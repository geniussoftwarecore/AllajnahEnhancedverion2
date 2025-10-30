# Allajnah Enhanced - نظام إدارة الشكاوى

## Overview
Allajnah Enhanced is a comprehensive complaint management system designed for Yemeni traders and oversight committees. The system facilitates the submission, tracking, and resolution of complaints against government entities with a multi-level committee review workflow.

## Tech Stack
- **Backend**: Python with FastAPI, SQLAlchemy ORM, PostgreSQL database
- **Frontend**: React with Vite, TailwindCSS for styling, i18next for internationalization
- **Authentication**: JWT-based authentication with role-based access control
- **Language**: Full Arabic language support with RTL layout, English translation in progress
- **Package Management**: uv for Python, npm for Node.js

## Architecture

### Database Schema
1. **Users Table**: User accounts with roles (trader, technical_committee, higher_committee)
2. **Categories Table**: Government entities (Customs, Standards, Taxes, etc.)
3. **Complaints Table**: Comprehensive complaint records matching Arabic complaint form
4. **Comments Table**: Public and internal comments on complaints
5. **Attachments Table**: File attachments for complaint evidence
6. **Subscriptions Table**: Annual subscription tracking for traders
7. **Payments Table**: Payment proof uploads and approval workflow
8. **ComplaintFeedback Table**: Post-resolution ratings and comments
9. **AuditLog Table**: System-wide audit trail
10. **PaymentMethod Table**: Configurable payment methods
11. **SLAConfig Table**: SLA thresholds by category/priority
12. **SystemSettings Table**: Key-value configuration store

### User Roles
1. **Trader (تاجر)**: Submit complaints, track status, manage subscription
2. **Technical Committee (اللجنة الفنية)**: Review, assign, update complaints, escalate
3. **Higher Committee (اللجنة العليا)**: Full admin access, user management, settings, final decisions

### Complaint Workflow
1. Trader submits → Status: "Submitted"
2. Technical Committee reviews → Status: "Under Review"
3. Can escalate → Status: "Escalated" 
4. Final resolution → Status: "Resolved" or "Rejected"
5. Trader can reopen within configured window
6. Feedback collected after resolution

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI application with all API endpoints
│   ├── database.py          # Database connection and session management
│   ├── models.py            # SQLAlchemy models (complete)
│   ├── schemas.py           # Pydantic schemas for validation
│   ├── auth.py              # JWT authentication and RBAC
│   ├── audit_helper.py      # Audit logging utilities
│   ├── init_db.py           # Database initialization
│   ├── seed.py              # Seed script for demo data
│   ├── create_admin.py      # Create first admin user
│   ├── pyproject.toml       # Python dependencies (uv)
│   └── uploads/             # File storage
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx         # React entry point
│   │   ├── App.jsx          # Main app with routing
│   │   ├── i18n.js          # i18next configuration
│   │   ├── api/axios.js     # API client
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Setup.jsx                      # Initial admin setup
│   │   │   ├── Login.jsx                      # Login page
│   │   │   ├── Register.jsx                   # Trader registration
│   │   │   ├── TraderDashboard.jsx            # Trader dashboard
│   │   │   ├── TechnicalCommitteeDashboard.jsx
│   │   │   └── HigherCommitteeDashboard.jsx
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── ComplaintForm.jsx
│   │       ├── ComplaintList.jsx
│   │       └── ComplaintDetail.jsx
│   └── package.json
```

## Current Implementation Status

### ✅ Completed Backend Features

#### Authentication & Authorization
- ~~User registration~~ - **DISABLED** for security (all users created by admin)
- JWT login with role-based tokens
- Password hashing with bcrypt
- Role-based access control (RBAC) decorators
- Setup wizard for first admin user

#### User Management (Admin)
- Create users (all roles) - `POST /api/admin/users`
- List users with filters (role, status, search) - `GET /api/admin/users`
- Get user details - `GET /api/admin/users/{id}`
- Update user profile - `PATCH /api/admin/users/{id}`
- Deactivate users (with last-admin protection) - `DELETE /api/admin/users/{id}`
- Reset user password - `POST /api/admin/users/{id}/reset-password`

#### Complaints Management
- Create complaint - `POST /api/complaints`
- List complaints (role-filtered) - `GET /api/complaints`
- Get complaint details - `GET /api/complaints/{id}`
- Update status/priority/assignment - `PATCH /api/complaints/{id}`
- Reopen complaint - `POST /api/complaints/{id}/reopen`

#### Comments
- Add comment (public/internal) - `POST /api/complaints/{id}/comments`
- List comments - `GET /api/complaints/{id}/comments`

#### Attachments
- Upload files - `POST /api/complaints/{id}/attachments`
- List attachments - `GET /api/complaints/{id}/attachments`

#### Subscriptions
- Get trader's subscription - `GET /api/subscriptions/me`
- List all subscriptions (admin) - `GET /api/subscriptions`
- Auto-expire check

#### Payments
- Submit payment proof - `POST /api/payments`
- List payments (role-filtered) - `GET /api/payments`
- Approve/reject payment - `PATCH /api/payments/{id}`
- Auto-create subscription on approval

#### Feedback
- Submit feedback (1-5 stars + comment) - `POST /api/complaints/{id}/feedback`
- Get feedback - `GET /api/complaints/{id}/feedback`

#### Categories (Admin)
- Create category - `POST /api/categories`
- List categories - `GET /api/categories`
- Update category - `PATCH /api/categories/{id}`
- Delete category - `DELETE /api/categories/{id}`

#### Payment Methods (Admin)
- CRUD operations - `/api/admin/payment-methods`

#### SLA Configs (Admin)
- CRUD operations - `/api/admin/sla-configs`

#### System Settings (Admin)
- CRUD operations - `/api/admin/settings`

#### Analytics
- Dashboard stats - `GET /api/dashboard/stats`
  * Total, submitted, under_review, escalated, resolved, rejected counts
  * Average resolution time
  * Complaints by category

#### Audit Trail
- List audit logs - `GET /api/admin/audit-logs`
- Auto-logging on key actions

### ⚠️ Missing/Incomplete Backend Features

1. **Workflow Automation**
   - Auto-assign complaints to technical committee by category
   - SLA timer with auto-escalation when threshold exceeded
   - Auto-close resolved complaints after N days of inactivity
   - Notifications on status changes

2. **Duplicate Detection**
   - Similarity check when submitting new complaint
   - Warn traders about potentially duplicate complaints

3. **Enhanced Analytics**
   - Time-range filters for dashboard
   - SLA breach tracking and reporting
   - Feedback trends over time
   - More detailed charts data

4. **Notification System**
   - Email/SMS hooks for key events
   - Template system for notifications
   - Integration points for external services

### ✅ Completed Frontend Features

- Setup wizard for initial admin
- Login and registration pages
- Role-based routing
- Three dashboard pages with stats
- Complaint list with filters
- Complaint detail view
- Comment system
- Header with user info and logout
- RTL layout for Arabic
- i18next setup (partial translations)

### ⚠️ Missing/Incomplete Frontend Features

1. **Higher Committee Admin Pages**
   - Users Management page (list, create, edit, deactivate, reset password)
   - Settings page (categories, SLA configs, payment methods, system settings)
   - Payments Review page (queue, approve/reject, history)
   - Analytics page (charts, time filters, detailed stats)
   - Audit Log viewer (filters, pagination)

2. **Technical Committee Enhancements**
   - Advanced filters UI
   - Improved assignment interface
   - Internal comments visibility toggle
   - Escalation workflow UI

3. **Trader Pages**
   - Subscription status page
   - Payment proof upload interface
   - Feedback modal after resolution
   - Reopen complaint functionality

4. **General Improvements**
   - Complete Arabic/English translations
   - Loading states on all forms
   - Error handling and user feedback
   - Form validation with clear messages
   - Prevent double submissions
   - Attachment preview/download UI
   - Duplicate warning on complaint submission

## Recent Changes
- **2025-10-30**: Project successfully migrated to Replit environment
  * Installed all Python dependencies via uv
  * Installed all Node.js dependencies via npm
  * Initialized PostgreSQL database with all tables
  * Seeded default categories
  * Both backend and frontend workflows running successfully
  * Backend accessible on port 8000
  * Frontend accessible on port 5000

## Environment Setup

### Prerequisites
- Python 3.11+ with uv package manager
- Node.js 18+ with npm
- PostgreSQL database (provided by Replit)

### Installation & Running

1. **Backend Setup**
```bash
# Install Python dependencies (already done)
uv sync

# Initialize database (already done)
uv run python backend/init_db.py

# Run backend server
cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

2. **Frontend Setup**
```bash
# Install dependencies (already done)
cd frontend && npm install

# Run development server
npm run dev
```

### Environment Variables
All database credentials are auto-configured:
- `DATABASE_URL` - PostgreSQL connection string
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

### Creating First Admin
Run the setup wizard by accessing the application. If not shown, run:
```bash
uv run python backend/create_admin.py
```

## API Endpoints Summary

### Public
- `GET /api/setup/status` - Check if setup is needed
- `POST /api/setup/initialize` - Create first admin
- `POST /api/auth/register` - Register trader
- `POST /api/auth/login` - Login

### Authenticated
- `GET /api/auth/me` - Get current user
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/categories` - List categories
- `GET /api/users/committee` - List committee members

### Traders
- `POST /api/complaints` - Submit complaint
- `GET /api/complaints` - List my complaints
- `GET /api/complaints/{id}` - View complaint
- `POST /api/complaints/{id}/comments` - Add comment
- `POST /api/complaints/{id}/attachments` - Upload file
- `POST /api/complaints/{id}/reopen` - Reopen complaint
- `POST /api/complaints/{id}/feedback` - Submit feedback
- `GET /api/subscriptions/me` - My subscription
- `POST /api/payments` - Upload payment proof
- `GET /api/payments` - My payments

### Technical Committee
- `GET /api/complaints` - All complaints (filtered)
- `PATCH /api/complaints/{id}` - Update complaint
- Internal comments support

### Higher Committee (Admin)
- All Technical Committee endpoints plus:
- `/api/admin/users/*` - User management
- `/api/admin/payment-methods/*` - Payment methods CRUD
- `/api/admin/sla-configs/*` - SLA configuration
- `/api/admin/settings/*` - System settings
- `/api/admin/audit-logs` - Audit log viewer
- `/api/categories/*` - Category management
- `/api/payments/*` - Payment approval
- `/api/subscriptions` - All subscriptions

## Default Data

### Categories (Pre-populated)
1. الموصفات والمقاييس (Standards and Measurements)
2. الجمارك (Customs)
3. الضرائب (Taxes)
4. صندوق النظافة والتحسين (Cleaning and Improvement Fund)
5. مباحث الأموال العامة (Public Funds Investigation)
6. خلل إداري (Administrative Issues)

## Next Implementation Steps

### High Priority
1. Complete Higher Committee admin UI pages
2. Implement workflow automation (auto-assign, SLA timers)
3. Add duplicate complaint detection
4. Complete trader subscription management UI
5. Enhanced analytics with charts

### Medium Priority
6. Complete Arabic/English translations
7. Notification hooks/templates
8. Form validation improvements
9. Comprehensive seed script

### Low Priority
10. Email/SMS integration
11. Advanced reporting
12. Bulk operations
13. Export functionality

## Development Notes

### Running Workflows
- Backend: `cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 8000`
- Frontend: `cd frontend && npm run dev`

### Database Operations
- Initialize: `uv run python backend/init_db.py`
- Seed data: `uv run python backend/seed.py`
- All migrations are handled by SQLAlchemy's `create_all()`

### Code Conventions
- Backend: FastAPI with Pydantic schemas, SQLAlchemy models
- Frontend: React functional components with hooks
- All user-facing text should support AR/EN via i18next
- Use RTL layout for Arabic
- Follow existing code patterns for consistency

## Acceptance Test Checklist

- [ ] A1: Admin creates Technical Committee and Trader users
- [ ] A2: Trader uploads payment proof → Admin approves → Subscription active
- [ ] A3: Trader files complaint with attachment
- [ ] A4: Auto-assign to Technical Committee → Update → Resolve → Auto-close
- [ ] A5: Trader reopens → Technical escalates → Admin finalizes
- [ ] A6: Trader submits feedback
- [ ] A7: Admin changes category SLA → Stats update
- [ ] A8: Audit log shows all events with actors and timestamps
