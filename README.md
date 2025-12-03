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

### **Workers**

Controls the worker pool via Redis

1. **GET `/api/workers`:**
   List all active workers and their current status

Response:

- `id` - Worker UUID
- `status` - `IDLE` or `BUSY`
- `uptime` - Seconds online

2. **POST `/api/workers/scale`:**
   Dynamically spawn new workers on active manager nodes

Request Body:

- `count` - Number of new workers to launch (default: 1)
- `targetId` - Specific Manager Id to target, if omitted it's random

3. **DELETE `/api/workers/:workerId`:**
   Send a kill signal to a specific worker instance

---

## Worker Service

The worker service is now a reactive **Manager** that maintains a pool of worker instances
It listens for control signals from the API to dynamically spawn or kill executors

Start the manager (starts with 0 workers by default)

```sh
bun run worker/index.ts
```

### How it works

1. **Service Discovery:** on startup, the manager registers itself in redis (`manager:{id}`) so the api knows it is online
2. **Control Plane:** it subscribes to the redis control channel to receive `SPAWN` or `KILL` commands
3. **Targeting:** the api can target specific manager nodes for scaling or all active managers randomly

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
- [Architecture](docs/ARCHITECTURE.md)
