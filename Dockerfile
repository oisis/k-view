# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/web
COPY web/package.json web/package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY web/ .
RUN npm run build

# Stage 2: Build the Go backend (Single Binary)
FROM golang:1.25-alpine AS backend-builder
ARG TARGETARCH
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum* ./
RUN go mod tidy
RUN go install github.com/swaggo/swag/cmd/swag@latest
COPY backend/ .
# Copy frontend assets to the location expected by go:embed
COPY --from=frontend-builder /app/web/dist ./handlers/dist
# Generate Swagger documentation
RUN swag init
# Use TARGETARCH (provided by buildx) or default to amd64
RUN CGO_ENABLED=0 GOOS=linux GOARCH=${TARGETARCH:-amd64} go build -ldflags="-s -w" -a -o k-view-server .

# Stage 3: Final image (Minimal)
FROM alpine:3.19
ARG TARGETARCH
WORKDIR /app

# Install kubectl for terminal features and ca-certificates for OIDC
# Use TARGETARCH to download correct kubectl binary
RUN apk add --no-cache ca-certificates tzdata curl && \
    K8S_ARCH=${TARGETARCH:-amd64} && \
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/${K8S_ARCH}/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

# Copy ONLY the single binary
COPY --from=backend-builder /app/backend/k-view-server /app/

# Expose the port the app runs on
EXPOSE 8080

# Run the binary
CMD ["./k-view-server"]
