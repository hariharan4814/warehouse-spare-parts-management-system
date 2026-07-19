# ⚙️ Warehouse Spare Parts Management System (WSPMS ERP)

[![Production Ready](https://img.shields.io/badge/status-production--ready-success.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black.svg)](https://nextjs.org/)
[![Django Framework](https://img.shields.io/badge/Django-4.2-green.svg)](https://djangoproject.com/)

An enterprise-grade, comprehensive web application designed to manage spare parts inventory, streamline procurement, automate multi-warehouse transfers, schedule work orders, and log audit trails. WSPMS ERP bridges the gap between maintenance technicians and warehouse supervisors, ensuring spare parts are always available when critical machinery needs repair, preventing operational downtime, and automating asset valuation tracking.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Project Highlights](#project-highlights)
3. [System Architecture](#system-architecture)
4. [User Roles](#user-roles)
5. [Feature List](#feature-list)
6. [Technology Stack](#technology-stack)
7. [Folder Structure](#folder-structure)
8. [Environment Variables](#environment-variables)
9. [Installation Guide](#installation-guide)
10. [Deployment Guide (Docker)](#deployment-guide-docker)
11. [API Documentation Reference](#api-documentation-reference)
12. [Screenshots](#screenshots)
13. [Testing](#testing)
14. [Future Enhancements](#future-enhancements)
15. [Author](#author)
16. [License](#license)

---

## 🔍 Overview

In modern industrial facilities, equipment maintenance delays are often caused by the unavailability of critical spare parts. Traditional inventory management software frequently lacks integration with actual maintenance work orders, leading to discrepancies, over-purchasing, or stockouts.

The **Warehouse Spare Parts Management System (WSPMS ERP)** was developed to solve these operational pain points. By binding inventory transactions directly to maintenance schedules, every stock change is recorded as an immutable transaction. The system eliminates manual accounting errors, keeps track of safety threshold stock values, and coordinates multi-location transfers.

### Key Solutions:
* **Preventing Stockouts**: Automated threshold tracking alerts managers when a part falls below its safety margin.
* **Unified Maintenance Workflows**: Technicians request parts via Work Orders, and Storekeepers issue parts atomically with automatic stock level adjustments.
* **Asset Valuation Audits**: Comprehensive, real-time calculation of overall inventory worth based on current warehouse-wise item logs.

---

## 🚀 Project Highlights

* **🔑 JWT Authentication & RBAC**: Highly secured JSON Web Token handling with role-based dashboard layouts.
* **📦 Inventory Management**: Atomic transactions preventing race conditions during stock ingestion/reductions.
* **🏢 Multi-Warehouse Support**: Distributed storage locations, bins, racks, and warehouse capacity tracking.
* **📝 Purchase Orders**: Fully integrated procurement workflow from draft request to receipt verification.
* **🔄 Stock Transfers**: Inter-facility stock movements with dual-ledger confirmation tracking.
* **🔧 Work Orders**: Technician task scheduling linked to real-time spare part requests.
* **📊 Reports & Analytics**: Interactive data visualization charts mapping key operational trends.
* **🔔 Notifications**: Live in-app alert notifications for low-stock warnings and task assignments.
* **📜 Audit Logs**: Administrative history logs tracking login, logout, create, update, and delete actions.
* **🐳 Docker Ready**: Packaged as containerized multi-services for instant production deployment.

---

## 📐 System Architecture

The project is structured under a decoupled architecture connecting a Next.js frontend to a Django REST Framework (DRF) backend through RESTful APIs secured via JSON Web Tokens (JWT).

```
┌──────────────────────────────────────────────┐
│             Next.js Frontend Client          │
│          (TypeScript, Tailwind CSS)          │
└──────────────────────┬───────────────────────┘
                       │
               HTTPS REST Requests
                (JWT Bearer Token)
                       │
                       ▼
┌──────────────────────────────────────────────┐
│            Django REST Framework             │
│            (Python Backend Engine)           │
└──────────────────────┬───────────────────────┘
                       │
                psycopg Driver
                       │
                       ▼
┌──────────────────────────────────────────────┐
│             PostgreSQL Database              │
│        (Transactional Persistent DB)         │
└──────────────────────────────────────────────┘
```

---

## 👥 User Roles

WSPMS ERP enforces strict Role-Based Access Control (RBAC) to restrict interface access according to employee functions:

| Role | Responsibilities | Access Scope |
| :--- | :--- | :--- |
| **Admin** | Manages system configurations, logs, users, and overall inventory. | Full read/write access across all modules, system settings, and audit logs. |
| **Warehouse Manager** | Monitors inventory levels, oversees procurement, and views business analytics. | Accesses reports, purchase orders, goods receipts, and warehouse analytics. |
| **Storekeeper** | Manages receipt of incoming parts, coordinates transfers, and issues parts. | Handles stock transfers, goods receipts, and issues spare parts. |
| **Technician** | Schedules equipment maintenance and requests required spare parts. | Creates work orders, views assigned tasks, and requests parts. |

---

## 📋 Feature List

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

## 💻 Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack React Query, Lucide React, Axios.
- **Backend**: Python 3.11, Django, Django REST Framework (DRF), SimpleJWT (JWT Authentication).
- **Database**: PostgreSQL 16.
- **Orchestration**: Docker, Docker Compose.

---

## 📁 Folder Structure

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

## 🔧 Environment Variables

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

## 🛠️ Installation Guide

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

## 🐳 Deployment Guide (Docker)

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

## 📖 API Documentation Reference

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

---

## 📸 Screenshots

Here are visual mockups representing key areas of the dashboard interface:

| Login View | Executive Dashboard |
| :--- | :--- |
| ![Login UI](https://via.placeholder.com/400x250?text=WSPMS+Login+View) | ![Dashboard UI](https://via.placeholder.com/400x250?text=WSPMS+Dashboard+Overview) |

| Spare Parts Catalog | Inventory Valuation |
| :--- | :--- |
| ![Spare Parts Catalog UI](https://via.placeholder.com/400x250?text=Spare+Parts+Catalog) | ![Inventory Valuation UI](https://via.placeholder.com/400x250?text=Inventory+Valuation+Ledger) |

| Purchase Orders | Warehouse Configuration |
| :--- | :--- |
| ![Purchase Orders UI](https://via.placeholder.com/400x250?text=Procurement+PO+Workflow) | ![Warehouse UI](https://via.placeholder.com/400x250?text=Warehouse+Configuration) |

| BI Reports & Analytics | Live Notifications |
| :--- | :--- |
| ![BI Reports UI](https://via.placeholder.com/400x250?text=Reports+and+Aggregations) | ![Notifications UI](https://via.placeholder.com/400x250?text=In-App+Live+Alerts) |

---

## 🧪 Testing

Both backend and frontend codebases include comprehensive testing to guarantee code quality and type safety.

### Django Backend Unit Tests
Run the backend test suite:
```bash
python manage.py test
```
* **Status**: **37/37 Backend Tests Passed (100% Success Rate)**

### Next.js Frontend TypeScript Validation
Verify component type safety:
```bash
npx tsc --noEmit
```
* **Status**: **TypeScript Compilation Successful (0 Compilation Errors)**

---

## 🔮 Future Enhancements

* **📱 Mobile Companion Application**: Dedicated iOS/Android apps for on-field maintenance reporting.
* **🏷️ Barcode & QR Code Scanning**: Camera-based scanning of spare part barcodes for instant warehouse ingestion.
* **📡 RFID Integration**: Real-time asset tracking throughout logistics hubs.
* **✉️ Email Alerts**: Automated email dispatches for critical safety stock thresholds.
* **🧠 AI Demand Forecasting**: Machine learning pipelines predicting seasonal part requirements.
* **⚙️ IoT Predictive Maintenance**: Direct hardware integration requesting spare parts automatically prior to failure.

---

## ✍️ Author

* **Hariharan B**
* **Dakshesh R**
* *M.Sc Computer Science*
* **PSG College of Arts and Science**

---

## 📄 License

This project was developed for educational, portfolio, and learning purposes. Released under the [MIT License](LICENSE).
