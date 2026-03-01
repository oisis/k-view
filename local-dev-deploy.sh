#!/bin/bash

# ROLE: Senior DevOps Script for local DEV environment
# Ensures clean, verified and versioned deployments.

NAMESPACE="k-view"
IMAGE_NAME="k-view"
CHART_PATH="./charts/k-view"
VALUES_FILE="tmp-gemini/my-values.yaml"

# 1. Verification of the current Kubernetes context
CURRENT_CONTEXT=$(kubectl config current-context)
if [[ "$CURRENT_CONTEXT" != "docker-desktop" ]]; then
    echo "⚠️  Error: Current context is '$CURRENT_CONTEXT'. Please switch to 'docker-desktop'."
    exit 1
fi

# 2. Detection of the last tag and version increment
LAST_TAG=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "k-view(-dev)?:v[0-9]+$" | cut -d: -f2 | sort -V | tail -n 1)
if [ -z "$LAST_TAG" ]; then
    NEW_TAG="v1"
else
    TAG_NUM=${LAST_TAG#v}
    NEW_TAG="v$((TAG_NUM + 1))"
fi

echo "🚀 Starting deployment to namespace: $NAMESPACE"
echo "📦 Version transition: ${LAST_TAG:-none} -> $NEW_TAG"

# 3. Handle stuck Helm releases
STATUS=$(helm status k-view -n "$NAMESPACE" 2>/dev/null | grep "STATUS:" | awk '{print $2}')
if [[ "$STATUS" == "pending-upgrade" ]]; then
    echo "🧹 Release is stuck in $STATUS. Performing rollback..."
    helm rollback k-view -n "$NAMESPACE" || echo "Rollback failed, proceeding anyway..."
elif [[ "$STATUS" == "pending-install" ]]; then
    echo "💣 Release is stuck in $STATUS. Uninstalling..."
    helm uninstall k-view -n "$NAMESPACE" || echo "Uninstall failed, proceeding anyway..."
fi

# 4. Local Docker Build
echo "🏗️  Building local image $IMAGE_NAME:$NEW_TAG..."
docker build -t "$IMAGE_NAME:$NEW_TAG" . || exit 1

# 5. Namespace Preparation
echo "🌐 Ensuring namespace $NAMESPACE exists..."
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# 6. Helm Validation
echo "🔍 Linting Helm chart..."
helm lint "$CHART_PATH" || exit 1

# 7. Helm Deployment (Removed --force to avoid conflicts with Server-Side Apply)
echo "☸️  Upgrading release k-view..."
helm upgrade --install k-view "$CHART_PATH" \
  -n "$NAMESPACE" \
  -f "$VALUES_FILE" \
  --set image.repository="$IMAGE_NAME" \
  --set image.tag="$NEW_TAG" \
  --wait --timeout 3m || exit 1

# 8. Rollout Verification
echo "✅ Verifying deployment health..."
kubectl rollout status deployment/k-view -n "$NAMESPACE" || exit 1

# 9. Surgical Image Cleanup
echo "🧼 Cleanup: Removing old local images..."
docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "k-view(-dev)?:v" | grep -v "$IMAGE_NAME:$NEW_TAG" | xargs -I {} docker rmi {} 2>/dev/null || true

echo "🎉 Successfully deployed $NEW_TAG to $NAMESPACE!"
