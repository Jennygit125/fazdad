/**
 * Reports Service
 * Handles all report-related API calls
 */

const Logger = require('../utils/logger');
const { ROLES } = require('../utils/constants');
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
        } catch (error) { // Error already logged in apiClient
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
        } catch (error) { // Error already logged in apiClient
            throw error;
        }
    }

    /**
     * Create a new report
     * Moderator only
     */
    static async createReport(data) {
        const { contentId, contentType, reportType, description, priority } = data || {};
        
        // Data Integrity Check
        if (!contentId || !contentType || !reportType || !description) {
            throw new Error('All report fields are required');
        }

        const validContentTypes = ["post", "comment", "user", "other"];
        const validReportTypes = ["spam", "abuse", "harassment", "misinformation", "other"];
        const validPriorities = ["low", "medium", "high"];

        const payload = {
            contentId: String(contentId).trim(),
            contentType: validContentTypes.includes(contentType) ? contentType : "other",
            reportType: validReportTypes.includes(reportType) ? reportType : "other",
            description: String(description).trim(),
            priority: validPriorities.includes(priority) ? priority : "medium"
        };

        try {
            const endpoint = apiClient.endpoints?.REPORTS?.CREATE || '/moderator/reports';
            return await apiClient.post(endpoint, payload);
        } catch (error) { // Error already logged in apiClient
            throw error;
        }
    }

    /**
     * Get reports based on user role
     * Automatically chooses the correct endpoint
     */
    static async getReports(userRole) {
        if (userRole === ROLES.ADMIN) {
            return this.getAdminReports();
        } else if (userRole === ROLES.MODERATOR) {
            return this.getModeratorReports();
        } else {
            throw new Error('Insufficient permissions to view reports');
        }
    }
}

module.exports = ReportsService;
