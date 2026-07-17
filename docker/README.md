# Docker

Infrastructure configuration for the Warehouse Spare Parts Management System.

## Services

| Service    | Description                          |
|------------|--------------------------------------|
| `postgres` | PostgreSQL 16 database               |

## Usage

From the project root:

```bash
docker compose -f docker/docker-compose.yml up -d
```

Stop services:

```bash
docker compose -f docker/docker-compose.yml down
```

## Environment

Database credentials match `backend/.env.example` defaults. Override via environment variables or a `.env` file in the `docker/` directory when deploying.
