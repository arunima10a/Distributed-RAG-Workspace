# --- Stage 1: Build ---
FROM golang:1.25-alpine AS builder

WORKDIR /app

# 1. Copy go.mod and go.sum first to cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# 2. Copy the source code
COPY . .

# 3. Build the specific binary (Update the path for each service)
RUN go build -o main ./go_apps/llm_service/go_component/main.go
# --- Stage 2: Run ---
FROM alpine:latest
WORKDIR /root/

# Copy the binary from the builder stage
COPY --from=builder /app/main .

# Expose the port we assigned earlier
EXPOSE 8081

CMD ["./main"]