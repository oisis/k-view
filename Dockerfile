# Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/web
COPY web/package.json web/package-lock.json* ./
RUN npm install
COPY web/ .
RUN npm run build

# Build Backend
FROM golang:1.22-alpine AS backend-builder
WORKDIR /app/backend
ARG TARGETARCH
COPY backend/go.mod backend/go.sum* ./
COPY backend/ .
RUN go mod tidy
# Build purely static binary since we no longer use SQLite
RUN CGO_ENABLED=0 GOOS=linux GOARCH=${TARGETARCH} go build -a -o k-view-server .


# Final Image
FROM alpine:3.19
WORKDIR /app

# Install ca-certificates, timezone data, and kubectl
RUN apk add --no-cache ca-certificates tzdata curl && \
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/$([ $(uname -m) = x86_64 ] && echo amd64 || echo arm64)/kubectl" && \
    chmod +x kubectl && mv kubectl /usr/local/bin/

# Copy built artifacts
COPY --from=backend-builder /app/backend/k-view-server /app/
COPY --from=frontend-builder /app/web/dist /app/web/dist

# Set user
USER 1000:1000

ENV PORT=8080
ENV GIN_MODE=release

EXPOSE 8080

CMD ["/app/k-view-server"]
