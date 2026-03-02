#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

NAMESPACE="k-view-test-data"

function show_help() {
    echo "Usage: ./deploy-test-suite.sh [OPTION]"
    echo "Deploy or cleanup the K-View unified test suite."
    echo ""
    echo "Options:"
    echo "  --deploy    Create namespace and apply all manifests (default)"
    echo "  --cleanup   Delete all manifests and the test namespace"
    echo "  --help      Show this help message"
}

function deploy() {
    echo -e "${BLUE}🚀 Deploying K-View Unified Test Suite...${NC}"
    
    # Create namespace
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply all manifests
    kubectl apply -f examples/test-suite/
    
    echo -e "\n${GREEN}✅ Test suite deployed successfully to namespace: $NAMESPACE${NC}"
}

function cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up K-View Test Suite...${NC}"
    
    # Delete manifests
    kubectl delete -f examples/test-suite/ --ignore-not-found=true
    
    # Delete namespace
    echo -e "${YELLOW}Deleting namespace $NAMESPACE...${NC}"
    kubectl delete namespace $NAMESPACE --ignore-not-found=true
    
    echo -e "\n${RED}✅ Cleanup complete.${NC}"
}

# Parse arguments
case "$1" in
    --cleanup|--delete)
        cleanup
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
