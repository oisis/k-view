import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSettings } from '../SettingsContext';

/**
 * Custom hook for fetching and managing Kubernetes resource data with automatic refreshing.
 * Optimized for performance: stops polling when tab is inactive, ensures visible feedback.
 */
export function useResourceData(url, searchTerm = '', initialSort = { key: 'name', direction: 'asc' }, getVal = (item, key) => {
    if (key === 'name' || key === 'namespace' || key === 'status' || key === 'age') return item[key];
    if (item.extra && item.extra[key] !== undefined) return item.extra[key];
    return item[key];
}) {
    const { settings } = useSettings();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState(initialSort);
    const isVisible = useRef(document.visibilityState === 'visible');

    const load = useCallback((isInitial = false) => {
        if (document.visibilityState !== 'visible') return;

        if (isInitial) {
            setLoading(true);
        } else if (items.length === 0) {
            setIsRefreshing(true);
        }
        
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
            .then(data => {
                setItems(prev => {
                    // Only update if data actually changed to prevent unnecessary renders
                    if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
                    return data || [];
                });
            })
            .catch(e => setError(e.message))
            .finally(() => {
                setLoading(false);
                setIsRefreshing(false);
            });
    }, [url, items.length]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            const visible = document.visibilityState === 'visible';
            isVisible.current = visible;
            if (visible && settings.resourceRefreshInterval > 0) {
                load(false);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [load, settings.resourceRefreshInterval]);

    useEffect(() => {
        load(true);
        
        if (settings.resourceRefreshInterval > 0) {
            const interval = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    load(false);
                }
            }, settings.resourceRefreshInterval * 1000);
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

    const refresh = useCallback(() => load(false), [load]);

    return {
        items: filteredItems,
        rawData: items,
        loading,
        isRefreshing,
        error,
        sortConfig,
        setSortConfig,
        refresh
    };
}

/**
 * Optimized Detail fetching with visibility check and minimum refresh indicator duration.
 */
export function useResourceDetails(kind, namespace, name) {
    const { settings } = useSettings();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const load = useCallback(async (isInitial = false) => {
        if (document.visibilityState !== 'visible') return;

        if (isInitial) setLoading(true);
        else setIsRefreshing(true);
        
        const startTime = Date.now();
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
            const duration = Date.now() - startTime;
            const delay = Math.max(0, 600 - duration);
            setTimeout(() => {
                setLoading(false);
                setIsRefreshing(false);
            }, delay);
        }
    }, [kind, namespace, name]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && settings.resourceRefreshInterval > 0) {
                load(false);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [load, settings.resourceRefreshInterval]);

    useEffect(() => {
        if (kind && name) {
            load(true);
            if (settings.resourceRefreshInterval > 0) {
                const interval = setInterval(() => {
                    if (document.visibilityState === 'visible') load(false);
                }, settings.resourceRefreshInterval * 1000);
                return () => clearInterval(interval);
            }
        }
    }, [load, kind, name, settings.resourceRefreshInterval]);

    return { data, loading, isRefreshing, error, refresh: () => load(false) };
}
