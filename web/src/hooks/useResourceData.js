import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSettings } from '../SettingsContext';

/**
 * Custom hook for fetching and managing Kubernetes resource data with automatic refreshing.
 * Updated to handle backend DTOs: name, namespace, status, age, extra.
 */
export function useResourceData(url, searchTerm = '', initialSort = { key: 'name', direction: 'asc' }, getVal = (item, key) => {
    // Handle nested DTO structure for sorting
    if (key === 'name' || key === 'namespace' || key === 'status' || key === 'age') return item[key];
    if (item.extra && item.extra[key] !== undefined) return item.extra[key];
    return item[key];
}) {
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
                } catch (e) {}
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
            if (!isNaN(aNum) && !isNaN(bNum) && typeof aVal !== 'string') {
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
            if (typeof obj === 'string') return (obj || '').toLowerCase().includes(lowercasedTerm);
            if (typeof obj === 'number') return String(obj || '').includes(lowercasedTerm);
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

/**
 * Custom hook for fetching single resource details DTO.
 */
export function useResourceDetails(kind, namespace, name) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const url = namespace && namespace !== '-' 
                ? `/api/resources/${kind}/${namespace}/${name}` 
                : `/api/resources/${kind}/-/${name}`;
            
            const res = await fetch(url);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to fetch resource details');
            }
            const dto = await res.json();
            setData(dto);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [kind, namespace, name]);

    useEffect(() => {
        if (kind && name) load();
    }, [load]);

    return { data, loading, error, refresh: load };
}
