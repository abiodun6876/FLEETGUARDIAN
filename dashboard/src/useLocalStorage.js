import { useState, useEffect, useCallback } from 'react';
import storageService from './storageService';

/**
 * Custom hook for localStorage with React state synchronization
 * @param {string} key - Storage key
 * @param {*} initialValue - Initial value if key doesn't exist
 * @returns {[*, Function]} - [value, setValue]
 */
export function useLocalStorage(key, initialValue) {
    // State to store our value
    const [storedValue, setStoredValue] = useState(() => {
        try {
            // Get from local storage by key
            const item = storageService.get(key);
            // Parse stored json or if none return initialValue
            return item !== null ? item : initialValue;
        } catch (error) {
            console.error(`Error loading ${key} from localStorage:`, error);
            return initialValue;
        }
    });

    // Return a wrapped version of useState's setter function that
    // persists the new value to localStorage.
    const setValue = useCallback((value) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // Save state
            setStoredValue(valueToStore);

            // Save to local storage
            storageService.set(key, valueToStore);

            // Dispatch custom event for cross-tab sync
            window.dispatchEvent(new CustomEvent('localStorageChange', {
                detail: { key, value: valueToStore }
            }));
        } catch (error) {
            console.error(`Error saving ${key} to localStorage:`, error);
        }
    }, [key, storedValue]);

    // Listen for changes from other tabs
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.detail && e.detail.key === key) {
                setStoredValue(e.detail.value);
            }
        };

        const handleNativeStorageChange = (e) => {
            if (e.key === `fleetguardian_${key}` && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    setStoredValue(parsed.value);
                } catch (error) {
                    console.error('Error parsing storage event:', error);
                }
            }
        };

        window.addEventListener('localStorageChange', handleStorageChange);
        window.addEventListener('storage', handleNativeStorageChange);

        return () => {
            window.removeEventListener('localStorageChange', handleStorageChange);
            window.removeEventListener('storage', handleNativeStorageChange);
        };
    }, [key]);

    return [storedValue, setValue];
}

/**
 * Custom hook for debounced values
 * @param {*} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {*} Debounced value
 */
export function useDebounce(value, delay = 500) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
