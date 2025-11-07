# Allajnah Enhanced - Complaint Management System

## Overview
Allajnah Enhanced is a comprehensive complaint management system for Yemeni traders and oversight committees. It streamlines the submission, tracking, and multi-level committee review of complaints against government entities. The system aims to enhance transparency and accountability in governmental operations. It supports full Arabic language with RTL layout and is production-ready.

**Latest Update (Nov 2025)**:
- **Integration Setup Complete**: Successfully provisioned and configured all core integrations. PostgreSQL database is now live with automatic backups and SSL connections. SendGrid email integration is fully configured using Replit connector for secure credential management, enabling real email notifications for all complaint lifecycle events. SMS notifications via Twilio are currently disabled (email-only mode) but the system is designed to support SMS when needed - simply connect the Twilio integration. The notification service intelligently attempts Replit connectors first, then falls back to environment variables for maximum flexibility.
- **Production-Ready Deployment Configuration**: Configured the application for production deployment on Replit with VM deployment target to support stateful features (WebSocket connections, scheduled background jobs). Added comprehensive deployment guide (DEPLOYMENT_GUIDE.md) covering setup, monitoring, security, and scaling. Configured proper build process for frontend optimization and production run commands for both frontend (port 5000) and backend (port 8000).
- **Enhanced Notification System Resilience**: Upgraded notification service with robust fallback mechanism. The system now intelligently attempts to use Replit connectors first for Twilio and SendGrid integration, then gracefully falls back to environment variables if connectors are unavailable. Added clear logging to track which credential source is being used, ensuring notifications work in both development and production environments without manual intervention.
- **Health Check & Monitoring**: Added production-grade health check endpoints (`/health` and `/api/health`) for monitoring systems and load balancers. The endpoint verifies database connectivity and returns detailed system status with proper HTTP status codes (200 for healthy, 503 for unhealthy), enabling automated monitoring and alerting.
- **Database Integration**: Provisioned and configured Replit-managed PostgreSQL database with automatic backups and SSL connections. Database URL and credentials are managed automatically through Replit's environment system, ensuring secure and reliable database access in production.
- **Ready for Production**: The system is now fully configured and ready for deployment with proper error handling, monitoring, logging, rate limiting, audit trails, and comprehensive documentation. All core features have been tested and are working correctly.
- **File Attachment System**: Implemented comprehensive file attachment functionality for complaints. Traders can now upload multiple files (PDF, DOC, DOCX, JPG, PNG, GIF) when submitting complaints via an intuitive drag-and-drop interface in step 3 of the complaint form. Features robust error handling with per-file upload tracking, automatic retry of failed uploads (only failed files, preventing duplicates), and clear user feedback showing which files failed with specific error messages. Users must explicitly choose to retry failed uploads or proceed without them - no silent failures. The complaint details view displays all attachments with download capability, proper authorization checks, and audit logging. Backend includes secure file storage in uploads directory, file validation, download endpoint with proper content-type headers, and role-based access control ensuring only authorized users can download attachments.
- **Merchant Account Approval Workflow**: Implemented comprehensive account approval system for new merchant registrations. New merchants now register through a dedicated public registration page and enter "pending" status until Higher Committee approval. The system blocks login attempts from unapproved accounts with clear messaging (pending awaits review, rejected shows reason). Higher Committee manages approvals via dedicated interface with filtering, approval/rejection actions, and audit logging. Admin-created users and initial setup users are auto-approved to maintain administrative access. Features Alembic-based database migration that safely backfills existing users to approved status, ensuring seamless deployment upgrades. The complete workflow ensures secure onboarding: merchant registers → pending status → Higher Committee reviews → approved/rejected → access granted/denied.
- **Enhanced Payment & Subscription System**: Implemented comprehensive payment and subscription improvements with multiple payment methods (e-wallet, money transfer, bank transfer), dual-committee approval workflow (Technical Committee and Higher Committee), payment proof upload with validation, reference number tracking, detailed payment instructions in Arabic and English, notification system for payment requests and decisions, and database migration for seamless upgrades. Payment methods are configurable by admins with Arabic/English instructions. The subscription price is set at 15,000 YER annually. 
- **Phase 7 Complete - Complete Notification Coverage**: Implemented all missing notification methods to provide comprehensive coverage across the complaint lifecycle. Added send_comment_notification (notifies complaint owner and assigned user when comments are added), send_escalation_notification (alerts complaint owner when their complaint is escalated to Higher Committee due to SLA violation), and send_sla_warning_notification (proactively warns both complaint owner and assigned reviewer when approaching SLA deadline at 80% threshold). Integrated comment notifications into the create_comment endpoint, escalation notifications into the auto-escalation workflow, and created new check_sla_warnings scheduler task running hourly. All new methods respect user preferences for email/SMS channels and specific notification types. The notification system now fully supports all seven notification preference types.
- **Phase 6 Complete - Notification System**: Implemented comprehensive notification system with Twilio SMS and SendGrid email integration using Replit connectors for secure credential management. Added granular notification preferences allowing users to control email/SMS channels and specific notification types (status changes, assignments, comments, approvals, escalations, SLA warnings). All notification methods now respect user preferences before sending. Created API endpoints (GET/PUT `/api/users/notification-preferences`) for managing preferences with audit logging. The system ensures users only receive notifications they've opted into.
- **Phase 5 Complete - Unified Header Design**: Replaced the old header design across all pages with a modern, consistent ProfileDropdown component. The annoying red logout button has been removed in favor of an elegant dropdown menu that appears when clicking on the user's profile. The dropdown provides quick access to Profile, Change Password, Settings, and Logout options, with the ability to upload profile pictures directly from the menu. This creates a unified, professional user experience across the entire application.
- **Phase 4 Complete - Enhanced User Settings Page**: Transformed the user settings page into a comprehensive profile management hub. Users can now edit all profile information (first name, last name, phone, whatsapp, telegram, address) directly from the settings page with an intuitive edit/view mode toggle. Added profile picture upload with camera icon overlay, file validation (type and size), and real-time UI updates. The page features a clean, responsive design with dark mode support, proper error handling, and success feedback. All changes are persisted via API calls with proper state management and AuthContext updates.
- **Phase 3 Complete - Quick Profile Picture Upload**: Enhanced the profile dropdown menu with instant profile picture upload functionality. Users can now update their profile picture directly from the dropdown by hovering over their current picture and clicking the camera icon, eliminating the need to navigate to the full profile page. Features include real-time visual feedback with loading animations, file validation, automatic state updates, and the ability to retry uploads.
- **Phase 2 Complete - Enhanced Profile Management**: Added profile completion indicator with visual progress bar showing filled/missing fields, account statistics dashboard displaying complaint metrics (total, pending, resolved, rejected), account information widget with member registration date and last update timestamp, and secure email update functionality with password confirmation and audit logging.
- **Phase 1 Complete - Profile Management System**: Redesigned header UX by replacing the prominent red logout button with a professional profile dropdown menu. Added comprehensive self-service profile management including profile picture uploads with avatar fallback, secure password changes with server-side validation, and user settings for notification preferences. All user roles (Trader, Technical Committee, Higher Committee) can now manage their profiles independently.
- Completed comprehensive UI/UX redesign with modern aesthetics including gradients, glassmorphism effects, smooth animations, enhanced shadows, and refined visual hierarchy across all pages and user roles. The ComplaintForm has been transformed into a premium wizard-style multi-step interface with progress indicators, step-by-step validation, animated transitions, and enhanced user guidance.

## User Preferences
I prefer iterative development with a focus on completing core functionalities first, then refining and adding advanced features. I value clear, concise explanations and prefer to be asked before major architectural or design changes are implemented. All user-facing text should support both Arabic and English, with Arabic being the primary language and using an RTL layout. Please follow existing code patterns for consistency.

## System Architecture
The system utilizes a clear separation of concerns with a Python FastAPI backend using SQLAlchemy and a React frontend built with Vite and TailwindCSS.

### UI/UX Decisions
-   **Language Support**: Prioritizes full Arabic language support with RTL layout using i18next for internationalization. English translation is also supported.
-   **Design System**: TailwindCSS for consistent, responsive design, incorporating modern aesthetics like Neumorphism and Glassmorphism, and full dark mode support. Features smooth animations via Framer Motion.
-   **Accessibility**: Enhanced ARIA roles and semantic HTML across UI components, with proper touch targets for mobile.
-   **Responsive Design**: Mobile-first approach with custom Tailwind breakpoints and optimized UI components.

### Technical Implementations
-   **Authentication**: JWT-based authentication with robust role-based access control (RBAC).
-   **Database**: PostgreSQL managed with SQLAlchemy ORM.
-   **Workflow Automation**: Includes smart task queuing, multi-member task assignment, SLA monitoring with auto-escalation, and auto-closing of resolved complaints. Features concurrency protection and a Higher Committee approval system.
-   **Duplicate Detection**: Uses text similarity to warn about potential duplicate complaints.
-   **Notification System**: Comprehensive notification system with SendGrid email integration via Replit connector (fully configured and operational). Email notifications work for all events: status changes, assignments, comments, approvals, escalations, and SLA warnings. SMS via Twilio is supported but currently disabled (email-only mode). Features granular user preferences for controlling notification channels and specific notification types. All notification methods check user preferences before dispatching messages.
-   **Analytics**: Comprehensive dashboard statistics and administrative analytics.
-   **Audit Trail**: System-wide logging of key actions.
-   **Security**: Robust file upload validation, CORS configuration, rate limiting, and session handling.

### Feature Specifications
-   **User Roles**: Trader (submits/tracks complaints), Technical Committee (reviews/assigns/updates), Higher Committee (admin access, decision-making).
-   **Profile Management**: 
    - Self-service profile editing with profile picture upload (image validation, avatar fallback with initials)
    - Quick profile picture upload directly from the dropdown menu (hover to reveal camera icon, instant upload with visual feedback)
    - Secure password changes (server-side validation enforcing complexity requirements)
    - Email update with password confirmation and uniqueness validation
    - Profile completion indicator showing percentage and missing fields
    - Account statistics dashboard (for traders: total, pending, resolved, rejected complaints)
    - Account information widget displaying registration date, last update, role, and active status
    - User settings including notification preferences and theme toggle
-   **Complaint Workflow**: Multi-status progression (Submitted, Under Review, Escalated, Resolved/Rejected) with re-opening and feedback. Includes task acceptance/rejection mechanisms, multi-step approvals, and file attachment support with upload/download capabilities.
-   **File Attachments**: Comprehensive file attachment system allowing traders to upload supporting documents (PDF, DOC, DOCX, images) when submitting complaints. Features include multi-file upload with drag-and-drop, per-file error tracking, smart retry logic (only failed files), download functionality with authorization checks, and audit logging.
-   **Subscription & Payment Management**: Traders manage annual subscriptions, committees approve payment proofs.
-   **Admin Management**: CRUD operations for users, categories, payment methods, SLA configurations, and system settings.
-   **Category System**: Complaints are organized by government entities, with cascading selection in the complaint form.

### System Design Choices
-   **Modularity**: Project structured into `backend/` and `frontend/` directories.
-   **API-First Approach**: Comprehensive RESTful APIs for frontend and future integrations.
-   **Scalability**: Technologies chosen for scalability (FastAPI, React, PostgreSQL).

## External Dependencies
-   **Database**: PostgreSQL
-   **Backend Framework**: FastAPI (Python)
-   **Frontend Framework**: React
-   **Styling**: TailwindCSS
-   **Internationalization**: i18next
-   **ORM**: SQLAlchemy (Python)
-   **Authentication**: PyJWT, bcrypt
-   **Charts**: Recharts
-   **Date Pickers**: react-datepicker
-   **Notifications**: react-toastify
-   **Icons**: lucide-react
-   **Animation**: Framer Motion