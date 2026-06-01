/**
 * Storage Utilities
 * Session and data management
 */

const STORAGE_KEYS = Object.freeze({
    SESSION: 'fazdad_session_v1',
    USER_PREFERENCES: 'fazdad_preferences_v1',
    CACHE: 'fazdad_cache_v1',
});

class StorageManager {
    /**
     * Read JSON from storage with fallback
     */
    static readJson(storage, key, fallback = null) {
        try {
            const raw = storage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            console.error(`Error reading from storage [${key}]:`, error);
            return fallback;
        }
    }

    /**
     * Write JSON to storage
     */
    static writeJson(storage, key, value) {
        try {
            storage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing to storage [${key}]:`, error);
            return false;
        }
    }

    /**
     * Get current session
     */
    static getSession() {
        return this.readJson(sessionStorage, STORAGE_KEYS.SESSION, null);
    }

    /**
     * Save session
     */
    static saveSession(session) {
        this.writeJson(sessionStorage, STORAGE_KEYS.SESSION, session);
    }

    /**
     * Clear session
     */
    static clearSession() {
        sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    }

    /**
     * Get user preferences
     */
    static getPreferences() {
        return this.readJson(sessionStorage, STORAGE_KEYS.USER_PREFERENCES, {});
    }

    /**
     * Save user preferences
     */
    static savePreferences(prefs) {
        this.writeJson(sessionStorage, STORAGE_KEYS.USER_PREFERENCES, prefs);
    }

    /**
     * Cache data with optional TTL
     */
    static cacheData(key, value, ttlSeconds = null) {
        const cache = this.readJson(sessionStorage, STORAGE_KEYS.CACHE, {});
        cache[key] = {
            value,
            timestamp: Date.now(),
            ttl: ttlSeconds,
        };
        this.writeJson(sessionStorage, STORAGE_KEYS.CACHE, cache);
    }

    /**
     * Retrieve cached data (respects TTL)
     */
    static getCachedData(key) {
        const cache = this.readJson(sessionStorage, STORAGE_KEYS.CACHE, {});
        const entry = cache[key];

        if (!entry) return null;

        if (entry.ttl) {
            const age = (Date.now() - entry.timestamp) / 1000;
            if (age > entry.ttl) {
                delete cache[key];
                this.writeJson(sessionStorage, STORAGE_KEYS.CACHE, cache);
                return null;
            }
        }

        return entry.value;
    }
}

module.exports = { StorageManager, STORAGE_KEYS };
