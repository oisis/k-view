import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Server, Activity, ChevronDown, X, Search } from 'lucide-react';

// --- Namespace status badge ---
function StatusBadge({ status }) {
    const styles = {
        Running: 'bg-green-900/40 text-green-400 border-green-800',
        CrashLoopBackOff: 'bg-red-900/40 text-red-400 border-red-800',
        Failed: 'bg-red-900/40 text-red-400 border-red-800',
        Pending: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
        Succeeded: 'bg-blue-900/40 text-blue-400 border-blue-800',
    };
    const cls = styles[status] || 'bg-gray-700 text-gray-400 border-gray-600';
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
            <Activity size={10} />
            {status}
        </span>
    );
}

// --- Searchable namespace dropdown ---
function NamespaceSelect({ namespaces, selected, onChange }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        function handle(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    // Focus input when dropdown opens
    useEffect(() => {
        if (open) inputRef.current?.focus();
        else setQuery('');
    }, [open]);

    const filtered = ['All namespaces', ...namespaces].filter(ns =>
        ns.toLowerCase().includes(query.toLowerCase())
    );

    const selectNs = (ns) => {
        onChange(ns === 'All namespaces' ? '' : ns);
        setOpen(false);
    };

    const displayValue = selected === '' ? 'All namespaces' : selected;

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 hover:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors min-w-[200px] justify-between"
            >
                <span className="flex items-center gap-2">
                    <Server size={14} className="text-gray-400" />
                    <span className="truncate">{displayValue}</span>
                </span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full min-w-[220px] bg-gray-800 border border-gray-600 rounded-lg shadow-xl overflow-hidden">
                    {/* Search input */}
                    <div className="p-2 border-b border-gray-700">
                        <div className="flex items-center gap-2 bg-gray-900 rounded px-2 py-1.5">
                            <Search size={13} className="text-gray-500 shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search namespaces..."
                                className="bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none flex-1 w-full"
                            />
                            {query && (
                                <button onClick={() => setQuery('')}>
                                    <X size={13} className="text-gray-500 hover:text-gray-300" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options list */}
                    <ul className="max-h-52 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <li className="px-4 py-3 text-xs text-gray-500 text-center">No matches</li>
                        ) : (
                            filtered.map(ns => {
                                const value = ns === 'All namespaces' ? '' : ns;
                                const isSelected = selected === value;
                                const isSystem = ['kube-system', 'kube-public', 'kube-node-lease'].includes(ns);
                                return (
                                    <li
                                        key={ns}
                                        onClick={() => selectNs(ns)}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer transition-colors
                      ${isSelected ? 'bg-blue-900/50 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}
                                    >
                                        <Server size={12} className={isSystem ? 'text-purple-400' : 'text-gray-500'} />
                                        <span className="flex-1">{ns}</span>
                                        {isSystem && (
                                            <span className="text-xs text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded">system</span>
                                        )}
                                        {isSelected && <span className="text-blue-400 text-xs">✓</span>}
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

// --- Main Dashboard ---
export default function Dashboard() {
    const [pods, setPods] = useState([]);
    const [namespaces, setNamespaces] = useState([]);
    const [namespace, setNamespace] = useState(''); // '' = all
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch namespaces once on mount
    useEffect(() => {
        fetch('/api/namespaces')
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => setNamespaces(data || []))
            .catch(() => { });
    }, []);

    // Fetch pods whenever selected namespace changes
    const fetchPods = useCallback(() => {
        setLoading(true);
        setError(null);
        const qs = namespace ? `?namespace=${encodeURIComponent(namespace)}` : '';
        fetch(`/api/pods${qs}`)
            .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch pods')))
            .then(data => setPods(data || []))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [namespace]);

    useEffect(() => { fetchPods(); }, [fetchPods]);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Dashboard</h2>
                    <p className="text-gray-400 text-sm">
                        {loading ? 'Loading...' : `${pods.length} pod${pods.length !== 1 ? 's' : ''} found`}
                    </p>
                </div>
                <NamespaceSelect
                    namespaces={namespaces}
                    selected={namespace}
                    onChange={setNamespace}
                />
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-400 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Pods table */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-200">Running Pods</h3>
                    {namespace && (
                        <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded border border-blue-800">
                            {namespace}
                        </span>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="text-xs text-gray-400 bg-gray-900/50 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Namespace</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Age</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                        Loading pods...
                                    </td>
                                </tr>
                            ) : pods.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                        No pods found in{namespace ? ` "${namespace}"` : ' any namespace'}.
                                    </td>
                                </tr>
                            ) : (
                                pods.map((pod, i) => (
                                    <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-3 font-medium text-white">
                                            <div className="flex items-center gap-2">
                                                <Box size={14} className="text-blue-400 shrink-0" />
                                                <span className="font-mono text-sm">{pod.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="flex items-center gap-1.5 text-gray-400">
                                                <Server size={13} />
                                                {pod.namespace}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <StatusBadge status={pod.status} />
                                        </td>
                                        <td className="px-6 py-3 text-gray-400 text-xs">
                                            {new Date(pod.age).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
