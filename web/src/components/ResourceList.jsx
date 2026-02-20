import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw } from 'lucide-react';

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
        Running: 'bg-green-900/40 text-green-400 border-green-800',
        Active: 'bg-green-900/40 text-green-400 border-green-800',
        Complete: 'bg-blue-900/40 text-blue-400 border-blue-800',
        Bound: 'bg-blue-900/40 text-blue-400 border-blue-800',
        ClusterIP: 'bg-gray-700 text-gray-300 border-gray-600',
        LoadBalancer: 'bg-cyan-900/40 text-cyan-400 border-cyan-800',
        CrashLoopBackOff: 'bg-red-900/40 text-red-400 border-red-800',
        Failed: 'bg-red-900/40 text-red-400 border-red-800',
        Degraded: 'bg-orange-900/40 text-orange-400 border-orange-800',
        Pending: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
        Suspended: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
    };
    const cls = map[v] || 'bg-gray-700 text-gray-400 border-gray-600';
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
            <Activity size={9} /> {v}
        </span>
    );
}

export default function ResourceList({ kind }) {
    const schema = SCHEMAS[kind] || { title: kind, cols: [{ key: 'name', label: 'Name' }, { key: 'age', label: 'Age' }] };
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = () => {
        setLoading(true);
        setError(null);
        fetch(`/api/resources/${kind}`)
            .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch')))
            .then(data => setItems(data || []))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [kind]);

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{schema.title}</h2>
                    <p className="text-gray-400 text-sm">
                        {loading ? 'Loading...' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <button onClick={load} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 border border-gray-600 px-3 py-2 rounded-lg transition-colors">
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-900/30 border border-red-800 text-red-400 rounded-lg text-sm">{error}</div>
            )}

            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 bg-gray-900/60 uppercase tracking-wider">
                            <tr>
                                {schema.cols.map(col => (
                                    <th key={col.key} className="px-4 py-3 whitespace-nowrap">{col.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={schema.cols.length} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={schema.cols.length} className="px-4 py-8 text-center text-gray-500">No items found.</td></tr>
                            ) : items.map((item, i) => (
                                <tr key={i} className="border-t border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                                    {schema.cols.map(col => {
                                        const val = getVal(item, col.key);
                                        return (
                                            <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                                                {col.badge
                                                    ? <StatusBadge value={val} />
                                                    : col.key === 'name'
                                                        ? <span className="font-mono font-medium text-white">{val}</span>
                                                        : <span className="text-gray-400">{val}</span>
                                                }
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
