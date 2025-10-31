# Allajnah Enhanced - نظام إدارة الشكاوى المحسّن

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Demo Accounts](#demo-accounts)
4. [Features](#features)
5. [User Workflows](#user-workflows)
6. [System Architecture](#system-architecture)
7. [API Documentation](#api-documentation)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Overview

**Allajnah Enhanced** is a professional, full-stack complaint management platform designed for traders and government oversight committees. Built with modern technologies, it provides a complete workflow for complaint submission, tracking, resolution, and escalation.

### Key Highlights
- 🌐 **Bilingual Support**: Full Arabic and English interface with RTL layout
- 🔐 **Role-Based Access Control**: Three distinct user roles with appropriate permissions
- 📊 **Advanced Analytics**: Real-time dashboards with charts and time-based filtering
- 🔔 **Notification System**: Ready hooks for email/SMS integration
- 📁 **File Attachments**: Support for complaint evidence uploads
- 💳 **Subscription Management**: Annual subscription with payment proof workflow
- 🔍 **Duplicate Detection**: AI-powered similar complaint detection
- ⚡ **SLA Monitoring**: Automated escalation based on configurable SLA thresholds
- 📝 **Audit Trail**: Complete system activity logging
- ⭐ **Feedback System**: Post-resolution rating and comments

### Technology Stack
- **Backend**: Python 3.11, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: React 18, Vite, TailwindCSS, i18next
- **Charts**: Recharts
- **Package Management**: uv (Python), npm (Node.js)
- **Database**: PostgreSQL (Neon-backed)
- **Authentication**: JWT with bcrypt password hashing

---

## Quick Start

### Prerequisites
- Python 3.11+ with uv package manager
- Node.js 18+ with npm
- PostgreSQL database (automatically provided in Replit environment)

### Installation

The project is already set up and running. Both workflows are active:

1. **Backend**: Running on http://0.0.0.0:8000
2. **Frontend**: Running on http://0.0.0.0:5000

### First-Time Setup

If starting fresh, run these commands:

```bash
# Initialize database
cd backend && uv run python init_db.py

# Populate demo data
cd backend && uv run python seed.py
```

---

## Demo Accounts

The following demo accounts have been created:

### Admin (Higher Committee)
- **Email**: admin@allajnah.com
- **Password**: admin123
- **Access**: Full system access, user management, settings, analytics, audit logs

### Technical Committee
- **Email**: tech@allajnah.com
- **Password**: tech123
- **Access**: Review complaints, assign, update status, add internal comments, escalate

### Trader 1 (Active Subscription)
- **Email**: trader1@example.com
- **Password**: trader123
- **Access**: Submit complaints, view own complaints, manage subscription, upload payments
- **Status**: Has active subscription with 11 months remaining

### Trader 2
- **Email**: trader2@example.com
- **Password**: trader123
- **Access**: Submit complaints, view own complaints, manage subscription, upload payments
- **Status**: No active subscription

---

## Features

### For Traders (التجّار)

#### Complaint Management
- **Submit Complaints**: Comprehensive form matching official complaint format
  - Personal information or on-behalf-of filing
  - Category selection (Customs, Standards, Taxes, etc.)
  - Problem dates and detailed description
  - Desired resolution and previous complaint history
  - File attachments support
  
- **Track Complaints**: View all submitted complaints with status filtering
  - Status: Submitted, Under Review, Escalated, Resolved, Rejected
  - Priority levels: Low, Medium, High, Urgent
  - Timeline tracking
  
- **Communication**: 
  - Add public comments on complaints
  - Receive updates from committees
  - View resolution details

- **Feedback**: Rate complaint resolution (1-5 stars) with comments

- **Reopen**: Reopen resolved/rejected complaints within 7-day window

#### Subscription Management
- View subscription status and expiration date
- Upload payment proof with receipt images
- Track payment approval status
- Renewal notifications for expiring subscriptions

### For Technical Committee (اللجنة الفنية)

#### Complaint Processing
- View all submitted and assigned complaints
- Filter by status, category, priority
- Search by keywords
- Auto-assignment on complaint creation

#### Workflow Actions
- Update complaint status
- Assign to committee members
- Set priority levels
- Add internal notes (hidden from traders)
- Add public comments
- Escalate to Higher Committee when needed

#### Dashboard
- Statistics overview
- Active complaints count
- Status breakdown
- Category distribution

### For Higher Committee / Admin (اللجنة العليا)

#### User Management
- Create users (Traders, Technical Committee, Higher Committee)
- View all users with filters (role, status, search)
- Edit user profiles
- Deactivate/reactivate users
- Reset user passwords
- Last admin protection (cannot deactivate last admin)

#### Payment Review
- View all payment submissions
- Approve/reject payment proofs
- Add approval notes
- Automatic subscription creation on approval
- Filter by status (pending, approved, rejected)

#### Settings Management

**Categories**
- Create/edit/delete complaint categories
- Configure government entity mappings
- Arabic/English names and descriptions

**SLA Configurations**
- Set response time thresholds (hours)
- Set resolution time thresholds (hours)
- Set escalation time thresholds (hours)
- Configure per priority level (Urgent, High, Medium, Low)
- Category-specific or global SLA rules

**Payment Methods**
- Configure available payment options
- Set Arabic/English names
- Provide payment instructions
- Enable/disable methods

**System Settings**
- Annual subscription price
- Reopen window duration
- Auto-close inactive complaints
- Duplicate detection threshold
- Maximum file upload size

#### Advanced Analytics
- **Time-Range Filtering**: Filter all metrics by date range
- **Metrics Dashboard**:
  - Total complaints
  - Resolution rate percentage
  - Average resolution time (days)
  - SLA breaches count
  - Active subscriptions
  - Subscriptions expiring soon (30 days)
  - Pending payments
  - Average feedback rating
- **Visualizations**:
  - Complaints by status (progress bars)
  - Complaints by category (breakdown)
  - Top assignees by complaint count
- **Export-Ready**: Data structured for CSV/PDF export

#### Audit Log
- Complete system activity trail
- Filter by:
  - User (actor)
  - Action type (CREATE, UPDATE, DELETE, etc.)
  - Target type (complaint, user, payment, etc.)
  - Date range
- Immutable log entries
- Timestamp and user tracking

#### Workflow Automation
- **Auto-Assignment**: New complaints automatically assigned to Technical Committee
- **SLA Monitoring**: Automated escalation when thresholds exceeded
- **Auto-Close**: Resolved complaints auto-closed after configured inactivity period
- **Manual Triggers**: Run automation tasks on-demand via API

---

## User Workflows

### Complete Complaint Lifecycle

```
1. TRADER SUBMITS COMPLAINT
   ├─→ Fills detailed complaint form
   ├─→ Uploads supporting documents
   ├─→ Duplicate check warns of similar complaints
   └─→ Status: SUBMITTED

2. AUTO-ASSIGNMENT
   ├─→ System assigns to Technical Committee member
   └─→ Status: UNDER_REVIEW

3. TECHNICAL COMMITTEE REVIEWS
   ├─→ Examines complaint details
   ├─→ Adds internal notes
   ├─→ Communicates with trader (public comments)
   └─→ Either:
       ├─→ RESOLVES directly → Status: RESOLVED
       └─→ ESCALATES → Status: ESCALATED

4. HIGHER COMMITTEE (if escalated)
   ├─→ Reviews escalated case
   ├─→ Makes final decision
   └─→ Status: RESOLVED or REJECTED

5. TRADER RECEIVES RESOLUTION
   ├─→ Views resolution details
   ├─→ Submits feedback (rating + comment)
   └─→ Option to REOPEN within 7 days if unsatisfied

6. AUTO-CLOSE
   └─→ After 7 days of inactivity, complaint auto-closes
```

### Subscription Renewal Flow

```
1. TRADER
   ├─→ Views subscription status
   ├─→ Sees expiration warning (30 days before)
   └─→ Uploads payment proof

2. HIGHER COMMITTEE
   ├─→ Reviews payment proof
   ├─→ Verifies payment details
   └─→ Approves or Rejects

3. SYSTEM
   └─→ On approval:
       ├─→ Creates new subscription (1 year)
       ├─→ Updates trader status to ACTIVE
       └─→ Trader can submit complaints
```

---

## System Architecture

### Database Schema

#### Core Tables
- **users**: User accounts with roles and credentials
- **categories**: Complaint categories and government entities
- **complaints**: Comprehensive complaint records
- **comments**: Public and internal notes on complaints
- **attachments**: File uploads linked to complaints
- **subscriptions**: Annual subscription tracking
- **payments**: Payment proof uploads and approval workflow
- **complaint_feedbacks**: Post-resolution ratings
- **audit_logs**: System-wide activity trail

#### Configuration Tables
- **payment_methods**: Available payment options
- **sla_configs**: SLA thresholds by priority/category
- **system_settings**: Key-value configuration store

### API Architecture

The backend exposes RESTful API endpoints organized by feature:

- **Authentication**: `/api/auth/*` - Login, registration, token management
- **Setup**: `/api/setup/*` - Initial system configuration
- **Complaints**: `/api/complaints/*` - CRUD and workflow operations
- **Users**: `/api/admin/users/*` - User management (admin only)
- **Payments**: `/api/payments/*` - Payment review and tracking
- **Subscriptions**: `/api/subscriptions/*` - Subscription management
- **Settings**: `/api/admin/settings/*` - System configuration (admin only)
- **Analytics**: `/api/admin/analytics` - Enhanced metrics (admin only)
- **Audit**: `/api/admin/audit-logs` - Activity trail (admin only)

### Frontend Structure

```
frontend/src/
├── api/
│   └── axios.js              # API client with interceptors
├── components/
│   ├── ComplaintDetail.jsx   # Full complaint view with actions
│   ├── ComplaintForm.jsx     # Comprehensive submission form
│   ├── ComplaintList.jsx     # Complaint table with filters
│   └── Header.jsx            # Navigation and user menu
├── context/
│   └── AuthContext.jsx       # Authentication state management
├── pages/
│   ├── Admin/
│   │   ├── Analytics.jsx     # Advanced analytics dashboard
│   │   ├── AuditLog.jsx      # Activity trail viewer
│   │   ├── PaymentsReview.jsx # Payment approval interface
│   │   ├── Settings.jsx       # System configuration
│   │   └── UsersManagement.jsx # User CRUD operations
│   ├── HigherCommitteeDashboard.jsx
│   ├── TechnicalCommitteeDashboard.jsx
│   ├── TraderDashboard.jsx
│   ├── TraderSubscription.jsx  # Subscription & payment management
│   ├── Login.jsx
│   ├── Register.jsx
│   └── Setup.jsx               # First-time admin setup
├── App.jsx                     # Routing and role-based access
├── i18n.js                     # Internationalization config
├── index.css                   # Global styles with RTL support
└── main.jsx                    # React entry point
```

---

## API Documentation

### Authentication Endpoints

#### POST `/api/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "admin@allajnah.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "admin@allajnah.com",
    "first_name": "Admin",
    "last_name": "User",
    "role": "higher_committee",
    "is_active": true
  }
}
```

#### GET `/api/auth/me`
Get current authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:** User object

### Complaint Endpoints

#### POST `/api/complaints`
Create a new complaint (Traders only).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "category_id": 1,
  "title": "مشكلة في الخدمات الصحية",
  "description": "تفاصيل المشكلة",
  "complaint_summary": "ملخص الشكوى",
  "complaining_on_behalf_of": "self",
  "priority": "high",
  "problem_occurred_date": "2025-10-25T00:00:00Z",
  "problem_discovered_date": "2025-10-27T00:00:00Z",
  "desired_resolution": "الحل المطلوب"
}
```

**Response:** Created complaint object

#### GET `/api/complaints`
List complaints (filtered by role).

**Query Parameters:**
- `status`: Filter by status (submitted, under_review, escalated, resolved, rejected)
- `category_id`: Filter by category

**Response:** Array of complaint objects

#### PATCH `/api/complaints/{id}`
Update complaint status/assignment (Committee only).

**Request:**
```json
{
  "status": "under_review",
  "assigned_to_id": 2,
  "priority": "urgent"
}
```

### Admin Endpoints

#### GET `/api/admin/analytics`
Get enhanced analytics with time filtering.

**Query Parameters:**
- `start_date`: ISO format date (e.g., 2025-01-01)
- `end_date`: ISO format date (e.g., 2025-12-31)

**Response:**
```json
{
  "total_complaints": 150,
  "submitted": 20,
  "under_review": 45,
  "escalated": 10,
  "resolved": 60,
  "rejected": 15,
  "avg_resolution_time_days": 5.2,
  "sla_breaches": 8,
  "active_subscriptions": 42,
  "expiring_soon": 5,
  "pending_payments": 3,
  "avg_feedback_rating": 4.2,
  "resolution_rate": 50.0,
  "by_category": {
    "الجمارك": 45,
    "الموصفات والمقاييس": 30
  },
  "top_assignees": [
    {"name": "Technical Committee", "count": 85}
  ]
}
```

#### POST `/api/admin/users`
Create a new user (Admin only).

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "first_name": "محمد",
  "last_name": "أحمد",
  "role": "trader",
  "phone": "+249912345678"
}
```

### Payment & Subscription Endpoints

#### POST `/api/payments`
Submit payment proof (Traders only).

**Request:** FormData with:
- `amount`: Payment amount
- `method`: Payment method name
- `file`: Payment proof image

#### PATCH `/api/payments/{id}`
Approve or reject payment (Admin only).

**Request:**
```json
{
  "status": "approved",
  "approval_notes": "تم التحقق من الدفع"
}
```

---

## Deployment

### Current Status
The application is configured and running in the Replit environment:
- Backend: Port 8000
- Frontend: Port 5000
- Database: PostgreSQL (Neon-backed)

### Publishing to Production

To deploy this application for public access:

1. Click the **"Deploy"** button in Replit
2. Configure the deployment:
   - **Deployment Type**: Autoscale (recommended) or VM
   - **Build Command**: Already configured in workflows
   - **Run Command**: Already configured in workflows
3. Set environment variables if needed (DATABASE_URL is auto-configured)
4. Deploy and get your live URL

### Environment Variables
The following are automatically configured:
- `DATABASE_URL`: PostgreSQL connection string
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`: Individual DB credentials

### Production Checklist
- [ ] Change default admin password
- [ ] Configure actual payment methods and instructions
- [ ] Set real subscription prices
- [ ] Enable email/SMS notifications (integrate with provider)
- [ ] Set up regular database backups
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring and alerts
- [ ] Review and adjust SLA thresholds
- [ ] Train users on the system

---

## Troubleshooting

### Common Issues

#### "No Admin Found" Error
**Problem:** Trying to access the system before initial setup.

**Solution:** Access `/setup` route and create the first admin user.

#### "Subscription Required" When Submitting Complaint
**Problem:** Trader doesn't have an active subscription.

**Solution:**
1. Navigate to Subscription page
2. Upload payment proof
3. Wait for admin approval
4. Subscription will be activated

#### Frontend Not Loading
**Problem:** Vite dev server not running.

**Solution:** 
```bash
cd frontend && npm install
npm run dev
```

#### Backend API Errors
**Problem:** FastAPI server not running or database not initialized.

**Solution:**
```bash
cd backend
uv run python init_db.py  # Initialize database
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

#### CSS Not Loading Properly
**Problem:** Tailwind styles not applied.

**Solution:** Restart the frontend workflow. Vite will rebuild the CSS.

### Database Issues

#### Reset Database
⚠️ **Warning:** This deletes all data!

```bash
cd backend
uv run python
>>> from database import engine, Base
>>> Base.metadata.drop_all(bind=engine)
>>> Base.metadata.create_all(bind=engine)
>>> exit()
uv run python init_db.py
uv run python seed.py
```

#### View Database Schema
```bash
uv run python
>>> from database import SessionLocal
>>> from models import User, Complaint, Payment  # etc.
>>> db = SessionLocal()
>>> db.query(User).count()  # Count users
```

### Performance Optimization

#### For Production Deployment

1. **Frontend:**
   - Build optimized production bundle: `npm run build`
   - Serve with production server (not dev server)

2. **Backend:**
   - Use production ASGI server with workers
   - Enable connection pooling
   - Add caching layer (Redis) for analytics

3. **Database:**
   - Create indexes on frequently queried columns
   - Regular vacuum and analyze
   - Connection pooling

---

## Advanced Features

### Workflow Automation

The system includes automated tasks that run periodically:

1. **Auto-Assignment**: All new complaints automatically assigned to Technical Committee
2. **SLA Monitoring**: Complaints checked against SLA thresholds, auto-escalated if exceeded
3. **Auto-Close**: Resolved complaints auto-closed after configured days of inactivity

Manual triggers available via API:
- `POST /api/admin/automation/check-sla`
- `POST /api/admin/automation/auto-close`
- `POST /api/admin/automation/run-periodic-tasks`

### Duplicate Detection

Before submitting a complaint, the system checks for similar existing complaints using text similarity algorithms. If duplicates found (>70% similarity), user is warned and shown similar complaints.

API: `POST /api/complaints/check-duplicate`

### Notification Hooks

The system has notification hooks ready for integration with email/SMS providers. See `backend/notifications.py` for stub functions:

- `notify_complaint_status_change()`
- `notify_assignment()`
- `notify_escalation()`
- `notify_payment_approval()`
- `notify_subscription_expiry()`
- `notify_sla_violation()`

Integrate with services like:
- SendGrid (email)
- Twilio (SMS)
- Firebase Cloud Messaging (push notifications)

### Internationalization

The system supports full Arabic and English translation:

1. **Frontend**: Translations in `frontend/src/i18n.js`
2. **Database**: Dual-language columns (`name_ar`, `name_en`)
3. **RTL Layout**: Automatic right-to-left for Arabic
4. **Date Formatting**: Locale-aware date display

To switch language (future enhancement):
```javascript
import { useTranslation } from 'react-i18next';
const { i18n } = useTranslation();
i18n.changeLanguage('en'); // or 'ar'
```

---

## Contributing

### Code Style
- **Python**: Follow PEP 8, use type hints where possible
- **JavaScript**: Use functional components, hooks, and clear naming
- **SQL**: Use SQLAlchemy ORM, avoid raw SQL
- **Comments**: Minimal comments, self-documenting code preferred

### Testing
- Backend: Add unit tests using pytest
- Frontend: Add component tests using React Testing Library
- Integration: Test full user workflows

### Git Workflow
- Make commits with clear, descriptive messages
- Feature branches for new functionality
- Pull requests with description and testing notes

---

## License & Credits

**Allajnah Enhanced** is a custom-built complaint management system designed for Yemeni traders and oversight committees.

Built with:
- FastAPI (backend framework)
- React (frontend framework)
- PostgreSQL (database)
- TailwindCSS (styling)
- Vite (build tool)

---

## Support

For issues, questions, or feature requests:
1. Check this documentation
2. Review the code comments
3. Examine the audit logs for system behavior
4. Check browser console and backend logs

---

**Last Updated**: October 31, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
