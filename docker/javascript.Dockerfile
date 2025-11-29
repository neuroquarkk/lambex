FROM node:20-alpine
RUN adduser -D sandbox_user
WORKDIR /app
USER sandbox_user
