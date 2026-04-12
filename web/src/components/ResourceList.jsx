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
import CopyButton from './ui/CopyButton';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { 
    createColumnHelper, 
    useReactTable, 
    getCoreRowModel, 
    getSortedRowModel,
    flexRender 
} from '@tanstack/react-table';

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

const columnHelper = createColumnHelper();

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

function formatK8sDate(val) {
    if (typeof val !== 'string' || !val.includes('T') || !val.endsWith('Z')) return val;
    try {
        return val.replace('T', ' ').replace('Z', '').split('.')[0];
    } catch (e) {
        return val;
    }
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
        <div className="relative inline-block w-full text-center">
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
import * as ReactWindow from 'react-window';
const { FixedSizeList } = ReactWindow;

// --- Column Visibility Dropdown ---
function VisibilityMenu({ table, t, icons }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <Button
                variant="outline"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className={cn("h-11 w-11 rounded-xl border-2 transition-all", isOpen ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground")}
                title={t('column_visibility')}
            >
                <icons.eye size={18} />
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-2xl p-2 z-[100] backdrop-blur-xl"
                    >
                        <div className="px-3 py-2 mb-1 border-b border-border/50">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Display Columns</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-0.5">
                            {table.getAllLeafColumns().map(column => {
                                if (column.id === 'actions') return null;
                                return (
                                    <label
                                        key={column.id}
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted cursor-pointer transition-colors group"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={column.getIsVisible()}
                                            onChange={column.getToggleVisibilityHandler()}
                                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary"
                                        />
                                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                            {typeof column.columnDef.header === 'function' ? column.id.replace('extra.', '').replace('_', ' ') : column.columnDef.header}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/50 flex justify-center">
                            <button
                                onClick={() => table.toggleAllColumnsVisible()}
                                className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline p-1"
                            >
                                Reset to all
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function ResourceList({ kind: propKind }) {
    const { kind: paramKind } = useParams();
    const kind = propKind || paramKind;

    const { settings } = useSettings();
    const { t } = useTranslation();
    const { icons } = useTheme();
    const schema = SCHEMAS[kind] || { title: kind, cols: [{ key: 'name', label: 'Name' }, { key: 'age', label: 'Age' }] };
    const density = settings.tableDensity || 'comfortable';
    
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
    const sizingKey = `kview-table-sizing-${kind}`;
    const visibilityKey = `kview-table-visibility-${kind}`;

    const [namespace, setNamespace] = useState(() => {
        const saved = localStorage.getItem(nsKey);
        if (saved !== null) return saved;
        return settings.defaultNamespace;
    });

    useEffect(() => {
        const saved = localStorage.getItem(nsKey);
        if (saved === null) setNamespace(settings.defaultNamespace);
        else setNamespace(saved);
    }, [nsKey, settings.defaultNamespace, kind]);

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

    const isEvent = kind === 'Events';
    const isNamespaced = schema.cols.some(col => col.key === 'namespace');

    // --- Column Persistence ---
    const [columnSizing, setColumnSizing] = useState({});
    const [columnVisibility, setColumnVisibility] = useState({});
    const lastKind = useRef(kind);

    useEffect(() => {
        try {
            const savedSizing = localStorage.getItem(sizingKey);
            setColumnSizing(savedSizing ? JSON.parse(savedSizing) : {});
            const savedVisibility = localStorage.getItem(visibilityKey);
            setColumnVisibility(savedVisibility ? JSON.parse(savedVisibility) : {});
            lastKind.current = kind;
        } catch (e) {
            setColumnSizing({});
            setColumnVisibility({});
        }
    }, [kind, sizingKey, visibilityKey]);

    useEffect(() => {
        if (lastKind.current === kind) localStorage.setItem(visibilityKey, JSON.stringify(columnVisibility));
    }, [columnVisibility, visibilityKey, kind]);

    useEffect(() => {
        if (lastKind.current === kind && Object.keys(columnSizing).length > 0) localStorage.setItem(sizingKey, JSON.stringify(columnSizing));
    }, [columnSizing, sizingKey, kind]);

    // --- TanStack Table Definition ---
    const sorting = useMemo(() => [{ id: sortConfig.key, desc: sortConfig.direction === 'desc' }], [sortConfig]);

    const getInitialSize = (columnId) => {
        if (columnId === 'name') return kind === 'Pods' ? 400 : 300;
        if (columnId === 'extra.labels' || columnId === 'extra.annotations') return 208;
        if (['extra.images', 'extra.address', 'extra.endpoints', 'extra.external'].includes(columnId)) return 192;
        if (['extra.cluster-ip', 'extra.access-modes', 'extra.reclaim-policy', 'extra.storage-class'].includes(columnId)) return 128;
        if (columnId === 'extra.schedule') return 160;
        if (['age', 'extra.last-schedule', 'extra.restarts'].includes(columnId)) return 100;
        if (['status', 'pod_status'].includes(columnId)) return 120;
        if (columnId === 'namespace') return 192;
        if (['extra.ready', 'extra.up-to-date', 'extra.available', 'extra.pods', 'extra.desired', 'extra.current', 'extra.replicas', 'extra.readyReplicas'].includes(columnId)) return 80;
        if (['extra.activeJobsCount', 'extra.active'].includes(columnId)) return 64;
        if (columnId === 'actions') return 50;
        return 150;
    };

    const tanstackColumns = useMemo(() => {
        const baseCols = (schema.cols || []).map(col => {
            return columnHelper.accessor(row => getVal(row, col.key), {
                id: col.key,
                size: getInitialSize(col.key),
                minSize: 50,
                header: () => t(col.label?.toLowerCase()?.replace(' ', '_')) || col.label,
                cell: info => {
                    const item = info.row.original;
                    let val = info.getValue();
                    if (['extra.lastScheduleTime', 'extra.lastTimestamp', 'extra.firstTimestamp', 'extra.last-schedule'].includes(col.key)) val = formatK8sDate(val);
                    const expandableKeys = ['extra.labels', 'extra.annotations', 'extra.images', 'extra.endpoints', 'extra.external', 'extra.parameters', 'extra.access-modes'];
                    if (expandableKeys.includes(col.key)) return <ExpandableCell value={val} type={col.key.split('.')[1]} />;
                    if (col.key === 'extra.schedule') return <ScheduleCell value={val} item={item} />;
                    if (col.key === 'extra.active' || col.key === 'extra.activeJobsCount') return <span className="text-primary font-semibold">{val}</span>;
                    if (col.badge) return <StatusBadge value={val} />;
                    
                    const textClass = density === 'compact' ? "text-[11px]" : "text-[13px]";

                    if (col.key === 'name') return (
                        <div className="flex items-center gap-2 group/name">
                            <Link to={`/resources/${kind}/${item.namespace || '-'}/${val}`} className={cn("font-mono font-semibold tracking-tight transition-all truncate block text-foreground hover:text-primary", textClass)} title={val}>{val}</Link>
                            <CopyButton value={val} className="opacity-0 group-hover/name:opacity-100 transition-opacity" />
                        </div>
                    );
                    if (col.key === 'namespace' && val !== '-') return <Link to={`/resources/Namespaces/-/${val}`} className="text-primary hover:text-primary hover:underline truncate block text-center font-semibold text-[11px]" title={val}>{val}</Link>;
                    if (col.key === 'extra.node') return <Link to={`/resources/Nodes/-/${val}`} className="text-primary hover:text-primary hover:underline truncate block font-mono text-[11px] text-center font-semibold" title={val}>{val}</Link>;
                    return <span className={cn("text-muted-foreground font-medium truncate block", density === 'compact' ? "text-[10px]" : "text-xs")} title={val}>{val}</span>;
                },
            });
        });

        if (!isEvent) {
            baseCols.push(columnHelper.display({
                id: 'actions',
                size: 50,
                header: () => <div className="flex items-center justify-center text-primary/60"><icons.settings size={14} strokeWidth={3} /></div>,
                cell: info => <div className="flex justify-center"><ResourceActionMenu kind={kind} namespace={info.row.original.namespace} name={info.row.original.name} onRefresh={refresh} uid={info.row.original.uid} /></div>,
            }));
        }
        return baseCols;
    }, [schema, t, kind, refresh, icons, density]);

    const table = useReactTable({
        data: paginatedItems,
        columns: tanstackColumns,
        getRowId: (row) => row.uid || `${row.namespace}/${row.name}`,
        state: { sorting, columnSizing, columnVisibility },
        columnResizeMode: 'onChange',
        onColumnSizingChange: setColumnSizing,
        onColumnVisibilityChange: setColumnVisibility,
        manualSorting: true,
        onSortingChange: (updater) => {
            const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
            if (newSorting.length > 0) {
                const { id, desc } = newSorting[0];
                setSortConfig({ key: id, direction: desc ? 'desc' : 'asc' });
            } else {
                setSortConfig(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }));
            }
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const getCellAlignmentClass = (columnId) => {
        const base = density === 'compact' ? "text-[11px] px-3 font-mono" : "text-[13px] px-4 font-mono";
        if (['age', 'extra.restarts', 'extra.node', 'namespace', 'status', 'pod_status', 'extra.suspend', 'extra.type', 'extra.ready', 'extra.desired', 'extra.current', 'extra.available', 'extra.replicas', 'extra.pods', 'extra.controller', 'extra.count', 'extra.firstTimestamp', 'extra.lastTimestamp', 'extra.active', 'extra.activeJobsCount', 'extra.schedule', 'extra.readyReplicas', 'actions'].includes(columnId)) return `text-center ${base}`;
        if (columnId === 'name') return density === 'compact' ? "text-left px-4" : "text-left px-6";
        if (columnId === 'extra.message') return density === 'compact' ? "text-left px-4 text-[10px] leading-tight text-muted-foreground font-medium" : "text-left px-6 text-xs leading-tight text-muted-foreground font-medium";
        return density === 'compact' ? "px-3" : "px-4";
    };

    const rowHeightValue = density === 'compact' ? 32 : 48;
    const headerHeight = density === 'compact' ? "py-2 px-3" : "py-3 px-4";
    const rowHeight = density === 'compact' ? "py-1.5" : "py-3";

    const VirtualizedRow = ({ index, style }) => {
        const row = table.getRowModel().rows[index];
        return (
            <div style={style} className="flex items-center border-b border-border/20 glass-row group">
                {row.getVisibleCells().map(cell => (
                    <div 
                        key={cell.id} 
                        style={{ width: cell.column.getSize() }} 
                        className={cn(
                            "overflow-hidden border-r border-border/40 last:border-r-0 transition-all duration-300 flex items-center", 
                            getCellAlignmentClass(cell.column.id)
                        )}
                    >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                ))}
            </div>
        );
    };

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const shortcutText = isMac ? '⌘K' : 'Ctrl+K';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:pt-4 md:px-8 md:pb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        {t(kind) || schema.title}
                        <AnimatePresence>
                            {isRefreshing && <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ml-1" title="Auto-refreshing..." />}
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
                        <input type="text" placeholder={`${t('search_placeholder')} (${shortcutText})`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-background border-2 border-border pl-9 pr-4 py-2 rounded-xl text-xs font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all h-11 w-64 shadow-sm" />
                    </div>
                    {isNamespaced && <NamespaceSelect namespaces={namespaces} selected={namespace} onChange={setNamespace} />}
                    <VisibilityMenu table={table} t={t} icons={icons} />
                </div>
            </div>

            <CreateResourceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreated={handleCreated} initialKind={kind} namespaces={namespaces} />

            <AnimatePresence>
                {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl text-xs font-bold uppercase tracking-widest">{error}</motion.div>}
            </AnimatePresence>

            <div className="glass rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <div style={{ minWidth: '100%', width: table.getTotalSize() }}>
                        <div className="glass-header text-muted-foreground font-black uppercase tracking-[0.15em] flex border-b-2 border-border">
                            {table.getHeaderGroups().map(headerGroup => (
                                <React.Fragment key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <div key={header.id} style={{ width: header.getSize() }} className={cn("relative whitespace-nowrap group select-none font-semibold text-center border-r border-border/60 last:border-r-0 flex items-center justify-center", headerHeight, header.id === 'actions' && "bg-primary/5")}>
                                            <div className="flex items-center justify-center h-full w-full cursor-pointer hover:text-primary transition-colors" onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}</div>
                                            <div onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} className={cn("absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none hover:bg-primary/50 transition-colors z-20", header.column.getIsResizing() ? "bg-primary w-1" : "bg-transparent")} />
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                        
                        {loading && paginatedItems.length === 0 ? (
                            <div className="px-8 py-20 text-center text-muted-foreground italic font-medium animate-pulse">{t('loading')}...</div>
                        ) : table.getRowModel().rows.length === 0 ? (
                            <div className="px-8 py-20 text-center text-muted-foreground font-medium uppercase tracking-wider text-xs opacity-50">{t('no_resources_found', { kind: t(kind) || kind.replace(/-/g, ' ') })}</div>
                        ) : (
                            <FixedSizeList
                                height={Math.min(table.getRowModel().rows.length * rowHeightValue, 600)}
                                itemCount={table.getRowModel().rows.length}
                                itemSize={rowHeightValue}
                                width="100%"
                                className="custom-scrollbar"
                            >
                                {VirtualizedRow}
                            </FixedSizeList>
                        )}
                    </div>
                </div>
            </div>

            {totalPages > 1 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/30 backdrop-blur-md rounded-2xl border border-border/50 px-6 py-3 shadow-xl">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Showing {Math.min((items || []).length, (currentPage - 1) * (settings?.itemsPerPage || 15) + 1)} - {Math.min((items || []).length, currentPage * (settings?.itemsPerPage || 15))} of {(items || []).length} items</div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 border-r border-border/30 pr-6 mr-2">
                            <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="h-9 w-9 rounded-xl border-border/50 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all active:scale-90 disabled:opacity-30"><icons.chevrons_left size={16} /></Button>
                            <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="h-9 w-9 rounded-xl border-border/50 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all active:scale-90 disabled:opacity-30"><icons.chevron_left size={16} /></Button>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1).map((p, i, arr) => (
                                <React.Fragment key={p}>
                                    {i > 0 && arr[i - 1] !== p - 1 && <span className="text-muted-foreground/30 px-1 font-black">...</span>}
                                    <button onClick={() => setCurrentPage(p)} className={cn("w-9 h-9 flex items-center justify-center rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 border", currentPage === p ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-110" : "bg-muted/10 text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground hover:bg-muted/30")}>{p}</button>
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5 border-l border-border/30 pl-6 ml-2">
                            <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="h-9 w-9 rounded-xl border-border/50 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all active:scale-90 disabled:opacity-30"><icons.chevron_right size={16} /></Button>
                            <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="h-9 w-9 rounded-xl border-border/50 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all active:scale-90 disabled:opacity-30"><icons.chevrons_right size={16} /></Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
