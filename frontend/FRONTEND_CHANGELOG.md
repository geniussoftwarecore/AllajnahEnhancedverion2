# Frontend Changelog

## Phase 1 Critical Fixes - November 3, 2025

### Summary
Fixed all critical frontend issues to prepare for Phase 2 workflow upgrade. All changes focus on stabilizing the app by correcting API calls, adding validation, and ensuring proper setup/login flows.

---

### 🔧 Issue 1: Fixed Absolute API Paths

**Problem:**
- API calls in `AuthContext.jsx` and `App.jsx` were using absolute paths (e.g., `/auth/login`) instead of relative paths
- This caused API calls to bypass the configured `baseURL` in axios configuration
- Endpoints were not correctly using `/api` prefix

**Changes:**
- **AuthContext.jsx**:
  - Changed `api.post('/auth/login')` → `api.post('auth/login')`
  - Changed `api.post('/auth/register')` → `api.post('auth/register')`

- **App.jsx**:
  - Changed import from `axios` to `api` from `./api/axios`
  - Changed `axios.get('/setup/status')` → `api.get('setup/status')`

- **Setup.jsx**:
  - Changed import from `axios` to `api` from `../api/axios`
  - Changed `axios.get('/setup/status')` → `api.get('setup/status')`
  - Changed `axios.post('/setup/initialize')` → `api.post('setup/initialize')`

**Result:** ✅ All endpoints now correctly use `baseURL: '/api'` as configured in `frontend/src/api/axios.js`

---

### ⚙️ Issue 2: Setup Status Check

**Status:** Already implemented

**Implementation:**
- `Setup.jsx` already contains `useEffect` that calls `api.get('setup/status')` on mount (lines 40-61)
- If response shows `already_configured` → displays message and provides redirect link to login
- If backend says "needs setup" → keeps form active
- Proper error handling with localStorage fallback

**Result:** ✅ UI and backend setup state are always synchronized

---

### 🕒 Issue 3: Login Retry/Cooldown Logic

**Problem:**
- Login cooldown was set to 30 seconds instead of required 60 seconds

**Changes:**
- **Login.jsx**:
  - Updated `setLoginCooldown(30)` → `setLoginCooldown(60)`
  - Updated `setCooldownSeconds(30)` → `setCooldownSeconds(60)`
  - Updated error message to show "60 ثانية" instead of "30 ثانية"

**Implementation Details:**
- Tracks `failedAttempts` in localStorage via `incrementLoginAttempts()`
- After 5 failed attempts → blocks login for 60 seconds
- Displays countdown timer in submit button
- Resets counter on successful login via `resetLoginAttempts()`

**Result:** ✅ Safer auth flow with 60-second cooldown after 5 failed attempts, prevents login endpoint spamming

---

### 🌐 Issue 4: Added Missing i18n Keys

**Changes:**
Added the following keys to both `frontend/src/i18n/en.json` and `frontend/src/i18n/ar.json`:

**English (en.json):**
```json
"errors": {
  "server_error": "Unexpected server error",
  "invalid_credentials": "Invalid email or password",
  "validation_failed": "Please correct highlighted fields"
},
"password": {
  "requirements": "Password must contain uppercase, lowercase, number and special character"
}
```

**Arabic (ar.json):**
```json
"errors": {
  "server_error": "خطأ غير متوقع في الخادم",
  "invalid_credentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  "validation_failed": "يرجى تصحيح الحقول المميزة"
},
"password": {
  "requirements": "يجب أن تحتوي كلمة المرور على أحرف كبيرة وصغيرة وأرقام ورموز خاصة"
}
```

**Result:** ✅ Consistent bilingual messaging throughout the application

---

### 🧪 Issue 5: Smoke Tests

**Status:** Already comprehensive

**Current Implementation:**
- `frontend/tests/smoke.test.js` uses Playwright (superior to basic @testing-library approach)
- Tests include:
  - ✅ Page load without JavaScript exceptions
  - ✅ Form fields visibility and rendering
  - ✅ Validation error handling
  - ✅ HTTP error responses (401, 404, 400)
  - ✅ Cross-page navigation
  - ✅ Console error tracking
  - ✅ User-friendly error messages

**Result:** ✅ Automated sanity checks during build with comprehensive coverage

---

## Files Modified

### Core Application Files
- `frontend/src/context/AuthContext.jsx` - Fixed API paths for login/register
- `frontend/src/App.jsx` - Fixed API import and setup status check
- `frontend/src/pages/Setup.jsx` - Fixed API import and paths
- `frontend/src/pages/Login.jsx` - Updated cooldown to 60 seconds

### Internationalization
- `frontend/src/i18n/en.json` - Added missing error and password keys
- `frontend/src/i18n/ar.json` - Added missing error and password keys (Arabic)

### Documentation
- `frontend/FRONTEND_CHANGELOG.md` - This file
- `frontend/QA_CHECKLIST.md` - Quality assurance checklist

---

## Testing & Verification

All changes have been tested and verified to work correctly:
- ✅ API calls use correct `/api` prefix
- ✅ Setup page syncs with backend status
- ✅ Login cooldown enforces 60-second wait after 5 failures
- ✅ All error messages display in both English and Arabic
- ✅ Smoke tests pass without JavaScript errors

---

## Next Steps - Phase 2

With Phase 1 complete, the application is now stable and ready for:
- Workflow upgrades
- Additional features
- Performance optimizations
- Enhanced user experience improvements
