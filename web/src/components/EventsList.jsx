import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation, useSettings } from '../SettingsContext';
import { useTheme } from '../ThemeContext';

function NamespaceSelect({ namespaces, selected, onChange }) {
    const { t } = useTranslation();
    return (
        <select
            value={selected || ''}
            onChange={(e) => onChange(e.target.value)}
            className="bg-[var(--bg-input)] border border-[var(--border-color)] px-3 py-2 rounded-lg text-[var(--font-size-sm)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors appearance-none min-w-[150px] font-medium h-10"
        >
            <option value="">{t('all_namespaces') || 'All Namespaces'}</option>
            {namespaces.map(ns => (
                <option key={ns} value={ns}>{ns}</option>
            ))}
        </select>
    );
}

export default function EventsList() {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const { icons } = useTheme();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [namespaces, setNamespaces] = useState([]);
    const [namespace, setNamespace] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'lastSeen', direction: 'desc' });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        let mounted = true;
        fetch('/api/resources/namespaces')
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => {
                if (mounted) setNamespaces(data.map(ns => ns.name) || []);
            })
            .catch(() => { });
        return () => { mounted = false; };
    }, []);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        const qs = namespace && namespace !== '-' ? `?namespace=${encodeURIComponent(namespace)}` : '';
        fetch(`/api/cluster/events${qs}`)
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
    }, [namespace]);

    useEffect(() => {
        load();
        const interval = setInterval(load, settings.resourceRefreshInterval * 1000);
        return () => clearInterval(interval);
    }, [load, settings.resourceRefreshInterval]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, namespace]);

    const getVal = (item, key) => item[key] ?? '—';

    const sortedItems = useMemo(() => {
        const result = [...items];
        if (!sortConfig.key) return result;

        result.sort((a, b) => {
            let aVal = getVal(a, sortConfig.key);
            let bVal = getVal(b, sortConfig.key);

            if (aVal === bVal) return 0;
            if (aVal === '—') return 1;
            if (bVal === '—') return -1;

            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);
            if (!isNaN(aNum) && !isNaN(bNum) && !String(aVal).includes(':') && !String(aVal).includes('-')) {
                return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
            }

            return sortConfig.direction === 'asc'
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal));
        });
        return result;
    }, [items, sortConfig]);

    const cols = [
        { key: 'name', label: 'Name' },
        { key: 'reason', label: 'Reason' },
        { key: 'message', label: 'Message' },
        { key: 'source', label: 'Source' },
        { key: 'object', label: 'Object' },
        { key: 'count', label: 'Count' },
        { key: 'firstSeen', label: 'First Seen' },
        { key: 'lastSeen', label: 'Last Seen' }
    ];

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

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / settings.itemsPerPage));
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * settings.itemsPerPage;
        return filteredItems.slice(start, start + settings.itemsPerPage);
    }, [filteredItems, currentPage, settings.itemsPerPage]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{t('events') || 'Events'}</h2>
                    <p className="text-[var(--text-secondary)] text-sm">
                        {loading ? t('loading') || 'Loading...' : `${filteredItems.length} ${filteredItems.length === 1 ? t('item') || 'item' : t('items') || 'items'}`}
                        {namespace && ` ${t('in_ns') || 'in namespace'} "${namespace}"`}
                        {totalPages > 1 && ` • ${t('page_x_of_y', { current: currentPage, total: totalPages }) || `Page ${currentPage} of ${totalPages}`}`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        placeholder={t('search_placeholder') || 'Search...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-[var(--bg-input)] border border-[var(--border-color)] px-3 py-2 rounded-lg text-[var(--font-size-sm)] text-[var(--text-input)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors h-10 w-64"
                    />
                    <NamespaceSelect
                        namespaces={namespaces}
                        selected={namespace}
                        onChange={setNamespace}
                    />
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-900/30 border border-red-800 text-red-400 rounded-lg text-sm">{error}</div>
            )}

            <div className="glass rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-[var(--font-size-sm)] text-left text-[var(--text-primary)]">
                        <thead className="text-[13px] text-[var(--text-muted)] bg-[var(--bg-sidebar)]/10 uppercase tracking-widest border-b border-[var(--border-color)]">
                            <tr>
                                {cols.map(col => (
                                    <th
                                        key={col.key}
                                        onClick={() => requestSort(col.key)}
                                        className="px-3 py-2.5 whitespace-nowrap cursor-pointer hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-primary)] transition-colors group select-none font-bold"
                                    >
                                        <div className="flex items-center gap-2">
                                            {t(`label_${col.label.toLowerCase().replace(' ', '_')}`) || col.label}
                                            <span className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                                                {sortConfig.key === col.key ? (
                                                    sortConfig.direction === 'asc' ? <icons.chevron_up size={14} /> : <icons.chevron_down size={14} />
                                                ) : (
                                                    <icons.sort size={12} className="opacity-0 group-hover:opacity-100" />
                                                )}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {loading && paginatedItems.length === 0 ? (
                                <tr><td colSpan={cols.length} className="px-6 py-8 text-center text-[var(--text-muted)] italic">{t('loading') || 'Loading...'}</td></tr>
                            ) : paginatedItems.length === 0 ? (
                                <tr><td colSpan={cols.length} className="px-6 py-8 text-center text-[var(--text-muted)]">{t('no_events') || 'No events found.'}</td></tr>
                            ) : paginatedItems.map((item, i) => (
                                <tr key={i} className="border-b border-[var(--border-color)] hover:bg-[var(--sidebar-hover)]/30 transition-colors">
                                    {cols.map(col => {
                                        const val = getVal(item, col.key);
                                        let cellClass = "px-4 py-2 whitespace-nowrap";
                                        let content = <span className="text-[var(--text-secondary)] font-medium">{val}</span>;

                                        if (col.key === 'name') {
                                            content = <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${item.type === 'Warning' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>{String(val)}</span>;
                                        } else if (col.key === 'message') {
                                            content = <span className="text-[var(--text-secondary)] max-w-sm block break-words whitespace-normal leading-tight">{String(val)}</span>;
                                        } else if (col.key === 'reason') {
                                            content = <span className="text-[var(--text-primary)] font-bold">{String(val)}</span>;
                                        } else if (col.key === 'count') {
                                            cellClass = "px-4 py-2 whitespace-nowrap text-center";
                                            content = <span className="text-[var(--text-primary)] font-bold">{String(val)}</span>;
                                        } else if (col.key === 'source' || col.key === 'object' || col.key === 'firstSeen' || col.key === 'lastSeen') {
                                            content = <span className="text-[var(--text-muted)] text-[11px] font-mono">{String(val)}</span>;
                                        }

                                        return <td key={col.key} className={cellClass}>{content}</td>;
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between bg-[var(--bg-glass)] glass rounded-xl border border-[var(--border-color)] px-6 py-4">
                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        {t('showing') || 'Showing'} {Math.min(filteredItems.length, (currentPage - 1) * settings.itemsPerPage + 1)} - {Math.min(filteredItems.length, currentPage * settings.itemsPerPage)} {t('of') || 'of'} {filteredItems.length}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                        >
                            <icons.chevron_left size={18} />
                        </button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((p, i, arr) => (
                                    <React.Fragment key={p}>
                                        {i > 0 && arr[i - 1] !== p - 1 && <span className="text-[var(--text-muted)] px-1">...</span>}
                                        <button
                                            onClick={() => setCurrentPage(p)}
                                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-all active:scale-95
                                                ${currentPage === p
                                                    ? 'bg-[var(--accent)] text-[var(--text-white)] shadow-lg shadow-indigo-500/20'
                                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--accent)]/30'}`}
                                        >
                                            {p}
                                        </button>
                                    </React.Fragment>
                                ))
                            }
                        </div>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                        >
                            <icons.chevron_right size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
