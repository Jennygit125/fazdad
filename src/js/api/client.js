/**
 * API Client
 * Handles all HTTP communication with the backend
 *
 * Standalone module with hardcoded defaults - no external config dependency
 */

const Logger = require('../utils/logger');

class ApiClient {
    constructor() {
        try {
            // Prioritize Webpack-injected environment variable for Vercel compatibility
            const rawUrl = process.env.API_BASE_URL || '';
            // Ensure the URL doesn't end with a slash to prevent double-slashes in requests
            this.baseUrl = rawUrl && rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
            // Increase timeout to 60s to handle Render's free tier "cold starts"
            this.timeout = 60000;
            
            this.refreshHandler = null;
            this.refreshPromise = null;

            // Hardcoded endpoints - no external config file needed
            this.endpoints = {
                AUTH: {
                    SIGN_IN: '/signIn',
                    SIGN_UP: '/signUp',
                    REFRESH: '/refresh',
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
            
            console.log('[API_CLIENT] Successfully initialized with baseUrl');
            console.log('[API_CLIENT] Endpoints loaded');
            Logger.info('[API_CLIENT] Successfully initialized', { baseUrl: "i won't tell you this "});
        } catch (error) { // Catching errors during constructor is unusual, usually indicates a fatal setup issue.
            console.error('[API_CLIENT] Fatal Constructor error:', error);
            throw error;
        }
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
            _retry = false,
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

            // Handle 401 Unauthorized for token refresh
            if (response.status === 401 && !_retry && this.refreshHandler) {
                if (!this.refreshPromise) {
                    this.refreshPromise = this.refreshHandler().finally(() => {
                        this.refreshPromise = null;
                    });
                }
                const refreshed = await this.refreshPromise;
                if (refreshed) {
                    return await this.request(endpoint, { ...options, _retry: true });
                }
            }

            if (!response.ok) {
                const error = await this.handleErrorResponse(response);
                throw error;
            }

            return await response.json();
        } catch (error) {
            Logger.error(`API Request Failed [${method} ${endpoint}]`, error);
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

    /**
     * Register a callback for 401 errors
     */
    setRefreshHandler(handler) {
        this.refreshHandler = handler;
    }
}

module.exports = new ApiClient();
