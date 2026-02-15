/**
 * LocalStorage Service with namespace isolation and error handling
 */

const NAMESPACE = 'fleetguardian_';

class StorageService {
    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Parsed value or defaultValue
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(NAMESPACE + key);
            if (item === null) return defaultValue;

            const parsed = JSON.parse(item);

            // Check expiration
            if (parsed.expiry && Date.now() > parsed.expiry) {
                this.remove(key);
                return defaultValue;
            }

            return parsed.value;
        } catch (error) {
            console.error(`Error reading from localStorage (${key}):`, error);
            return defaultValue;
        }
    }

    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @param {number} ttl - Time to live in milliseconds (optional)
     * @returns {boolean} Success status
     */
    set(key, value, ttl = null) {
        try {
            const item = {
                value,
                expiry: ttl ? Date.now() + ttl : null
            };
            localStorage.setItem(NAMESPACE + key, JSON.stringify(item));
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('localStorage quota exceeded. Clearing old data...');
                this.clearExpired();
                // Try again after clearing
                try {
                    localStorage.setItem(NAMESPACE + key, JSON.stringify({ value, expiry: null }));
                    return true;
                } catch (retryError) {
                    console.error('Failed to save after clearing:', retryError);
                    return false;
                }
            }
            console.error(`Error writing to localStorage (${key}):`, error);
            return false;
        }
    }

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(NAMESPACE + key);
        } catch (error) {
            console.error(`Error removing from localStorage (${key}):`, error);
        }
    }

    /**
     * Check if key exists
     * @param {string} key - Storage key
     * @returns {boolean}
     */
    has(key) {
        return localStorage.getItem(NAMESPACE + key) !== null;
    }

    /**
     * Clear all namespaced items
     */
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(NAMESPACE)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    }

    /**
     * Clear expired items
     */
    clearExpired() {
        try {
            const keys = Object.keys(localStorage);
            const now = Date.now();

            keys.forEach(key => {
                if (key.startsWith(NAMESPACE)) {
                    try {
                        const item = JSON.parse(localStorage.getItem(key));
                        if (item.expiry && now > item.expiry) {
                            localStorage.removeItem(key);
                        }
                    } catch (e) {
                        // Invalid JSON, remove it
                        localStorage.removeItem(key);
                    }
                }
            });
        } catch (error) {
            console.error('Error clearing expired items:', error);
        }
    }

    /**
     * Get all keys with namespace
     * @returns {string[]}
     */
    keys() {
        try {
            return Object.keys(localStorage)
                .filter(key => key.startsWith(NAMESPACE))
                .map(key => key.replace(NAMESPACE, ''));
        } catch (error) {
            console.error('Error getting keys:', error);
            return [];
        }
    }
}

export default new StorageService();
