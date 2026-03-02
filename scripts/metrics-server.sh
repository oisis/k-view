#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Installing Metrics Server...${NC}"

# 1. Apply official components
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# 2. Apply patch for local cluster (insecure TLS)
echo -e "${YELLOW}🔧 Patching Metrics Server for local cluster (insecure TLS)...${NC}"

# We use a temporary file for the patch to be shell-agnostic
PATCH_FILE="/tmp/metrics-server-patch.yaml"
cat <<EOF > "$PATCH_FILE"
spec:
  template:
    spec:
      containers:
      - name: metrics-server
        args:
        - --cert-dir=/tmp
        - --secure-port=10250
        - --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname
        - --kubelet-use-node-status-port
        - --metric-resolution=15s
        - --kubelet-insecure-tls
EOF

kubectl patch deployment metrics-server -n kube-system --patch-file "$PATCH_FILE"
rm "$PATCH_FILE"

# 3. Wait for readiness
echo -e "${BLUE}⏳ Waiting for Metrics Server to be ready...${NC}"
kubectl rollout status deployment/metrics-server -n kube-system

echo -e "\n${GREEN}✅ Metrics Server deployed and patched successfully!${NC}"
