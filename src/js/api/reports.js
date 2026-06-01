/**
 * Reports Service
 * Handles all report-related API calls
 */

const apiClient = require('./client');
const API_CONFIG = require('../../../config/api.config');

class ReportsService {
    /**
     * Get moderator reports
     * Accessible by admin and moderator
     */
    static async getModeratorReports() {
        try {
            return await apiClient.get(API_CONFIG.ENDPOINTS.REPORTS.GET_MODERATOR);
        } catch (error) {
            console.error('Failed to fetch moderator reports:', error);
            throw error;
        }
    }

    /**
     * Get admin reports
     * Accessible by admin only
     */
    static async getAdminReports() {
        try {
            return await apiClient.get(API_CONFIG.ENDPOINTS.REPORTS.GET_ADMIN);
        } catch (error) {
            console.error('Failed to fetch admin reports:', error);
            throw error;
        }
    }

    /**
     * Create a new report
     * Moderator only
     */
    static async createReport({ contentId, contentType, reportType, description, priority, actionTaken }) {
        const payload = {
            contentId,
            contentType,
            reportType,
            description,
            priority: priority || 'medium',
            actionTaken: actionTaken || 'flagged for review'
        };

        try {
            return await apiClient.post(API_CONFIG.ENDPOINTS.REPORTS.CREATE, payload);
        } catch (error) {
            console.error('Failed to create report:', error);
            throw error;
        }
    }

    /**
     * Get reports based on user role
     * Automatically chooses the correct endpoint
     */
    static async getReports(userRole) {
        if (userRole === 'admin') {
            return this.getAdminReports();
        } else if (userRole === 'moderator') {
            return this.getModeratorReports();
        } else {
            throw new Error('Insufficient permissions to view reports');
        }
    }
}

module.exports = ReportsService;
