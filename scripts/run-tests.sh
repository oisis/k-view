#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Project root is one level up from scripts/
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting K-View Test Suite from $PROJECT_ROOT...${NC}"

# 1. Backend Tests (Go)
echo -e "\n${BLUE}🧪 Running Backend Tests (Go)...${NC}"
if cd "$PROJECT_ROOT/backend" && go test ./...; then
    echo -e "${GREEN}✅ Backend tests passed!${NC}"
else
    echo -e "${RED}❌ Backend tests failed!${NC}"
    exit 1
fi

# 2. Frontend Tests (Vitest)
echo -e "\n${BLUE}🧪 Running Frontend Tests (Vitest - Frozen Views)...${NC}"
cd "$PROJECT_ROOT/web"
if npm test -- run; then
    echo -e "${GREEN}✅ Frontend tests passed!${NC}"
else
    echo -e "${RED}❌ Frontend tests failed!${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 All tests passed successfully! Resource views are confirmed as 'frozen'.${NC}"
