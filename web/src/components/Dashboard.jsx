import React, { useState, useEffect } from 'react';
import { Box, Server, Activity } from 'lucide-react';

export default function Dashboard() {
    const [pods, setPods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/api/pods')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch pods');
                return res.json();
            })
            .then(data => {
                // data could be null if no pods
                setPods(data || []);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8">Loading pods...</div>;
    if (error) return <div className="p-8 text-red-400">Error: {error}</div>;

    return (
        <div className="p-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Dashboard</h2>
                <p className="text-gray-400">Overview of your Kubernetes Pods</p>
            </div>

            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                    <h3 className="font-semibold text-gray-200">Running Pods</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="text-xs text-gray-400 bg-gray-900/50 uppercase">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Namespace</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Age</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pods.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No pods found.</td>
                                </tr>
                            ) : (
                                pods.map((pod, i) => (
                                    <tr key={i} className="border-b border-gray-700 hover:bg-gray-750">
                                        <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                                            <Box size={16} className="text-blue-400" />
                                            {pod.name}
                                        </td>
                                        <td className="px-6 py-4 flex items-center gap-2">
                                            <Server size={16} className="text-gray-500" />
                                            {pod.namespace}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-max ${pod.status === 'Running' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'
                                                }`}>
                                                <Activity size={12} />
                                                {pod.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">{new Date(pod.age).toLocaleString()}</td>
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
