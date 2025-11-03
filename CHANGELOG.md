# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added - 2025-11-03

#### Setup Page Enhancements
- **Setup Status Check on Mount**: Setup page now calls `GET /api/setup/status` when loading to verify setup status from the backend
- **LocalStorage Synchronization**: Setup completion status is now synchronized between API response and localStorage (`setup_completed`)
- **Bilingual Support**: Full bilingual error handling and UI messages supporting both Arabic (ar) and English (en)
  - Uses centralized `mapBackendError` utility for consistent error messages
  - Implemented `useTranslation` hook from react-i18next for dynamic language support
  - All UI text now responds to language preference
- **Improved Navigation**: After successful setup initialization, users are now redirected to `/login` instead of the root path
- **Loading States**: Added proper loading state (`checkingStatus`) while verifying setup status from backend

#### Routing Guards
- **Setup Completion Guard**: When `setup_completed=false`, users are redirected to `/setup`
- **Setup Prevention Guard**: When `setup_completed=true`, access to `/setup` is blocked and users are redirected to `/login`
- **Centralized Status Management**: Setup status is managed both in localStorage and validated against backend API

#### Internationalization (i18n)
- **New Translation Keys**:
  - `setup.already_configured` (ar: "النظام تم إعداده بالفعل", en: "System already configured")
  - Updated `setup.success` messages to reflect redirect to login
  - Ensured `errors.generic` exists in both languages

#### Technical Improvements
- Replaced static import of `ar.json` with dynamic i18n hooks
- Improved error detection for already-completed setup scenarios
- Enhanced user experience with proper status checking before rendering form

### Changed
- Setup page redirect destination from `/` to `/login` after successful initialization
- Setup page now uses react-i18next for all translations instead of static JSON import
- Error messages now respect current language setting (Arabic/English)

### Files Modified
- `frontend/src/pages/Setup.jsx` - Complete refactor for API integration and bilingual support using react-i18next hooks
- `frontend/src/App.jsx` - Fixed axios endpoint (using `/setup/status` instead of `/api/setup/status` due to baseURL) and added localStorage synchronization
- `frontend/src/i18n.js` - Added complete setup, errors, and common translation objects for both Arabic and English
- `frontend/src/i18n/ar.json` - Added `setup.already_configured` key and updated success message (reference file)
- `frontend/src/i18n/en.json` - Added `setup.already_configured` key and updated success message (reference file)
- `.local/state/replit/agent/progress_tracker.md` - Updated migration progress

### Fixed
- **API Endpoint Consistency**: Fixed axios base URL handling - since axios instance has `baseURL: '/api'`, endpoints now use `/setup/status` (which resolves to `/api/setup/status`) instead of `/api/setup/status` (which would incorrectly resolve to `/api/api/setup/status`)
- **LocalStorage Sync in Router**: App.jsx now properly syncs `setup_completed` status to localStorage when checking setup status

### Dependencies
- No new dependencies added (uses existing react-i18next, axios, react-router-dom)

---

## Format
This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.
