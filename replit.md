# Allajnah Enhanced - Complaint Management System

## Overview
Allajnah Enhanced is a comprehensive complaint management system for Yemeni traders and oversight committees. It streamlines the submission, tracking, and multi-level committee review of complaints against government entities, aiming to enhance transparency and accountability. The system supports full Arabic language with RTL layout and is production-ready. Key capabilities include multi-status complaint progression, secure file attachments, a robust notification system, and an account approval workflow for merchants.

## User Preferences
I prefer iterative development with a focus on completing core functionalities first, then refining and adding advanced features. I value clear, concise explanations and prefer to be asked before major architectural or design changes are implemented. All user-facing text should support both Arabic and English, with Arabic being the primary language and using an RTL layout. Please follow existing code patterns for consistency.

## System Architecture

### UI/UX Decisions
-   **Language Support**: Full Arabic language support with RTL layout using i18next; English also supported.
-   **Design System**: TailwindCSS for consistent, responsive design, incorporating modern aesthetics like Neumorphism and Glassmorphism, and full dark mode support. Features smooth animations via Framer Motion.
-   **Accessibility**: Enhanced ARIA roles and semantic HTML across UI components.
-   **Responsive Design**: Mobile-first approach with custom Tailwind breakpoints.

### Technical Implementations
-   **Authentication**: JWT-based authentication with robust role-based access control (RBAC).
-   **Database**: PostgreSQL managed with SQLAlchemy ORM.
-   **Workflow Automation**: Smart task queuing, multi-member task assignment, SLA monitoring with auto-escalation, and auto-closing. Includes concurrency protection and a Higher Committee approval system.
-   **Enhanced Escalation System**: Manual escalation by TC members, trader appeal paths to Higher Committee, intelligent TC reassignment, automatic routing of reopened complaints to different reviewers, multi-reviewer approval requirements for complex cases, and mediation request workflow.
-   **Duplicate Detection**: Text similarity to warn about potential duplicate complaints.
-   **Notification System**: Comprehensive email (SendGrid) and SMS (Twilio - currently email-only mode) notification system with granular user preferences. Uses Replit connectors first, falling back to environment variables.
-   **Analytics**: Comprehensive dashboard statistics and administrative analytics.
-   **Audit Trail**: System-wide logging of key actions including all escalations, appeals, reassignments, and mediation requests.
-   **Security**: Robust file upload validation, CORS configuration, rate limiting, and session handling.
-   **Deployment**: Configured for production deployment on Replit with VM deployment target, including health check endpoints and optimized build processes.
-   **Account Approval**: Merchant accounts require Higher Committee approval after registration, with pending/rejected statuses and audit logging.

### Feature Specifications
-   **User Roles**: Trader (submits/tracks/appeals), Technical Committee (reviews/assigns/updates/escalates/reassigns/requests mediation), Higher Committee (admin access, decision-making, approvals, mediates).
-   **Profile Management**: Self-service editing, profile picture upload (with quick upload from dropdown), secure password changes, email updates, profile completion indicator, account statistics, and notification preferences.
-   **Complaint Workflow**: Multi-status progression (Submitted, Under Review, Escalated, Resolved/Rejected, Mediation Pending/In Progress) with re-opening, feedback, task acceptance/rejection, multi-step approvals, and file attachment support.
-   **Escalation & Appeals**:
    - **Manual Escalation**: TC members can escalate complex cases directly to Higher Committee without waiting for SLA violations
    - **Trader Appeals**: Traders can request Higher Committee review of resolved/rejected complaints if unsatisfied
    - **TC Reassignment**: TC members can transfer cases to colleagues or request automatic reassignment based on workload
    - **Smart Reopening**: Reopened complaints automatically route to different TC members for fresh perspective
    - **Multi-Reviewer Approvals**: Complex cases can require multiple Higher Committee approvals before finalization
    - **Mediation Requests**: TC can request Higher Committee mediation for cases with communication challenges
-   **File Attachments**: Multi-file upload with drag-and-drop, per-file error tracking, smart retry logic, download functionality with authorization checks, and audit logging.
-   **Subscription & Payment Management**: Annual subscriptions for traders, committee approval for payment proofs, multiple payment methods, and detailed instructions.
-   **Admin Management**: CRUD operations for users, categories, payment methods, SLA configurations, and system settings.
-   **Category System**: Complaints organized by government entities with cascading selection.

### System Design Choices
-   **Modularity**: Project structured into `backend/` and `frontend/` directories.
-   **API-First Approach**: Comprehensive RESTful APIs.
-   **Scalability**: Technologies chosen for scalability (FastAPI, React, PostgreSQL).

## External Dependencies
-   **Database**: PostgreSQL
-   **Backend Framework**: FastAPI (Python)
-   **Frontend Framework**: React
-   **Styling**: TailwindCSS
-   **Internationalization**: i18next
-   **ORM**: SQLAlchemy (Python)
-   **Authentication**: PyJWT, bcrypt
-   **Email Service**: SendGrid (via Replit Connector)
-   **SMS Service**: Twilio (supported, currently disabled for SMS, via Replit Connector)
-   **Charts**: Recharts
-   **Date Pickers**: react-datepicker
-   **Notifications**: react-toastify
-   **Icons**: lucide-react
-   **Animation**: Framer Motion

## Environment Configuration

### Required Secrets
The following secrets must be configured in Replit Secrets:

1. **JWT_SECRET_KEY** (Required) - Secret key for JWT token generation and validation. Must be at least 32 characters long. Generate using: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`

2. **DATABASE_URL** (Auto-configured) - PostgreSQL database connection URL. Automatically provided by Replit's PostgreSQL database service.

### Optional Integrations
To enable email and SMS notifications, configure these Replit connectors:

1. **SendGrid** (connector:ccfg_sendgrid_01K69QKAPBPJ4SWD8GQHGY03D5)
   - Purpose: Send transactional emails for complaint notifications
   - Setup: Requires SendGrid API key from your SendGrid account
   - After setting up connector, enable in Replit Secrets: `ENABLE_EMAIL_NOTIFICATIONS=true`
   - Fallback: Can also use SENDGRID_API_KEY directly in Secrets without connector

2. **Twilio** (connector:ccfg_twilio_01K69QJTED9YTJFE2SJ7E4SY08)
   - Purpose: Send SMS notifications for urgent complaint updates
   - Setup: Requires Twilio Account SID, Auth Token, and Phone Number
   - After setting up connector, enable in Replit Secrets: `ENABLE_SMS_NOTIFICATIONS=true`
   - Fallback: Can also use TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER directly in Secrets without connector

### Environment Variables Reference
See `backend/.env.example` for a complete list of configurable environment variables including:
- JWT configuration
- CORS settings
- Rate limiting
- File upload restrictions
- Password policies
- Feature flags

## Migration Notes (November 2025)
- Migrated from previous Replit environment
- Configured JWT_SECRET_KEY for persistent authentication
- Added .gitignore files for backend and frontend
- Fixed role validation bug (HIGHER_COMMITTEE enum value)
- Improved error handling for validation responses