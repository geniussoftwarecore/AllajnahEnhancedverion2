# Allajnah Enhanced - Production Deployment Guide

## Overview
This guide covers deploying the Allajnah Enhanced complaint management system to production on Replit.

## Prerequisites Checklist

### 1. Database
- ✅ PostgreSQL database provisioned (Replit managed)
- ✅ DATABASE_URL environment variable configured automatically
- ✅ Database migrations run automatically on startup

### 2. Email Notifications (Optional)
To enable email notifications, you need SendGrid credentials:

**Option A: Replit Connector (Recommended)**
- Set up SendGrid connector through Replit integrations
- No manual configuration needed

**Option B: Manual Setup**
- Get SendGrid API key from https://app.sendgrid.com/settings/api_keys
- Add to Secrets:
  - `SENDGRID_API_KEY`: Your API key
  - `EMAIL_FROM`: Your verified sender email

### 3. SMS Notifications (Optional)
To enable SMS notifications, you need Twilio credentials:

**Option A: Replit Connector (Recommended)**
- Set up Twilio connector through Replit integrations
- No manual configuration needed

**Option B: Manual Setup**
- Get Twilio credentials from https://console.twilio.com/
- Add to Secrets:
  - `TWILIO_ACCOUNT_SID`: Your account SID
  - `TWILIO_AUTH_TOKEN`: Your auth token
  - `TWILIO_PHONE_NUMBER`: Your Twilio phone number

## Deployment Configuration

The system is configured for **VM deployment** (always-on) to support:
- WebSocket real-time notifications
- Scheduled background jobs (SLA monitoring, auto-escalation)
- Stateful connections

### Build Process
The deployment automatically:
1. Installs frontend dependencies (`npm install`)
2. Builds production-optimized frontend (`npm run build`)

### Run Configuration
Production runs:
- **Backend**: uvicorn on port 8000 (FastAPI)
- **Frontend**: Vite preview server on port 5000 (serves built files)

## Publishing to Production

1. Click the **Deploy** button in Replit
2. Review the deployment configuration
3. Click **Deploy** to publish
4. Your app will be available at your Replit deployment URL

## Initial Setup

### First-Time Configuration
1. Visit your deployed application
2. Complete the initial setup wizard:
   - Create the first Higher Committee (admin) account
   - This account will have full system access

### Post-Deployment Steps
1. **Login** as the admin account
2. **Configure Categories**: Add government entity categories
3. **Configure SLA Settings**: Set response time thresholds
4. **Configure Payment Methods**: Add payment options for subscriptions
5. **Create Users**: Add Technical Committee members and initial traders

## Monitoring & Health Checks

### Health Endpoint
- **URL**: `https://your-app.repl.co/health`
- **Purpose**: Monitor application and database status
- **Response**: 
  - `200 OK`: All systems operational
  - `503 Service Unavailable`: System unhealthy

### Logs
- View application logs through Replit Console
- Audit logs stored in database (accessible via Admin panel)

## Security Best Practices

### Environment Secrets
- Never commit API keys or passwords to the repository
- Use Replit Secrets for all sensitive credentials
- Keys are automatically injected as environment variables

### Database
- Use Replit's managed PostgreSQL (includes backups)
- Database credentials managed automatically
- SSL connections enabled by default

### Rate Limiting
Currently configured limits:
- **Login attempts**: 5 per minute
- **Complaint submissions**: 10 per hour
- **File uploads**: 20 per hour

Adjust in `backend/config.py` if needed.

## Backup Strategy

### Database Backups
- Replit automatically backs up your PostgreSQL database
- Access backups through Database panel
- Test restoration process regularly

### File Attachments
- Stored in `backend/uploads/` directory
- Consider periodic exports for critical files
- Included in Replit's file system backups

## Performance Optimization

### Current Optimizations
- ✅ Database connection pooling (10 connections, 20 max overflow)
- ✅ Frontend built with production optimizations (minification, tree-shaking)
- ✅ Static file serving for attachments
- ✅ Rate limiting to prevent abuse

### Monitoring Points
1. Database connection pool usage
2. File upload storage (monitor disk usage)
3. Response times for complaint operations
4. Scheduled job execution success rate

## Troubleshooting

### App Not Starting
1. Check logs for database connection errors
2. Verify DATABASE_URL is set
3. Ensure all required packages are installed

### Notifications Not Working
1. Verify API credentials in Secrets
2. Check notification service logs
3. Confirm user notification preferences are enabled

### WebSocket Connection Issues
1. Ensure port 8000 is accessible for backend
2. Check browser console for connection errors
3. Verify CORS configuration includes your domain

## Scaling Considerations

### Current Capacity
- Handles moderate concurrent users (50-100)
- Suitable for city/regional deployment

### When to Scale
Consider upgrading if you experience:
- Slow database queries (>2 seconds)
- High memory usage (>80% consistently)
- Complaint submission delays

## Support & Maintenance

### Regular Maintenance Tasks
- **Weekly**: Review audit logs for suspicious activity
- **Monthly**: Check disk usage for uploaded files
- **Quarterly**: Review and update SLA thresholds

### Updates
1. Test updates in a development environment first
2. Announce scheduled maintenance to users
3. Use Replit's rollback feature if issues arise

## Contact & Documentation

- **Full Documentation**: See `DOCUMENTATION.md`
- **API Reference**: See `API_DOCUMENTATION.md`
- **User Guide**: See `USER_GUIDE.md` (Arabic)

---

**Last Updated**: November 2025  
**Version**: 1.0.0
