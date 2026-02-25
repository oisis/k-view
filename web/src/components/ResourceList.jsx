import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings, useTranslation } from '../SettingsContext';
import { useTheme } from '../ThemeContext';
import ResourceActionMenu from './ResourceActionMenu';
import NamespaceSelect from './NamespaceSelect';
import CreateResourceModal from './CreateResourceModal';

// Column schema per resource kind
const SCHEMAS = {
    pods: {
        title: 'Pods',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'status', label: 'Status', badge: true },
            { key: 'extra.ready', label: 'Ready' },
            { key: 'extra.restarts', label: 'Restarts' },
            { key: 'age', label: 'Age' },
        ],
    },
    deployments: {
        title: 'Deployments',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'extra.ready', label: 'Ready' },
            { key: 'extra.up-to-date', label: 'Up-to-date' },
            { key: 'extra.available', label: 'Available' },
            { key: 'status', label: 'Status', badge: true },
            { key: 'age', label: 'Age' },
        ],
    },
    statefulsets: {
        title: 'StatefulSets',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'extra.ready', label: 'Ready' },
            { key: 'extra.replicas', label: 'Replicas' },
            { key: 'status', label: 'Status', badge: true },
            { key: 'age', label: 'Age' },
        ],
    },
    daemonsets: {
        title: 'DaemonSets',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'extra.desired', label: 'Desired' },
            { key: 'extra.ready', label: 'Ready' },
            { key: 'extra.available', label: 'Available' },
            { key: 'status', label: 'Status', badge: true },
            { key: 'age', label: 'Age' },
        ],
    },
    jobs: {
        title: 'Jobs',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'extra.completions', label: 'Completions' },
            { key: 'extra.duration', label: 'Duration' },
            { key: 'status', label: 'Status', badge: true },
            { key: 'age', label: 'Age' },
        ],
    },
    cronjobs: {
        title: 'CronJobs',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'extra.images', label: 'Images' },
            { key: 'extra.labels', label: 'Labels' },
            { key: 'extra.schedule', label: 'Schedule' },
            { key: 'extra.suspend', label: 'Suspend' },
            { key: 'extra.active', label: 'Active' },
            { key: 'extra.last-schedule', label: 'Last Run' },
            { key: 'age', label: 'Age' },
        ],
    },
    replicasets: {
        title: 'Replica Sets',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'extra.desired', label: 'Desired' },
            { key: 'extra.current', label: 'Current' },
            { key: 'extra.ready', label: 'Ready' },
            { key: 'status', label: 'Status', badge: true },
            { key: 'age', label: 'Age' },
        ],
    },
    replicationcontrollers: {
        title: 'Replication Controllers',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'extra.desired', label: 'Desired' },
            { key: 'extra.current', label: 'Current' },
            { key: 'extra.ready', label: 'Ready' },
            { key: 'status', label: 'Status', badge: true },
            { key: 'age', label: 'Age' },
        ],
    },
    services: {
        title: 'Services',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'status', label: 'Type', badge: true },
            { key: 'extra.cluster-ip', label: 'Cluster IP' },
            { key: 'extra.ports', label: 'Ports' },
            { key: 'age', label: 'Age' },
        ],
    },
    ingresses: {
        title: 'Ingresses',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'extra.class', label: 'Class' },
            { key: 'extra.hosts', label: 'Hosts' },
            { key: 'extra.address', label: 'Address' },
            { key: 'status', label: 'Status', badge: true },
            { key: 'age', label: 'Age' },
        ],
    },
    'ingress-classes': {
        title: 'Ingress Classes',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'extra.controller', label: 'Controller' },
            { key: 'status', label: 'Default', badge: true },
            { key: 'age', label: 'Age' },
        ],
    },
    configmaps: {
        title: 'ConfigMaps',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'extra.data', label: 'Data Count' },
            { key: 'age', label: 'Age' },
        ],
    },
    secrets: {
        title: 'Secrets',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'extra.type', label: 'Type' },
            { key: 'extra.data', label: 'Data Count' },
            { key: 'age', label: 'Age' },
        ],
    },
    pvcs: {
        title: 'PersistentVolumeClaims',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'status', label: 'Status', badge: true },
            { key: 'extra.capacity', label: 'Capacity' },
            { key: 'extra.access-mode', label: 'Access Mode' },
            { key: 'extra.storage-class', label: 'Storage Class' },
            { key: 'age', label: 'Age' },
        ],
    },
    pvs: {
        title: 'Persistent Volumes',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'status', label: 'Status', badge: true },
            { key: 'extra.capacity', label: 'Capacity' },
            { key: 'extra.access-mode', label: 'Access Mode' },
            { key: 'extra.reclaim-policy', label: 'Reclaim Policy' },
            { key: 'extra.storage-class', label: 'Storage Class' },
            { key: 'extra.claim', label: 'Claim' },
            { key: 'age', label: 'Age' },
        ],
    },
    'storage-classes': {
        title: 'Storage Classes',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'status', label: 'Is Default', badge: true },
            { key: 'extra.provisioner', label: 'Provisioner' },
            { key: 'extra.reclaim-policy', label: 'Reclaim Policy' },
            { key: 'extra.volume-binding-mode', label: 'Binding Mode' },
            { key: 'age', label: 'Age' },
        ],
    },
    'cluster-role-bindings': {
        title: 'Cluster Role Bindings',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'extra.role', label: 'Role' },
            { key: 'extra.subjects', label: 'Subjects' },
            { key: 'age', label: 'Age' },
        ],
    },
    'cluster-roles': {
        title: 'Cluster Roles',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'extra.rules', label: 'Rules (summary)' },
            { key: 'age', label: 'Age' },
        ],
    },
    events: {
        title: 'Events',
        cols: [
            { key: 'extra.last-seen', label: 'Last Seen' },
            { key: 'extra.type', label: 'Type', badge: true },
            { key: 'extra.reason', label: 'Reason' },
            { key: 'extra.object', label: 'Object' },
            { key: 'extra.message', label: 'Message' },
        ],
    },
    namespaces: {
        title: 'Namespaces',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'status', label: 'Status', badge: true },
            { key: 'age', label: 'Age' },
        ],
    },
    'network-policies': {
        title: 'Network Policies',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'extra.pod-selector', label: 'Pod Selector' },
            { key: 'extra.policy-types', label: 'Policy Types' },
            { key: 'age', label: 'Age' },
        ],
    },
    'role-bindings': {
        title: 'Role Bindings',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'extra.role', label: 'Role' },
            { key: 'extra.subjects', label: 'Subjects' },
            { key: 'age', label: 'Age' },
        ],
    },
    roles: {
        title: 'Roles',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'extra.rules', label: 'Rules (summary)' },
            { key: 'age', label: 'Age' },
        ],
    },
    'service-accounts': {
        title: 'Service Accounts',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'namespace', label: 'Namespace' },
            { key: 'extra.secrets', label: 'Secrets' },
            { key: 'age', label: 'Age' },
        ],
    },
    crds: {
        title: 'Custom Resource Definitions',
        cols: [
            { key: 'name', label: 'Name' },
            { key: 'extra.group', label: 'Group' },
            { key: 'extra.version', label: 'Version' },
            { key: 'extra.scope', label: 'Scope' },
            { key: 'status', label: 'Status', badge: true },
            { key: 'age', label: 'Age' },
        ],
    },
};

// Get a possibly-nested value like "extra.ready"
function getVal(item, key) {
    if (key.startsWith('extra.')) {
        return item.extra?.[key.slice(6)] ?? '—';
    }
    return item[key] ?? '—';
}

function StatusBadge({ value }) {
    const { t } = useTranslation();
    const v = String(value);
    const translatedValue = t(v.toLowerCase()) || v;
    const map = {
        Normal: 'bg-info/10 text-black border-info',
        Warning: 'bg-warning/10 text-warning border-warning/20',
        Running: 'bg-success/10 text-success border-success/20',
        Active: 'bg-success/10 text-success border-success/20',
        Complete: 'bg-purple/10 text-purple border-purple/20',
        Bound: 'bg-purple/10 text-purple border-purple/20',
        ClusterIP: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        LoadBalancer: 'bg-cyan/10 text-cyan border-cyan/20',
        CrashLoopBackOff: 'bg-error/10 text-error border-error/20',
        Failed: 'bg-error/10 text-error border-error/20',
        Degraded: 'bg-warning/10 text-warning border-warning/20',
        Pending: 'bg-warning/10 text-warning border-warning/20',
        Suspended: 'bg-warning/10 text-warning border-warning/20',
        Available: 'bg-cyan/10 text-cyan border-cyan/20',
        Released: 'bg-warning/10 text-warning border-warning/20',
        Default: 'bg-purple/10 text-purple border-purple/20',
    };
    const cls = map[v] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${cls}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${cls.split(' ')[1].replace('text-', 'bg-')}`}></div>
            {translatedValue}
        </span>
    );
}

function ExpandableCell({ value, type }) {
    const [expanded, setExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);

    if (!value || value === '—') return <span className="text-[var(--text-muted)]">—</span>;

    const items = typeof value === 'string' ? value.split(',').map(s => s.trim()) : (Array.isArray(value) ? value : [String(value)]);
    if (items.length === 0) return <span className="text-[var(--text-muted)]">—</span>;

    const handleMouseEnter = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top - 10,
                left: rect.left
            });
        }
        setIsHovered(true);
    };

    return (
        <div className="relative group/expandable">
            {!expanded ? (
                <button
                    ref={buttonRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                    className="text-[13px] font-bold text-[var(--accent)] hover:text-[var(--text-primary)] bg-[var(--accent)]/10 px-2 py-0.5 rounded transition-all flex items-center gap-1 active:scale-95"
                >
                    Show all ({items.length})
                </button>
            ) : (
                <div className="flex flex-col gap-1 py-1 max-w-[300px]">
                    {items.map((it, idx) => (
                        <div key={idx} className="text-[12px] font-mono bg-[var(--bg-sidebar)]/50 px-2 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)] truncate" title={it}>
                            {it}
                        </div>
                    ))}
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                        className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] mt-1 text-left px-1 underline"
                    >
                        Hide
                    </button>
                </div>
            )}

            {isHovered && !expanded && createPortal(
                <div 
                    style={{ 
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        transform: 'translateY(-100%)',
                        zIndex: 9999
                    }}
                    className="mb-2 bg-[var(--bg-tooltip)] border border-[var(--border-tooltip)] rounded-lg shadow-2xl p-3 min-w-[240px] pointer-events-none glass animate-in fade-in zoom-in duration-200 backdrop-blur-xl"
                >
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-2 border-b border-[var(--border-tooltip)] pb-1">
                        {type === 'labels' ? 'Labels' : 'Images'}
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-2">
                        {items.map((it, idx) => (
                            <div key={idx} className="text-[12px] font-mono text-[var(--text-tooltip)] break-all leading-tight">
                                {it}
                            </div>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

function ScheduleCell({ value, nextRun }) {
    const [isHovered, setIsHovered] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const ref = useRef(null);

    if (!value || value === '—') return <span className="text-[var(--text-muted)]">—</span>;

    const handleMouseEnter = () => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setCoords({ top: rect.top - 10, left: rect.left });
        }
        setIsHovered(true);
    };

    return (
        <div className="relative inline-block">
            <span
                ref={ref}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setIsHovered(false)}
                className="text-[13px] font-mono text-[var(--accent)] cursor-help hover:underline decoration-dotted decoration-[var(--accent)]/40 underline-offset-4"
            >
                {value}
            </span>

            {isHovered && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        transform: 'translateY(-100%)',
                        zIndex: 9999
                    }}
                    className="mb-2 bg-[var(--bg-tooltip)] border border-[var(--border-tooltip)] rounded-lg shadow-2xl p-3 min-w-[200px] pointer-events-none glass animate-in fade-in zoom-in duration-200 backdrop-blur-xl"
                >
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-2 border-b border-[var(--border-tooltip)] pb-1">
                        Next Run
                    </div>
                    <div className="text-[13px] font-bold text-[var(--text-tooltip)] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        {nextRun || 'Calculating...'}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

export default function ResourceList({ kind }) {
    const { settings } = useSettings();
    const { t } = useTranslation();
    const { icons } = useTheme();
    const schema = SCHEMAS[kind] || { title: kind, cols: [{ key: 'name', label: 'Name' }, { key: 'age', label: 'Age' }] };
    const [items, setItems] = useState([]);
    const [namespaces, setNamespaces] = useState([]);
    const [user, setUser] = useState(null);
    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.ok ? r.json() : null)
            .then(d => setUser(d))
            .catch(() => { });
    }, []);

    const scope = user?.email || 'anonymous';
    const nsKey = `kview-selected-namespace-${scope}`;

    const [namespace, setNamespace] = useState(() => {
        const saved = localStorage.getItem(nsKey);
        if (saved !== null) return saved;
        return settings.defaultNamespace;
    });

    // Update namespace if scope changes and no previous manual selection
    useEffect(() => {
        const saved = localStorage.getItem(nsKey);
        if (saved === null) {
            setNamespace(settings.defaultNamespace);
        } else {
            setNamespace(saved);
        }
    }, [nsKey, settings.defaultNamespace]);

    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const navigate = useNavigate();

    const getLabel = useCallback((label) => {
        const key = `label_${label.toLowerCase().replace(/ /g, '_').replace(/-/g, '_')}`;
        const translated = t(key);
        return translated !== key ? translated : label;
    }, [t]);

    // Persist namespace
    useEffect(() => {
        if (namespace !== undefined) {
            localStorage.setItem(nsKey, namespace);
        }
    }, [namespace, nsKey]);

    // Sorting state
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch namespaces on mount
    useEffect(() => {
        fetch('/api/namespaces')
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => setNamespaces(data || []))
            .catch(() => { });
    }, []);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        const qs = namespace ? `?namespace=${encodeURIComponent(namespace)}` : '';
        fetch(`/api/resources/${kind}${qs}`)
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
    }, [kind, namespace]);

        useEffect(() => {
            load();
            const interval = setInterval(load, 5000);
            return () => clearInterval(interval);
        }, [load]);
    
        const handleCreated = () => {
        load();
        setIsCreateModalOpen(false);
    };

    useEffect(() => {
        const interval = setInterval(load, settings.resourceRefreshInterval * 1000);
        return () => clearInterval(interval);
    }, [load, settings.resourceRefreshInterval]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, namespace, kind]);

    // Sorting logic
    const sortedItems = useMemo(() => {
        const result = [...items];
        if (!sortConfig.key) return result;

        result.sort((a, b) => {
            let aVal = getVal(a, sortConfig.key);
            let bVal = getVal(b, sortConfig.key);

            // Special handling for Age or duration (convert to numeric if possible)
            // For now, simple string/null comparison
            if (aVal === bVal) return 0;
            if (aVal === '—') return 1;
            if (bVal === '—') return -1;

            // Try to compare as numbers if they look like it
            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);
            if (!isNaN(aNum) && !isNaN(bNum) && !aVal.includes(':') && !aVal.includes('-')) {
                return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
            }

            return sortConfig.direction === 'asc'
                ? aVal.toString().localeCompare(bVal.toString())
                : bVal.toString().localeCompare(aVal.toString());
        });
        return result;
    }, [items, sortConfig]);

    const filteredItems = useMemo(() => {
        if (!searchTerm) return sortedItems;
        const lowercasedTerm = searchTerm.toLowerCase();
        return sortedItems.filter(item => {
            return schema.cols.some(col => {
                const val = getVal(item, col.key);
                return String(val).toLowerCase().includes(lowercasedTerm);
            });
        });
    }, [sortedItems, searchTerm, schema.cols]);

    const totalPages = Math.ceil(filteredItems.length / settings.itemsPerPage);
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * settings.itemsPerPage;
        return filteredItems.slice(start, start + settings.itemsPerPage);
    }, [filteredItems, currentPage, settings.itemsPerPage]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Only show namespace selector for namespaced resources
    const isNamespaced = schema.cols.some(col => col.key === 'namespace');
    const supportsTrace = kind === 'ingresses' || kind === 'services' || kind === 'pods';

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{t(kind) || schema.title}</h2>
                    <p className="text-[var(--text-secondary)] text-sm">
                        {loading ? t('loading') : `${filteredItems.length} ${filteredItems.length === 1 ? t('item') : t('items')}`}
                        {namespace && ` ${t('in_ns')} "${namespace}"`}
                        {totalPages > 1 && ` • ${t('page_x_of_y', { current: currentPage, total: totalPages })}`}
                    </p>
                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        placeholder={t('search_placeholder')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-[var(--bg-input)] border border-[var(--border-color)] px-3 py-2 rounded-lg text-[var(--font-size-sm)] text-[var(--text-input)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors h-10 w-64"
                                    />
                                    {isNamespaced && (                        <NamespaceSelect
                            namespaces={namespaces}
                            selected={namespace}
                            onChange={setNamespace}
                        />
                    )}
                </div>
            </div>

            <CreateResourceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={handleCreated}
                initialKind={kind}
                namespaces={namespaces}
            />

            {error && (
                <div className="mb-4 p-4 bg-red-900/30 border border-red-800 text-red-400 rounded-lg text-sm">{error}</div>
            )}

            <div className="bg-[var(--bg-glass)] glass rounded-2xl border border-[var(--border-color)] shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-[var(--font-size-sm)] text-left text-[var(--text-primary)]">
                        <thead className="text-[13px] text-[var(--text-muted)] bg-[var(--bg-sidebar)]/50 uppercase tracking-widest border-b border-[var(--border-color)]">
                            <tr>
                                {schema.cols.map(col => (
                                    <th
                                        key={col.key}
                                        onClick={() => requestSort(col.key)}
                                        className={`px-3 py-2.5 whitespace-nowrap cursor-pointer hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-primary)] transition-colors group select-none font-bold ${col.key === 'extra.active' ? 'w-20 text-center' : ''}`}
                                    >
                                        <div className={`flex items-center gap-2 ${col.key === 'extra.active' ? 'justify-center' : ''}`}>
                                            {getLabel(col.label)}
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
                                {supportsTrace && <th className="px-3 py-2.5 whitespace-nowrap w-10"></th>}
                                <th className="px-3 py-2.5 whitespace-nowrap w-20 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {loading && paginatedItems.length === 0 ? (
                                <tr><td colSpan={schema.cols.length + (supportsTrace ? 2 : 1)} className="px-6 py-8 text-center text-[var(--text-muted)] italic">{t('loading')}</td></tr>
                            ) : paginatedItems.length === 0 ? (
                                <tr><td colSpan={schema.cols.length + (supportsTrace ? 2 : 1)} className="px-6 py-8 text-center text-[var(--text-muted)]">{t('no_resources_found', { kind: t(kind) || kind.replace(/-/g, ' ') })}</td></tr>
                            ) : paginatedItems.map((item, i) => (
                                <tr key={i} className="border-b border-[var(--border-color)] hover:bg-[var(--sidebar-hover)]/30 transition-colors">
                                        {schema.cols.map(col => {
                                            const val = getVal(item, col.key);
                                            
                                            // Conditional rendering based on column key
                                            let content;
                                            let cellClass = "px-3 py-1.5 whitespace-nowrap";

                                            if (col.key === 'extra.labels' || col.key === 'extra.images') {
                                                content = <ExpandableCell value={val} type={col.key === 'extra.labels' ? 'labels' : 'images'} />;
                                            } else if (col.key === 'extra.schedule') {
                                                content = <ScheduleCell value={val} nextRun={item.extra?.['next-run']} />;
                                            } else if (col.key === 'extra.active') {
                                                cellClass = "px-3 py-1.5 whitespace-nowrap w-20 text-center";
                                                content = <span className="text-[var(--text-primary)] font-bold">{val}</span>;
                                            } else if (col.badge) {
                                                content = <StatusBadge value={val} />;
                                            } else if (col.key === 'name') {
                                                content = (
                                                    <Link
                                                        to={`/${kind}/${item.namespace || '-'}/${val}`}
                                                        className="font-bold text-[var(--accent)] hover:text-[var(--text-primary)] transition-colors"
                                                    >
                                                        {val}
                                                    </Link>
                                                );
                                            } else if (col.key === 'namespace' && val !== '-') {
                                                content = (
                                                    <Link
                                                        to={`/namespaces/-/${val}`}
                                                        className="text-info hover:underline"
                                                    >
                                                        {val}
                                                    </Link>
                                                );
                                            } else {
                                                content = <span className="text-[var(--text-secondary)] font-medium">{val}</span>;
                                            }

                                            return (
                                                <td key={col.key} className={cellClass}>
                                                    {content}
                                                </td>
                                            );
                                        })}
                                    {supportsTrace && (
                                        <td className="px-4 py-2 whitespace-nowrap text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/${kind}/${item.namespace || '-'}/${item.name}?tab=trace`);
                                                }}
                                                className="text-info/70 hover:text-info p-1.5 hover:bg-info/10 rounded inline-flex transition-colors"
                                                title="Visual Trace"
                                            >
                                                <icons.activity size={16} />
                                            </button>
                                        </td>
                                    )}
                                    <td className="px-4 py-2 whitespace-nowrap text-right">
                                        <ResourceActionMenu
                                            kind={kind}
                                            namespace={item.namespace}
                                            name={item.name}
                                            onRefresh={load}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between bg-[var(--bg-glass)] glass rounded-xl border border-[var(--border-color)] px-6 py-4">
                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        {t('showing')} {Math.min(filteredItems.length, (currentPage - 1) * settings.itemsPerPage + 1)} - {Math.min(filteredItems.length, currentPage * settings.itemsPerPage)} {t('of')} {filteredItems.length}
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
