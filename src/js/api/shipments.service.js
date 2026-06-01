/**
 * Example: Shipment Service
 * 
 * This is an example of how to create a service module for API resources.
 * Copy this pattern for other resources (users, tracking, etc.)
 */

const apiClient = require('../api/client');
const API_CONFIG = require('../../config/api.config');

class ShipmentService {
    /**
     * Get all shipments
     */
    static async getAll(filters = {}) {
        try {
            const queryString = new URLSearchParams(filters).toString();
            const url = queryString 
                ? `${API_CONFIG.ENDPOINTS.SHIPMENTS.LIST}?${queryString}`
                : API_CONFIG.ENDPOINTS.SHIPMENTS.LIST;
            
            return await apiClient.get(url);
        } catch (error) {
            console.error('Failed to fetch shipments:', error);
            throw error;
        }
    }

    /**
     * Get single shipment by ID
     */
    static async getById(id) {
        if (!id) throw new Error('Shipment ID is required');
        
        try {
            const url = API_CONFIG.ENDPOINTS.SHIPMENTS.GET.replace(':id', id);
            return await apiClient.get(url);
        } catch (error) {
            console.error(`Failed to fetch shipment ${id}:`, error);
            throw error;
        }
    }

    /**
     * Create new shipment
     */
    static async create(shipmentData) {
        if (!shipmentData) throw new Error('Shipment data is required');
        
        try {
            return await apiClient.post(
                API_CONFIG.ENDPOINTS.SHIPMENTS.CREATE,
                shipmentData
            );
        } catch (error) {
            console.error('Failed to create shipment:', error);
            throw error;
        }
    }

    /**
     * Update existing shipment
     */
    static async update(id, shipmentData) {
        if (!id) throw new Error('Shipment ID is required');
        if (!shipmentData) throw new Error('Shipment data is required');
        
        try {
            const url = API_CONFIG.ENDPOINTS.SHIPMENTS.UPDATE.replace(':id', id);
            return await apiClient.put(url, shipmentData);
        } catch (error) {
            console.error(`Failed to update shipment ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete shipment
     */
    static async delete(id) {
        if (!id) throw new Error('Shipment ID is required');
        
        try {
            const url = API_CONFIG.ENDPOINTS.SHIPMENTS.DELETE.replace(':id', id);
            return await apiClient.delete(url);
        } catch (error) {
            console.error(`Failed to delete shipment ${id}:`, error);
            throw error;
        }
    }

    /**
     * Track shipment
     */
    static async track(id) {
        if (!id) throw new Error('Shipment ID is required');
        
        try {
            const url = API_CONFIG.ENDPOINTS.SHIPMENTS.TRACK.replace(':id', id);
            return await apiClient.get(url);
        } catch (error) {
            console.error(`Failed to track shipment ${id}:`, error);
            throw error;
        }
    }

    /**
     * Cache shipment data with TTL
     */
    static async getCachedById(id, ttlSeconds = 300) {
        const { StorageManager } = require('../utils/storage');
        const cacheKey = `shipment_${id}`;
        
        // Check cache first
        const cached = StorageManager.getCachedData(cacheKey);
        if (cached) {
            return cached;
        }

        // Fetch from API and cache
        const shipment = await this.getById(id);
        StorageManager.cacheData(cacheKey, shipment, ttlSeconds);
        
        return shipment;
    }
}

module.exports = ShipmentService;