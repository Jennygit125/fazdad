/**
 * Public Service
 * Handles public API calls that don't require authentication
 */

const apiClient = require('./client');

class PublicService {
    /**
     * Get public message
     * No authentication required
     */
    static async getPublicMessage() {
        try {
            const endpoint = apiClient.endpoints?.AUTH?.PUBLIC_MESSAGE || '/public/message';
            return await apiClient.get(endpoint);
        } catch (error) {
            console.error('Failed to fetch public message:', error);
            throw error;
        }
    }
}

module.exports = PublicService;
