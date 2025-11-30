FROM python:3.11-alpine
RUN adduser -D sandbox_user
WORKDIR /app
USER sandbox_user
