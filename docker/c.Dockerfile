FROM alpine:latest
RUN apk add --no-cache gcc musl-dev
RUN adduser -D sandbox_user
WORKDIR /app
USER sandbox_user
