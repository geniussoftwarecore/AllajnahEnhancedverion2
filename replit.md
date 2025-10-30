# Allajnah Enhanced - نظام إدارة الشكاوى

## Overview
Allajnah Enhanced is a comprehensive complaint management system designed for Yemeni traders and oversight committees. The system facilitates the submission, tracking, and resolution of complaints against government entities with a multi-level committee review workflow.

## Tech Stack
- **Backend**: Python with FastAPI, SQLAlchemy ORM, PostgreSQL database
- **Frontend**: React with Vite, TailwindCSS for styling
- **Authentication**: JWT-based authentication with role-based access control
- **Language**: Full Arabic language support with RTL layout

## Architecture

### Database Schema
1. **Users Table**: Stores user accounts with roles (trader, technical_committee, higher_committee)
2. **Categories Table**: Pre-populated with government entities (Customs, Standards, Taxes, etc.)
3. **Complaints Table**: Complaint records with comprehensive fields matching the Arabic complaint form
4. **Comments Table**: Supports public and internal comments on complaints
5. **Attachments Table**: File attachments for complaint evidence

### User Roles
1. **Trader (تاجر)**: Can submit complaints, track status, add comments
2. **Technical Committee (اللجنة الفنية)**: Reviews complaints, assigns to members, updates status, can escalate
3. **Higher Committee (اللجنة العليا)**: Reviews all complaints and escalated cases, makes final decisions

### Complaint Workflow
1. Trader submits complaint → Status: "Submitted"
2. Technical Committee reviews → Status: "Under Review"
3. Can be escalated → Status: "Escalated"
4. Final resolution → Status: "Resolved" or "Rejected"

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI application and API endpoints
│   ├── database.py          # Database connection and session management
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas for validation
│   ├── auth.py              # JWT authentication and role-based access
│   ├── init_db.py           # Database initialization script
│   ├── requirements.txt     # Python dependencies
│   └── uploads/             # File attachments storage
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx         # React application entry point
│   │   ├── App.jsx          # Main app component with routing
│   │   ├── index.css        # Global styles with TailwindCSS
│   │   ├── api/
│   │   │   └── axios.js     # API client configuration
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Authentication context
│   │   ├── pages/
│   │   │   ├── Login.jsx                      # Login page
│   │   │   ├── Register.jsx                   # Registration page
│   │   │   ├── TraderDashboard.jsx            # Trader dashboard
│   │   │   ├── TechnicalCommitteeDashboard.jsx  # Technical committee dashboard
│   │   │   └── HigherCommitteeDashboard.jsx    # Higher committee dashboard
│   │   └── components/
│   │       ├── Header.jsx           # Application header
│   │       ├── ComplaintForm.jsx    # Complaint submission form
│   │       ├── ComplaintList.jsx    # List of complaints with filters
│   │       └── ComplaintDetail.jsx  # Detailed complaint view with comments
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite configuration
```

## Features Implemented

### Authentication & Authorization
- User registration with role selection
- JWT-based login
- Role-based access control for all endpoints
- Protected routes in frontend

### Trader Features
- Submit complaints with full Arabic form fields
- View all personal complaints
- Filter complaints by status
- View complaint details and status
- Add public comments to complaints
- Dashboard with complaint statistics

### Technical Committee Features
- View all submitted and under-review complaints
- Assign complaints to committee members
- Update complaint status
- Add internal (committee-only) and public comments
- Escalate complaints to Higher Committee
- Dashboard with statistics

### Higher Committee Features
- View all complaints across the system
- Review escalated complaints
- Make final decisions (resolve/reject)
- Full access to all complaint management features
- Comprehensive dashboard with statistics

### Complaint Management
- Comprehensive complaint form matching the Arabic template provided
- Fields include: personal info, complaint details, dates, desired resolution
- Status tracking through workflow stages
- Comment system with public/internal visibility
- File attachment support (ready for implementation)

## Recent Changes
- 2025-10-30: Initial project setup and full implementation
- Database schema created with all necessary tables
- FastAPI backend with complete REST API
- React frontend with three role-based dashboards
- Arabic language support with RTL layout
- Authentication and authorization system
- Complaint submission and management workflow
- **Security Fix**: Public registration now restricted to trader role only
- Added admin-only endpoint for creating committee users
- Removed role selection from public registration form

## Environment Variables
The following environment variables are configured:
- `DATABASE_URL`: PostgreSQL database connection string
- `SESSION_SECRET`: JWT secret key for token signing
- Other database connection variables (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration (trader role only)
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Admin (Higher Committee Only)
- `POST /api/admin/users` - Create committee users (technical or higher committee)

### Complaints
- `GET /api/complaints` - List complaints (filtered by role)
- `POST /api/complaints` - Create new complaint (trader only)
- `GET /api/complaints/{id}` - Get complaint details
- `PATCH /api/complaints/{id}` - Update complaint (committee only)

### Comments
- `GET /api/complaints/{id}/comments` - Get complaint comments
- `POST /api/complaints/{id}/comments` - Add comment

### Attachments
- `GET /api/complaints/{id}/attachments` - Get complaint attachments
- `POST /api/complaints/{id}/attachments` - Upload attachment

### Other
- `GET /api/categories` - List complaint categories
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/users/committee` - List committee users

## How to Use

### Initial Setup
To create the first Higher Committee admin user, run:
```bash
cd backend && python create_admin.py
```
This will prompt you to enter the admin's credentials. Once created, this admin can login and create additional committee users through the admin endpoint.

### For Traders
1. **Register an Account**: Click "Register" and fill out the form (all registrations are automatically assigned the trader role)
2. **Login**: Use your credentials to access your dashboard
3. **Submit Complaints**: Use the comprehensive Arabic form based on the official complaint template
4. **Track Progress**: View your complaint status and updates in real-time

### For Committee Members
Committee members must be created by a Higher Committee admin:
1. **Login**: Use credentials provided by the admin
2. **Review Complaints**: View submitted complaints in your dashboard
3. **Assign & Update**: Assign complaints to team members and update status
4. **Add Comments**: Add public or internal comments
5. **Escalate**: Technical Committee can escalate to Higher Committee
6. **Resolve**: Make final decisions on complaints

## Default Categories
The system includes pre-populated categories for common government entities:
- الموصفات والمقاييس (Standards and Measurements)
- الجمارك (Customs)
- الضرائب (Taxes)
- صندوق النظافة والتحسين (Cleaning and Improvement Fund)
- مباحث الأموال العامة (Public Funds Investigation)
- خلل إداري (Administrative Issues)

## Next Steps for Enhancement
- Email/SMS notifications for status changes
- Advanced analytics and reporting
- Bulk complaint processing
- Payment subscription system
- Feedback system after resolution
- Mobile app development
- Multi-language support (English)
