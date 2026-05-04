# --- Stage 1: Build ---
FROM golang:1.25-alpine AS builder
WORKDIR /app

# Copy the go.mod from the ROOT (since that's our context)
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code
COPY . .


# Build the collaboration_service binary
RUN go build -o main ./go_apps/collaboration_service/main.go

# --- Stage 2: Run ---
FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/main .

EXPOSE 8082
CMD ["./main"]