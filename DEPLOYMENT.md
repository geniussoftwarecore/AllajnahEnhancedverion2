# Production Deployment Guide

This guide covers different deployment options for the AllAjnah application.

## Pre-Deployment Checklist

- [ ] PostgreSQL database server is running
- [ ] Domain name is configured and pointing to your server
- [ ] SSL certificate is obtained (Let's Encrypt recommended)
- [ ] Firewall is configured to allow HTTP (80) and HTTPS (443)
- [ ] Server has at least 2GB RAM and 20GB storage
- [ ] Backup strategy is in place

## Option 1: Docker Deployment (Recommended)

### Prerequisites
- Docker and Docker Compose installed
- Domain name configured

### Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd <repository-name>
   ```

2. **Create environment file**
   ```bash
   cp .env.example.production .env
   ```

3. **Edit .env with your production values**
   ```bash
   nano .env
   ```
   
   Set the following:
   - `DB_PASSWORD`: Strong database password
   - `JWT_SECRET_KEY`: Generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
   - `CORS_ORIGINS`: Your domain (e.g., https://yourdomain.com)
   - `API_URL`: Your API URL (e.g., https://yourdomain.com/api)

4. **Build and start containers**
   ```bash
   docker-compose up -d
   ```

5. **Check logs**
   ```bash
   docker-compose logs -f
   ```

6. **Set up reverse proxy (Nginx)**
   
   Create `/etc/nginx/sites-available/allajnah`:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:80;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

7. **Enable site and get SSL**
   ```bash
   sudo ln -s /etc/nginx/sites-available/allajnah /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d yourdomain.com
   ```

### Useful Docker Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# View running containers
docker-compose ps

# Execute command in container
docker-compose exec backend bash
```

## Option 2: Manual Deployment on Ubuntu/Debian

### 1. System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3.11 python3.11-venv postgresql nginx certbot python3-certbot-nginx git

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Redis (optional, for caching)
sudo apt install -y redis-server
```

### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE allajnah_db;
CREATE USER allajnah_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE allajnah_db TO allajnah_user;
\q
```

### 3. Application Setup

```bash
# Create application directory
sudo mkdir -p /var/www/allajnah
sudo chown $USER:$USER /var/www/allajnah
cd /var/www/allajnah

# Clone repository
git clone <your-repo-url> .

# Backend setup
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Create .env file
cp .env.example .env
nano .env  # Edit with your production values

# Frontend setup
cd ../frontend
npm install
npm run build
```

### 4. Systemd Service

Create `/etc/systemd/system/allajnah-backend.service`:

```ini
[Unit]
Description=AllAjnah Backend Service
After=network.target postgresql.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/allajnah/backend
Environment="PATH=/var/www/allajnah/backend/venv/bin"
ExecStart=/var/www/allajnah/backend/venv/bin/gunicorn main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --timeout 120 \
    --access-logfile /var/log/allajnah/access.log \
    --error-logfile /var/log/allajnah/error.log
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Create log directory:
```bash
sudo mkdir -p /var/log/allajnah
sudo chown www-data:www-data /var/log/allajnah
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable allajnah-backend
sudo systemctl start allajnah-backend
sudo systemctl status allajnah-backend
```

### 5. Nginx Configuration

Create `/etc/nginx/sites-available/allajnah`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect to HTTPS (will be added by certbot)
    
    # Frontend
    location / {
        root /var/www/allajnah/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # File upload limit
    client_max_body_size 10M;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/allajnah /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 7. Firewall Configuration

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## Option 3: VPS Deployment (DigitalOcean, Linode, AWS)

### Quick Deploy Script

Save this as `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "=== AllAjnah Deployment Script ==="

# Variables
APP_DIR="/var/www/allajnah"
DOMAIN="yourdomain.com"

# Install dependencies
echo "Installing system dependencies..."
sudo apt update
sudo apt install -y python3.11 python3.11-venv postgresql nginx git nodejs npm redis-server certbot python3-certbot-nginx

# Setup database
echo "Setting up database..."
sudo -u postgres psql -c "CREATE DATABASE allajnah_db;"
sudo -u postgres psql -c "CREATE USER allajnah_user WITH PASSWORD 'changeme';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE allajnah_db TO allajnah_user;"

# Clone repository
echo "Cloning repository..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR
cd $APP_DIR
git clone <your-repo-url> .

# Setup backend
echo "Setting up backend..."
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn
cp .env.example .env

echo "Please edit $APP_DIR/backend/.env with your configuration"
read -p "Press enter when done..."

# Setup frontend
echo "Building frontend..."
cd ../frontend
npm install
npm run build

# Setup systemd service
echo "Setting up systemd service..."
sudo cp /path/to/allajnah-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable allajnah-backend
sudo systemctl start allajnah-backend

# Setup Nginx
echo "Setting up Nginx..."
sudo cp /path/to/nginx-config /etc/nginx/sites-available/allajnah
sudo ln -s /etc/nginx/sites-available/allajnah /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL
echo "Setting up SSL..."
sudo certbot --nginx -d $DOMAIN

echo "=== Deployment Complete ==="
echo "Your application should now be running at https://$DOMAIN"
```

## Post-Deployment

### 1. Create Admin Account

```bash
curl -X POST "https://yourdomain.com/api/setup/admin" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Admin",
    "last_name": "User",
    "email": "admin@yourdomain.com",
    "password": "YourSecurePassword123!",
    "national_id": "1234567890"
  }'
```

### 2. Test the Application

- Visit https://yourdomain.com
- Try logging in with admin account
- Submit a test complaint
- Check notifications (if configured)

### 3. Set Up Monitoring

Consider setting up:
- Application monitoring (e.g., Sentry)
- Server monitoring (e.g., Prometheus + Grafana)
- Log aggregation (e.g., ELK stack)
- Uptime monitoring (e.g., UptimeRobot)

### 4. Regular Backups

Set up automated database backups:

```bash
# Create backup script
cat > /usr/local/bin/backup-allajnah.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/allajnah"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U allajnah_user allajnah_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Files backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/allajnah/backend/uploads

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-allajnah.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-allajnah.sh") | crontab -
```

## Updating the Application

```bash
# Pull latest changes
cd /var/www/allajnah
git pull

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart allajnah-backend

# Update frontend
cd ../frontend
npm install
npm run build
sudo systemctl reload nginx
```

## Troubleshooting

### Check Backend Logs
```bash
sudo journalctl -u allajnah-backend -f
tail -f /var/log/allajnah/error.log
```

### Check Nginx Logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Database Connection Issues
```bash
# Test database connection
sudo -u postgres psql allajnah_db
```

### Permission Issues
```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/allajnah
sudo chmod -R 755 /var/www/allajnah
```

## Security Hardening

1. **Enable automatic updates**
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

2. **Configure fail2ban**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

3. **Restrict SSH access**
   - Use SSH keys instead of passwords
   - Change default SSH port
   - Disable root login

4. **Regular updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

## Support

For issues and questions:
- Check logs first
- Review this documentation
- Contact your system administrator
