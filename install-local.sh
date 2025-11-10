#!/bin/bash
# Local Development Installation Script for AllAjnah

set -e

echo "=================================="
echo "AllAjnah - Local Setup Script"
echo "=================================="

# Check Python version
if ! command -v python3.11 &> /dev/null; then
    echo "Python 3.11 is not installed. Please install it first."
    exit 1
fi

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install it first."
    exit 1
fi

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Please install it first."
    exit 1
fi

echo ""
echo "Step 1: Setting up PostgreSQL database..."
read -p "Enter database name (default: allajnah_db): " DB_NAME
DB_NAME=${DB_NAME:-allajnah_db}

read -p "Enter database user (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Enter database password: " DB_PASSWORD
echo ""

# Create database
createdb -U $DB_USER $DB_NAME 2>/dev/null || echo "Database already exists"

echo ""
echo "Step 2: Setting up backend..."
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Generate JWT secret
JWT_SECRET=$(python -c "import secrets; print(secrets.token_urlsafe(32))")

# Create .env file
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost/$DB_NAME

# JWT Configuration
JWT_SECRET_KEY=$JWT_SECRET
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS Configuration (Development)
CORS_ORIGINS=http://localhost:5000

# Rate Limiting
RATE_LIMIT_LOGIN_PER_MINUTE=5
RATE_LIMIT_COMPLAINTS_PER_HOUR=10
RATE_LIMIT_UPLOADS_PER_HOUR=20

# File Upload Security
MAX_UPLOAD_SIZE_MB=10
ALLOWED_UPLOAD_EXTENSIONS=.jpg,.jpeg,.png,.pdf,.doc,.docx

# Password Policy
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_DIGITS=true
PASSWORD_REQUIRE_SPECIAL=true

# Redis (optional)
REDIS_URL=

# Email Notifications (optional)
SENDGRID_API_KEY=
EMAIL_FROM=noreply@localhost
ENABLE_EMAIL_NOTIFICATIONS=false

# SMS Notifications (optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
ENABLE_SMS_NOTIFICATIONS=false
EOF

echo "✓ Backend configuration created"

echo ""
echo "Step 3: Setting up frontend..."
cd ../frontend

# Install dependencies
npm install

echo "✓ Frontend dependencies installed"

echo ""
echo "=================================="
echo "Installation Complete!"
echo "=================================="
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then visit: http://localhost:5000"
echo ""
echo "API Documentation: http://localhost:8000/docs"
echo ""
