# Testing Guide

This guide covers how to test the AllAjnah application at different levels.

## Overview

The project includes:
- **Frontend Tests**: Playwright for end-to-end smoke tests
- **Backend Tests**: Manual API testing with FastAPI's built-in tools
- **Integration Tests**: Test complete user workflows

## Prerequisites

- Application running (backend and frontend)
- Test database (optional, for isolated testing)
- Playwright installed (for frontend tests)

## Frontend Testing

### Smoke Tests with Playwright

The frontend includes Playwright tests to verify critical user paths.

#### Setup

```bash
cd frontend
npm install  # Installs Playwright
npx playwright install  # Install browser binaries
```

#### Running Tests

```bash
# Run smoke tests (headless)
npm run test:smoke

# Run with visible browser
npm run test:smoke:headed

# Run in debug mode
npm run test:smoke:debug

# Run specific test file
npx playwright test tests/smoke.test.js
```

#### Test Coverage

Current smoke tests cover:
- ✅ Application loads successfully
- ✅ Setup page is accessible
- ✅ Arabic RTL layout renders correctly
- ✅ Basic navigation works
- ✅ Form inputs are functional

#### Creating New Tests

Create test files in `frontend/tests/`:

```javascript
// Example: frontend/tests/login.test.js
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('http://localhost:5000');
  
  // Your test steps
  await page.fill('[name="email"]', 'admin@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Assertions
  await expect(page).toHaveURL(/.*dashboard/);
});
```

### Manual Testing Checklist

#### User Registration & Authentication
- [ ] New user can register with valid credentials
- [ ] Registration validates email format
- [ ] Registration enforces password policy
- [ ] User can log in with correct credentials
- [ ] Login fails with incorrect credentials
- [ ] User can log out
- [ ] Password reset request works (if implemented)

#### Complaint Management
- [ ] Citizen can submit a new complaint
- [ ] File attachments upload successfully
- [ ] Complaint appears in user's dashboard
- [ ] Staff can view assigned complaints
- [ ] Staff can update complaint status
- [ ] Comments can be added to complaints
- [ ] Notifications are sent on status changes

#### Admin Functions
- [ ] Admin can view all users
- [ ] Admin can approve/reject user accounts
- [ ] Admin can assign complaints to staff
- [ ] Admin dashboard shows statistics
- [ ] Reports can be exported (PDF/Excel)

#### Arabic/RTL Support
- [ ] Arabic text displays correctly
- [ ] RTL layout is properly oriented
- [ ] Language switching works
- [ ] Date/time formats are localized

## Backend Testing

### Interactive API Testing (Swagger UI)

FastAPI provides built-in API documentation with testing capabilities.

#### Access Swagger UI

1. Start the backend server
2. Navigate to: `http://localhost:8000/docs`
3. Test endpoints interactively

#### Example API Tests

**1. Health Check**
```bash
curl http://localhost:8000/health
```
Expected: `{"status": "healthy", "database": "connected"}`

**2. Create Admin User**
```bash
curl -X POST "http://localhost:8000/api/setup/admin" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "Admin",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "national_id": "1234567890"
  }'
```

**3. Login**
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=SecurePass123!"
```

**4. Get User Profile (with auth token)**
```bash
curl -X GET "http://localhost:8000/api/users/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Manual Backend Testing

#### Database Operations
```bash
# Check database connection
cd backend
source venv/bin/activate
python -c "from database import get_db; from sqlalchemy import text; db = next(get_db()); print(db.execute(text('SELECT 1')).scalar())"

# Check if tables exist
python -c "from database import engine; from sqlalchemy import inspect; inspector = inspect(engine); print(inspector.get_table_names())"

# Count users
python -c "from database import get_db; from models import User; db = next(get_db()); print(f'Users: {db.query(User).count()}')"
```

#### Seed Data
```bash
# Create test data
cd backend
python seed.py
```

### Python Unit Tests (Future Enhancement)

To add unit tests, create `backend/tests/`:

```bash
mkdir -p backend/tests
```

Example test structure:
```python
# backend/tests/test_auth.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_login_success():
    response = client.post("/api/auth/login", data={
        "username": "admin@example.com",
        "password": "correct_password"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_invalid_credentials():
    response = client.post("/api/auth/login", data={
        "username": "admin@example.com",
        "password": "wrong_password"
    })
    assert response.status_code == 401
```

Run with pytest:
```bash
cd backend
pip install pytest
pytest tests/
```

## Integration Testing

### Complete User Workflows

#### Test Workflow 1: Citizen Submits Complaint

1. **Setup**: Create citizen account
2. **Action**: Login as citizen
3. **Action**: Submit complaint with details and attachment
4. **Verify**: Complaint appears in dashboard
5. **Verify**: Email notification sent (if enabled)
6. **Verify**: Admin can see complaint

#### Test Workflow 2: Staff Processes Complaint

1. **Setup**: Citizen submits complaint
2. **Action**: Admin assigns to staff member
3. **Action**: Staff logs in
4. **Verify**: Complaint appears in assigned list
5. **Action**: Staff updates status
6. **Verify**: Citizen receives notification
7. **Action**: Staff adds comment
8. **Verify**: Comment appears in timeline

#### Test Workflow 3: Complaint Escalation

1. **Setup**: Create complaint nearing SLA deadline
2. **Action**: Wait for scheduler to run (or trigger manually)
3. **Verify**: Complaint escalated automatically
4. **Verify**: Escalation notifications sent
5. **Verify**: Status updated correctly

## Performance Testing

### Load Testing with Apache Bench

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test login endpoint
ab -n 100 -c 10 -p login.json -T application/json \
  http://localhost:8000/api/auth/login

# Where login.json contains:
# {"username": "test@example.com", "password": "password"}
```

### Expected Performance Targets

- API response time: < 200ms (95th percentile)
- Page load time: < 2s
- Database query time: < 100ms
- Concurrent users: 100+ (with proper hardware)

## Security Testing

### Basic Security Checks

#### Authentication & Authorization
- [ ] Endpoints require valid JWT tokens
- [ ] Expired tokens are rejected
- [ ] Users can only access their own data
- [ ] Admin endpoints reject non-admin users
- [ ] Rate limiting works on login endpoint

#### Input Validation
- [ ] SQL injection attempts are blocked
- [ ] XSS attempts are sanitized
- [ ] File upload size limits enforced
- [ ] File type restrictions work
- [ ] Email validation works

#### Password Security
- [ ] Passwords are hashed (not stored in plain text)
- [ ] Password policy is enforced
- [ ] Password reset tokens expire
- [ ] Failed login attempts are logged

### Security Testing Tools

```bash
# Check for common vulnerabilities
# Install OWASP ZAP or Burp Suite for deeper testing

# Check SSL configuration (production)
testssl.sh https://yourdomain.com

# Check headers
curl -I https://yourdomain.com
```

## Test Database Setup

For isolated testing without affecting production data:

```bash
# Create test database
createdb allajnah_test_db

# Update .env for testing
DATABASE_URL=postgresql://user:pass@localhost/allajnah_test_db

# Run migrations
cd backend
alembic upgrade head

# Seed test data
python seed.py
```

## Continuous Testing

### Pre-Deployment Checklist

Before deploying to production:

- [ ] All smoke tests pass
- [ ] Health check endpoint returns healthy
- [ ] Database migrations run successfully
- [ ] Authentication works correctly
- [ ] Critical user workflows complete successfully
- [ ] No console errors in browser
- [ ] No Python exceptions in backend logs
- [ ] API documentation is accessible
- [ ] File uploads work
- [ ] Email notifications send (if enabled)

### Monitoring in Production

After deployment, monitor:

- Health check endpoint: `/health`
- Error logs: Check for exceptions
- Response times: Monitor API latency
- Database performance: Check query times
- User feedback: Track complaints/issues

## Troubleshooting Tests

### Common Issues

**Tests fail to connect to server**
- Ensure backend is running on port 8000
- Ensure frontend is running on port 5000
- Check firewall settings

**Playwright tests timeout**
- Increase timeout in playwright.config.js
- Check if application is responding
- Run with `--headed` to see what's happening

**Database errors in tests**
- Ensure database is running
- Check DATABASE_URL is correct
- Run migrations: `alembic upgrade head`

**Authentication tests fail**
- Verify test user exists
- Check password is correct
- Ensure JWT_SECRET_KEY is set

## Best Practices

1. **Test Early**: Write tests as you develop features
2. **Test Often**: Run smoke tests before commits
3. **Test Realistically**: Use real-world data and scenarios
4. **Automate**: Use CI/CD to run tests automatically
5. **Monitor**: Track test results over time
6. **Document**: Update this guide as tests evolve

## CI/CD Integration (Future)

To run tests automatically on push:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run backend tests
        run: cd backend && pytest
      - name: Run frontend tests
        run: cd frontend && npm run test:smoke
```

## Getting Help

- **Playwright Docs**: https://playwright.dev
- **FastAPI Testing**: https://fastapi.tiangolo.com/tutorial/testing/
- **pytest Docs**: https://docs.pytest.org

---

**Remember**: Tests are only valuable if they're maintained and run regularly. Make testing part of your development workflow!
