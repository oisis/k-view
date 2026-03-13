import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation, useSettings } from '../SettingsContext';
import { useTheme } from '../ThemeContext';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from '../assets/k-view-logo.png';

// ── Collapsible section ────────────────────────────────────────────────────
function Section({ id, label, children, defaultOpen = false, isCollapsed, userEmail }) {
    const { icons } = useTheme();
    const scope = userEmail || 'anonymous';
    const key = `sidebar-section-${scope}-${id || label}`;
    const [open, setOpen] = useState(() => {
        try { return JSON.parse(localStorage.getItem(key)) ?? defaultOpen; }
        catch { return defaultOpen; }
    });

    const toggle = () => {
        setOpen(v => {
            try { localStorage.setItem(key, JSON.stringify(!v)); } catch { }
            return !v;
        });
    };

    if (isCollapsed) {
        return <div className="flex flex-col items-center gap-0.5 mb-1">{children}</div>;
    }

    return (
        <div className="mb-2">
            <button
                onClick={toggle}
                className="w-full flex items-center justify-between px-3 pt-4 pb-1 group transition-all"
            >
                <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground group-hover:text-foreground transition-colors block">
                    {label}
                </span>
                <motion.div
                    animate={{ rotate: open ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                >
                    <icons.chevron_down size={10} className="text-muted-foreground/50 group-hover:text-foreground" />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="space-y-0.5 overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Icon Color Mapping ──────────────────────────────────────────────────
const ICON_COLORS = {
    dashboard: "text-blue-600",
    cronjob: "text-blue-500",
    daemonset: "text-purple-600",
    deployment: "text-blue-600",
    job: "text-cyan-600",
    pod: "text-sky-600",
    replicaset: "text-indigo-600",
    statefulset: "text-violet-600",
    hpa: "text-pink-600",
    service: "text-emerald-600",
    ingress: "text-green-600",
    ingressclass: "text-teal-600",
    network: "text-emerald-700",
    configmap: "text-orange-600",
    secret: "text-yellow-600",
    pvc: "text-amber-600",
    storageclass: "text-orange-700",
    clusterrole: "text-rose-600",
    clusterrolebinding: "text-rose-700",
    crd: "text-purple-700",
    event: "text-blue-500",
    namespace: "text-cyan-700",
    networkpolicy: "text-red-600",
    nodes: "text-violet-700",
    pv: "text-amber-700",
    role: "text-rose-500",
    rolebinding: "text-rose-600",
    serviceaccount: "text-indigo-700",
    admin_panel: "text-red-600",
    console: "text-slate-600",
    settings: "text-slate-700",
    about: "text-sky-600",
    plus: "text-emerald-600",
};

// ── Nav item ───────────────────────────────────────────────────────────────
function NavItem({ href, iconKey, label, active, isCollapsed }) {
    const { icons } = useTheme();
    const Icon = icons[iconKey] || icons.pod;
    
    const clusterScopedPaths = [
        '/nodes', 
        '/config/PersistentVolumes', 
        '/config/StorageClasses', 
        '/cluster/ClusterRoleBindings', 
        '/cluster/ClusterRoles', 
        '/cluster/CustomResourceDefinitions', 
        '/cluster/Namespaces', 
        '/cluster/IngressClasses'
    ];
    const isClusterResource = clusterScopedPaths.some(p => href === p);
    const iconColor = ICON_COLORS[iconKey] || "text-muted-foreground";

    return (
        <Link
            to={href}
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                active
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                isClusterResource && !active && "border-l-2 border-primary/40 rounded-l-none bg-primary/5",
                isCollapsed ? "justify-center w-10 h-10 px-0 mx-auto" : "w-full"
            )}
            title={isCollapsed ? label : ''}
        >
            <Icon size={isCollapsed ? 20 : 16} className={cn(
                "transition-transform group-hover:scale-110 shrink-0",
                active ? "text-foreground" : iconColor
            )} />
            {!isCollapsed && (
                <span className="flex-1 truncate tracking-tight">{label}</span>
            )}
        </Link>
    );
}

// ── Nav action item ────────────────────────────────────────────────────────
function NavActionButton({ onClick, iconKey, label, isCollapsed }) {
    const { icons } = useTheme();
    const Icon = icons[iconKey] || icons.plus;
    const iconColor = ICON_COLORS[iconKey] || "text-emerald-600";

    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                "text-emerald-600 hover:bg-emerald-600/10",
                isCollapsed ? "justify-center w-10 h-10 px-0 mx-auto" : "w-full text-left"
            )}
            title={isCollapsed ? label : ''}
        >
            <Icon size={isCollapsed ? 20 : 16} className={cn("transition-transform group-hover:scale-110 shrink-0", iconColor)} />
            {!isCollapsed && (
                <span className="flex-1 truncate tracking-tight">{label}</span>
            )}
        </button>
    );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
export default function Sidebar({ user, onLogout, isCollapsed, setIsCollapsed, onCreateResource }) {
    const { pathname: p } = useLocation();
    const { t } = useTranslation();
    const { settings } = useSettings();
    const { icons } = useTheme();

    const isPathActive = (href) => {
        if (p === href) return true;
        if (href === '/') return p === '/';

        const parts = href.split('/');
        const kind = parts[parts.length - 1]; 

        const isCrd = kind === 'CustomResourceDefinitions';
        if (isCrd) {
            return p.startsWith('/CustomResourceDefinitions/') || p.startsWith('/cluster/CustomResourceDefinitions') || p === '/CustomResourceDefinition';
        }

        return p.startsWith(`/${kind}/`) || p.startsWith(`/workloads/${kind}`) || p.startsWith(`/network/${kind}`) || p.startsWith(`/config/${kind}`) || p.startsWith(`/cluster/${kind}`);
    };

    return (
        <motion.aside 
            initial={false}
            animate={{ width: isCollapsed ? 80 : 256 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="bg-card border-r border-border/50 flex flex-col hidden md:flex h-full shrink-0 relative z-20 overflow-hidden shadow-2xl"
        >
            {/* Header: Logo (left) + Buttons (right stack) */}
            <div className={cn(
                "border-b border-border/30 flex items-center transition-all duration-300 py-6",
                isCollapsed ? "flex-col gap-6 px-0" : "flex-row justify-between px-6 gap-2"
            )}>
                
                {/* Logo Area */}
                <AnimatePresence mode="wait">
                    {!isCollapsed ? (
                        <motion.div 
                            key="full-logo"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex-1 flex justify-center overflow-hidden"
                        >
                            <img src={logo} alt="K-View Logo" className="w-40 h-auto opacity-90" />
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="collapsed-icon"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/30"
                        >
                            <span className="text-primary font-bold text-xl">K</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Buttons Stack */}
                <div className={cn("flex flex-col items-center gap-3", !isCollapsed && "ml-auto")}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onLogout}
                        className="rounded-lg h-9 w-9 text-destructive hover:bg-destructive/10 transition-all active:scale-90 border border-destructive/20"
                        title={t('logout')}
                    >
                        <icons.logout size={16} />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="rounded-lg h-9 w-9 text-primary hover:bg-primary/10 transition-all active:scale-90 border border-primary/20"
                        title={isCollapsed ? t('expand_menu') : t('collapse_menu')}
                    >
                        {isCollapsed ? <icons.expand_menu size={16} /> : <icons.collapse_menu size={16} />}
                    </Button>
                </div>
            </div>

            {/* Scrollable nav */}
            <nav className="flex-1 overflow-y-auto mt-4 px-3 custom-scrollbar">
                <div className={cn("mb-6", isCollapsed && "flex flex-col items-center")}>
                    <NavItem href="/" iconKey="dashboard" label={t('dashboard')} active={isPathActive('/')} isCollapsed={isCollapsed} />
                </div>

                <Section id="workloads" label={t('workloads')} defaultOpen={false} isCollapsed={isCollapsed} userEmail={user?.email}>
                    <NavItem href="/workloads/CronJobs" iconKey="cronjob" label={t('CronJobs')} active={isPathActive('/workloads/CronJobs')} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/DaemonSets" iconKey="daemonset" label={t('DaemonSets')} active={isPathActive('/workloads/DaemonSets')} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/Deployments" iconKey="deployment" label={t('Deployments')} active={isPathActive('/workloads/Deployments')} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/Jobs" iconKey="job" label={t('Jobs')} active={isPathActive('/workloads/Jobs')} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/Pods" iconKey="pod" label={t('Pods')} active={isPathActive('/workloads/Pods')} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/ReplicaSets" iconKey="replicaset" label={t('ReplicaSets')} active={isPathActive('/workloads/ReplicaSets')} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/ReplicationControllers" iconKey="replicationcontroller" label={t('ReplicationControllers')} active={isPathActive('/workloads/ReplicationControllers')} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/StatefulSets" iconKey="statefulset" label={t('StatefulSets')} active={isPathActive('/workloads/StatefulSets')} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/HorizontalPodAutoscalers" iconKey="hpa" label={t('HorizontalPodAutoscalers')} active={isPathActive('/workloads/HorizontalPodAutoscalers')} isCollapsed={isCollapsed} />
                </Section>

                <Section id="network" label={t('Services')} defaultOpen={false} isCollapsed={isCollapsed} userEmail={user?.email}>
                    <NavItem href="/cluster/IngressClasses" iconKey="ingressclass" label={t('IngressClasses')} active={isPathActive('/cluster/IngressClasses')} isCollapsed={isCollapsed} />
                    <NavItem href="/network/Ingresses" iconKey="ingress" label={t('Ingresses')} active={isPathActive('/network/Ingresses')} isCollapsed={isCollapsed} />
                    <NavItem href="/network/Services" iconKey="service" label={t('Services')} active={isPathActive('/network/Services')} isCollapsed={isCollapsed} />
                    <NavItem href="/network/Endpoints" iconKey="network" label={t('Endpoints')} active={isPathActive('/network/Endpoints')} isCollapsed={isCollapsed} />
                </Section>

                <Section id="config" label={t('config')} defaultOpen={false} isCollapsed={isCollapsed} userEmail={user?.email}>
                    <NavItem href="/config/ConfigMaps" iconKey="configmap" label={t('ConfigMaps')} active={isPathActive('/config/ConfigMaps')} isCollapsed={isCollapsed} />
                    <NavItem href="/config/PersistentVolumeClaims" iconKey="pvc" label={t('PersistentVolumeClaims')} active={isPathActive('/config/PersistentVolumeClaims')} isCollapsed={isCollapsed} />
                    <NavItem href="/config/Secrets" iconKey="secret" label={t('Secrets')} active={isPathActive('/config/Secrets')} isCollapsed={isCollapsed} />
                    <NavItem href="/config/StorageClasses" iconKey="storageclass" label={t('StorageClasses')} active={isPathActive('/config/StorageClasses')} isCollapsed={isCollapsed} />
                </Section>

                <Section id="cluster" label={t('cluster')} defaultOpen={false} isCollapsed={isCollapsed} userEmail={user?.email}>
                    <NavItem href="/cluster/ClusterRoleBindings" iconKey="clusterrolebinding" label={t('ClusterRoleBindings')} active={isPathActive('/cluster/ClusterRoleBindings')} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/ClusterRoles" iconKey="clusterrole" label={t('ClusterRoles')} active={isPathActive('/cluster/ClusterRoles')} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/CustomResourceDefinitions" iconKey="crd" label={t('CustomResourceDefinitions')} active={isPathActive('/cluster/CustomResourceDefinitions')} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/Events" iconKey="event" label={t('Events')} active={isPathActive('/cluster/Events')} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/Namespaces" iconKey="namespace" label={t('Namespaces')} active={isPathActive('/cluster/Namespaces')} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/NetworkPolicies" iconKey="networkpolicy" label={t('NetworkPolicies')} active={isPathActive('/cluster/NetworkPolicies')} isCollapsed={isCollapsed} />
                    <NavItem href="/nodes" iconKey="nodes" label={t('Nodes')} active={isPathActive('/nodes')} isCollapsed={isCollapsed} />
                    <NavItem href="/config/PersistentVolumes" iconKey="pv" label={t('PersistentVolumes')} active={isPathActive('/config/PersistentVolumes')} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/RoleBindings" iconKey="rolebinding" label={t('RoleBindings')} active={isPathActive('/cluster/RoleBindings')} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/Roles" iconKey="role" label={t('Roles')} active={isPathActive('/cluster/Roles')} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/ServiceAccounts" iconKey="serviceaccount" label={t('ServiceAccounts')} active={isPathActive('/cluster/ServiceAccounts')} isCollapsed={isCollapsed} />
                </Section>

                <Section id="tools" label={t('tools')} defaultOpen={false} isCollapsed={isCollapsed} userEmail={user?.email}>
                    <NavActionButton onClick={onCreateResource} iconKey="plus" label={t('add_resource')} isCollapsed={isCollapsed} />
                    {user.role === 'kview-cluster-admin' && (
                        <NavItem href="/access" iconKey="admin_panel" label={t('admin_panel')} active={isPathActive('/access')} isCollapsed={isCollapsed} />
                    )}
                    <NavItem href="/about" iconKey="about" label={t('about')} active={isPathActive('/about')} isCollapsed={isCollapsed} />
                    <NavItem href="/console" iconKey="console" label={t('console')} active={isPathActive('/console')} isCollapsed={isCollapsed} />
                    <NavItem href="/settings" iconKey="settings" label={t('settings')} active={isPathActive('/settings')} isCollapsed={isCollapsed} />
                </Section>
            </nav>

            {/* Custom Cluster Name (Watermark) */}
            {settings.clusterName && !isCollapsed && (
                <div className="mt-auto px-6 py-6 border-t border-border/20 pointer-events-none select-none">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/40 break-all leading-tight">
                        {settings.clusterName}
                    </p>
                </div>
            )}
        </motion.aside>
    );
}
