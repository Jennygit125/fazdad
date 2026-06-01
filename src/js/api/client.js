/**
 * API Client
 * Handles all HTTP communication with the backend
 * Standalone module with hardcoded defaults - no external config dependency
 */

class ApiClient {
    constructor() {
        // Prioritize Webpack-injected environment variable for Vercel compatibility
        const rawUrl = process.env.API_BASE_URL || 'https://first-auth.onrender.com/api';
        // Ensure the URL doesn't end with a slash to prevent double-slashes in requests
        this.baseUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
        // Increase timeout to 60s to handle Render's free tier "cold starts"
        this.timeout = 60000;
        
        // Hardcoded endpoints - no external config file needed
        this.endpoints = {
            AUTH: {
                SIGN_IN: '/signIn',
                SIGN_UP: '/signUp',
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
            }
        };
    }

    /**
     * Add authorization headers to requests
     */
    getHeaders(customHeaders = {}) {
        const token = this.getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            ...customHeaders,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Retrieve stored authentication token
     */
    getAuthToken() {
        try {
            const raw = sessionStorage.getItem('fazdad_session_v1');
            if (!raw) return null;
            return JSON.parse(raw).token || null;
        } catch {
            return null;
        }
    }

    /**
     * Generic fetch wrapper with error handling
     */
    async request(endpoint, options = {}) {
        const {
            method = 'GET',
            body = null,
            customHeaders = {},
            timeout = this.timeout,
        } = options;

        const url = `${this.baseUrl}${endpoint}`;
        const headers = this.getHeaders(customHeaders);

        const requestInit = {
            method,
            headers,
            signal: AbortSignal.timeout(timeout),
        };

        if (body) {
            requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        try {
            const response = await fetch(url, requestInit);

            if (!response.ok) {
                const error = await this.handleErrorResponse(response);
                throw error;
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            // Specific handling for CORS or Network failures which fetch() reports as TypeError
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                throw new Error('Connection failed. This is likely a CORS security block or the server is waking up from sleep.');
            }
            throw error;
        }
    }

    /**
     * Handle error responses from backend
     */
    async handleErrorResponse(response) {
        let errorData = {};
        
        try {
            errorData = await response.json();
        } catch {
            errorData = { message: response.statusText };
        }

        const error = new Error(errorData.message || 'API request failed');
        error.status = response.status;
        error.data = errorData;
        
        return error;
    }

    /**
     * GET request helper
     */
    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    /**
     * POST request helper
     */
    post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body });
    }

    /**
     * PUT request helper
     */
    put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body });
    }

    /**
     * DELETE request helper
     */
    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    /**
     * PATCH request helper
     */
    patch(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PATCH', body });
    }
}

module.exports = new ApiClient();
