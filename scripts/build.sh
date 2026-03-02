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
NC='\033[0m' # No Color

IMAGE_NAME="k-view-local-build"
CONTAINER_NAME="k-view-extract"

# Default architecture is amd64, but can be overridden
ARCH=${1:-$(uname -m)}
if [ "$ARCH" = "x86_64" ]; then
    ARCH="amd64"
elif [ "$ARCH" = "arm64" ]; then
    ARCH="arm64"
fi

echo -e "${BLUE}🔨 Building K-View binary for $ARCH from $PROJECT_ROOT...${NC}"

# Build the image with the target architecture
docker build --build-arg TARGETARCH=$ARCH -t $IMAGE_NAME "$PROJECT_ROOT"

# Extract the binary
echo -e "${BLUE}📦 Extracting binary from image...${NC}"
docker create --name $CONTAINER_NAME $IMAGE_NAME
mkdir -p "$PROJECT_ROOT/bin"
docker cp $CONTAINER_NAME:/app/k-view-server "$PROJECT_ROOT/bin/k-view-server-$ARCH"
docker rm -f $CONTAINER_NAME

echo -e "${GREEN}✅ Build successful! Binary is at bin/k-view-server-$ARCH${NC}"
