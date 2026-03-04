import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import ResourceActionMenu from './ResourceActionMenu';

function parseToMilliCores(str) {
    if (!str || str === '0') return 0;
    if (str.endsWith('m')) return parseFloat(str);
    return parseFloat(str) * 1000;
}

function formatCores(valStr, capStr) {
    const val = parseToMilliCores(valStr);
    const cap = parseToMilliCores(capStr);
    const perc = cap > 0 ? (val / cap) * 100 : 0;

    let display = val.toFixed(2) + 'm';
    if (!valStr.endsWith('m') && val >= 1000) {
        display = (val / 1000).toFixed(2);
    }

    return `${display} (${perc.toFixed(2)}%)`;
}

function parseToBytes(str) {
    if (!str || str === '0') return 0;
    let bytes = parseFloat(str);
    if (str.endsWith('Ki')) bytes *= 1024;
    else if (str.endsWith('Mi')) bytes *= 1024 * 1024;
    else if (str.endsWith('Gi')) bytes *= 1024 * 1024 * 1024;
    else if (str.endsWith('Ti')) bytes *= 1024 * 1024 * 1024 * 1024;
    return bytes;
}

function formatRAM(valStr, capStr) {
    const val = parseToBytes(valStr);
    const cap = parseToBytes(capStr);
    const perc = cap > 0 ? (val / cap) * 100 : 0;

    const mib = val / (1024 * 1024);
    const gib = val / (1024 * 1024 * 1024);

    let display = mib.toFixed(2) + ' MiB';
    if (gib >= 1) display = gib.toFixed(2) + ' GiB';
    else if (valStr.endsWith('Mi')) display = mib.toFixed(2) + ' Mi'; 

    if (valStr.endsWith('Mi')) display = mib.toFixed(2) + 'Mi';
    if (valStr.endsWith('Gi')) display = gib.toFixed(2) + 'Gi';

    return `${display} (${perc.toFixed(2)}%)`;
}

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
    const { icons } = useTheme();
    if (role === 'control-plane') {
        return (
            <span className="flex items-center gap-1 text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                <icons.clusterrole size={12} /> control-plane
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1 text-xs font-semibold text-info bg-info/10 px-2 py-0.5 rounded-full">
            <icons.replicaset size={12} /> worker
        </span>
    );
}

const StatusIcon = ({ status }) => {
    const { icons } = useTheme();
    if (status === 'Ready') return <icons.check_circle size={16} className="text-success" />;
    return <icons.alert size={16} className="text-error" />;
}

function StatCard({ label, value, sub, iconKey, color }) {
    const { icons } = useTheme();
    const Icon = icons[iconKey] || icons.pod;
    return (
        <div className="bg-glass glass border border-border rounded-2xl p-5 flex items-start gap-4 shadow-lg">
            <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-sm text-secondary">{label}</p>
                {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function LabelsCell({ labels }) {
    const [expanded, setExpanded] = React.useState(false);
    const { activeTheme } = useTheme();
    const labelEntries = Object.entries(labels || {}).sort(([a], [b]) => a.localeCompare(b));
    if (labelEntries.length === 0) return <span className="text-text-muted italic">none</span>;

    const visibleLabels = expanded ? labelEntries : labelEntries.slice(0, 2);
    const hasMore = labelEntries.length > 2;
    const hideColor = activeTheme === 'light' ? 'var(--accent)' : 'var(--text-white)';

    return (
        <div className="flex flex-col gap-1 max-w-[250px] overflow-y-hidden mx-auto">
            <div className="flex flex-wrap gap-1 min-w-0 overflow-y-hidden justify-center">
                {visibleLabels.map(([k, v]) => (
                    <span key={k} className="text-xs bg-slate-500/10 px-1 rounded overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide max-w-full inline-block" title={`${k}: ${v}`}>
                        {(k || '').split('/').pop()}: {v}
                    </span>
                ))}
            </div>
            {hasMore && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs font-semibold w-fit transition-colors active:scale-95 mx-auto"
                    style={{ color: expanded ? hideColor : 'var(--accent)' }}
                >
                    {expanded ? 'Hide' : `Show all (${labelEntries.length})`}
                </button>
            )}
        </div>
    );
}

import { useResourceData } from '../hooks/useResourceData';

export default function Nodes() {
    const { icons } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');

    const { items: filteredNodes, rawData: nodes, loading, error, refresh } = useResourceData('/api/nodes', searchTerm);

    const ready = nodes.filter(n => n.status === 'Ready').length;
    const notReady = nodes.length - ready;
    const controlPlane = nodes.filter(n => n.role === 'control-plane').length;
    const workers = nodes.filter(n => n.role === 'worker').length;

    return (
        <div className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-primary mb-1">Nodes</h2>
                    <p className="text-secondary text-sm">
                        {loading ? 'Loading...' : `${filteredNodes.length} node${filteredNodes.length !== 1 ? 's' : ''} shown`}
                        {searchTerm && ` (filtered from ${nodes.length})`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        placeholder="Search nodes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-[var(--bg-input)] border border-border px-3 py-2 rounded-lg text-sm text-[var(--text-input)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors h-10 w-64"
                    />
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-400 rounded-lg text-sm">{error}</div>
            )}

            {!loading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total Nodes" value={nodes.length} iconKey="nodes" color="bg-info/10 text-info" />
                    <StatCard label="Ready" value={ready} sub={`${notReady} Not Ready`} iconKey="check_circle" color="bg-green-500/10 text-green-500" />
                    <StatCard label="Control Plane" value={controlPlane} iconKey="clusterrole" color="bg-purple-500/10 text-purple-400" />
                    <StatCard label="Workers" value={workers} iconKey="replicaset" color="bg-cyan-500/10 text-cyan-400" />
                </div>
            )}

            <div className="glass rounded-2xl border border-border shadow-xl overflow-hidden">
                <div className="p-4 border-b border-border bg-transparent">
                    <h3 className="font-semibold text-secondary">Node Details</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-primary">
                        <thead>
                            <tr>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && filteredNodes.length === 0 ? (
                                <tr><td className="px-4 py-8 text-center text-text-muted italic">Loading nodes...</td></tr>
                            ) : filteredNodes.length === 0 ? (
                                <tr><td className="px-4 py-8 text-center text-text-muted">{searchTerm ? 'No nodes matching search criteria' : 'No nodes found.'}</td></tr>
                            ) : (
                                (filteredNodes || []).map((node, i) => (
                                    <tr key={i} className="border-b border-border hover:bg-[var(--sidebar-hover)]/30 transition-colors text-primary">
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
