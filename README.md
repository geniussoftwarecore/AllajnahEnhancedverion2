# AllAjnah - Municipal Complaints Management System

A comprehensive web application for managing municipal complaints with Arabic language support, built with FastAPI (backend) and React (frontend).

## 🚀 Features

- **User Management**: Role-based access control (Admin, Staff, Citizen)
- **Complaint System**: Submit, track, and manage complaints
- **Real-time Notifications**: Email and SMS notifications
- **Document Management**: Upload and manage attachments
- **Analytics Dashboard**: Comprehensive reporting and statistics
- **Arabic Language Support**: Full RTL support with Arabic UI
- **SLA Monitoring**: Automated tracking of complaint resolution times
- **Export Functionality**: Export reports in PDF and Excel formats

## 📋 Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- PostgreSQL 14 or higher
- Redis (optional, for caching and rate limiting)

## 🛠️ Local Installation

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd <repository-name>
   ```

2. **Set up Python virtual environment**
   ```bash
   cd backend
   python -m venv venv
   
   # On Linux/Mac:
   source venv/bin/activate
   
   # On Windows:
   venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb allajnah_db
   
   # Run database migrations (if using Alembic)
   alembic upgrade head
   ```

6. **Generate JWT secret**
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   # Copy this value to JWT_SECRET_KEY in .env
   ```

7. **Run the backend server**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment (if needed)**
   ```bash
   # Create .env file if you need to override API URL
   echo "VITE_API_URL=http://localhost:8000" > .env
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🔧 Environment Variables

### Backend (.env)

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost/allajnah_db

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS Configuration
CORS_ORIGINS=http://localhost:5000,https://yourdomain.com

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
REDIS_URL=redis://localhost:6379

# Email Notifications (optional)
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@yourdomain.com
ENABLE_EMAIL_NOTIFICATIONS=false

# SMS Notifications (optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
ENABLE_SMS_NOTIFICATIONS=false
```

## 🚀 Production Deployment

### Option 1: Docker Deployment (Recommended)

See `docker-compose.yml` for containerized deployment.

```bash
docker-compose up -d
```

### Option 2: Manual Server Deployment

1. **Install system dependencies**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install python3.11 python3.11-venv postgresql nginx
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install nodejs
   ```

2. **Set up the application**
   ```bash
   # Create app directory
   sudo mkdir -p /var/www/allajnah
   sudo chown $USER:$USER /var/www/allajnah
   cd /var/www/allajnah
   
   # Clone repository
   git clone <your-repo-url> .
   ```

3. **Configure backend**
   ```bash
   cd backend
   python3.11 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pip install gunicorn
   
   # Set up environment
   cp .env.example .env
   # Edit .env with production values
   ```

4. **Build frontend**
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```

5. **Set up Systemd service**
   
   Create `/etc/systemd/system/allajnah.service`:
   ```ini
   [Unit]
   Description=AllAjnah Backend Service
   After=network.target postgresql.service
   
   [Service]
   Type=notify
   User=www-data
   WorkingDirectory=/var/www/allajnah/backend
   Environment="PATH=/var/www/allajnah/backend/venv/bin"
   ExecStart=/var/www/allajnah/backend/venv/bin/gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   ```

6. **Configure Nginx**
   
   Create `/etc/nginx/sites-available/allajnah`:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       # Frontend
       location / {
           root /var/www/allajnah/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
       
       # Backend API
       location /api/ {
           proxy_pass http://localhost:8000/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       
       # File uploads
       client_max_body_size 10M;
   }
   ```

7. **Enable and start services**
   ```bash
   # Enable Nginx site
   sudo ln -s /etc/nginx/sites-available/allajnah /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   
   # Start backend service
   sudo systemctl enable allajnah
   sudo systemctl start allajnah
   ```

8. **Set up SSL with Let's Encrypt (recommended)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

### Database Migrations

If you make database schema changes, create migrations:

```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

## 📊 Default Admin Account

After first run, create an admin account through the API:

```bash
curl -X POST "http://localhost:8000/api/setup/admin" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Admin",
    "last_name": "User",
    "email": "admin@example.com",
    "password": "YourSecurePassword123!",
    "national_id": "1234567890"
  }'
```

## 🧪 Testing

```bash
# Backend tests (if available)
cd backend
pytest

# Frontend tests
cd frontend
npm run test:smoke
```

## 📝 API Documentation

Once the backend is running, access the interactive API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🔒 Security Considerations

- ✅ Change JWT_SECRET_KEY to a strong random value
- ✅ Use HTTPS in production
- ✅ Set CORS_ORIGINS to specific domains (not *)
- ✅ Keep dependencies updated
- ✅ Use strong password policies
- ✅ Enable rate limiting
- ✅ Regular database backups
- ✅ Monitor logs for suspicious activity

## 📦 Technology Stack

**Backend:**
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- PostgreSQL (Database)
- APScheduler (Background jobs)
- JWT (Authentication)
- SendGrid/Twilio (Notifications)

**Frontend:**
- React 18
- Vite (Build tool)
- TailwindCSS (Styling)
- React Router (Navigation)
- Axios (HTTP client)
- i18next (Internationalization)

## 🤝 Support

For issues and questions, please contact your system administrator.

## 📄 License

[Your License Here]
