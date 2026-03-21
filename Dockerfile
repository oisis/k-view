# Stage 1: Build the Go backend
FROM golang:1.25-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum* ./
RUN go mod tidy
COPY backend/ .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -a -o k-view-server .

# Stage 2: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/web
COPY web/package.json web/package-lock.json* ./
# Use --legacy-peer-deps because some libs are not yet updated for React 19
RUN npm install --legacy-peer-deps
COPY web/ .
RUN npm run build

# Stage 3: Final image
FROM alpine:3.19
WORKDIR /app

# Install kubectl for terminal features and ca-certificates for OIDC
RUN apk add --no-cache ca-certificates tzdata curl && \
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/arm64/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

# Copy backend binary
COPY --from=backend-builder /app/backend/k-view-server /app/

# Copy frontend build
COPY --from=frontend-builder /app/web/dist /app/web/dist

# Expose the port the app runs on
EXPOSE 8080

# Run the binary
CMD ["./k-view-server"]
