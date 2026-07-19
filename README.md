# Warehouse Spare Parts Management System (WSPMS ERP)

An enterprise-grade platform for managing spare parts inventory, procurement, warehouse operations, stock transfers, and issue/return workflows across multiple facilities.

## Table of Contents
1. [Feature List](#feature-list)
2. [Technology Stack](#technology-stack)
3. [Folder Structure](#folder-structure)
4. [Environment Variables](#environment-variables)
5. [Installation Guide](#installation-guide)
6. [Deployment Guide (Docker)](#deployment-guide-docker)
7. [API Documentation Reference](#api-documentation-reference)

---

## Feature List

- **User Profiles & Role-Based Permissions**: Dynamic role checks for Admin, Warehouse Manager, Storekeeper, and Technician. Custom profile editing, password changes, and last login tracking.
- **Spare Parts Catalog**: Part coding, category management, storage location allocation, minimum/maximum stock thresholds, and unit costs.
- **Multi-Warehouse & Stock Transfers**: Inter-warehouse transfer management with validation checks, stock allocation tracking, and digital dispatch notes.
- **Inventory Ledger**: Real-time transactions (stock increases, decreases, adjustments, transfers, issues) generating automated `StockMovement` history log.
- **Supplier & Procurement**: Supplier directory, Purchase Order (PO) workflows, partial/full Goods Receipt Notes (GRN) automatic stock ingestion.
- **Work Orders & Parts Issuance**: Maintenance work orders (assignable to technicians), partial/full parts issuance, technician alerts.
- **Notifications System**: In-app notifications for safety thresholds (low stock, out of stock), PO updates, completed transfers, and assigned WOs.
- **Audit Log Trail**: Chronological immutable administrative log capturing all logins, logouts, creates, updates, and deletes with old vs new value payloads.
- **Business Intelligence & Reports**: Visual charts tracking monthly POs, WOs, supplier spend allocation, warehouse valuation breakdowns, and top consumed spare parts.

---

## Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack React Query, Lucide React, Axios.
- **Backend**: Python 3.11, Django, Django REST Framework (DRF), SimpleJWT (JWT Authentication).
- **Database**: PostgreSQL 16.
- **Orchestration**: Docker, Docker Compose.

---

## Folder Structure

```
warehouse-spare-parts-management-system/
├── frontend/                 # Next.js Application
│   ├── app/                  # App Router views & page logic
│   ├── components/           # UI & layout components
│   ├── services/             # API client services
│   ├── lib/                  # Shared utility functions (Axios, CSV exports)
│   ├── constants/            # Client configuration constants
│   └── public/               # Static assets
├── backend/                  # Django DRF Application
│   ├── config/               # Settings & routing config
│   ├── users/                # User profile management
│   ├── spare_parts/          # Catalog management
│   ├── inventory/            # Transaction ledger
│   ├── warehouses/           # Multi-facility allocation
│   ├── suppliers/            # Vendor directory
│   ├── purchases/            # PO & GRN workflow
│   ├── issue_return/         # WO & Parts Issuance
│   ├── reports/              # Aggregated analytics engines
│   ├── notifications/        # In-app notification dispatcher
│   ├── audit_logs/           # Admin audit trail
│   └── common/               # Healthcheck & SystemSettings singleton
├── docker-compose.yml        # Orchestration configuration
├── .env.example              # Environment variables template
└── README.md                 # System manual
```

---

## Environment Variables

### Backend Settings (`backend/.env`)
- `DJANGO_SETTINGS_MODULE`: Set to `config.settings.development` or `config.settings.production`
- `SECRET_KEY`: Django secret key
- `DEBUG`: `True` / `False`
- `ALLOWED_HOSTS`: Allowed IP addresses/domains (comma-separated)
- `USE_POSTGRES`: Set to `True` for database connection
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`: Database connection details

### Frontend Settings (`frontend/.env`)
- `NEXT_PUBLIC_API_URL`: Gateway base URL (e.g. `http://localhost:8000/api`)

---

## Installation Guide

### Backend Scaffolding
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create virtual environment and activate:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy env file and adjust variables:
   ```bash
   cp .env.example .env
   ```
5. Apply database migrations:
   ```bash
   python manage.py migrate
   ```
6. Run server:
   ```bash
   python manage.py runserver
   ```

### Frontend Scaffolding
1. Navigate to frontend:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy local environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start dev server:
   ```bash
   npm run dev
   ```

---

## Deployment Guide (Docker)

To build and spin up the complete containerized stack (PostgreSQL, Django backend, Next.js frontend):

1. Make sure Docker and Docker Compose are installed on your server.
2. Clone the repository and configure environment variables in `.env` (copying `.env.example`).
3. Run the following command in the root workspace folder:
   ```bash
   docker compose up --build -d
   ```
4. Perform database migrations automatically inside the container:
   ```bash
   docker compose exec backend python manage.py migrate
   ```
5. Access the applications:
   - **Frontend UI**: `http://localhost:3000`
   - **Backend API Docs**: `http://localhost:8000/api/health/`

---

## API Documentation Reference

- **Authentication**:
  - `POST /api/auth/login/` - Logs user in, returns access/refresh JWT tokens.
  - `POST /api/auth/logout/` - Invalidates refresh token.
  - `GET/PUT /api/auth/profile/` - View/Edit current user profile details.
  - `POST /api/auth/profile/change-password/` - Updates password.
- **Spare Parts**:
  - `GET/POST /api/spare-parts/` - List/Create catalog parts.
- **Warehouses**:
  - `GET/POST /api/warehouses/` - Facility registry.
  - `GET/POST /api/warehouses/transfers/` - Inventory stock transfers.
- **Procurement**:
  - `GET/POST /api/purchases/` - Purchase Order routing.
  - `GET/POST /api/purchases/goods-receipts/` - Receives orders into inventory.
- **Maintenance**:
  - `GET/POST /api/issue-return/work-orders/` - Work Order scheduling.
  - `GET/POST /api/issue-return/issue-transactions/` - Spare parts issuance.
- **Notifications**:
  - `GET /api/notifications/` - Active notifications feed.
  - `POST /api/notifications/mark-all-read/` - Bulk read state update.
- **Audit Logs**:
  - `GET /api/audit-logs/` - Security audit trail list (restricted to Admin roles).
