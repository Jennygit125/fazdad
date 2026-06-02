/**
 * Reports Service
 * Handles all report-related API calls
 */

const apiClient = require('./client');

class ReportsService {
    /**
     * Get moderator reports
     * Accessible by admin and moderator
     */
    static async getModeratorReports() {
        try {
            const endpoint = apiClient.endpoints?.REPORTS?.GET_MODERATOR || '/moderator/reports';
            return await apiClient.get(endpoint);
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
            const endpoint = apiClient.endpoints?.REPORTS?.GET_ADMIN || '/admin/reports';
            return await apiClient.get(endpoint);
        } catch (error) {
            console.error('Failed to fetch admin reports:', error);
            throw error;
        }
    }

    /**
     * Create a new report
     * Moderator only
     */
    static async createReport({ contentId, contentType, reportType, description, priority }) {
        const payload = {
            contentId,
            contentType,
            reportType,
            description,
            priority: priority || 'medium'
        };

        try {
            const endpoint = apiClient.endpoints?.REPORTS?.CREATE || '/moderator/reports';
            return await apiClient.post(endpoint, payload);
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
