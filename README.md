# Lambex - Remote Code Execution Engine

A containerized execution engine for running untrusted code securely
It exposes a REST API for submission and runs jobs through isolated docker workers powered by redis

---

## Quick Start

### Prerequisites

- Bun Runtime
- Docker Daemon
- Redis (`REDIS_URL`)
- PostgreSQL (`DATABASE_URL`)

```sh
# 1. Install dependencie
bun install

# 2. Start API Server (Default port: 8080)
bun run src/server.ts

# 3. Start Worker (in a seperate terminal)
bun run worker/index.ts
```

---

## API Reference

All API routes are prefixed with `/api`

### **Runs**

Manages execution jobs

1. **POST `/api/runs`**
   Queue a new run

Request body:

- `language` - Runtime identifier
- `code` - Source code as string

Response returns:

- `id` - Run identifier
- `status` - Initial state
- `url` - Status polling endpoint

2. **GET `/api/runs/:runId`**
   Fetch run status and output

Possible States:

- `QUEUED`
- `PROCESSING`
- `COMPLETED`
- `FAILED`
- `TIMEOUT`

Response returns:

- `output` - Stdout
- `error` - Execution error if any
- `executionTime` - Runtime duration (ms)

---

## Worker Service

Workers pull jobs from Redis and execute code inside locked down Docker containers

### Run Modes

Single Worker:

```sh
bun run worker/index.ts
```

Multiple workers:

```sh
bun run worker/index.ts -c 4
```

Each worker has an independent Redis connection and executes concurrently without blocking others

---

## Execution Model

Isolation is enforced through Docker:

- No network access
- Read-only filesystem
- Memory capped at 128MB
- Ephemeral container lifecycle

Heartbeat monitoring:

- Each worker registers itself every 3 seconds at:

```
worker:{uuid}
```

---

## Documentation

- [Adding a New Language](docs/ADD_LANGUAGE.md)
