import React, { useState, useEffect } from 'react';
import { Server, Cpu, MemoryStick, CheckCircle, XCircle, Shield, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

function bytesToGiB(str) {
    if (!str) return '?';
    if (str.endsWith('Ki')) return (parseFloat(str) / (1024 * 1024)).toFixed(1) + ' GiB';
    if (str.endsWith('Mi')) return (parseFloat(str) / 1024).toFixed(1) + ' GiB';
    if (str.endsWith('Gi')) return parseFloat(str).toFixed(1) + ' GiB';
    const bytes = parseFloat(str);
    if (!isNaN(bytes)) return (bytes / (1024 ** 3)).toFixed(1) + ' GiB';
    return str;
}

function RoleBadge({ role }) {
    if (role === 'control-plane') {
        return (
            <span className="flex items-center gap-1 text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                <Shield size={10} /> control-plane
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1 text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
            <Layers size={10} /> worker
        </span>
    );
}

function StatusIcon({ status }) {
    if (status === 'Ready') return <CheckCircle size={16} className="text-green-400" />;
    return <XCircle size={16} className="text-red-400" />;
}

function StatCard({ label, value, sub, icon: Icon, color }) {
    return (
        <div className="bg-[var(--bg-glass)] glass border border-[var(--border-color)] rounded-2xl p-5 flex items-start gap-4 shadow-lg">
            <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-2xl font-bold text-[var(--text-white)]">{value}</p>
                <p className="text-sm text-[var(--text-secondary)]">{label}</p>
                {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

export default function Nodes() {
    const [nodes, setNodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/api/nodes')
            .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch nodes')))
            .then(data => setNodes(data || []))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const ready = nodes.filter(n => n.status === 'Ready').length;
    const notReady = nodes.length - ready;
    const controlPlane = nodes.filter(n => n.role === 'control-plane').length;
    const workers = nodes.filter(n => n.role === 'worker').length;

    return (
        <div className="p-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-[var(--text-white)] mb-1">Nodes</h2>
                <p className="text-[var(--text-secondary)] text-sm">
                    {loading ? 'Loading...' : `${nodes.length} node${nodes.length !== 1 ? 's' : ''} in cluster`}
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-400 rounded-lg text-sm">{error}</div>
            )}

            {/* Stats cards */}
            {!loading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total Nodes" value={nodes.length} icon={Server} color="bg-blue-500/10 text-blue-400" />
                    <StatCard label="Ready" value={ready} sub={`${notReady} Not Ready`} icon={CheckCircle} color="bg-green-500/10 text-green-500" />
                    <StatCard label="Control Plane" value={controlPlane} icon={Shield} color="bg-purple-500/10 text-purple-400" />
                    <StatCard label="Workers" value={workers} icon={Layers} color="bg-cyan-500/10 text-cyan-400" />
                </div>
            )}

            {/* Nodes table */}
            <div className="bg-[var(--bg-glass)] glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl">
                <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/30">
                    <h3 className="font-semibold text-[var(--text-secondary)]">Node Details</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-[var(--text-primary)]">
                        <thead className="text-xs text-[var(--text-muted)] bg-[var(--bg-muted)]/60 uppercase tracking-wider border-b border-[var(--border-color)]">
                            <tr>
                                <th className="px-4 py-3">Node</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">CPU</th>
                                <th className="px-4 py-3">Memory</th>
                                <th className="px-4 py-3">Arch</th>
                                <th className="px-4 py-3">Kubelet</th>
                                <th className="px-4 py-3">Runtime</th>
                                <th className="px-4 py-3">Age</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="9" className="px-4 py-8 text-center text-[var(--text-muted)] italic">Loading nodes...</td></tr>
                            ) : nodes.length === 0 ? (
                                <tr><td colSpan="9" className="px-4 py-8 text-center text-[var(--text-muted)]">No nodes found.</td></tr>
                            ) : (
                                nodes.map((node, i) => (
                                    <tr key={i} className="border-b border-[var(--border-color)]/30 hover:bg-[var(--sidebar-hover)]/30 transition-colors text-[var(--text-primary)]">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 font-mono font-medium text-[var(--text-white)]">
                                                <Server size={14} className="text-[var(--text-muted)] shrink-0" />
                                                <Link
                                                    to={`/nodes/-/${node.name}`}
                                                    className="text-blue-400 hover:text-blue-300 transition-colors underline decoration-blue-800/30 underline-offset-4"
                                                >
                                                    {node.name}
                                                </Link>
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] ml-5">{node.os}</div>
                                        </td>
                                        <td className="px-4 py-3"><RoleBadge role={node.role} /></td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <StatusIcon status={node.status} />
                                                <span className={node.status === 'Ready' ? 'text-green-400' : 'text-red-400'}>
                                                    {node.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Cpu size={12} className="text-[var(--text-muted)]" />
                                                <span>{node.cpuCapacity}</span>
                                                <span className="text-[var(--text-muted)] text-xs">/ {node.cpuAllocatable} alloc</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <MemoryStick size={12} className="text-[var(--text-muted)]" />
                                                <span>{bytesToGiB(node.memoryCapacity)}</span>
                                                <span className="text-[var(--text-muted)] text-xs">/ {bytesToGiB(node.memoryAllocatable)} alloc</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[var(--text-muted)] font-mono text-xs">{node.architecture}</td>
                                        <td className="px-4 py-3 text-[var(--text-muted)] font-mono text-xs">{node.kubeletVersion}</td>
                                        <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{node.containerRuntime}</td>
                                        <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{new Date(node.age).toLocaleDateString()}</td>
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
