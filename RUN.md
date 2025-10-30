# Allajnah Enhanced - Setup and Run Instructions

## Overview
Allajnah Enhanced is a complaint management system for Yemeni traders with full Arabic support and multi-role dashboards.

## Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL database (or the project will use the Replit-provided database)

## Environment Setup

### 1. Database Configuration
The project uses a PostgreSQL database. If running on Replit, the database is auto-configured via environment variables. For local setup:

```bash
# The following environment variables should be set:
DATABASE_URL=postgresql://user:password@localhost/allajnah_db
SESSION_SECRET=your-secret-key-change-in-production
```

See `backend/.env.example` for all available configuration options.

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Dependencies are already installed via Replit package manager
# If running locally, install:
# pip install -r requirements.txt

# Initialize the database (creates tables and default categories)
python init_db.py

# Create the first admin user (Higher Committee)
python create_admin.py
# Follow the prompts to enter:
# - Email
# - Password
# - First Name
# - Last Name
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Dependencies are already installed via npm
# If running locally:
# npm install
```

## Running the Application

### Option 1: Using Replit Workflows (Recommended on Replit)
The project has two configured workflows that run automatically:
- **backend**: Runs the FastAPI server on port 8000
- **frontend**: Runs the Vite dev server on port 5000

Both workflows should start automatically. The frontend is accessible at the web preview URL.

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
# Backend will run on http://0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend will run on http://0.0.0.0:5000
```

## Test Credentials (After Running seed.py)

**IMPORTANT**: Public registration is DISABLED for security. All users must be created by admin.

### Seed Database with Demo Data
```bash
uv run python backend/seed.py
```

This creates the following test accounts:

### Higher Committee (Admin)
- **Email**: `admin@allajnah.com`
- **Password**: `admin123`
- Full system access

### Technical Committee
- **Email**: `tech@allajnah.com`
- **Password**: `tech123`
- Review and manage complaints

### Traders
**Trader 1** (with active subscription):
- **Email**: `trader1@example.com`
- **Password**: `trader123`

**Trader 2** (no subscription):
- **Email**: `trader2@example.com`
- **Password**: `trader123`

The seed also creates:
- 4 categories
- 2 payment methods
- System settings
- SLA configurations
- 2 sample complaints
- Sample comments

## User Roles & Features

### 1. Trader (تاجر)
- **Access**: Self-service registration
- **Features**:
  - Submit complaints with full Arabic form
  - View own complaints and their status
  - Add public comments to complaints
  - Submit feedback (rating 1-5) after complaint resolution
  - View subscription status
  - Submit payment proof for subscription renewal
  - Dashboard with complaint statistics

### 2. Technical Committee (اللجنة الفنية)
- **Access**: Created by Higher Committee admin
- **Features**:
  - View all submitted and under-review complaints
  - Assign complaints to committee members
  - Update complaint status and priority
  - Add public and internal comments
  - Escalate complaints to Higher Committee
  - Dashboard with queue management

### 3. Higher Committee (اللجنة العليا)
- **Access**: First admin created via `create_admin.py`, then can create more users
- **Features**:
  - Full access to all complaints
  - Review escalated complaints
  - Make final decisions (resolve/reject)
  - Create committee users (Technical & Higher Committee)
  - Manage categories (CRUD operations)
  - Review and approve/reject payment submissions
  - View comprehensive analytics dashboard
  - Category-wise complaint breakdown
  - Average resolution time metrics
  - Manage subscriptions

## API Endpoints

### Authentication
- ~~`POST /api/auth/register`~~ - **DISABLED** (all users created by admin)
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Workflow Automation (NEW)
- `POST /api/complaints/check-duplicate` - Check for similar complaints before submission
- `POST /api/admin/automation/run-periodic-tasks` - Run all automation tasks (Higher Committee)
- `POST /api/admin/automation/check-sla` - Check SLA violations and escalate (Higher Committee)
- `POST /api/admin/automation/auto-close` - Auto-close inactive resolved complaints (Higher Committee)

### Complaints
- `GET /api/complaints` - List complaints (role-filtered)
- `POST /api/complaints` - Create complaint (trader only)
- `GET /api/complaints/{id}` - Get complaint details
- `PATCH /api/complaints/{id}` - Update complaint (committee only)
- `POST /api/complaints/{id}/attachments` - Upload attachment
- `GET /api/complaints/{id}/attachments` - List attachments
- `POST /api/complaints/{id}/comments` - Add comment
- `GET /api/complaints/{id}/comments` - List comments
- `POST /api/complaints/{id}/feedback` - Submit feedback (trader only, after resolution)
- `GET /api/complaints/{id}/feedback` - Get feedback

### Categories
- `GET /api/categories` - List all categories (public)
- `POST /api/categories` - Create category (admin only)
- `PATCH /api/categories/{id}` - Update category (admin only)
- `DELETE /api/categories/{id}` - Delete category (admin only)

### Subscriptions & Payments
- `GET /api/subscriptions/me` - Get my subscription status (trader)
- `GET /api/subscriptions` - List all subscriptions (admin)
- `POST /api/payments` - Submit payment proof (trader)
- `GET /api/payments` - List payments (role-filtered)
- `PATCH /api/payments/{id}` - Approve/reject payment (admin)

### Dashboard & Analytics
- `GET /api/dashboard/stats` - Get statistics (role-filtered)
  - Total complaints by status
  - Average resolution time (days)
  - Breakdown by category

### Admin
- `GET /api/admin/users` - List all users with filters (role, status, search)
- `POST /api/admin/users` - Create users (all roles)
- `GET /api/admin/users/{id}` - Get user details
- `PATCH /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Deactivate user
- `POST /api/admin/users/{id}/reset-password` - Reset user password
- `GET /api/admin/analytics` - Enhanced analytics with time-range filters
- `GET /api/admin/audit-logs` - Audit log viewer with filters
- `GET /api/admin/payment-methods` - List payment methods
- `POST /api/admin/payment-methods` - Create payment method
- `PATCH /api/admin/payment-methods/{id}` - Update payment method
- `DELETE /api/admin/payment-methods/{id}` - Delete payment method
- `GET /api/admin/sla-configs` - List SLA configurations
- `POST /api/admin/sla-configs` - Create SLA config
- `PATCH /api/admin/sla-configs/{id}` - Update SLA config
- `DELETE /api/admin/sla-configs/{id}` - Delete SLA config
- `GET /api/admin/settings` - List system settings
- `POST /api/admin/settings` - Create setting
- `PATCH /api/admin/settings/{key}` - Update setting
- `DELETE /api/admin/settings/{key}` - Delete setting
- `GET /api/users/committee` - List committee members

## Default Categories

The system includes pre-populated government entity categories:
1. الموصفات والمقاييس (Standards and Measurements)
2. الجمارك (Customs)
3. الضرائب (Taxes)
4. صندوق النظافة والتحسين (Cleaning and Improvement Fund)
5. مباحث الأموال العامة (Public Funds Investigation)
6. خلل إداري (Administrative Issues)

## Workflow & Business Logic

### Complaint Lifecycle
1. **Submitted** - Trader creates complaint
2. **Under Review** - Technical Committee assigns to member
3. **Escalated** - Technical Committee escalates to Higher Committee (optional)
4. **Resolved/Rejected** - Final decision by committee
5. **Feedback** - Trader can submit rating and comment after resolution

### Subscription System
1. Trader submits payment proof with amount and method
2. Payment goes to "Pending" status
3. Higher Committee reviews and approves/rejects
4. If approved, subscription is created automatically (1 month active period)
5. Trader can view subscription status and expiry date
6. Subscription gates can be implemented in trader actions

### Comment System
- **Public Comments**: Visible to everyone involved in the complaint
- **Internal Comments**: Only visible to committee members

## File Structure

```
allajnah-enhanced/
├── backend/
│   ├── main.py              # FastAPI app and all endpoints
│   ├── models.py            # SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic validation schemas
│   ├── database.py          # Database connection
│   ├── auth.py              # JWT authentication & authorization
│   ├── init_db.py           # Database initialization
│   ├── create_admin.py      # Admin user creation script
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment variables template
│   └── uploads/             # File attachments storage
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js           # API client with interceptors
│   │   ├── components/
│   │   │   ├── ComplaintForm.jsx
│   │   │   ├── ComplaintList.jsx
│   │   │   ├── ComplaintDetail.jsx
│   │   │   └── Header.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Auth state management
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── TraderDashboard.jsx
│   │   │   ├── TechnicalCommitteeDashboard.jsx
│   │   │   └── HigherCommitteeDashboard.jsx
│   │   ├── App.jsx                # Routes & PrivateRoute
│   │   ├── main.jsx               # App entry point
│   │   ├── i18n.js                # i18next configuration
│   │   └── index.css              # TailwindCSS styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── RUN.md                   # This file
```

## Features Implemented

### Core Features
✅ User authentication (JWT-based)
✅ Role-based access control (Trader, Technical Committee, Higher Committee)
✅ Complaint management (full CRUD)
✅ File attachments upload/download
✅ Comment system (public & internal)
✅ Category management
✅ Dashboard statistics by role
✅ Arabic language support with RTL layout
✅ i18n support (Arabic/English)

### Advanced Features
✅ **Workflow Automation**:
  - Auto-assign complaints to technical committee on creation
  - SLA monitoring with auto-escalation when thresholds exceeded
  - Auto-close resolved complaints after inactivity period
✅ **Duplicate Detection**: Text similarity check warns about similar complaints
✅ **Enhanced Analytics**: Time-range filters, SLA breaches, feedback ratings, top assignees
✅ **Notification Hooks**: Email/SMS stubs ready for integration
✅ Subscription management system
✅ Payment proof submission and approval workflow
✅ Complaint feedback system (1-5 star rating + comment)
✅ Priority levels for complaints (Low, Medium, High, Urgent)
✅ Complaint status tracking through full lifecycle
✅ Assignment system for committee members
✅ Escalation workflow to Higher Committee
✅ Admin-only user creation for committee members
✅ Audit log with full tracking
✅ Complaint reopen functionality within configured window
✅ SLA configuration per priority level
✅ System settings (key-value configuration store)

## Troubleshooting

### Backend won't start
- Check that DATABASE_URL is set correctly
- Run `python init_db.py` to ensure tables are created
- Check `backend/uploads/` directory exists

### Frontend won't connect to backend
- Ensure both servers are running
- Check that backend is accessible at `/api`
- Verify CORS settings in `backend/main.py`

### 401 Unauthorized errors
- Check that JWT token is being sent in requests
- Verify SESSION_SECRET is set and consistent
- Token may have expired (default: 7 days)

### Database errors
- Run `python backend/init_db.py` to recreate tables
- Check PostgreSQL connection settings
- Verify all required environment variables are set

## Development Notes

- **Backend runs on port 8000** - API endpoints available at `http://localhost:8000/api`
- **Frontend runs on port 5000** - User interface at `http://localhost:5000`
- **File uploads** stored in `backend/uploads/`
- **Default JWT expiry**: 7 days
- **Database**: PostgreSQL (Replit-provided or local)
- **RTL support**: Enabled by default for Arabic

## Production Deployment

For production deployment on Replit:
1. Ensure SESSION_SECRET is set to a secure random value
2. File uploads directory is persistent
3. Database backups are configured
4. Consider implementing rate limiting
5. Enable HTTPS only
6. Review and restrict CORS settings

## Support & Documentation

- View API docs: `http://localhost:8000/docs` (FastAPI automatic docs)
- View alternative API docs: `http://localhost:8000/redoc`

## License

This project is proprietary software for complaint management in Yemen.
