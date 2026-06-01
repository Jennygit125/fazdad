# Fazdad Logistics - Project Organization Guide

## 📁 Project Structure

This project has been organized to support backend integration with modular, maintainable code.

```
fazdad/
├── src/
│   └── js/
│       ├── index.js              # Main application entry point
│       ├── api/
│       │   └── client.js          # API client for backend communication
│       ├── modules/
│       │   └── auth.js            # Authentication module
│       └── utils/
│           ├── crypto.js          # Cryptographic utilities
│           ├── storage.js         # Storage management
│           └── validation.js      # Input validation
├── config/
│   └── api.config.js             # API endpoints configuration
├── .env.example                  # Environment variables template
├── package.json                  # Dependencies
├── webpack.config.js             # Build configuration
└── README.md
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy example environment file
npm run setup

# Edit .env with your backend URL
```

The `.env` file should contain:
```
REACT_APP_BACKEND_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Development

```bash
# Watch mode with live reload
npm run dev

# Start dev server
npm start

# Build for production
npm build
```

## 📦 Modules Overview

### API Client (`src/js/api/client.js`)

Generic HTTP client for backend communication:

```javascript
const apiClient = require('./src/js/api/client');

// GET request
const data = await apiClient.get('/api/shipments');

// POST request
const result = await apiClient.post('/api/shipments', { 
    origin: 'New York',
    destination: 'Los Angeles' 
});

// Error handling
try {
    const response = await apiClient.post(endpoint, data);
} catch (error) {
    console.error(error.status, error.message);
}
```

### Authentication Module (`src/js/modules/auth.js`)

Handles user authentication and session management:

```javascript
const auth = require('./src/js/modules/auth');

// Register new user
await auth.register('username', 'password', 'email@example.com');

// Login
await auth.login('username', 'password');

// Check authentication status
if (auth.getIsAuthenticated()) {
    const user = auth.getCurrentUser();
}

// Logout
await auth.logout();

// Subscribe to auth changes
const unsubscribe = auth.subscribe((authState) => {
    console.log('Auth changed:', authState);
});
```

### Storage Manager (`src/js/utils/storage.js`)

Manages session and user data:

```javascript
const { StorageManager } = require('./src/js/utils/storage');

// Save data
StorageManager.saveSession({ token: 'abc123', user: {...} });
StorageManager.cacheData('key', value, ttlSeconds);

// Retrieve data
const session = StorageManager.getSession();
const cached = StorageManager.getCachedData('key');

// Clear session
StorageManager.clearSession();
```

### Validation Utilities (`src/js/utils/validation.js`)

Input validation and sanitization:

```javascript
const ValidationUtils = require('./src/js/utils/validation');

// Email validation
if (ValidationUtils.isValidEmail(email)) { ... }

// Password strength
const validation = ValidationUtils.validatePassword(password);

// Required fields
const validation = ValidationUtils.validateRequired(data, ['field1', 'field2']);
```

### Crypto Utilities (`src/js/utils/crypto.js`)

Secure cryptographic operations:

```javascript
const CryptoUtils = require('./src/js/utils/crypto');

// Check availability
if (CryptoUtils.isAvailable()) {
    const salt = CryptoUtils.generateSalt();
    const hash = await CryptoUtils.hashPassword(password, salt);
}
```

## 🔌 API Integration

### Adding New API Endpoints

1. **Add to config** (`config/api.config.js`):

```javascript
ENDPOINTS: {
    SHIPMENTS: {
        LIST: '/api/shipments',
        CREATE: '/api/shipments',
        GET: '/api/shipments/:id',
    },
}
```

2. **Create service module** (`src/js/api/shipments.js`):

```javascript
const apiClient = require('./client');
const API_CONFIG = require('../../../config/api.config');

class ShipmentService {
    static async getAll() {
        return apiClient.get(API_CONFIG.ENDPOINTS.SHIPMENTS.LIST);
    }

    static async create(shipmentData) {
        return apiClient.post(API_CONFIG.ENDPOINTS.SHIPMENTS.CREATE, shipmentData);
    }

    static async getById(id) {
        const url = API_CONFIG.ENDPOINTS.SHIPMENTS.GET.replace(':id', id);
        return apiClient.get(url);
    }

    static async update(id, shipmentData) {
        const url = API_CONFIG.ENDPOINTS.SHIPMENTS.UPDATE.replace(':id', id);
        return apiClient.put(url, shipmentData);
    }

    static async delete(id) {
        const url = API_CONFIG.ENDPOINTS.SHIPMENTS.DELETE.replace(':id', id);
        return apiClient.delete(url);
    }
}

module.exports = ShipmentService;
```

3. **Use in components**:

```javascript
const ShipmentService = require('../api/shipments');

async function loadShipments() {
    try {
        const shipments = await ShipmentService.getAll();
        // Update UI with shipments
    } catch (error) {
        console.error('Failed to load shipments:', error);
    }
}
```

## 🔐 Authentication Flow

The auth module is fully integrated with the backend API for secure session management.

```json
{
    "success": true,
    "token": "jwt_token_here",
    "user": {
        "id": "user_id",
        "username": "username",
        "email": "email@example.com"
    }
}
```

## 📝 Environment Variables

Create a `.env` file (copy from `.env.example`):

```bash
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:3000

# Environment type
NODE_ENV=development

# API timeout (milliseconds)
REACT_APP_API_TIMEOUT=30000

# Feature flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_TRACKING=true
```

## 🛠️ Common Tasks

### Connecting to Backend

1. Update `REACT_APP_BACKEND_URL` in `.env`
2. Replace local auth logic with backend calls in `auth.js`
3. Create service modules for each API resource
4. Add error handling for network failures

### Handling Errors

```javascript
try {
    const data = await apiClient.get('/api/endpoint');
} catch (error) {
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    console.error('Data:', error.data);
}
```

### Caching Data

```javascript
const { StorageManager } = require('./src/js/utils/storage');

// Cache for 5 minutes
StorageManager.cacheData('shipments', data, 300);

// Retrieve (returns null if expired)
const cached = StorageManager.getCachedData('shipments');
```

### Monitoring Auth State

```javascript
auth.subscribe((authState) => {
    if (authState.isAuthenticated) {
        document.body.classList.add('authenticated');
    } else {
        document.body.classList.remove('authenticated');
    }
});
```

## 📚 Best Practices

- ✅ Use `StorageManager` for all session data
- ✅ Always validate input with `ValidationUtils`
- ✅ Use `apiClient` for all HTTP requests
- ✅ Keep sensitive data in `.env` (never commit `.env`)
- ✅ Subscribe to auth changes for UI updates
- ✅ Use try-catch for async operations
- ✅ Sanitize user input with `ValidationUtils.sanitizeHtml()`

## 🔗 Next Steps

1. Set up your backend API
2. Update `API_CONFIG` with your endpoints
3. Create service modules for each resource
4. Replace local auth with backend integration
5. Test all API connections
6. Deploy to production

## 📖 Additional Resources

- Webpack Documentation
- Web Crypto API
- Fetch API
- Storage API