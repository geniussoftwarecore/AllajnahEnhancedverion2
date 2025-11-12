# Allajnah Enhanced - Complaint Management System

## Overview
Allajnah Enhanced is a comprehensive, production-ready complaint management system for Yemeni traders and oversight committees. Its primary purpose is to streamline the submission, tracking, and multi-level review of complaints against government entities, thereby enhancing transparency and accountability. The system features full Arabic language support with RTL layout, multi-status complaint progression, secure file attachments, a robust notification system, and an account approval workflow for merchants.

## User Preferences
I prefer iterative development with a focus on completing core functionalities first, then refining and adding advanced features. I value clear, concise explanations and prefer to be asked before major architectural or design changes are implemented. All user-facing text should support both Arabic and English, with Arabic being the primary language and using an RTL layout. Please follow existing code patterns for consistency.

## System Architecture

### UI/UX Decisions
-   **Language Support**: Full Arabic (RTL) and English support using i18next.
-   **Design System**: TailwindCSS for responsive design, incorporating Neumorphism and Glassmorphism, full dark mode, and Framer Motion for animations.
-   **Accessibility**: Enhanced ARIA roles and semantic HTML.
-   **Responsive Design**: Mobile-first approach with custom Tailwind breakpoints, mobile navigation, and touch-friendly design.
-   **Progressive Web App (PWA)**: Installable with service worker for offline caching and optimized caching strategies.

### Technical Implementations
-   **Authentication**: JWT-based with robust Role-Based Access Control (RBAC).
-   **Database**: PostgreSQL managed with SQLAlchemy ORM.
-   **Workflow Automation**: Smart task queuing, multi-member task assignment, SLA monitoring with auto-escalation, auto-closing, concurrency protection, and Higher Committee approval.
-   **Enhanced Escalation System**: Manual escalation, trader appeal paths, intelligent reassignment, automatic routing of reopened complaints, multi-reviewer approvals, and mediation requests.
-   **Duplicate Detection**: Text similarity analysis.
-   **Notification System**: In-app (real-time, WebSocket-powered, toast notifications) and optional external (Email via SendGrid, SMS via Twilio).
-   **Analytics**: Comprehensive dashboard statistics and administrative analytics.
-   **Audit Trail**: System-wide logging of key actions.
-   **Security**: File upload validation, CORS, rate limiting, and session handling.
-   **Deployment**: Configured for production on Replit with VM deployment target.
-   **Account Approval**: Merchant accounts require Higher Committee approval.

### Feature Specifications
-   **User Roles**: Trader, Technical Committee, Higher Committee.
-   **Profile Management**: Self-service editing, profile picture, password changes, notification preferences.
-   **Complaint Workflow**: Multi-status progression with re-opening, feedback, task acceptance/rejection, multi-step approvals, and file attachments.
-   **Escalation & Appeals**: Manual escalation, trader appeals, TC reassignment, smart reopening, multi-reviewer approvals, and mediation requests.
-   **File Attachments**: Multi-file upload with drag-and-drop, error tracking, retries, and authorized download.
-   **Subscription & Payment Management**: Annual subscriptions for traders, committee approval for payment proofs, multiple payment methods, including Yemeni e-wallets (جيب, جوالي, فلوسك, كاش, ون كاش, ياه ماني, ون ماني, موبايل ماني).
-   **Admin Management**: CRUD for users, categories, payment methods, SLA configurations, and system settings.
-   **Category System**: Complaints organized by government entities with cascading selection.
-   **Export & Reporting**: Export filtered complaints to Excel/CSV, individual complaint PDFs, and analytics data to Excel/CSV/PDF, all with full Arabic RTL support.

### System Design Choices
-   **Modularity**: `backend/` and `frontend/` directories.
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
-   **SMS Service**: Twilio (via Replit Connector)
-   **Charts**: Recharts
-   **Date Pickers**: react-datepicker
-   **Notifications**: react-toastify
-   **Icons**: lucide-react
-   **Animation**: Framer Motion
-   **PDF Generation**: ReportLab (Python) with NotoSansArabic.ttf
-   **Arabic Text Processing**: arabic-reshaper, python-bidi