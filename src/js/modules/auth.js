/**
 * Authentication Module
 * Handles user authentication and session management
 */
const apiClient = require('../api/client');
const { StorageManager } = require('../utils/storage');
const ValidationUtils = require('../utils/validation');
const Logger = require('../utils/logger');
const { ROLES } = require('../utils/constants');

class AuthModule {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.userRole = null;
        this.listeners = [];

        // Register refresh handler with the API client
        apiClient.setRefreshHandler(() => this.refreshSession());
    }

    /**
     * Subscribe to authentication state changes
     */
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Notify all listeners of state changes
     */
    notifyListeners() {
        this.listeners.forEach(listener => {
            listener({
                isAuthenticated: this.isAuthenticated,
                user: this.currentUser,
                role: this.userRole,
            });
        });
    }

    /**
     * Initialize authentication from stored session
     */
    async initialize() {
        const session = StorageManager.getSession();
        if (session && session.token) {
            this.isAuthenticated = true;
            this.currentUser = session.user;
            this.userRole = session.role;
            this.notifyListeners();
            return true;
        }
        return false;
    }

    /**
     * Register a new user with backend
     */
    async register(firstName, lastName, email, password) {
        // Validate input
        const validation = ValidationUtils.validateRequired(
            { firstName, lastName, email, password },
            ['firstName', 'lastName', 'email', 'password'],
        );

        if (!validation.isValid) {
            const error = new Error('Validation failed');
            error.validationErrors = validation.errors;
            throw error;
        }

        // Validate password strength
        const passwordValidation = ValidationUtils.validatePassword(password);
        if (!passwordValidation.isValid) {
            const error = new Error('Password does not meet requirements');
            error.validationErrors = passwordValidation.issues;
            throw error;
        }

        if (!ValidationUtils.isValidEmail(email)) {
            throw new Error('Invalid email format');
        }

        try {
            // apiClient is a singleton, guaranteed to be initialized
            const endpoint = apiClient.endpoints.AUTH.SIGN_UP || '/signUp';
            Logger.debug(`Attempting registration at: ${apiClient.baseUrl}${endpoint}`);
            const response = await apiClient.post(endpoint, {
                firstName,
                lastName,
                email: email.toLowerCase(),
                password
            });

            return {
                success: true,
                user: response.user || {
                    id: response.userId || response.id || response._id,
                    email: response.email || email,
                    role: response.role || ROLES.USER,
                },
            };
        } catch (error) {
            Logger.error('Registration failed', error, { email });
            throw error;
        }
    }

    /**
     * Login user with backend
     */
    async login(email, password) {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        try {
            // apiClient is a singleton, guaranteed to be initialized
            const endpoint = apiClient.endpoints.AUTH.SIGN_IN || '/signIn';
            const response = await apiClient.post(endpoint, {
                email: email.toLowerCase(),
                password,
            });

            const { token, refreshToken, user: userData } = response;

            if (!userData) {
                throw new Error('User data missing from server response');
            }

            if (!token) {
                throw new Error('No authentication token received from server');
            }

            // Map database fields to application user object
            const user = {
                id: userData.id || userData._id || "unknown",
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                role: userData.role || ROLES.USER,
                displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email
            };

            // Create session
            const session = {
                token,
                refreshToken,
                user,
                role: user.role,
                loginTime: new Date().toISOString(),
            };

            StorageManager.saveSession(session);
            this.isAuthenticated = true;
            this.currentUser = user;
            this.userRole = user.role;
            this.notifyListeners();

            return {
                success: true,
                user,
                role: user.role,
            };
        } catch (error) {
            Logger.error('Login failed', error, { email });
            this.isAuthenticated = false;
            this.currentUser = null;
            this.userRole = null;
            throw error;
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            // Optionally notify backend of logout
            // await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {});

            StorageManager.clearSession();
            this.isAuthenticated = false;
            this.currentUser = null;
            this.userRole = null;
            this.notifyListeners();

            return { success: true };
        } catch (error) {
            Logger.error('Logout failed', error);
            // Clear local session even if backend call fails
            StorageManager.clearSession();
            this.isAuthenticated = false;
            this.currentUser = null;
            this.userRole = null;
            this.notifyListeners();
            throw error;
        }
    }

    /**
     * Attempt to refresh the session using a refresh token
     */
    async refreshSession() {
        const session = StorageManager.getSession();
        if (!session || !session.refreshToken) {
            return false;
        }

        try {
            const endpoint = apiClient.endpoints?.AUTH?.REFRESH || '/refresh';
            // Use _retry: true to prevent infinite refresh loops if the refresh call itself is 401
            const response = await apiClient.post(endpoint, {
                refreshToken: session.refreshToken
            }, { _retry: true });

            const { token, refreshToken: newRefreshToken } = response;

            if (!token) throw new Error('Refresh failed');

            const updatedSession = {
                ...session,
                token,
                refreshToken: newRefreshToken || session.refreshToken,
                loginTime: new Date().toISOString()
            };

            StorageManager.saveSession(updatedSession);
            this.isAuthenticated = true;
            this.currentUser = updatedSession.user;
            this.userRole = updatedSession.role;
            this.notifyListeners();

            return true;
        } catch (error) {
            Logger.error('Session refresh failed', error);
            await this.logout();
            return false;
        }
    }

    /**
     * Get current authenticated user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    getIsAuthenticated() {
        return this.isAuthenticated;
    }

    /**
     * Get current user role
     */
    getUserRole() {
        return this.userRole;
    }

    /**
     * Check if user has a specific role
     */
    hasRole(role) {
        if (!Array.isArray(role)) {
            return this.userRole === role;
        }
        return role.includes(this.userRole);
    }

    /**
     * Check if user has admin role
     */
    isAdmin() {
        return this.userRole === ROLES.ADMIN;
    }

    /**
     * Check if user has moderator role
     */
    isModerator() {
        return this.userRole === ROLES.MODERATOR || this.userRole === ROLES.ADMIN;
    }
}

module.exports = new AuthModule();
