import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings, useTranslation } from '../SettingsContext';
import { useTheme } from '../ThemeContext';
import ResourceActionMenu from './ResourceActionMenu';
import NamespaceSelect from './NamespaceSelect';
import CreateResourceModal from './CreateResourceModal';
import ExpandableCell from './ResourceDetails/ExpandableCell';

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

// Column schema per resource kind - RESTORED FROM MAIN
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

// DTO-Safe value accessor (Restored logic from main, but using new DTO paths)
function getVal(item, key) {
    if (!item) return '—';
    
    let rawVal;
    // 1. Map top-level DTO fields
    if (key === 'name' || key === 'namespace' || key === 'status' || key === 'age') {
        rawVal = item[key];
    }
    // 2. Map extra fields from DTO (backend uses 'extra' object)
    else if (item.extra) {
        // Handle "extra.node", "extra.restarts", etc.
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
        Normal: 'bg-info/10 text-black',
        Warning: 'bg-warning/10 text-warning',
        Running: 'bg-success/10 text-success',
        Active: 'bg-success/10 text-success',
        Complete: 'bg-purple/10 text-purple',
        Bound: 'bg-purple/10 text-purple',
        ClusterIP: 'bg-slate-500/10 text-slate-400',
        LoadBalancer: 'bg-cyan/10 text-cyan',
        CrashLoopBackOff: 'bg-error/10 text-error',
        Failed: 'bg-error/10 text-error',
        Degraded: 'bg-warning/10 text-warning',
        Pending: 'bg-warning/10 text-warning',
        Suspended: 'bg-warning/10 text-warning',
        Available: 'bg-cyan/10 text-cyan',
        Released: 'bg-warning/10 text-warning',
        Default: 'bg-purple/10 text-purple',
    };
    const cls = map[v] || 'bg-slate-500/10 text-slate-400';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider ${cls}`}>
            {translatedValue}
        </span>
    );
}

function ScheduleCell({ value, nextRun }) {
    const [isHovered, setIsHovered] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const ref = useRef(null);

    if (!value || value === '—') return <span className="text-text-muted">—</span>;

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
                className="text-sm font-mono text-accent cursor-help hover:underline decoration-dotted decoration-[var(--accent)]/40 underline-offset-4 tracking-tighter"
            >
                {value}
            </span>

            {isHovered && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        transform: 'translateY(-100%)',
                        zIndex: 9999
                    }}
                    className="mb-2 bg-[var(--bg-tooltip)] border border-[var(--border-tooltip)] rounded-lg shadow-2xl p-3 min-w-[200px] pointer-events-none glass animate-in fade-in zoom-in duration-200 backdrop-blur-xl"
                >
                    <div className="text-xs font-bold text-text-muted uppercase mb-2 border-b border-[var(--border-tooltip)] pb-1">
                        Next Run
                    </div>
                    <div className="text-sm font-bold text-[var(--text-tooltip)] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        {nextRun || 'Calculating...'}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

import { useResourceData } from '../hooks/useResourceData';

/**
 * ResourceList Component - Restores the exact layout from main branch
 * while consuming backend DTOs.
 */
export default function ResourceList({ kind }) {
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
    const { items, loading, error, sortConfig, setSortConfig, refresh } = useResourceData(url, searchTerm, { key: 'name', direction: 'asc' }, getVal);

    // Fetch namespaces on mount
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
        <div className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-black mb-1 text-[var(--text-resource-kind)]">{t(kind) || schema.title}</h2>
                    <p className="text-secondary text-sm">
                        {loading ? t('loading') : `${(items || []).length} ${(items || []).length === 1 ? t('item') : t('items')}`}
                        {namespace && ` ${t('in_ns')} "${namespace}"`}
                        {totalPages > 1 && ` • ${t('page_x_of_y', { current: currentPage, total: totalPages })}`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-[var(--bg-input)] border border-border px-3 py-2 rounded-lg text-sm text-[var(--text-input)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors h-10 w-64"
                    />
                    {isNamespaced && (<NamespaceSelect
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

            {error && (
                <div className="mb-4 p-4 bg-red-900/30 border border-red-800 text-red-400 rounded-lg text-sm">{error}</div>
            )}

            <div className="glass rounded-2xl border border-border overflow-hidden transition-all duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-primary border-collapse table-fixed">
                        <thead className="border-b-2 border-border">
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
                                            className={`py-3 px-2 whitespace-nowrap cursor-pointer group select-none font-bold ${widthCls} text-center border-r border-white/10 last:border-r-0`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                {t(col.label?.toLowerCase()?.replace(' ', '_')) || col.label}
                                                <span className="opacity-50 group-hover:opacity-100 transition-colors" style={{ color: 'var(--text-table-header)' }}>
                                                    {sortConfig.key === col.key ? (
                                                        sortConfig.direction === 'asc' ? <icons.chevron_up size={14} /> : <icons.chevron_down size={14} />
                                                    ) : (
                                                        <icons.sort size={12} className="opacity-0 group-hover:opacity-100" />
                                                    )}
                                                </span>
                                            </div>
                                        </th>
                                    );
                                })}
                                {supportsTrace && <th className="px-2 py-3 whitespace-nowrap w-10 border-r border-white/10"></th>}
                                {!isEvent && <th className="px-2 py-3 whitespace-nowrap w-12 text-right"></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && paginatedItems.length === 0 ? (
                                <tr><td colSpan={schema.cols.length + (supportsTrace ? 1 : 0) + (isEvent ? 0 : 1)} className="px-6 py-8 text-center text-text-muted italic">{t('loading')}</td></tr>
                            ) : paginatedItems.length === 0 ? (
                                <tr><td colSpan={schema.cols.length + (supportsTrace ? 1 : 0) + (isEvent ? 0 : 1)} className="px-6 py-8 text-center text-text-muted">{t('no_resources_found', { kind: t(kind) || kind.replace(/-/g, ' ') })}</td></tr>
                            ) : paginatedItems.map((item, i) => (
                                <tr key={i} className="border-b border-border hover:bg-[var(--sidebar-hover)]/20 transition-colors">
                                    {(schema.cols || []).map(col => {                                        
                                        const val = getVal(item, col.key);
                                        let content;
                                        let cellClass = "py-1.5 overflow-hidden";

                                        if (['age', 'extra.restarts', 'extra.node', 'namespace', 'status', 'pod_status', 'extra.suspend', 'extra.type', 'extra.ready', 'extra.desired', 'extra.current', 'extra.available', 'extra.replicas', 'extra.pods', 'extra.controller', 'extra.count', 'extra.firstTimestamp', 'extra.lastTimestamp'].includes(col.key || '')) {
                                            cellClass += " text-center px-2";
                                        } else if (col.key === 'name') {
                                            cellClass += " text-left px-3";
                                        } else if (col.key === 'extra.message') {
                                            cellClass += " text-left px-3 text-xs leading-tight opacity-80";
                                        } else {
                                            cellClass += " px-2";
                                        }

                                        const expandableKeys = ['extra.labels', 'extra.annotations', 'extra.images', 'extra.endpoints', 'extra.external', 'extra.parameters', 'extra.access-modes'];
                                        if ((expandableKeys || []).includes(col.key || '')) {
                                            cellClass = "py-1.5 overflow-hidden min-w-0 pl-1 pr-2 text-left";
                                            content = <ExpandableCell value={val} type={(col.key || '').split('.')[1]} />;
                                        } else if (col.key === 'extra.schedule') {
                                            content = <ScheduleCell value={val} nextRun={item.extra?.['next-run']} />;
                                        } else if (col.key === 'extra.active') {
                                            cellClass += " whitespace-nowrap w-16 text-center";
                                            content = <span className="text-primary font-bold">{val}</span>;
                                        } else if (col.badge) {
                                            cellClass = "py-1.5 overflow-hidden text-center px-2";
                                            content = <StatusBadge value={val} />;
                                        } else if (col.key === 'name') {
                                            content = (
                                                <Link
                                                    to={`/${kind}/${item.namespace || '-'}/${val}`}
                                                    className="font-bold transition-colors truncate block text-[var(--text-resource-kind)] hover:text-primary"
                                                    title={val}
                                                >
                                                    {val}
                                                </Link>
                                            );
                                        } else if (col.key === 'namespace' && val !== '-') {
                                            content = (
                                                <Link
                                                    to={`/namespaces/-/${val}`}
                                                    className="text-info hover:underline truncate block text-center"
                                                    title={val}
                                                >
                                                    {val}
                                                </Link>
                                            );
                                        } else if (col.key === 'extra.node') {
                                            content = (
                                                <Link
                                                    to={`/nodes/-/${val}`}
                                                    className="text-info hover:underline truncate block font-mono text-xs text-center"
                                                    title={val}
                                                >
                                                    {val}
                                                </Link>
                                            );
                                        } else {
                                            content = <span className="text-secondary font-medium truncate block" title={val}>{val}</span>;
                                        }

                                        return (
                                            <td key={col.key} className={cellClass}>
                                                {content}
                                            </td>
                                        );
                                    })}
                                    {supportsTrace && (
                                        <td className="px-2 py-2 whitespace-nowrap text-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/${kind}/${item.namespace || '-'}/${item.name}?tab=trace`);
                                                }}
                                                className="text-info/70 hover:text-info p-1.5 hover:bg-info/10 rounded inline-flex transition-colors"
                                                title="Visual Trace"
                                            >
                                                <icons.activity size={16} />
                                            </button>
                                        </td>
                                    )}
                                    {!isEvent && (
                                        <td className="px-2 py-2 whitespace-nowrap text-center">
                                            <div className="flex justify-center">
                                                <ResourceActionMenu
                                                    kind={kind}
                                                    namespace={item.namespace}
                                                    name={item.name}
                                                    onRefresh={refresh}
                                                />
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls - Restored exact style from main */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between glass rounded-xl border border-border px-6 py-4">
                    <div className="text-xs font-bold text-text-muted uppercase tracking-wider">
                        {t('showing')} {Math.min((items || []).length, (currentPage - 1) * (settings?.itemsPerPage || 15) + 1)} - {Math.min((items || []).length, currentPage * (settings?.itemsPerPage || 15))} {t('of')} {(items || []).length}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(1)}
                            className="p-2 rounded-lg border border-border text-text-muted hover:text-primary hover:border-[var(--accent)]/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                            title="First Page"
                        >
                            <icons.chevrons_left size={18} />
                        </button>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-2 rounded-lg border border-border text-text-muted hover:text-primary hover:border-[var(--accent)]/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                        >
                            <icons.chevron_left size={18} />
                        </button>

                        <div className="flex items-center gap-1">
                            {(Array.from({ length: totalPages }, (_, i) => i + 1) || [])
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((p, i, arr) => (
                                    <React.Fragment key={p}>
                                        {i > 0 && arr[i - 1] !== p - 1 && <span className="text-text-muted px-1">...</span>}
                                        <button
                                            onClick={() => setCurrentPage(p)}
                                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-all active:scale-95
                                                ${currentPage === p
                                                    ? 'bg-[var(--accent)] text-white shadow-lg shadow-indigo-500/20'
                                                    : 'text-text-muted hover:text-primary border border-border hover:border-[var(--accent)]/30'}`}
                                        >
                                            {p}
                                        </button>
                                    </React.Fragment>
                                ))
                            }
                        </div>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="p-2 rounded-lg border border-border text-text-muted hover:text-primary hover:border-[var(--accent)]/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                        >
                            <icons.chevron_right size={18} />
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                            className="p-2 rounded-lg border border-border text-text-muted hover:text-primary hover:border-[var(--accent)]/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                            title="Last Page"
                        >
                            <icons.chevrons_right size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
