# Allajnah Enhanced - Complaint Management System

## Overview
Allajnah Enhanced is a comprehensive complaint management system for Yemeni traders and oversight committees. It streamlines the submission, tracking, and multi-level committee review of complaints against government entities. The system aims to enhance transparency and accountability in governmental operations. It supports full Arabic language with RTL layout and is production-ready.

**Latest Update (Nov 2025)**: Completed comprehensive UI/UX redesign with modern aesthetics including gradients, glassmorphism effects, smooth animations, enhanced shadows, and refined visual hierarchy across all pages and user roles. The ComplaintForm has been transformed into a premium wizard-style multi-step interface with progress indicators, step-by-step validation, animated transitions, and enhanced user guidance.

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
-   **Notification Hooks**: Module for integration with external notification services (e.g., email, SMS).
-   **Analytics**: Comprehensive dashboard statistics and administrative analytics.
-   **Audit Trail**: System-wide logging of key actions.
-   **Security**: Robust file upload validation, CORS configuration, rate limiting, and session handling.

### Feature Specifications
-   **User Roles**: Trader (submits/tracks complaints), Technical Committee (reviews/assigns/updates), Higher Committee (admin access, decision-making).
-   **Complaint Workflow**: Multi-status progression (Submitted, Under Review, Escalated, Resolved/Rejected) with re-opening and feedback. Includes task acceptance/rejection mechanisms and multi-step approvals.
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