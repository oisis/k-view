import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Server, Activity, Cpu, Database, Hash,
    ShieldCheck, AlertCircle, Info, RefreshCw, Box
} from 'lucide-react';

// --- Mini Chart Component (SVG) ---
function MiniChart({ data, color, label }) {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data.map(d => d.value), 1);
    const width = 400;
    const height = 60;
    const padding = 2;

    // Calculate points
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d.value / max) * (height - padding * 2)) - padding;
        return `${x},${y}`;
    }).join(' ');

    const gradId = `grad-${label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <div className="flex flex-col gap-1 w-full mt-2">
            <div className="flex justify-between text-xs text-[var(--text-muted)] font-mono">
                <span>{data[0].timestamp}</span>
                <span>{label}: {data[data.length - 1].value.toFixed(2)}%</span>
                <span>{data[data.length - 1].timestamp}</span>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[60px] overflow-visible">
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path
                    d={`M 0,${height} L ${points} L ${width},${height} Z`}
                    fill={`url(#${gradId})`}
                />
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    points={points}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
}

// --- Metric Card Component ---
function MetricCard({ title, value, subValue, icon: Icon, color, children, onClick, valueClassName = "", isCollapsed }) {
    const colorMap = {
        blue: 'text-info bg-info/10 border-info/20',
        green: 'text-success bg-success/10 border-success/20',
        purple: 'text-purple bg-purple/10 border-purple/20',
        orange: 'text-warning bg-warning/10 border-warning/20',
        cyan: 'text-cyan bg-cyan/10 border-cyan/20',
        red: 'text-error bg-error/10 border-error/20',
    };

    const cls = colorMap[color] || colorMap.blue;

    return (
        <div
            onClick={onClick}
            className={`bg-[var(--bg-glass)] glass ${isCollapsed ? 'p-6' : 'p-4'} rounded-2xl border border-[var(--border-color)] ${onClick ? 'cursor-pointer hover:border-[var(--accent)]/50' : ''} transition-all duration-300 group shadow-md hover:shadow-indigo-500/5 relative overflow-hidden`}
        >
            <div className={isCollapsed ? 'mb-5' : 'mb-3'}>
                <p className={`${isCollapsed ? 'text-xs' : 'text-xs'} font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-1.5`}>{title}</p>
                <h3 className={`${isCollapsed ? 'text-4xl' : 'text-3xl'} font-bold text-[var(--text-white)] tracking-tight group-hover:text-[var(--accent)] transition-colors ${valueClassName}`}>{value}</h3>
                {subValue && <p className={`${isCollapsed ? 'text-xs' : 'text-xs'} text-[var(--text-secondary)] mt-1.5 font-medium opacity-80`}>{subValue}</p>}
            </div>
            <div className={`absolute ${isCollapsed ? 'top-4 right-4' : 'top-2 right-2'} p-2 rounded-xl border ${cls} transition-transform group-hover:scale-110 duration-300`}>
                <Icon size={isCollapsed ? 22 : 18} />
            </div>
            {children}
        </div>
    );
}

export default function Dashboard({ isCollapsed }) {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(() => {
        setLoading(true);
        setError(null);
        fetch('/api/cluster/stats')
            .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch stats')))
            .then(data => setStats(data))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-secondary)]">
                <RefreshCw size={32} className="animate-spin text-blue-500" />
                <p className="animate-pulse">Analyzing cluster state...</p>
            </div>
        );
    }

    return (
        <div className={`p-10 ${isCollapsed ? 'max-w-[1800px]' : 'max-w-[1600px]'} mx-auto transition-all duration-500`}>
            {/* Header */}
            <div className="flex items-end justify-between mb-12">
                <div>
                    <h2 className="text-4xl font-extrabold text-[var(--text-white)] tracking-tight">System Overview</h2>
                    <p className="text-[var(--text-secondary)] mt-2 flex items-center gap-2.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_var(--text-success)] opacity-80"></span>
                        Connected as <span className="font-mono text-[var(--accent)] font-bold">{stats?.clusterName || 'Local Cluster'}</span>
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-white)] bg-[var(--bg-card)] border border-[var(--border-color)] px-5 py-3 rounded-xl transition-all hover:bg-[var(--bg-card-hover)] shadow-sm active:scale-95"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh Stats
                </button>
            </div>

            {/* Metrics Server Warning */}
            {stats && !stats.metricsServer && (
                <div className="mb-8 p-4 bg-warning/10 border border-warning/30 text-warning rounded-xl flex items-start gap-3 shadow-lg">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-sm">Metrics Server Missing</p>
                        <p className="text-xs opacity-80 mt-1">
                            Real-time CPU and RAM metrics are unavailable because Metrics Server is not installed in the cluster.
                        </p>
                        <a
                            href="https://github.com/kubernetes-sigs/metrics-server"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 text-xs font-bold underline hover:opacity-80"
                        >
                            View Installation Guide
                        </a>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-8 p-4 bg-error/10 border border-error/30 text-error rounded-xl flex items-center gap-2 shadow-lg">
                    <AlertCircle size={18} />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Stats Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${isCollapsed ? 'gap-6' : 'gap-4'} transition-all duration-500`}>

                {/* Cluster Identity */}
                <MetricCard
                    title="Cluster Platform"
                    value={stats?.clusterName || "K8s Cluster"}
                    subValue={`Version: ${stats?.k8sVersion || '—'}`}
                    icon={ShieldCheck}
                    color="cyan"
                    valueClassName={isCollapsed ? 'text-2xl' : 'text-xl'}
                    onClick={() => navigate('/nodes')}
                    isCollapsed={isCollapsed}
                />

                {/* Nodes */}
                <MetricCard
                    title="Total Nodes"
                    value={stats?.nodeCount || 0}
                    subValue={`${stats?.nodeCountReady || 0} READY NODES`}
                    icon={Server}
                    color="purple"
                    onClick={() => navigate('/nodes')}
                    isCollapsed={isCollapsed}
                />

                {/* Pods Status */}
                <MetricCard
                    title="Active Pods"
                    value={stats?.podCount || 0}
                    subValue={`${stats?.podCountFailed || 0} FAILED / EVICKTED`}
                    icon={Box}
                    color={stats?.podCountFailed > 0 ? "orange" : "green"}
                    onClick={() => navigate('/workloads/pods')}
                    isCollapsed={isCollapsed}
                >
                    <div className="mt-3 flex items-center gap-2">
                        <div className="h-3 flex-1 bg-error/30 rounded-full overflow-hidden relative">
                            <div
                                className={`h-full bg-success rounded-full transition-all duration-500`}
                                style={{ width: stats?.podCount ? `${((stats.podCount - stats.podCountFailed) / stats.podCount) * 100}%` : '0%' }}
                            ></div>
                        </div>
                        <span className="text-xs font-mono text-[var(--text-muted)]">
                            {stats?.podCount ? Math.round(((stats.podCount - stats.podCountFailed) / stats.podCount) * 100) : 0}% Healthy
                        </span>
                    </div>
                </MetricCard>

                {/* Control Plane Health (linked to Nodes status) */}
                <MetricCard
                    title="Control Plane"
                    value={(!stats || stats.nodeCountReady === stats.nodeCount) ? 'Healthy' : 'Not healthy'}
                    subValue="etcd & apiserver status"
                    icon={Activity}
                    color={(!stats || stats.nodeCountReady === stats.nodeCount) ? "green" : "red"}
                    valueClassName={(!stats || stats.nodeCountReady === stats.nodeCount) ? "text-success" : "text-error"}
                    isCollapsed={isCollapsed}
                />

                {/* CPU Usage */}
                <div className={`md:col-span-2 bg-[var(--bg-glass)] glass ${isCollapsed ? 'p-6' : 'p-4'} rounded-2xl border border-[var(--border-color)] shadow-lg hover:border-[var(--accent)]/30 transition-all duration-300 group relative overflow-hidden`}>
                    <div className="mb-5">
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-1.5">Compute Load (CPU)</p>
                        <h3 className={`${isCollapsed ? 'text-4xl' : 'text-3xl'} font-bold transition-colors flex items-baseline gap-2.5 ${(stats?.cpuUsage >= 80) ? 'text-error' : 'text-success'}`}>
                            {stats?.cpuUsage?.toFixed(2) || "0.00"}%
                            <span className={`${isCollapsed ? 'text-sm' : 'text-xs'} text-[var(--text-secondary)] font-medium opacity-60`}>of {stats?.cpuTotal || '—'} cores</span>
                        </h3>
                    </div>
                    <div className={`absolute ${isCollapsed ? 'top-4 right-4' : 'top-2 right-2'} p-2 rounded-xl text-info bg-info/10 border border-info/20 group-hover:scale-110 transition-transform duration-300`}>
                        <Cpu size={isCollapsed ? 22 : 18} />
                    </div>
                    <MiniChart
                        data={stats?.cpuHistory}
                        color={stats?.cpuUsage >= 80 ? "#ef4444" : "#10b981"}
                        label="Load"
                    />
                </div>

                {/* RAM Usage */}
                <div className={`md:col-span-2 bg-[var(--bg-glass)] glass ${isCollapsed ? 'p-6' : 'p-4'} rounded-2xl border border-[var(--border-color)] shadow-lg hover:border-[var(--accent)]/30 transition-all duration-300 group relative overflow-hidden`}>
                    <div className="mb-5">
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-1.5">Memory Pressure (RAM)</p>
                        <h3 className={`${isCollapsed ? 'text-4xl' : 'text-3xl'} font-bold transition-colors flex items-baseline gap-2.5 ${(stats?.ramUsage >= 80) ? 'text-error' : 'text-success'}`}>
                            {stats?.ramUsage?.toFixed(2) || "0.00"}%
                            <span className={`${isCollapsed ? 'text-sm' : 'text-xs'} text-[var(--text-secondary)] font-medium opacity-60`}>of {stats?.ramTotal || '—'}</span>
                        </h3>
                    </div>
                    <div className={`absolute ${isCollapsed ? 'top-4 right-4' : 'top-2 right-2'} p-2 rounded-xl text-purple bg-purple/10 border border-purple/20 group-hover:scale-110 transition-transform duration-300`}>
                        <Database size={isCollapsed ? 22 : 18} />
                    </div>
                    <MiniChart
                        data={stats?.ramHistory}
                        color={stats?.ramUsage >= 80 ? "#ef4444" : "#10b981"}
                        label="Used"
                    />
                </div>

            </div>

            {/* Quick Info Footer */}
            <div className="mt-10 pt-6 border-t border-[var(--border-color)] flex items-center gap-6 justify-center">
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium">
                    <Info size={14} className="text-info/60" />
                    Metrics update every 5 seconds
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] font-medium">
                    <Activity size={14} className="text-success/60" />
                    Cluster Health: Stable
                </div>
            </div>
        </div>
    );
}
