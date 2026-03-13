import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings, useTranslation } from '../SettingsContext';
import { useTheme } from '../ThemeContext';
import ResourceActionMenu from './ResourceActionMenu';
import NamespaceSelect from './NamespaceSelect';
import CreateResourceModal from './CreateResourceModal';
import ExpandableCell from './ResourceDetails/ExpandableCell';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { PodListSchema } from './ResourceList/templates/PodList';
import { DeploymentListSchema } from './ResourceList/templates/DeploymentList';
import { ServiceListSchema } from './ResourceList/templates/ServiceList';
import { CronJobListSchema } from './ResourceList/templates/CronJobList';
import { NodeListSchema } from './ResourceList/templates/NodeList';
import { IngressListSchema } from './ResourceList/templates/IngressList';
import { ConfigMapListSchema } from './ResourceList/templates/ConfigMapList';
import { SecretListSchema } from './ResourceList/templates/SecretList';
import { PvcListSchema } from './ResourceList/templates/PvcList';
import { PvListSchema } from './ResourceList/templates/PvList';
import { IngressClassListSchema } from './ResourceList/templates/IngressClassList';
import { HpaListSchema } from './ResourceList/templates/HpaList';
import { EventListSchema } from './ResourceList/templates/EventList';
import { NamespaceListSchema } from './ResourceList/templates/NamespaceList';
import { CrdListSchema } from './ResourceList/templates/CrdList';
import { RbacListSchema } from './ResourceList/templates/RbacList';
import { ServiceAccountListSchema } from './ResourceList/templates/ServiceAccountList';
import { StorageClassListSchema } from './ResourceList/templates/StorageClassList';
import { ClusterRbacListSchema } from './ResourceList/templates/ClusterRbacList';
import { ReplicaSetListSchema } from './ResourceList/templates/ReplicaSetList';
import { ReplicationControllerListSchema } from './ResourceList/templates/ReplicationControllerList';
import { StatefulSetListSchema } from './ResourceList/templates/StatefulSetList';
import { JobListSchema } from './ResourceList/templates/JobList';
import { EndpointsListSchema } from './ResourceList/templates/EndpointsList';

const SCHEMAS = {
    Pods: PodListSchema,
    Deployments: DeploymentListSchema,
    StatefulSets: StatefulSetListSchema,
    DaemonSets: DeploymentListSchema,
    Jobs: JobListSchema,
    CronJobs: CronJobListSchema,
    ReplicaSets: ReplicaSetListSchema,
    ReplicationControllers: ReplicationControllerListSchema,
    HorizontalPodAutoscalers: HpaListSchema,
    Services: ServiceListSchema,
    Ingresses: IngressListSchema,
    IngressClasses: IngressClassListSchema,
    Endpoints: EndpointsListSchema,
    ConfigMaps: ConfigMapListSchema,
    Secrets: SecretListSchema,
    PersistentVolumeClaims: PvcListSchema,
    PersistentVolumes: PvListSchema,
    StorageClasses: StorageClassListSchema,
    ClusterRoleBindings: ClusterRbacListSchema,
    ClusterRoles: ClusterRbacListSchema,
    Events: EventListSchema,
    Namespaces: NamespaceListSchema,
    NetworkPolicies: ConfigMapListSchema,
    RoleBindings: RbacListSchema,
    Roles: RbacListSchema,
    ServiceAccounts: ServiceAccountListSchema,
    CustomResourceDefinitions: CrdListSchema,
};

function getVal(item, key) {
    if (!item) return '—';
    let rawVal;
    if (key === 'name' || key === 'namespace' || key === 'status' || key === 'age') {
        rawVal = item[key];
    }
    else if (item.extra) {
        const extraKey = key.startsWith('extra.') ? key.slice(6) : key;
        rawVal = item.extra[extraKey];
    } else {
        rawVal = item[key];
    }
    if (rawVal === undefined || rawVal === null) return '—';
    if (typeof rawVal === 'boolean') return String(rawVal);
    if (Array.isArray(rawVal)) return rawVal.join(', ');
    return rawVal;
}

function StatusBadge({ value }) {
    const { t } = useTranslation();
    const v = String(value || '');
    const translatedValue = t(v.toLowerCase()) || v;
    const map = {
        Normal: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        Warning: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
        Running: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        Active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        Complete: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        Bound: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        ClusterIP: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        LoadBalancer: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
        CrashLoopBackOff: 'bg-destructive/10 text-destructive border-destructive/20',
        Failed: 'bg-destructive/10 text-destructive border-destructive/20',
        Degraded: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
        Pending: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
        Suspended: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
        Available: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
        Released: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
        Default: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    };
    const cls = map[v] || 'bg-muted/30 text-muted-foreground border-border/30';
    return (
        <Badge variant="outline" className={cn("font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5", cls)}>
            {translatedValue}
        </Badge>
    );
}

function ScheduleCell({ value, nextRun }) {
    const [isHovered, setIsHovered] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const ref = useRef(null);

    if (!value || value === '—') return <span className="text-muted-foreground opacity-40">—</span>;

    const handleMouseEnter = () => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setCoords({ top: rect.top - 10, left: rect.left });
        }
        setIsHovered(true);
    };

    return (
        <div className="relative inline-block">
            <span
                ref={ref}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setIsHovered(false)}
                className="text-xs font-mono font-semibold text-primary cursor-help hover:underline decoration-dotted decoration-primary/40 underline-offset-4"
            >
                {value}
            </span>

            {isHovered && createPortal(
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    style={{
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        transform: 'translateY(-100%)',
                        zIndex: 9999
                    }}
                    className="mb-2 bg-popover/90 border border-border rounded-xl shadow-2xl p-4 min-w-[200px] pointer-events-none backdrop-blur-xl"
                >
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-2 border-b border-border/50 pb-1 tracking-wider">
                        Next Run
                    </div>
                    <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        {nextRun || 'Calculating...'}
                    </div>
                </motion.div>,
                document.body
            )}
        </div>
    );
}

import { useResourceData } from '../hooks/useResourceData';

export default function ResourceList({ kind: propKind }) {
    const { kind: paramKind } = useParams();
    const kind = propKind || paramKind;

    const { settings } = useSettings();
    const { t } = useTranslation();
    const { icons } = useTheme();
    const schema = SCHEMAS[kind] || { title: kind, cols: [{ key: 'name', label: 'Name' }, { key: 'age', label: 'Age' }] };
    
    const [namespaces, setNamespaces] = useState([]);
    const [user, setUser] = useState(null);
    
    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.ok ? r.json() : null)
            .then(d => setUser(d))
            .catch(() => { });
    }, []);

    const scope = user?.email || 'anonymous';
    const nsKey = `kview-selected-namespace-${scope}`;

    const [namespace, setNamespace] = useState(() => {
        const saved = localStorage.getItem(nsKey);
        if (saved !== null) return saved;
        return settings.defaultNamespace;
    });

    useEffect(() => {
        const saved = localStorage.getItem(nsKey);
        if (saved === null) {
            setNamespace(settings.defaultNamespace);
        } else {
            setNamespace(saved);
        }
    }, [nsKey, settings.defaultNamespace]);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const navigate = useNavigate();

    const url = `/api/resources/${kind}${namespace ? `?namespace=${encodeURIComponent(namespace)}` : ''}`;
    const { items, loading, isRefreshing, error, sortConfig, setSortConfig, refresh } = useResourceData(url, searchTerm, { key: 'name', direction: 'asc' }, getVal);

    useEffect(() => {
        fetch('/api/namespaces')
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => setNamespaces(data || []))
            .catch(() => { });
    }, []);

    const handleCreated = () => {
        refresh();
        setIsCreateModalOpen(false);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, namespace, kind]);

    const totalPages = Math.ceil((items || []).length / (settings?.itemsPerPage || 15)) || 1;
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * (settings?.itemsPerPage || 15);
        return (items || []).slice(start, start + (settings?.itemsPerPage || 15));
    }, [items, currentPage, settings.itemsPerPage]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const isNamespaced = schema.cols.some(col => col.key === 'namespace');
    const isEvent = kind === 'Events';
    const supportsTrace = false;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 md:p-8"
        >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
                        {t(kind) || schema.title}
                        <AnimatePresence>
                            {isRefreshing && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ml-3"
                                    title="Auto-refreshing..."
                                />
                            )}
                        </AnimatePresence>
                    </h1>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mt-1 opacity-70">
                        {loading ? t('loading') : `${(items || []).length} ${(items || []).length === 1 ? t('item') : t('items')}`}
                        {namespace && ` • ns: ${namespace}`}
                        {totalPages > 1 && ` • page ${currentPage}/${totalPages}`}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <icons.search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-background border-2 border-border pl-9 pr-4 py-2 rounded-xl text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all h-11 w-64 shadow-sm"
                        />
                    </div>
                    {isNamespaced && (
                        <NamespaceSelect
                            namespaces={namespaces}
                            selected={namespace}
                            onChange={setNamespace}
                        />
                    )}
                </div>
            </div>

            <CreateResourceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={handleCreated}
                initialKind={kind}
                namespaces={namespaces}
            />

            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl text-xs font-bold uppercase tracking-widest"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <Card className="border-border/50 bg-card overflow-hidden shadow-xl transition-all duration-500">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-xs text-left text-foreground border-separate border-spacing-0 table-fixed">
                        <thead className="bg-muted text-muted-foreground font-black uppercase tracking-[0.15em] border-b border-border">
                            <tr>
                                {(schema.cols || []).map(col => {
                                    let widthCls = "";
                                    if (col.key === 'name') widthCls = kind === 'CronJobs' ? "w-1/6" : "w-1/4";
                                    else if (col.key === 'extra.labels' || col.key === 'extra.annotations') widthCls = "w-40";
                                    else if (col.key === 'extra.images' || col.key === 'extra.address' || col.key === 'extra.endpoints' || col.key === 'extra.external') widthCls = "w-48";
                                    else if (col.key === 'extra.cluster-ip' || col.key === 'extra.access-modes' || col.key === 'extra.reclaim-policy' || col.key === 'extra.storage-class') widthCls = "w-32";
                                    else if (col.key === 'extra.suspend') widthCls = "w-24";
                                    else if (col.key === 'extra.type' || col.key === 'extra.controller') widthCls = "w-32";
                                    else if (col.key === 'age' || col.key === 'extra.last-schedule') widthCls = "w-24";
                                    else if (col.key === 'status' || col.key === 'pod_status') widthCls = "w-36";
                                    else if (col.key === 'extra.scope') widthCls = "w-32";
                                    else if (col.key === 'extra.version') widthCls = "w-20";
                                    else if (col.key === 'extra.ready' || col.key === 'extra.up-to-date' || col.key === 'extra.available' || col.key === 'extra.pods' || col.key === 'extra.desired' || col.key === 'extra.current' || col.key === 'extra.replicas') widthCls = "w-20";
                                    else if (col.key === 'extra.restarts') widthCls = "w-24";
                                    else if (col.key === 'extra.cpu' || col.key === 'extra.ram') widthCls = "w-20";
                                    else if (col.key === 'namespace') widthCls = "w-32";
                                    else if (col.key === 'extra.reason') widthCls = "w-32";
                                    else if (col.key === 'extra.message') widthCls = "w-1/3";
                                    else if (col.key === 'extra.source') widthCls = "w-32";
                                    else if (col.key === 'extra.involvedObject') widthCls = "w-48";
                                    else if (col.key === 'extra.count') widthCls = "w-16";
                                    else if (col.key === 'extra.firstTimestamp' || col.key === 'extra.lastTimestamp') widthCls = "w-32";

                                    return (
                                        <th
                                            key={col.key}
                                            onClick={() => requestSort(col.key)}
                                            className={cn(
                                                "py-3 px-4 whitespace-nowrap cursor-pointer group select-none font-semibold text-center border-b-2 border-border border-r border-border/60 last:border-r-0",
                                                widthCls
                                            )}
                                        >

                                            <div className="flex items-center justify-center gap-2">
                                                {t(col.label?.toLowerCase()?.replace(' ', '_')) || col.label}
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                                                    {sortConfig.key === col.key ? (
                                                        sortConfig.direction === 'asc' ? <icons.chevron_up size={14} /> : <icons.chevron_down size={14} />
                                                    ) : (
                                                        <icons.sort size={12} />
                                                    )}
                                                </span>
                                            </div>
                                        </th>
                                    );
                                })}
                                {supportsTrace && <th className="px-4 py-3 whitespace-nowrap w-12 border-b border-border/30 border-r border-border/10"></th>}
                                {!isEvent && <th className="px-4 py-3 whitespace-nowrap w-16 border-b border-border/30 text-right"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {loading && paginatedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={schema.cols.length + (supportsTrace ? 1 : 0) + (isEvent ? 0 : 1)} className="px-8 py-20 text-center text-muted-foreground italic font-medium animate-pulse">
                                        {t('loading')}...
                                    </td>
                                </tr>
                            ) : paginatedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={schema.cols.length + (supportsTrace ? 1 : 0) + (isEvent ? 0 : 1)} className="px-8 py-20 text-center text-muted-foreground font-medium uppercase tracking-wider text-xs opacity-50">
                                        {t('no_resources_found', { kind: t(kind) || kind.replace(/-/g, ' ') })}
                                    </td>
                                </tr>
                            ) : paginatedItems.map((item, i) => (
                                <motion.tr 
                                    key={i} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="hover:bg-muted/50 transition-all group"
                                >
                                    {(schema.cols || []).map(col => {                                        
                                        const val = getVal(item, col.key);
                                        let content;
                                        let cellClass = "py-3 overflow-hidden border-r border-border/40 border-b border-border/60 last:border-r-0";

                                        if (['age', 'extra.restarts', 'extra.node', 'namespace', 'status', 'pod_status', 'extra.suspend', 'extra.type', 'extra.ready', 'extra.desired', 'extra.current', 'extra.available', 'extra.replicas', 'extra.pods', 'extra.controller', 'extra.count', 'extra.firstTimestamp', 'extra.lastTimestamp'].includes(col.key || '')) {
                                            cellClass += " text-center px-4 font-mono text-[13px]";
                                        } else if (col.key === 'name') {
                                            cellClass += " text-left px-6";
                                        } else if (col.key === 'extra.message') {
                                            cellClass += " text-left px-6 text-xs leading-tight text-muted-foreground font-medium";
                                        } else {
                                            cellClass += " px-4";
                                        }

                                        const expandableKeys = ['extra.labels', 'extra.annotations', 'extra.images', 'extra.endpoints', 'extra.external', 'extra.parameters', 'extra.access-modes'];
                                        if ((expandableKeys || []).includes(col.key || '')) {
                                            content = <ExpandableCell value={val} type={(col.key || '').split('.')[1]} />;
                                        } else if (col.key === 'extra.schedule') {
                                            content = <ScheduleCell value={val} item={item} />;
                                        } else if (col.key === 'extra.active') {
                                            cellClass = cn(cellClass, "whitespace-nowrap w-16 text-center font-mono");
                                            content = <span className="text-primary font-semibold">{val}</span>;
                                        } else if (col.badge) {
                                            cellClass = cn(cellClass, "text-center px-4");
                                            content = <StatusBadge value={val} />;
                                        } else if (col.key === 'name') {
                                            content = (
                                                <Link
                                                    to={`/resources/${kind}/${item.namespace || '-'}/${val}`}
                                                    className="font-mono text-[13px] font-semibold tracking-tight transition-all truncate block text-foreground hover:text-primary"
                                                    title={val}
                                                >
                                                    {val}
                                                </Link>
                                            );
                                        } else if (col.key === 'namespace' && val !== '-') {
                                            content = (
                                                <Link
                                                    to={`/resources/Namespaces/-/${val}`}
                                                    className="text-primary hover:text-primary hover:underline truncate block text-center font-semibold text-xs"
                                                    title={val}
                                                >
                                                    {val}
                                                </Link>
                                            );
                                        } else if (col.key === 'extra.node') {
                                            content = (
                                                <Link
                                                    to={`/resources/Nodes/-/${val}`}
                                                    className="text-primary hover:text-primary hover:underline truncate block font-mono text-xs text-center font-semibold"
                                                    title={val}
                                                >
                                                    {val}
                                                </Link>
                                            );
                                        } else {
                                            content = <span className="text-muted-foreground font-medium truncate block text-xs" title={val}>{val}</span>;
                                        }

                                        return (
                                            <td key={col.key} className={cellClass}>
                                                {content}
                                            </td>
                                        );
                                    })}
                                    {supportsTrace && (
                                        <td className="px-4 py-4 whitespace-nowrap text-center border-r border-border/10">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/resources/${kind}/${item.namespace || '-'}/${item.name}?tab=trace`);
                                                }}
                                                className="h-8 w-8 text-primary/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                title="Visual Trace"
                                            >
                                                <icons.activity size={14} />
                                            </Button>
                                        </td>
                                    )}
                                    {!isEvent && (
                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                            <div className="flex justify-end pr-2">
                                                <ResourceActionMenu
                                                    kind={kind}
                                                    namespace={item.namespace}
                                                    name={item.name}
                                                    onRefresh={refresh}
                                                />
                                            </div>
                                        </td>
                                    )}
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-card/30 backdrop-blur-md rounded-[2rem] border border-border/50 px-10 py-6 shadow-xl"
                >
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">
                        Showing {Math.min((items || []).length, (currentPage - 1) * (settings?.itemsPerPage || 15) + 1)} - {Math.min((items || []).length, currentPage * (settings?.itemsPerPage || 15))} of {(items || []).length} items
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 border-r border-border/30 pr-6 mr-2">
                            <Button
                                variant="outline"
                                size="icon"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(1)}
                                className="h-9 w-9 rounded-xl border-border/50 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all active:scale-90 disabled:opacity-30"
                            >
                                <icons.chevrons_left size={16} />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className="h-9 w-9 rounded-xl border-border/50 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all active:scale-90 disabled:opacity-30"
                            >
                                <icons.chevron_left size={16} />
                            </Button>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {(Array.from({ length: totalPages }, (_, i) => i + 1) || [])
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((p, i, arr) => (
                                    <React.Fragment key={p}>
                                        {i > 0 && arr[i - 1] !== p - 1 && <span className="text-muted-foreground/30 px-1 font-black">...</span>}
                                        <button
                                            onClick={() => setCurrentPage(p)}
                                            className={cn(
                                                "w-9 h-9 flex items-center justify-center rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 border",
                                                currentPage === p
                                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-110"
                                                    : "bg-muted/10 text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground hover:bg-muted/30"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    </React.Fragment>
                                ))
                            }
                        </div>

                        <div className="flex items-center gap-1.5 border-l border-border/30 pl-6 ml-2">
                            <Button
                                variant="outline"
                                size="icon"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className="h-9 w-9 rounded-xl border-border/50 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all active:scale-90 disabled:opacity-30"
                            >
                                <icons.chevron_right size={16} />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                                className="h-9 w-9 rounded-xl border-border/50 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all active:scale-90 disabled:opacity-30"
                            >
                                <icons.chevrons_right size={16} />
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
