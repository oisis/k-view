#!/bin/bash

# Exit on error
set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Project root is one level up from scripts/
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

IMAGE_NAME="k-view"
NAMESPACE="k-view"
CHART_PATH="$PROJECT_ROOT/charts/k-view"
VALUES_FILE="$PROJECT_ROOT/gemini/my-values.yaml"
PORT=8080

echo -e "${BLUE}🚀 Starting Local Deployment for $IMAGE_NAME...${NC}"
echo -e "${BLUE}📁 Project Root: $PROJECT_ROOT${NC}"

# 1. Detect latest version and increment
echo -e "${BLUE}🔍 Detecting current version...${NC}"
LATEST_TAG=$(docker images $IMAGE_NAME --format '{{.Tag}}' | grep '^v[0-9]*$' | sed 's/v//' | sort -n | tail -n 1)

if [ -z "$LATEST_TAG" ]; then
    NEW_TAG="v1"
    OLD_TAG=""
else
    NEW_VERSION=$((LATEST_TAG + 1))
    NEW_TAG="v$NEW_VERSION"
    OLD_TAG="v$LATEST_TAG"
fi

echo -e "${GREEN}✨ New version will be: $NEW_TAG${NC}"

# 2. Build Docker image
echo -e "\n${BLUE}📦 Building Docker image $IMAGE_NAME:$NEW_TAG...${NC}"
# Use project root as build context
docker build -t $IMAGE_NAME:$NEW_TAG "$PROJECT_ROOT"

# 3. Helm Lint
echo -e "\n${BLUE}🧪 Linting Helm Chart...${NC}"
helm lint "$CHART_PATH"

# 4. Critical Cleanup
echo -e "\n${YELLOW}🧹 Pre-deployment cleanup of cluster-wide resources...${NC}"
kubectl delete clusterrole,clusterrolebinding -l app.kubernetes.io/instance=$IMAGE_NAME --ignore-not-found
kubectl delete clusterrole,clusterrolebinding -l app.kubernetes.io/name=$IMAGE_NAME --ignore-not-found
kubectl delete clusterrole k-view-role kview-cluster-admin kview-cluster-viewer --ignore-not-found
kubectl delete clusterrolebinding k-view-rolebinding k-view-binding --ignore-not-found

# 5. Deploy to Kubernetes
echo -e "\n${BLUE}🚢 Deploying to namespace '$NAMESPACE'...${NC}"
helm upgrade --install $IMAGE_NAME "$CHART_PATH" \
    --namespace $NAMESPACE --create-namespace \
    --values "$VALUES_FILE" \
    --set image.tag=$NEW_TAG

# 6. Wait for Rollout
echo -e "\n${BLUE}⏳ Waiting for rollout to finish...${NC}"
kubectl rollout status deployment/$IMAGE_NAME -n $NAMESPACE

# 7. Port Forwarding
echo -e "\n${BLUE}🔌 Setting up Port Forwarding on port $PORT...${NC}"
pkill -f "kubectl port-forward.*service/$IMAGE_NAME" || true
nohup kubectl port-forward service/$IMAGE_NAME $PORT:80 --address 0.0.0.0 -n $NAMESPACE > /tmp/k-view-pf.log 2>&1 &

sleep 2
if ps aux | grep -v grep | grep -q "kubectl port-forward.*service/$IMAGE_NAME"; then
    echo -e "${GREEN}✅ Port-forwarding active at http://localhost:$PORT${NC}"
else
    echo -e "${RED}❌ Port-forwarding failed to start. Check /tmp/k-view-pf.log${NC}"
fi

# 8. Cleanup old image
if [ ! -z "$OLD_TAG" ]; then
    echo -e "\n${YELLOW}🧹 Cleaning up old image $IMAGE_NAME:$OLD_TAG...${NC}"
    docker rmi $IMAGE_NAME:$OLD_TAG || true
fi

echo -e "\n${GREEN}🎉 Deployment complete! K-View version $NEW_TAG is ready.${NC}"
