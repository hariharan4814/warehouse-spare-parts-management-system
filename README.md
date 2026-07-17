# Warehouse Spare Parts Management System

An enterprise-grade platform for managing spare parts inventory, procurement, warehouse operations, and issue/return workflows across multiple facilities.

This repository contains the **project foundation** — a production-ready monorepo structure with frontend and backend scaffolding. Business features are implemented incrementally across planned sprints.

---

## Technology Stack

### Frontend

| Technology        | Purpose                          |
|-------------------|----------------------------------|
| Next.js 15        | React framework (App Router)     |
| TypeScript        | Type-safe development            |
| Tailwind CSS      | Utility-first styling            |
| shadcn/ui         | Component library (prepared)     |
| TanStack Query    | Server state management          |
| Axios             | HTTP client                      |
| React Hook Form   | Form handling                    |
| Zod               | Schema validation                |

### Backend

| Technology              | Purpose                    |
|-------------------------|----------------------------|
| Python                  | Runtime                    |
| Django                  | Web framework              |
| Django REST Framework   | API layer (prepared)       |
| PostgreSQL              | Primary database           |

---

## Project Structure

```
warehouse-spare-parts-management-system/
├── frontend/                 # Next.js 15 application
│   ├── app/                  # App Router pages and layouts
│   ├── components/           # UI and layout components
│   ├── services/             # API service layer
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Shared utilities
│   ├── store/                # Client state
│   ├── types/                # TypeScript definitions
│   ├── utils/                # Helper functions
│   ├── constants/            # Application constants
│   ├── styles/               # Global styles
│   └── public/               # Static assets
├── backend/                  # Django application
│   ├── config/               # Project settings and URLs
│   ├── authentication/       # Auth module (future sprint)
│   ├── users/                # User management
│   ├── dashboard/            # Dashboard module
│   ├── spare_parts/          # Spare parts catalog
│   ├── inventory/            # Inventory tracking
│   ├── warehouses/           # Warehouse management
│   ├── suppliers/            # Supplier management
│   ├── purchases/            # Purchase orders
│   ├── requests/             # Parts requests
│   ├── issue_return/         # Issue and return workflows
│   ├── reports/              # Reporting
│   ├── notifications/        # Notifications
│   ├── audit_logs/           # Audit trail
│   └── common/               # Shared backend utilities
├── docker/                   # Docker Compose configuration
├── docs/                     # Project documentation
├── README.md
├── PROJECT_STATUS.md
└── .gitignore
```

---

## Prerequisites

- **Node.js** 20+
- **Python** 3.11+
- **PostgreSQL** 16+
- **Docker** (optional, for containerized database)

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd warehouse-spare-parts-management-system
```

### 2. Start PostgreSQL (Docker)

```bash
docker compose -f docker/docker-compose.yml up -d
```

### 3. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env   # Windows
cp .env.example .env     # macOS / Linux

# Verify Django configuration
python manage.py check

# Run development server
python manage.py runserver
```

The backend runs at `http://localhost:8000`.

### 4. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
copy .env.example .env.local   # Windows
cp .env.example .env.local     # macOS / Linux

# Run development server
npm run dev
```

The frontend runs at `http://localhost:3000`.

### 5. shadcn/ui components (when needed)

```bash
cd frontend
npx shadcn@latest add button
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable              | Description              | Default                  |
|-----------------------|--------------------------|--------------------------|
| `SECRET_KEY`          | Django secret key        | —                        |
| `DEBUG`               | Debug mode               | `True`                   |
| `ALLOWED_HOSTS`       | Allowed hostnames        | `localhost,127.0.0.1`    |
| `DB_NAME`             | PostgreSQL database name | `warehouse_spare_parts`  |
| `DB_USER`             | PostgreSQL user          | `postgres`               |
| `DB_PASSWORD`         | PostgreSQL password      | `postgres`               |
| `DB_HOST`             | PostgreSQL host          | `localhost`              |
| `DB_PORT`             | PostgreSQL port          | `5432`                   |
| `CORS_ALLOWED_ORIGINS`| Frontend origins         | `http://localhost:3000`  |

### Frontend (`frontend/.env.local`)

| Variable                   | Description     | Default                     |
|----------------------------|-----------------|-----------------------------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | `http://localhost:8000/api` |

---

## Development Status

See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for sprint progress.

| Sprint   | Status        |
|----------|---------------|
| Sprint 1 | In Progress   |
| Sprint 2 | Pending       |
| Sprint 3 | Pending       |
| Sprint 4 | Pending       |

---

## License

Proprietary. All rights reserved.
