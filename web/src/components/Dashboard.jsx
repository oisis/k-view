import React, { useState, useEffect, useCallback } from 'react';
import { Box, Server, Activity } from 'lucide-react';
import NamespaceSelect from './NamespaceSelect';

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
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-900/40">
                    <h3 className="font-semibold text-gray-200">Running Pods</h3>
                    {namespace && (
                        <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded border border-blue-800 flex items-center gap-1.5">
                            <Server size={12} />
                            {namespace}
                        </span>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="text-xs text-gray-400 bg-gray-900/60 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Namespace</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Age</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 italic">
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
                                    <tr key={i} className="hover:bg-gray-700/30 transition-colors group">
                                        <td className="px-6 py-3 font-medium text-white">
                                            <div className="flex items-center gap-2">
                                                <Box size={14} className="text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
                                                <span className="font-mono text-sm">{pod.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-gray-400 font-medium">
                                            {pod.namespace}
                                        </td>
                                        <td className="px-6 py-3">
                                            <StatusBadge status={pod.status} />
                                        </td>
                                        <td className="px-6 py-3 text-gray-400 text-xs">
                                            {pod.age}
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
