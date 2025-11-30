FROM alpine:latest
RUN apk add --no-cache g++
RUN adduser -D sandbox_user
WORKDIR /app
USER sandbox_user
