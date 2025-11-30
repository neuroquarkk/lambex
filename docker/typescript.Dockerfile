FROM oven/bun:1.3.0-alpine
RUN adduser -D sandbox_user
WORKDIR /app
USER sandbox_user
