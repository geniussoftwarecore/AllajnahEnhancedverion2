# QA Checklist - Phase 1 Critical Fixes

This checklist verifies that all Phase 1 critical frontend issues have been properly fixed and tested.

---

## ✅ Issue 1: API Path Corrections

### Verification Steps

#### Test 1.1: Login API Call
- [ ] Open browser DevTools Network tab
- [ ] Navigate to `/login`
- [ ] Enter valid credentials and submit
- [ ] **Verify:** Network request goes to `/api/auth/login` (not `/auth/login`)
- [ ] **Expected:** API call uses correct base URL with `/api` prefix

#### Test 1.2: Register API Call
- [ ] Navigate to `/register`
- [ ] Fill in registration form and submit
- [ ] **Verify:** Network request goes to `/api/auth/register`
- [ ] **Expected:** API call uses correct base URL with `/api` prefix

#### Test 1.3: Setup Status Check
- [ ] Navigate to `/setup`
- [ ] Check Network tab on page load
- [ ] **Verify:** Initial status check calls `/api/setup/status`
- [ ] **Expected:** Setup status API uses correct path

#### Test 1.4: Setup Initialize
- [ ] Fill setup form with valid data
- [ ] Submit the form
- [ ] **Verify:** Network request goes to `/api/setup/initialize`
- [ ] **Expected:** Setup endpoint uses correct path

**Status:** ✅ PASSED / ❌ FAILED  
**Notes:** ______________________________

---

## ⚙️ Issue 2: Setup Status Synchronization

### Verification Steps

#### Test 2.1: Setup Already Completed
- [ ] Ensure database has at least one user (setup completed)
- [ ] Navigate to `/setup`
- [ ] **Verify:** Page shows "النظام تم إعداده بالفعل" (System already configured) message
- [ ] **Verify:** "انتقل إلى صفحة تسجيل الدخول" button is displayed
- [ ] Click the button
- [ ] **Expected:** Redirects to `/login` page

#### Test 2.2: Setup Needs Configuration
- [ ] Clear database (no users exist)
- [ ] Navigate to `/setup`
- [ ] **Verify:** Setup form is displayed with input fields
- [ ] **Verify:** No "already configured" message shown
- [ ] **Expected:** Form is active and ready for input

#### Test 2.3: Setup Status Caching
- [ ] Complete setup successfully
- [ ] Check `localStorage.setup_completed`
- [ ] **Verify:** Value is set to `"true"`
- [ ] Reload page
- [ ] **Expected:** Status persists without additional API call if offline

**Status:** ✅ PASSED / ❌ FAILED  
**Notes:** ______________________________

---

## 🕒 Issue 3: Login Cooldown (60 seconds)

### Verification Steps

#### Test 3.1: Failed Login Attempts Tracking
- [ ] Navigate to `/login`
- [ ] Enter incorrect credentials
- [ ] Submit form (Attempt 1)
- [ ] **Verify:** Error message appears
- [ ] Open DevTools Console and check `localStorage.login_attempts`
- [ ] **Expected:** Value is `"1"`
- [ ] Repeat for attempts 2, 3, and 4
- [ ] **Expected:** Counter increments properly

#### Test 3.2: Cooldown Trigger (5 attempts)
- [ ] Continue with incorrect credentials (Attempt 5)
- [ ] Submit form
- [ ] **Verify:** Error message shows "يرجى الانتظار 60 ثانية"
- [ ] **Verify:** Submit button is disabled
- [ ] **Verify:** Button text shows countdown (e.g., "انتظر 60ث", "انتظر 59ث")
- [ ] **Expected:** Login is blocked for 60 seconds

#### Test 3.3: Cooldown Countdown
- [ ] Wait and observe countdown timer
- [ ] **Verify:** Counter decrements every second (60, 59, 58...)
- [ ] Wait until countdown reaches 0
- [ ] **Verify:** Submit button becomes enabled again
- [ ] **Expected:** Can retry login after 60 seconds

#### Test 3.4: Successful Login Resets Counter
- [ ] Clear `localStorage` to reset cooldown
- [ ] Fail login 3 times (incorrect credentials)
- [ ] On 4th attempt, use correct credentials
- [ ] **Verify:** Login succeeds
- [ ] Check `localStorage.login_attempts`
- [ ] **Expected:** Counter is cleared/reset to 0

#### Test 3.5: Cooldown Persists Across Page Reloads
- [ ] Trigger cooldown (5 failed attempts)
- [ ] Note remaining seconds
- [ ] Reload the page
- [ ] **Verify:** Cooldown timer resumes from remaining time
- [ ] **Expected:** Cooldown is not bypassed by refresh

**Status:** ✅ PASSED / ❌ FAILED  
**Notes:** ______________________________

---

## 🌐 Issue 4: i18n Keys (Bilingual Support)

### Verification Steps

#### Test 4.1: Error Messages in Arabic
- [ ] Ensure language is set to Arabic (AR)
- [ ] Trigger a login error (401)
- [ ] **Verify:** Error shows "البريد الإلكتروني أو كلمة المرور غير صحيحة"
- [ ] Trigger a server error (simulate 500)
- [ ] **Verify:** Error shows "خطأ غير متوقع في الخادم"
- [ ] Leave required field empty and submit
- [ ] **Verify:** Validation error shows "يرجى تصحيح الحقول المميزة"

#### Test 4.2: Error Messages in English
- [ ] Change language to English (EN)
- [ ] Trigger a login error (401)
- [ ] **Verify:** Error shows "Invalid email or password"
- [ ] Trigger a server error
- [ ] **Verify:** Error shows "Unexpected server error"
- [ ] Leave required field empty and submit
- [ ] **Verify:** Validation error shows "Please correct highlighted fields"

#### Test 4.3: Password Requirements
- [ ] View password field on Setup or Register page
- [ ] Check for password requirements hint/tooltip
- [ ] **Verify (AR):** "يجب أن تحتوي كلمة المرور على أحرف كبيرة وصغيرة وأرقام ورموز خاصة"
- [ ] **Verify (EN):** "Password must contain uppercase, lowercase, number and special character"

**Status:** ✅ PASSED / ❌ FAILED  
**Notes:** ______________________________

---

## 🧪 Issue 5: Smoke Tests

### Verification Steps

#### Test 5.1: Run Smoke Tests
```bash
cd frontend
npm run test:smoke
```

- [ ] All tests pass without failures
- [ ] No JavaScript exceptions reported
- [ ] Setup page loads correctly
- [ ] Login page loads correctly
- [ ] Form fields render properly
- [ ] 401 error handling works
- [ ] 404 error handling works
- [ ] 400 error handling works
- [ ] Navigation between pages works

#### Test 5.2: Manual Smoke Test
- [ ] Visit `/setup` - Page loads without console errors
- [ ] Visit `/login` - Page loads without console errors
- [ ] Submit empty form - Validation triggers without crashes
- [ ] Navigate from setup to login - No JavaScript errors
- [ ] Navigate from login to register - No JavaScript errors

**Status:** ✅ PASSED / ❌ FAILED  
**Notes:** ______________________________

---

## 🏗️ Build & Integration Tests

### Verification Steps

#### Test 6.1: Production Build
```bash
cd frontend
npm run build
```

- [ ] Build completes successfully without errors
- [ ] No TypeScript/ESLint errors
- [ ] All assets bundled correctly
- [ ] Output files created in `dist/` folder

#### Test 6.2: Development Server
```bash
cd frontend
npm run dev
```

- [ ] Server starts on port 5000
- [ ] No runtime errors in terminal
- [ ] Hot reload works when editing files
- [ ] Application loads in browser at `http://localhost:5000`

**Status:** ✅ PASSED / ❌ FAILED  
**Notes:** ______________________________

---

## 📋 Final Checklist Summary

Mark each category as complete:

- [ ] **1. API Paths** - All endpoints use relative paths with `/api` prefix
- [ ] **2. Setup Status** - Setup page synchronizes with backend state
- [ ] **3. Login Cooldown** - 60-second cooldown after 5 failed attempts
- [ ] **4. i18n Keys** - All messages bilingual (AR/EN)
- [ ] **5. Smoke Tests** - All automated tests pass
- [ ] **6. Build** - Production build succeeds
- [ ] **7. Dev Server** - Development server runs without errors

---

## Sign-Off

**Tested By:** ______________________________  
**Date:** ______________________________  
**Overall Status:** ✅ PASSED / ❌ FAILED  
**Notes/Comments:**

______________________________
______________________________
______________________________

---

## Phase 1 Completion Criteria

✅ All critical frontend issues resolved  
✅ API calls use correct baseURL  
✅ Setup status synchronization works  
✅ Login cooldown enforces 60-second wait  
✅ Bilingual error messages implemented  
✅ Smoke tests pass  
✅ Application builds successfully  

**Ready for Phase 2:** YES / NO
