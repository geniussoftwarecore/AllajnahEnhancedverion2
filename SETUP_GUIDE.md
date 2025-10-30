# Allajnah Enhanced - Setup Guide

## ✓ Project Successfully Imported and Configured!

Your complaint management system is now fully operational.

## Admin Account

An admin account has been created for you:

- **Email**: `admin@allajnah.sd`
- **Password**: `Admin123`
- **Role**: Higher Committee (Full Admin Access)

⚠️ **IMPORTANT**: Please change this password immediately after first login!

## How to Use the System

### 1. Admin Login
1. Open the application (you should see the login page)
2. Enter the admin credentials above
3. You will be redirected to the Higher Committee dashboard

### 2. Create User Accounts (Admin Only)
As an admin, you can create accounts for:
- **Higher Committee Members**: Full administrative access
- **Technical Committee Members**: Can review and manage complaints
- **Traders**: Can submit and track complaints

To create users, use the admin endpoint:
- Endpoint: `POST /api/admin/users`
- This can only be accessed by Higher Committee members
- You'll need to build a UI for this or use an API client like Postman

### 3. User Roles

#### Higher Committee (Admin)
- View all complaints across the system
- Review escalated complaints
- Make final decisions (resolve/reject)
- Create new users (all roles)
- Full access to all features

#### Technical Committee
- View submitted and under-review complaints
- Assign complaints to committee members
- Update complaint status
- Add internal and public comments
- Escalate complaints to Higher Committee

#### Traders
- Submit new complaints
- View personal complaints
- Filter complaints by status
- Add public comments
- Track complaint progress

## Database Setup

✓ PostgreSQL database is configured and initialized
✓ Default categories are pre-loaded:
  - الموصفات والمقاييس (Standards and Measurements)
  - الجمارك (Customs)
  - الضرائب (Taxes)
  - صندوق النظافة والتحسين (Cleaning and Improvement Fund)
  - مباحث الأموال العامة (Public Funds Investigation)
  - خلل إداري (Administrative Issues)

## Security Notes

1. **Public Registration Disabled**: For security, public registration has been disabled. Only admins can create new accounts.

2. **Password Requirements**: Passwords must be secure. Consider adding a password change feature for first-time users.

3. **API Authentication**: All protected endpoints require JWT bearer tokens.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (returns JWT token)
- `GET /api/auth/me` - Get current user info

### Admin (Higher Committee Only)
- `POST /api/admin/users` - Create new users

### Complaints
- `GET /api/complaints` - List complaints (filtered by role)
- `POST /api/complaints` - Create complaint (traders only)
- `GET /api/complaints/{id}` - Get complaint details
- `PATCH /api/complaints/{id}` - Update complaint (committee only)

### Comments
- `GET /api/complaints/{id}/comments` - Get comments
- `POST /api/complaints/{id}/comments` - Add comment

### Other
- `GET /api/categories` - List categories
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/users/committee` - List committee users

## Next Steps

1. ✓ Login with the admin account
2. Create additional committee users as needed
3. Test the complaint submission workflow
4. Consider adding:
   - User management UI in the admin panel
   - Password change functionality
   - Email notifications
   - Analytics and reporting features

## Technical Details

- **Backend**: Python FastAPI on port 8000
- **Frontend**: React with Vite on port 5000
- **Database**: PostgreSQL (Neon-backed)
- **Authentication**: JWT tokens
- **Language**: Full Arabic support with RTL layout

Both frontend and backend are running and ready to use!
