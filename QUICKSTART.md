# Quick Start Guide

Get AllAjnah up and running in minutes!

## For Local Development

### Option 1: Automated Setup (Recommended)

```bash
# Make the script executable
chmod +x install-local.sh

# Run the installation script
./install-local.sh
```

The script will:
- Set up the PostgreSQL database
- Create a Python virtual environment
- Install all backend dependencies
- Generate a secure JWT secret key
- Install frontend dependencies
- Create the necessary configuration files

### Option 2: Manual Setup

**Backend:**
```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Access the app:**
- Frontend: http://localhost:5000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## For Production Deployment

### Docker (Simplest)

```bash
# Copy and edit environment file
cp .env.example.production .env
nano .env  # Set your production values

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### VPS/Server

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

Quick commands:
```bash
# 1. Install system dependencies
sudo apt update && sudo apt install -y python3.11 postgresql nginx git nodejs npm

# 2. Clone and setup
git clone <your-repo-url> /var/www/allajnah
cd /var/www/allajnah

# 3. Setup backend
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn
cp .env.example .env
# Edit .env with production values

# 4. Build frontend
cd ../frontend
npm install
npm run build

# 5. Configure systemd and nginx
sudo cp ../allajnah-backend.service /etc/systemd/system/
sudo cp ../nginx-production.conf /etc/nginx/sites-available/allajnah
sudo ln -s /etc/nginx/sites-available/allajnah /etc/nginx/sites-enabled/
sudo systemctl enable allajnah-backend
sudo systemctl start allajnah-backend
sudo systemctl restart nginx

# 6. Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

## First Steps After Installation

1. **Create Admin Account**
   ```bash
   curl -X POST "http://localhost:8000/api/setup/admin" \
     -H "Content-Type: application/json" \
     -d '{
       "first_name": "Admin",
       "last_name": "User",
       "email": "admin@example.com",
       "password": "SecurePassword123!",
       "national_id": "1234567890"
     }'
   ```

2. **Login** at http://localhost:5000 with your admin credentials

3. **Configure** the system settings from the admin panel

4. **Test** by submitting a sample complaint

## Essential Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✓ |
| `JWT_SECRET_KEY` | Secret key for JWT tokens | ✓ |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | ✓ |

## Common Issues

**Database connection error:**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database credentials

**Frontend can't reach backend:**
- Ensure both services are running
- Check CORS_ORIGINS includes your frontend URL
- Verify firewall settings

**Port already in use:**
- Backend: Kill process on port 8000
- Frontend: Kill process on port 5000
- Or change ports in the configuration

## Getting Help

- Read the full [README.md](README.md)
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
- Review API documentation at http://localhost:8000/docs
- Check application logs for errors

## Next Steps

- Configure email notifications (SendGrid)
- Configure SMS notifications (Twilio)
- Set up proper CORS origins for production
- Configure Redis for better performance
- Set up automated backups
- Enable monitoring and logging

Enjoy using AllAjnah! 🎉
