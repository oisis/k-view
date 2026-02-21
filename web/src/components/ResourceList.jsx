import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Activity, RefreshCw, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import NamespaceSelect from './NamespaceSelect';
import NetworkTraceModal from './NetworkTraceModal';

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
            { key: 'extra.schedule', label: 'Schedule' },
            { key: 'extra.last-schedule', label: 'Last Run' },
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
    const v = String(value);
    const map = {
        Running: 'bg-green-500/15 text-green-400',
        Active: 'bg-green-500/15 text-green-400',
        Complete: 'bg-blue-500/15 text-blue-400',
        Bound: 'bg-blue-500/15 text-blue-400',
        ClusterIP: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]',
        LoadBalancer: 'bg-cyan-500/15 text-cyan-400',
        CrashLoopBackOff: 'bg-red-500/15 text-red-500',
        Failed: 'bg-red-500/15 text-red-500',
        Degraded: 'bg-orange-500/15 text-orange-500',
        Pending: 'bg-yellow-500/15 text-yellow-500',
        Suspended: 'bg-yellow-500/15 text-yellow-500',
        Available: 'bg-teal-500/15 text-teal-400',
        Released: 'bg-orange-500/15 text-orange-500',
        Default: 'bg-blue-500/15 text-blue-400',
    };
    const cls = map[v] || 'bg-[var(--bg-muted)] text-[var(--text-secondary)]';
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
            <Activity size={9} /> {v}
        </span>
    );
}

export default function ResourceList({ kind }) {
    const schema = SCHEMAS[kind] || { title: kind, cols: [{ key: 'name', label: 'Name' }, { key: 'age', label: 'Age' }] };
    const [items, setItems] = useState([]);
    const [namespaces, setNamespaces] = useState([]);
    const [namespace, setNamespace] = useState(localStorage.getItem('kview-selected-namespace') || '');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [traceTarget, setTraceTarget] = useState(null); // { kind, namespace, name }

    // Persist namespace
    useEffect(() => {
        localStorage.setItem('kview-selected-namespace', namespace);
    }, [namespace]);

    // Sorting state
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

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
            .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch')))
            .then(data => setItems(data || []))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [kind, namespace]);

    useEffect(() => { load(); }, [load]);

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
                    <h2 className="text-2xl font-bold text-[var(--text-white)] mb-1">{schema.title}</h2>
                    <p className="text-[var(--text-secondary)] text-sm">
                        {loading ? 'Loading...' : `${sortedItems.length} item${sortedItems.length !== 1 ? 's' : ''}`}
                        {namespace && ` in "${namespace}"`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isNamespaced && (
                        <NamespaceSelect
                            namespaces={namespaces}
                            selected={namespace}
                            onChange={setNamespace}
                        />
                    )}
                    <button onClick={load} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-white)] bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-2 rounded-lg transition-colors h-10">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-900/30 border border-red-800 text-red-400 rounded-lg text-sm">{error}</div>
            )}

            <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-[var(--text-primary)]">
                        <thead className="text-xs text-[var(--text-muted)] bg-[var(--bg-muted)]/60 uppercase tracking-wider border-b border-[var(--border-color)]">
                            <tr>
                                {schema.cols.map(col => (
                                    <th
                                        key={col.key}
                                        onClick={() => requestSort(col.key)}
                                        className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-white)] transition-colors group select-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.label}
                                            <span className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                                                {sortConfig.key === col.key ? (
                                                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                                ) : (
                                                    <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100" />
                                                )}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                                {supportsTrace && <th className="px-6 py-4 whitespace-nowrap w-20"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-muted)]">
                            {loading && sortedItems.length === 0 ? (
                                <tr><td colSpan={schema.cols.length} className="px-6 py-8 text-center text-[var(--text-muted)] italic">Loading...</td></tr>
                            ) : sortedItems.length === 0 ? (
                                <tr><td colSpan={schema.cols.length} className="px-6 py-8 text-center text-[var(--text-muted)]">No {kind.replace(/-/g, ' ')} found.</td></tr>
                            ) : sortedItems.map((item, i) => (
                                <tr key={i} className="hover:bg-[var(--sidebar-hover)] transition-colors">
                                    {schema.cols.map(col => {
                                        const val = getVal(item, col.key);
                                        return (
                                            <td key={col.key} className="px-6 py-3 whitespace-nowrap">
                                                {col.badge
                                                    ? <StatusBadge value={val} />
                                                    : col.key === 'name'
                                                        ? (
                                                            <Link
                                                                to={`/${kind}/${item.namespace || '-'}/${val}`}
                                                                className="font-mono font-medium text-blue-400 hover:text-blue-300 transition-colors underline decoration-blue-800/30 underline-offset-4"
                                                            >
                                                                {val}
                                                            </Link>
                                                        )
                                                        : <span className="text-[var(--text-secondary)]">{val}</span>
                                                }
                                            </td>
                                        );
                                    })}
                                    {supportsTrace && (
                                        <td className="px-6 py-3 whitespace-nowrap text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setTraceTarget({ kind: kind.replace(/e?s$/, ''), namespace: item.namespace || '', name: item.name }); }}
                                                className="text-blue-400/70 hover:text-blue-300 p-1.5 hover:bg-blue-900/30 rounded inline-flex"
                                                title="Visual Trace"
                                            >
                                                <Activity size={16} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <NetworkTraceModal
                isOpen={!!traceTarget}
                onClose={() => setTraceTarget(null)}
                kind={traceTarget?.kind}
                namespace={traceTarget?.namespace}
                name={traceTarget?.name}
            />
        </div>
    );
}
