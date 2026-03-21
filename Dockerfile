# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/web
COPY web/package.json web/package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY web/ .
RUN npm run build

# Stage 2: Build the Go backend (Single Binary)
FROM golang:1.25-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum* ./
RUN go mod tidy
COPY backend/ .
# Copy frontend assets to the location expected by go:embed
COPY --from=frontend-builder /app/web/dist ./handlers/dist
RUN CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -a -o k-view-server .

# Stage 3: Final image (Minimal)
FROM alpine:3.19
WORKDIR /app

# Install kubectl for terminal features and ca-certificates for OIDC
RUN apk add --no-cache ca-certificates tzdata curl && \
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/arm64/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

# Copy ONLY the single binary
COPY --from=backend-builder /app/backend/k-view-server /app/

# Expose the port the app runs on
EXPOSE 8080

# Run the binary
CMD ["./k-view-server"]
