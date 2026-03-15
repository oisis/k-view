import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings, useTranslation } from '../SettingsContext';
import { useTheme } from '../ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import RadialChart from './ui/RadialChart';

// --- Mini Chart Component (SVG) ---
function MiniChart({ data, color, label }) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[60px] mt-2 text-sm font-medium text-muted-foreground/60 italic bg-muted/20 rounded-lg border border-dashed border-border/50">
                No metrics data available
            </div>
        );
    }

    const validData = data.filter(d => typeof d?.value === 'number' && !isNaN(d.value));
    if (validData.length === 0) {
         return (
            <div className="flex items-center justify-center h-[60px] mt-2 text-sm font-medium text-muted-foreground/60 italic bg-muted/20 rounded-lg border border-dashed border-border/50">
                Metrics not ready
            </div>
        );
    }

    const max = Math.max(...validData.map(d => d.value), 1);
    const width = 400;
    const height = 60;
    const padding = 2;

    const points = validData.map((d, i) => {
        const x = (i / (validData.length - 1 || 1)) * width;
        const y = height - ((d.value / max) * (height - padding * 2)) - padding;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="flex flex-col gap-1 w-full mt-4">
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-tighter font-bold">
                <span>{data[0].timestamp}</span>
                <span className="font-black" style={{ color }}>{label}: {data[data.length - 1].value.toFixed(2)}%</span>
                <span>{data[data.length - 1].timestamp}</span>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[60px] overflow-visible">
                <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    d={`M 0,${height} L ${points} L ${width},${height} Z`}
                    fill={color}
                    fillOpacity="0.1"
                />
                <motion.polyline
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    points={points}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
}

// --- Metric Card Component (Shadcn + Framer) ---
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut"
    }
  })
};

function MetricCard({ title, value, subValue, iconKey, color, children, index, isCollapsed, onClick }) {
    const { icons } = useTheme();
    const Icon = icons[iconKey] || icons.pod;
    
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-600/10 border-blue-600/20',
        green: 'text-emerald-600 bg-emerald-600/10 border-emerald-600/20',
        purple: 'text-purple-600 bg-purple-600/10 border-purple-600/20',
        orange: 'text-orange-600 bg-orange-600/10 border-orange-600/20',
        cyan: 'text-cyan-600 bg-cyan-600/10 border-cyan-600/20',
        red: 'text-red-600 bg-red-600/10 border-red-600/20',
    };

    const cls = colorClasses[color] || colorClasses.blue;

    return (
        <motion.div
            custom={index}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            whileHover={onClick ? { y: -4, transition: { duration: 0.2 } } : {}}
            onClick={onClick}
            className={cn("h-full", onClick && "cursor-pointer")}
        >
            <Card 
                className={cn(
                    "relative h-full overflow-hidden border-border bg-card/50 backdrop-blur-md transition-all",
                    onClick && "hover:border-primary/30 hover:shadow-lg"
                )}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {title}
                    </CardTitle>
                    <div className={cn("rounded-lg p-2 border", cls)}>
                        <Icon size={isCollapsed ? 20 : 16} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className={cn("text-2xl font-bold tracking-tight text-foreground font-mono")}>
                        {value}
                    </div>
                    {subValue && (
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                            {subValue}
                        </p>
                    )}
                    {children}
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function Dashboard({ isCollapsed }) {
    const { settings } = useSettings();
    const { t } = useTranslation();
    const { icons } = useTheme();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(() => {
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
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                    <icons.refresh size={32} className="text-primary" />
                </motion.div>
                <p className="font-medium">{t('analyzing_cluster')}</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:pt-4 md:px-8 md:pb-8 w-full">
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {t('system_overview')}
                </h1>
                <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    {t('connected_as')} <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{settings.clusterName || stats?.clusterName || 'Local Cluster'}</span>
                </p>
            </motion.div>

            {/* Metrics Server Warning */}
            <AnimatePresence>
                {stats && !stats.metricsServer && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-8 p-4 bg-orange-400/10 border border-orange-400/30 text-orange-400 rounded-xl flex items-start gap-3 shadow-lg overflow-hidden"
                    >
                        <icons.alert size={20} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-sm">{t('metrics_server_missing')}</p>
                            <p className="text-xs opacity-80 mt-1">
                                {t('metrics_server_desc')}
                            </p>
                            <a
                                href="https://github.com/kubernetes-sigs/metrics-server"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 text-xs font-bold underline hover:opacity-80"
                            >
                                {t('view_install_guide')}
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <div className="mb-8 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl flex items-center gap-2 shadow-lg">
                    <icons.alert size={18} />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Stats Grid */}
            <div className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-all duration-500",
                isCollapsed ? "xl:grid-cols-4" : "xl:grid-cols-4"
            )}>

                {/* Cluster Identity */}
                <MetricCard
                    index={0}
                    title={t('cluster_platform')}
                    value={
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1 font-black">Identity</span>
                            <span className="text-xl font-black text-foreground tracking-tight">
                                {settings.clusterName || stats?.clusterName || "K8s Cluster"}
                            </span>
                        </div>
                    }
                    subValue={`K8s version: ${stats?.k8sVersion || '—'}`}
                    iconKey="clusterrole"
                    color="cyan"
                    onClick={() => navigate('/resources/Nodes')}
                    isCollapsed={isCollapsed}
                />

                {/* Nodes */}
                <MetricCard
                    index={1}
                    title={t('total_nodes')}
                    value={stats?.nodeCount || 0}
                    subValue={`${stats?.nodeCountReady || 0} ${t('ready_nodes')}`}
                    iconKey="nodes"
                    color="purple"
                    onClick={() => navigate('/resources/Nodes')}
                    isCollapsed={isCollapsed}
                />

                {/* Pods Status */}
                <MetricCard
                    index={2}
                    title={t('active_pods')}
                    value={stats?.podCount || 0}
                    subValue={`${stats?.podCountFailed || 0} ${t('failed_evicted')}`}
                    iconKey="pod"
                    color={stats?.podCountFailed > 0 ? "orange" : "green"}
                    onClick={() => navigate('/resources/Pods')}
                    isCollapsed={isCollapsed}
                >
                    <div className="mt-4 flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden relative">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: stats?.podCount ? `${((stats.podCount - stats.podCountFailed) / stats.podCount) * 100}%` : '0%' }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-emerald-500 rounded-full"
                            />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">
                            {stats?.podCount ? Math.round(((stats.podCount - stats.podCountFailed) / stats.podCount) * 100) : 0}%
                        </span>
                    </div>
                </MetricCard>

                {/* Control Plane Health */}
                <MetricCard
                    index={3}
                    title={t('control_plane')}
                    value={(!stats || stats.nodeCountReady === stats.nodeCount) ? t('healthy') : t('not_healthy')}
                    subValue={t('control_plane_desc')}
                    iconKey="activity"
                    color={(!stats || stats.nodeCountReady === stats.nodeCount) ? "green" : "red"}
                    valueClassName={(!stats || stats.nodeCountReady === stats.nodeCount) ? "text-emerald-400" : "text-red-400"}
                    isCollapsed={isCollapsed}
                />

                {/* CPU Usage */}
                <motion.div
                    custom={4}
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="md:col-span-2"
                >
                    <Card className="border-border/50 bg-card/50 backdrop-blur-md overflow-hidden hover:border-primary/50 transition-all">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                {t('compute_load')}
                            </CardTitle>
                            <div className="rounded-lg p-2 border text-emerald-400 bg-emerald-400/10 border-emerald-400/20">
                                <icons.cpu size={18} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-8">
                                <RadialChart 
                                    value={stats?.cpuUsage || 0} 
                                    color={stats?.cpuUsage >= 80 ? "#f87171" : "#10b981"} 
                                    size={110}
                                    strokeWidth={12}
                                />
                                <div className="flex flex-col justify-center">
                                    <span className="text-xl font-black tracking-tight text-foreground">
                                        Used {Number(stats?.cpuUsage || 0) && Number(stats?.cpuTotal || 0) ? ((Number(stats.cpuUsage) / 100) * Number(stats.cpuTotal)).toFixed(2) : "0.00"} of total {Number(stats?.cpuTotal) || "0"} Cores
                                    </span>
                                </div>
                            </div>
                            <MiniChart
                                data={stats?.cpuHistory}
                                color="#10b981"
                                label="History"
                            />
                        </CardContent>
                    </Card>
                </motion.div>

                {/* RAM Usage */}
                <motion.div
                    custom={5}
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="md:col-span-2"
                >
                    <Card className="border-border/50 bg-card/50 backdrop-blur-md overflow-hidden hover:border-primary/50 transition-all">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                {t('memory_pressure')}
                            </CardTitle>
                            <div className="rounded-lg p-2 border text-purple-400 bg-purple-400/10 border-purple-400/20">
                                <icons.pvc size={18} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-8">
                                <RadialChart 
                                    value={stats?.ramUsage || 0} 
                                    color={stats?.ramUsage >= 80 ? "#f87171" : "#a78bfa"} 
                                    size={110}
                                    strokeWidth={12}
                                />
                                <div className="flex flex-col justify-center">
                                    <span className="text-xl font-black tracking-tight text-foreground">
                                        Used {Number(stats?.ramUsage || 0) && Number(stats?.ramTotal || 0) ? ((Number(stats.ramUsage) / 100) * parseFloat(stats.ramTotal)).toFixed(1) : "0.0"} of total {stats?.ramTotal || "0"}
                                    </span>
                                </div>
                            </div>
                            <MiniChart
                                data={stats?.ramHistory}
                                color="#a78bfa"
                                label="History"
                            />
                        </CardContent>
                    </Card>
                </motion.div>

            </div>

            {/* Quick Info Footer */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-12 flex items-center gap-8 justify-center border-t border-border/30 pt-8"
            >
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    <icons.about size={14} className="text-primary/60" />
                    {t('metrics_update_info', { sec: settings.resourceRefreshInterval })}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    <icons.activity size={14} className="text-emerald-500/60" />
                    {t('cluster_health_stable')}
                </div>
            </motion.div>
        </div>
    );
}
