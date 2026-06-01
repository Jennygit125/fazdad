/**
 * Public Service
 * Handles public API calls that don't require authentication
 */

const apiClient = require('./client');
const API_CONFIG = require('../../../config/api.config');

class PublicService {
    /**
     * Get public message
     * No authentication required
     */
    static async getPublicMessage() {
        try {
            return await apiClient.get(API_CONFIG.ENDPOINTS.AUTH.PUBLIC_MESSAGE);
        } catch (error) {
            console.error('Failed to fetch public message:', error);
            throw error;
        }
    }
}

module.exports = PublicService;
