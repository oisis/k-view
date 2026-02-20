#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

IMAGE_NAME="k-view-local-build"
CONTAINER_NAME="k-view-extract"

# Default architecture is amd64, but can be overridden (e.g., ./build.sh arm64)
ARCH=${1:-"arm64"}

echo -e "${BLUE}🚀 Starting Docker-based build for K-View ($ARCH)...${NC}"

# 1. Build the Docker image (passing ARCH as build-arg)
echo -e "${BLUE}🐳 Building Docker image for $ARCH...${NC}"
docker build --build-arg TARGETARCH=$ARCH -t $IMAGE_NAME .

# 2. Extract the binary for local use if needed
echo -e "${BLUE}📦 Extracting binary from container...${NC}"
# Remove old extractor if exists
docker rm -f $CONTAINER_NAME 2>/dev/null || true

# Create a dummy container to copy files from
docker create --name $CONTAINER_NAME $IMAGE_NAME

# Copy the server binary to local directory
docker cp $CONTAINER_NAME:/app/k-view-server ./k-view-server

# Clean up
docker rm -f $CONTAINER_NAME

echo -e "${GREEN}✅ Build complete!${NC}"
echo -e "${GREEN}👉 The image '$IMAGE_NAME' ($ARCH) is ready.${NC}"
echo -e "You can run it with:"
echo -e "docker run -p 8080:8080 \\"
echo -e "  -e KVIEW_GOOGLE_CLIENT_ID=xxx \\"
echo -e "  -e KVIEW_GOOGLE_CLIENT_SECRET=xxx \\"
echo -e "  $IMAGE_NAME"
