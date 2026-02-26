import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSettings } from '../SettingsContext';

/**
 * Custom hook for fetching and managing Kubernetes resource data with automatic refreshing.
 * 
 * @param {string} url - The API endpoint to fetch data from.
 * @param {string} searchTerm - Optional search term for filtering.
 * @param {object} initialSort - Initial sorting configuration.
 * @param {function} getVal - Helper function to extract values for sorting.
 */
export function useResourceData(url, searchTerm = '', initialSort = { key: 'name', direction: 'asc' }, getVal = (item, key) => item[key]) {
    const { settings } = useSettings();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState(initialSort);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        fetch(url)
            .then(async r => {
                if (r.ok) return r.json();
                let errorMessage = 'Failed to fetch';
                try {
                    const data = await r.json();
                    errorMessage = data.error || errorMessage;
                } catch (e) {
                    try {
                        const text = await r.text();
                        if (text) errorMessage = text;
                    } catch (e2) { }
                }
                throw new Error(errorMessage);
            })
            .then(data => setItems(data || []))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [url]);

    useEffect(() => {
        load();
        if (settings.resourceRefreshInterval > 0) {
            const interval = setInterval(load, settings.resourceRefreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [load, settings.resourceRefreshInterval]);

    const sortedItems = useMemo(() => {
        const result = [...items];
        if (!sortConfig.key) return result;

        result.sort((a, b) => {
            let aVal = getVal(a, sortConfig.key);
            let bVal = getVal(b, sortConfig.key);

            if (aVal === bVal) return 0;
            if (aVal === '—' || aVal === undefined || aVal === null) return 1;
            if (bVal === '—' || bVal === undefined || bVal === null) return -1;

            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);
            if (!isNaN(aNum) && !isNaN(bNum) && typeof aVal !== 'string' || (!aVal.includes(':') && !aVal.includes('-'))) {
                return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
            }

            return sortConfig.direction === 'asc'
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal));
        });
        return result;
    }, [items, sortConfig, getVal]);

    const filteredItems = useMemo(() => {
        if (!searchTerm) return sortedItems;
        const lowercasedTerm = searchTerm.toLowerCase();

        const searchInObj = (obj) => {
            if (!obj) return false;
            if (typeof obj === 'string') return obj.toLowerCase().includes(lowercasedTerm);
            if (typeof obj === 'number') return String(obj).includes(lowercasedTerm);
            if (Array.isArray(obj)) return obj.some(searchInObj);
            if (typeof obj === 'object') {
                return Object.values(obj).some(searchInObj);
            }
            return false;
        };

        return sortedItems.filter(item => searchInObj(item));
    }, [sortedItems, searchTerm]);

    return {
        items: filteredItems,
        rawData: items,
        loading,
        error,
        sortConfig,
        setSortConfig,
        refresh: load
    };
}
