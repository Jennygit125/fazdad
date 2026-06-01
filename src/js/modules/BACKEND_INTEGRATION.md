# Backend Integration Guide - first-auth.onrender.com

## 🚀 Quick Start

Your frontend is now connected to the backend at `https://first-auth.onrender.com`

### 1. Install Dependencies
```bash
npm install
```

### 2. Create .env File
```bash
npm run setup
# .env will be created with backend URL automatically set
```

### 3. Start Development
```bash
npm start
```

Visit `http://localhost:8080` in your browser.

---

## 📋 Available Services

### Authentication Service (Built-in)
```javascript
const auth = require('./src/js/modules/auth');

// Sign up
await auth.register('username', 'password', 'email@example.com');

// Sign in
const result = await auth.login('username', 'password');

// Check status
if (auth.getIsAuthenticated()) {
    console.log('User:', auth.getCurrentUser());
    console.log('Role:', auth.getUserRole());
}

// Logout
await auth.logout();

// Check roles
if (auth.isAdmin()) { /* admin logic */ }
if (auth.isModerator()) { /* moderator logic */ }
```

### Users Service
```javascript
const UsersService = require('./src/js/api/users');

// Get your profile
const profile = await UsersService.getProfile();

// Get all users (admin/moderator)
const users = await UsersService.getAllUsers();

// Delete user (admin)
await UsersService.deleteUser(userId);

// Lock user (admin/moderator)
await UsersService.lockUser(userId, duration); // duration optional

// Promote to admin (admin only)
await UsersService.promoteToAdmin(userId);
```

### Reports Service
```javascript
const ReportsService = require('./src/js/api/reports');

// Get moderator reports (admin/moderator)
const reports = await ReportsService.getModeratorReports();

// Get admin reports (admin only)
const reports = await ReportsService.getAdminReports();

// Create report (moderator only)
await ReportsService.createReport({
    title: 'Report Title',
    description: 'Report description',
    // ... other fields
});

// Auto-choose endpoint based on role
const reports = await ReportsService.getReports(userRole);
```

### Public Service
```javascript
const PublicService = require('./src/js/api/public');

// Get public message (no auth required)
const message = await PublicService.getPublicMessage();
```

---

## 🔐 Authentication Flow

### Backend Response Format

**Sign Up Success:**
```json
{
    "success": true,
    "userId": "user_id",
    "username": "username",
    "email": "email@example.com",
    "role": "user"
}
```

**Sign In Success:**
```json
{
    "success": true,
    "token": "jwt_token_here",
    "user": {
        "id": "user_id",
        "username": "username",
        "email": "email@example.com",
        "role": "user"
    }
}
```

### How It Works

1. **User signs in** → Backend returns JWT token
2. **Token stored** → In sessionStorage with user data
3. **Token auto-injected** → On every API request (Bearer token)
4. **Protected routes** → Backend validates token + role
5. **Logout** → Clears token from sessionStorage

---

## 🛡️ Role-Based Access Control (RBAC)

### Available Roles
- `user` - Basic user access
- `moderator` - Moderator permissions
- `admin` - Full admin access

### Role Hierarchy
```
user < moderator < admin
```

### Protected Endpoints

| Endpoint | Required Role | Purpose |
|----------|--|--|
| `/signUp` | None | Register |
| `/signIn` | None | Login |
| `/public/message` | None | Public content |
| `/user/profile` | user, moderator, admin | View own profile |
| `/moderator/reports` | admin, moderator | View reports |
| `/admin/reports` | admin | Admin reports |
| `/moderator/reports` (POST) | moderator | Create report |
| `/admin/user/:id` (DELETE) | admin | Delete user |
| `/user/:id/lock` (POST) | admin, moderator | Lock user |
| `/admin/promote/:id` (POST) | admin | Make admin |
| `/admin/getAllUsers` | admin, moderator | View all users |

### Check Permissions in Frontend

```javascript
const auth = require('./src/js/modules/auth');

// Check if user has specific role
if (auth.hasRole('admin')) {
    // Show admin panel
}

// Check if admin
if (auth.isAdmin()) {
    // Show admin features
}

// Check if moderator (includes admin)
if (auth.isModerator()) {
    // Show moderator features
}

// Get current role
const role = auth.getUserRole();

// Show/hide UI based on role
const adminPanel = document.querySelector('[data-role="admin"]');
if (auth.isAdmin()) {
    adminPanel.style.display = 'block';
} else {
    adminPanel.style.display = 'none';
}
```

---

## 📝 Usage Examples

### Complete Login Flow
```javascript
const auth = require('./src/js/modules/auth');

async function handleLogin(username, password) {
    try {
        const result = await auth.login(username, password);
        
        console.log('Welcome,', result.user.username);
        console.log('Your role:', result.role);
        
        // Redirect based on role
        if (result.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else if (result.role === 'moderator') {
            window.location.href = 'moderator-dashboard.html';
        } else {
            window.location.href = 'user-dashboard.html';
        }
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}
```

### Load User Profile with Error Handling
```javascript
const UsersService = require('./src/js/api/users');

async function loadUserProfile() {
    try {
        const profile = await UsersService.getProfile();
        
        document.querySelector('[data-user-name]').textContent = profile.displayName;
        document.querySelector('[data-user-email]').textContent = profile.email;
        document.querySelector('[data-user-role]').textContent = profile.role.toUpperCase();
        
    } catch (error) {
        if (error.status === 401) {
            // Token expired, redirect to login
            window.location.href = 'login.html';
        } else {
            console.error('Failed to load profile:', error.message);
        }
    }
}
```

### Admin Delete User
```javascript
const UsersService = require('./src/js/api/users');
const auth = require('./src/js/modules/auth');

async function deleteUser(userId) {
    // Check permission
    if (!auth.isAdmin()) {
        alert('Only admins can delete users');
        return;
    }

    try {
        if (confirm('Are you sure you want to delete this user?')) {
            await UsersService.deleteUser(userId);
            alert('User deleted successfully');
            // Refresh user list
            loadAllUsers();
        }
    } catch (error) {
        alert('Failed to delete user: ' + error.message);
    }
}
```

### Moderator Create Report
```javascript
const ReportsService = require('./src/js/api/reports');
const auth = require('./src/js/modules/auth');

async function submitReport() {
    // Check permission
    if (!auth.isModerator()) {
        alert('Only moderators can create reports');
        return;
    }

    const reportData = {
        title: document.querySelector('[name="title"]').value,
        description: document.querySelector('[name="description"]').value,
        category: document.querySelector('[name="category"]').value,
    };

    try {
        const result = await ReportsService.createReport(reportData);
        alert('Report submitted successfully');
        // Clear form
        document.querySelector('form').reset();
    } catch (error) {
        alert('Failed to submit report: ' + error.message);
    }
}
```

---

## 🔍 Debugging

### Check Current Auth State
```javascript
// In browser console:
const auth = require('./src/js/modules/auth');
console.log({
    authenticated: auth.getIsAuthenticated(),
    user: auth.getCurrentUser(),
    role: auth.getUserRole(),
});
```

### View API Requests
Browser console will show:
```
API Error [POST /signIn]: Invalid credentials
API Error [GET /moderator/reports]: 403 Forbidden
```

### Clear Local Session
```javascript
// In browser console:
const { StorageManager } = require('./src/js/utils/storage');
StorageManager.clearSession();
```

### Test Public Message
```javascript
// In browser console:
const PublicService = require('./src/js/api/public');
await PublicService.getPublicMessage();
```

---

## ⚠️ Common Issues

### "401 Unauthorized"
- User not logged in
- Token expired
- Invalid token format

**Fix:** Call `auth.login()` to get a fresh token

### "403 Forbidden"
- User doesn't have required role
- Role mismatch between frontend and backend

**Fix:** Check `auth.getUserRole()` and verify backend returns correct role

### "CORS Error"
- Backend doesn't allow requests from `localhost:8080`

**Fix:** Backend needs to have CORS headers configured

### "Token is undefined"
- Backend didn't return token in login response
- Login response format is different

**Fix:** Check backend response includes `token` or `accessToken` field

---

## 🧪 Testing the Connection

### 1. Test Public Message (no auth)
```javascript
const PublicService = require('./src/js/api/public');
const msg = await PublicService.getPublicMessage();
console.log(msg);
```

### 2. Test Sign Up
```javascript
const auth = require('./src/js/modules/auth');
await auth.register('testuser123', 'TestPass123!', 'test@example.com');
```

### 3. Test Sign In
```javascript
const auth = require('./src/js/modules/auth');
await auth.login('testuser123', 'TestPass123!');
```

### 4. Test Protected Route
```javascript
const UsersService = require('./src/js/api/users');
const profile = await UsersService.getProfile();
console.log(profile);
```

---

## 📚 API Config Reference

All endpoints are configured in `config/api.config.js`:

```javascript
API_CONFIG.ENDPOINTS = {
    AUTH: {
        SIGN_IN: '/signIn',
        SIGN_UP: '/signUp',
        PUBLIC_MESSAGE: '/public/message',
    },
    USERS: {
        PROFILE: '/user/profile',
        GET_ALL: '/admin/getAllUsers',
        DELETE: '/admin/user/:id',
        LOCK: '/user/:id/lock',
        PROMOTE: '/admin/promote/:id',
    },
    REPORTS: {
        GET_MODERATOR: '/moderator/reports',
        GET_ADMIN: '/admin/reports',
        CREATE: '/moderator/reports',
    },
};
```

To add new endpoints:
1. Add to `config/api.config.js`
2. Create service in `src/js/api/`
3. Import and use in your page scripts

---

## 🚀 Production Deployment

When deploying to production:

1. Update backend URL in `.env`:
   ```
   REACT_APP_BACKEND_URL=https://first-auth.onrender.com
   ```

2. Build for production:
   ```bash
   npm run build
   ```

3. Deploy `dist/` folder to your server

4. Ensure CORS is configured on backend for production domain

---

## 📞 Support Resources

- Backend docs: `https://first-auth.onrender.com/docs` (if available)
- Frontend architecture: See `ARCHITECTURE.md`
- Quick start: See `QUICK_START.md`
- Example service: See `src/js/api/shipments.example.js`

---

**Status**: ✅ Connected to `https://first-auth.onrender.com`
**Last Updated**: June 1, 2026