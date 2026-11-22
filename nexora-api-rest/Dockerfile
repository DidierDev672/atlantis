# Etapa 1: Compilación del binario Go
FROM golang:1.24-alpine AS builder

ENV GOTOOLCHAIN=auto
WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Compilación estática sin CGO para máxima seguridad y portabilidad
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o /app/nexora-api ./cmd/api

# Etapa 2: Imagen mínima de ejecución
FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata && \
    addgroup -S nexora && adduser -S nexora -G nexora

COPY --from=builder /app/nexora-api /app/nexora-api

USER nexora

EXPOSE 8080

ENTRYPOINT ["/app/nexora-api"]
