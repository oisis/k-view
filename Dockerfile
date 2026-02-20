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
# Install gcc and musl-dev for SQLite CGO
RUN apk add --no-cache gcc musl-dev
ARG TARGETARCH
COPY backend/go.mod backend/go.sum* ./
COPY backend/ .
RUN go mod tidy
# CGO_ENABLED=1 is required for go-sqlite3. Pass TARGETARCH to GOARCH.
RUN CGO_ENABLED=1 GOOS=linux GOARCH=${TARGETARCH} go build -a -o k-view-server .


# Final Image
FROM alpine:3.19
WORKDIR /app

# Install ca-certificates and sqlite
RUN apk add --no-cache ca-certificates sqlite-libs tzdata

# Create data directory for SQLite persistence
RUN mkdir -p /data && chown -R 1000:1000 /data
VOLUME /data

# Copy built artifacts
COPY --from=backend-builder /app/backend/k-view-server /app/
COPY --from=frontend-builder /app/web/dist /app/web/dist

# Set user
USER 1000:1000

ENV DB_PATH=/data/kview.db
ENV PORT=8080
ENV GIN_MODE=release

EXPOSE 8080

CMD ["/app/k-view-server"]
