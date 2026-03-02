#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

NAMESPACE="k-view-test-data"
DIR="examples/test-suite"

function show_help() {
    echo "Usage: ./deploy-test-suite.sh [OPTION]"
    echo "Deploy or cleanup the K-View unified test suite (27 resources)."
    echo ""
    echo "Options:"
    echo "  --deploy    Install Ingress-Nginx, create namespace and apply all manifests (default)"
    echo "  --cleanup   Delete all manifests, the test namespace, and Ingress-Nginx"
    echo "  --dry-run   Validate all manifests against the cluster API without applying changes"
    echo "  --help      Show this help message"
}

function deploy() {
    local dry_run_flag=""
    if [ "$1" == "dry-run" ]; then
        dry_run_flag="--dry-run=server"
        echo -e "${YELLOW}🔍 Running in DRY-RUN mode (Server-side validation)${NC}"
    fi

    echo -e "${BLUE}🚀 Preparing Infrastructure...${NC}"
    
    # 1. Install Ingress Nginx
    if [ "$1" != "dry-run" ]; then
        echo -e "${BLUE}📦 Installing Ingress Nginx Controller...${NC}"
        kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
        
        echo -e "${YELLOW}⏳ Waiting for Ingress Nginx Controller to be ready (Webhook setup)...${NC}"
        kubectl wait --namespace ingress-nginx \
          --for=condition=ready pod \
          --selector=app.kubernetes.io/component=controller \
          --timeout=120s
    fi
    
    # 2. Create Namespace
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply $dry_run_flag -f -
    
    # 3. Apply CRDs first
    echo -e "${BLUE}⚙️  Applying Custom Resource Definitions...${NC}"
    kubectl apply $dry_run_flag -f $DIR/test-k-view-crd.yaml
    
    if [ "$1" != "dry-run" ]; then
        echo -e "Waiting for CRDs to be established..."
        sleep 5
    fi
    
    # 4. Apply all other manifests
    echo -e "${BLUE}🚀 Deploying/Validating remaining resources...${NC}"
    if [ "$1" == "dry-run" ]; then
        for file in $DIR/*.yaml; do
            if [[ "$file" == *"test-k-view-node.yaml"* ]]; then continue; fi
            echo -n "Validating $(basename $file)... "
            if kubectl apply --dry-run=server -f "$file" > /dev/null 2>&1; then
                echo -e "${GREEN}OK${NC}"
            else
                echo -e "${RED}FAILED${NC}"
                kubectl apply --dry-run=server -f "$file"
            fi
        done
    else
        # Apply all files in the directory
        kubectl apply -f $DIR/
    fi
    
    if [ "$1" == "dry-run" ]; then
        echo -e "\n${GREEN}✅ Dry-run validation complete.${NC}"
    else
        echo -e "\n${GREEN}✅ Test suite deployed successfully!${NC}"
        echo -e "Namespace: $NAMESPACE"
    fi
}

function cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up K-View Test Suite...${NC}"
    kubectl delete -f $DIR/ --ignore-not-found=true
    kubectl delete namespace $NAMESPACE --ignore-not-found=true
    echo -e "\n${RED}✅ Cleanup complete.${NC}"
}

# Parse arguments
case "$1" in
    --cleanup|--delete)
        cleanup
        ;;
    --dry-run)
        deploy "dry-run"
        ;;
    --deploy|--apply|"")
        deploy
        ;;
    --help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown option: $1${NC}"
        show_help
        exit 1
        ;;
esac
