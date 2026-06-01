/**
 * Users Service
 * Handles all user-related API calls
 */

const apiClient = require('./client');

class UsersService {
    /**
     * Get current user profile
     */
    static async getProfile() {
        try {
            const endpoint = apiClient.endpoints?.USERS?.PROFILE || '/user/profile';
            return await apiClient.get(endpoint);
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            throw error;
        }
    }

    /**
     * Get all users (admin/moderator only)
     */
    static async getAllUsers() {
        try {
            const endpoint = apiClient.endpoints?.USERS?.GET_ALL || '/admin/getAllUsers';
            return await apiClient.get(endpoint);
        } catch (error) {
            console.error('Failed to fetch all users:', error);
            throw error;
        }
    }

    /**
     * Delete a user (admin only)
     */
    static async deleteUser(userId) {
        if (!userId) throw new Error('User ID is required');

        try {
            const template = apiClient.endpoints?.USERS?.DELETE || '/admin/user/:id';
            const url = template.replace(':id', userId);
            return await apiClient.delete(url);
        } catch (error) {
            console.error(`Failed to delete user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Lock a user (admin/moderator)
     * Moderator locks for 1 day, admin can choose duration
     */
    static async lockUser(userId, duration = null) {
        if (!userId) throw new Error('User ID is required');

        try {
            const template = apiClient.endpoints?.USERS?.LOCK || '/user/:id/lock';
            const url = template.replace(':id', userId);
            // Backend expects duration (minutes or ISO string) for Admin, 
            // or empty body for Moderator 1-day auto-lock
            const body = duration ? { duration } : {}; 
            
            return await apiClient.post(url, body);
        } catch (error) {
            console.error(`Failed to lock user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Promote a user to admin (admin only)
     */
    static async promoteToAdmin(userId) {
        if (!userId) throw new Error('User ID is required');

        try {
            const template = apiClient.endpoints?.USERS?.PROMOTE || '/admin/promote/:id';
            const url = template.replace(':id', userId);
            return await apiClient.post(url, {});
        } catch (error) {
            console.error(`Failed to promote user ${userId}:`, error);
            throw error;
        }
    }
}

module.exports = UsersService;
