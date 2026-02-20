import React, { useState, useEffect, useCallback } from 'react';
import {
    Server, Activity, Cpu, Database, Hash,
    ShieldCheck, AlertCircle, Info, RefreshCw, Box
} from 'lucide-react';

// --- Mini Chart Component (SVG) ---
function MiniChart({ data, color, label }) {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data.map(d => d.value), 1);
    const width = 200;
    const height = 40;
    const padding = 2;

    // Calculate points
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d.value / max) * (height - padding * 2)) - padding;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="flex flex-col gap-1 w-full mt-2">
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>{data[0].timestamp}</span>
                <span>{label}: {data[data.length - 1].value}%</span>
                <span>{data[data.length - 1].timestamp}</span>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10 overflow-visible">
                <defs>
                    <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path
                    d={`M 0,${height} L ${points} L ${width},${height} Z`}
                    fill={`url(#grad-${color})`}
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
function MetricCard({ title, value, subValue, icon: Icon, color, children }) {
    const colorMap = {
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        green: 'text-green-400 bg-green-500/10 border-green-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        red: 'text-red-400 bg-red-500/10 border-red-500/20',
    };

    const cls = colorMap[color] || colorMap.blue;

    return (
        <div className={`bg-gray-800/40 backdrop-blur-sm p-5 rounded-xl border border-gray-700 hover:border-gray-600 transition-all group shadow-lg`}>
            <div className="flex items-start justify-between mb-2">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">{value}</h3>
                    {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
                </div>
                <div className={`p-2 rounded-lg ${cls}`}>
                    <Icon size={20} />
                </div>
            </div>
            {children}
        </div>
    );
}

export default function Dashboard() {
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
    }, [fetchStats]);

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
                <RefreshCw size={32} className="animate-spin text-blue-500" />
                <p className="animate-pulse">Analyzing cluster state...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">System Overview</h2>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Connected to <span className="font-mono text-blue-300">{stats?.clusterName || 'Local Cluster'}</span>
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg transition-all hover:bg-gray-700 h-10 shadow-sm"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh Stats
                </button>
            </div>

            {/* Metrics Server Warning */}
            {stats && !stats.metricsServer && (
                <div className="mb-8 p-4 bg-orange-900/20 border border-orange-800/50 text-orange-400 rounded-xl flex items-start gap-3 shadow-lg">
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
                            className="inline-block mt-2 text-[10px] font-bold underline hover:text-orange-300"
                        >
                            View Installation Guide
                        </a>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-8 p-4 bg-red-900/20 border border-red-800/50 text-red-400 rounded-xl flex items-center gap-2 shadow-lg">
                    <AlertCircle size={18} />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                {/* Cluster Identity */}
                <MetricCard
                    title="Cluster Platform"
                    value={stats?.clusterName || "K8s Cluster"}
                    subValue={`Version: ${stats?.k8sVersion || '—'}`}
                    icon={ShieldCheck}
                    color="cyan"
                />

                {/* Nodes */}
                <MetricCard
                    title="Total Nodes"
                    value={stats?.nodeCount || 0}
                    subValue="Available Infrastracture"
                    icon={Server}
                    color="purple"
                />

                {/* Pods Status */}
                <MetricCard
                    title="Active Pods"
                    value={stats?.podCount || 0}
                    subValue={`${stats?.podCountFailed || 0} FAILED / EVICKTED`}
                    icon={Box}
                    color={stats?.podCountFailed > 0 ? "orange" : "green"}
                >
                    <div className="mt-3 flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-green-500 rounded-full`}
                                style={{ width: stats?.podCount ? `${((stats.podCount - stats.podCountFailed) / stats.podCount) * 100}%` : '0%' }}
                            ></div>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500">
                            {stats?.podCount ? Math.round(((stats.podCount - stats.podCountFailed) / stats.podCount) * 100) : 0}% Healthy
                        </span>
                    </div>
                </MetricCard>

                {/* ETCD Health */}
                <MetricCard
                    title="Control Plane"
                    value={stats?.etcdHealth || 'Healthy'}
                    subValue="etcd & apiserver status"
                    icon={Activity}
                    color="green"
                />

                {/* CPU Usage */}
                <div className="md:col-span-2 bg-gray-800/40 backdrop-blur-sm p-5 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Compute Load (CPU)</p>
                            <h3 className="text-2xl font-bold text-white flex items-baseline gap-2">
                                {stats?.cpuUsage || 0}%
                                <span className="text-xs text-gray-500 font-normal">of {stats?.cpuTotal || '—'}</span>
                            </h3>
                        </div>
                        <div className="p-2 rounded-lg text-blue-400 bg-blue-500/10 border border-blue-500/20">
                            <Cpu size={20} />
                        </div>
                    </div>
                    <MiniChart data={stats?.cpuHistory} color="#60a5fa" label="Load" />
                </div>

                {/* RAM Usage */}
                <div className="md:col-span-2 bg-gray-800/40 backdrop-blur-sm p-5 rounded-xl border border-gray-700 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Memory Pressure (RAM)</p>
                            <h3 className="text-2xl font-bold text-white flex items-baseline gap-2">
                                {stats?.ramUsage || 0}%
                                <span className="text-xs text-gray-500 font-normal">of {stats?.ramTotal || '—'}</span>
                            </h3>
                        </div>
                        <div className="p-2 rounded-lg text-purple-400 bg-purple-500/10 border border-purple-500/20">
                            <Database size={20} />
                        </div>
                    </div>
                    <MiniChart data={stats?.ramHistory} color="#a855f7" label="Used" />
                </div>

            </div>

            {/* Quick Info Footer */}
            <div className="mt-10 pt-6 border-t border-gray-800 flex items-center gap-6 justify-center">
                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                    <Info size={14} className="text-blue-500/60" />
                    Metrics update every 60 seconds
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                    <Activity size={14} className="text-green-500/60" />
                    Cluster Health: Stable
                </div>
            </div>
        </div>
    );
}
