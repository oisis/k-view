import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronLeft, FileText, List, Terminal, Search, RefreshCw, ChevronRight,
    Info, Clipboard, CheckCircle2, AlertCircle, Clock, Activity, SquareTerminal,
    ChevronRight as ChevronRightIcon, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import NetworkTrace from './NetworkTrace';
import PodTerminal from './PodTerminal';
import { useSettings, useTranslation } from '../SettingsContext';

export default function ResourceDetails({ user }) {
    const { settings } = useSettings();
    const { kind, namespace, name } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const setActiveTab = (tabId) => {
        const newParams = new URLSearchParams(searchParams);
        if (tabId === 'overview') {
            newParams.delete('tab');
        } else {
            newParams.set('tab', tabId);
        }
        setSearchParams(newParams, { replace: true });
    };

    const [data, setData] = useState(null);
    const [yaml, setYaml] = useState('');
    const [editedYaml, setEditedYaml] = useState('');
    const [format, setFormat] = useState('yaml'); // 'yaml' or 'json'
    const [events, setEvents] = useState([]);
    const [logs, setLogs] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quotas, setQuotas] = useState([]);
    const [limits, setLimits] = useState([]);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    // Logs enhancements state
    const [logRefreshInterval, setLogRefreshInterval] = useState(settings.logsRefreshInterval); // in seconds
    const [logSearchTerm, setLogSearchTerm] = useState('');
    const [logSearchRegex, setLogSearchRegex] = useState(false);
    const [logPaginationEnabled, setLogPaginationEnabled] = useState(true);
    const [logPage, setLogPage] = useState(1);
    const [logLinesPerPage] = useState(36);
    const [logContainer, setLogContainer] = useState('');
    const [logWrapLines, setLogWrapLines] = useState(false);

    const canEdit = user && (user.role === 'kview-cluster-admin' || user.role === 'admin' || user.role === 'edit');

    const fetchLogs = async () => {
        if (!kind.toLowerCase().startsWith('pod')) return;
        try {
            const containerQuery = logContainer ? `&container=${logContainer}` : '';
            const logsRes = await fetch(`/api/pods/${namespace}/${name}/logs?tail=1000${containerQuery}`);
            if (logsRes.ok) {
                const logsData = await logsRes.text();
                setLogs(logsData);
            }
        } catch (e) {
            console.error('Failed to fetch logs:', e);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const nsPath = namespace ? `/${namespace}` : '/-';
                const [detailsRes, yamlRes, eventsRes, logsRes] = await Promise.all([
                    fetch(`/api/resources/${kind}${nsPath}/${name}`),
                    fetch(`/api/resources/${kind}${nsPath}/${name}/yaml?format=${format}`),
                    fetch(`/api/resources/${kind}${nsPath}/${name}/events`),
                    kind === 'pods' ? fetch(`/api/pods/${namespace}/${name}/logs?tail=1000`) : Promise.resolve(null)
                ]);

                if (!detailsRes.ok) throw new Error('Failed to fetch resource details');

                const [detailsData, yamlData, eventsData, logsData] = await Promise.all([
                    detailsRes.json(),
                    yamlRes.text(),
                    eventsRes.json(),
                    logsRes ? logsRes.text() : Promise.resolve('')
                ]);

                setData(detailsData);
                setYaml(yamlData);
                setEditedYaml(yamlData);
                setEvents(Array.isArray(eventsData) ? eventsData : []);
                setLogs(logsData);

                // Fetch extra data for namespaces
                if (kind === 'namespaces') {
                    const [qRes, lRes] = await Promise.all([
                        fetch(`/api/resources/resourcequotas?namespace=${name}`),
                        fetch(`/api/resources/limitranges?namespace=${name}`)
                    ]);
                    if (qRes.ok) setQuotas(await qRes.json());
                    if (lRes.ok) setLimits(await lRes.json());
                }

                // Initialize logContainer if not set
                if (kind.toLowerCase().startsWith('pod') && detailsData.spec?.containers?.length > 0 && !logContainer) {
                    setLogContainer(detailsData.spec.containers[0].name);
                }
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [kind, namespace, name, format]);

    useEffect(() => {
        if (activeTab === 'logs') {
            fetchLogs();
        }
    }, [activeTab, logContainer, namespace, name]);

    useEffect(() => {
        if (activeTab === 'logs' && logRefreshInterval > 0) {
            const interval = setInterval(fetchLogs, logRefreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [activeTab, logRefreshInterval, namespace, name]);

    useEffect(() => {
        if (!loading && data) {
            if (searchParams.get('edit') === 'true' && canEdit) {
                setIsEditing(true);
            }
            if (searchParams.get('exec') === 'true' && kind.toLowerCase().startsWith('pod')) {
                setActiveTab('exec');
            }
            if (searchParams.get('trace') === 'true') {
                setActiveTab('trace');
            }
        }
    }, [loading, data, searchParams, canEdit, kind]);

    if (loading) return <div className="p-8 text-[var(--text-secondary)]">{t('loading')}</div>;
    if (error) return <div className="p-8 text-red-400">{t('error')}: {error}</div>;
    if (!data) return <div className="p-8 text-[var(--text-muted)]">{t('resource_not_found')}</div>;

    // Safety check: Ensure we have at least metadata
    if (!data.metadata) return <div className="p-8 text-red-400">Error: Invalid resource data received from API</div>;

    const { metadata } = data;
    const spec = data.spec || {};
    const status = data.status || {};
    const isPod = kind.toLowerCase().startsWith('pod');
    const isDeployment = kind.toLowerCase().startsWith('deploy');
    const isService = kind.toLowerCase().startsWith('serv');

    const podSpec = isPod ? spec : (spec.template?.spec || {});
    const volumes = podSpec.volumes || [];
    const mountedConfigMaps = Array.from(new Set(volumes.filter(v => v.configMap).map(v => v.configMap.name)));
    const mountedSecrets = Array.from(new Set(volumes.filter(v => v.secret).map(v => v.secret.secretName)));
    const mountedPvcs = Array.from(new Set(volumes.filter(v => v.persistentVolumeClaim).map(v => v.persistentVolumeClaim.claimName)));

    const restarts = isPod && status.containerStatuses
        ? status.containerStatuses.reduce((acc, c) => acc + (c.restartCount || 0), 0)
        : 0;

    const readyCount = isPod && status.containerStatuses
        ? status.containerStatuses.filter(c => c.ready).length
        : 0;
    const totalContainers = isPod && status.containerStatuses
        ? status.containerStatuses.length
        : 0;

    // Calculate Pod Metrics
    let cpuUsage = '—';
    let ramUsage = '—';
    if (isPod && data.metrics?.containers) {
        const cpuSum = data.metrics.containers.reduce((acc, c) => {
            const val = c.usage?.cpu || '0m';
            if (val.endsWith('n')) return acc + (parseInt(val) / 1000000);
            if (val.endsWith('u')) return acc + (parseInt(val) / 1000);
            if (val.endsWith('m')) return acc + parseInt(val);
            return acc + (parseInt(val) * 1000);
        }, 0);
        cpuUsage = cpuSum >= 1000 ? `${(cpuSum / 1000).toFixed(2)}` : `${Math.round(cpuSum)}m`;

        const ramSum = data.metrics.containers.reduce((acc, c) => {
            const val = c.usage?.memory || '0Ki';
            if (val.endsWith('Ki')) return acc + (parseInt(val) / 1024);
            if (val.endsWith('Mi')) return acc + parseInt(val);
            if (val.endsWith('Gi')) return acc + (parseInt(val) * 1024);
            return acc + (parseInt(val) / (1024 * 1024));
        }, 0);
        ramUsage = ramSum >= 1024 ? `${(ramSum / 1024).toFixed(2)} GiB` : `${Math.round(ramSum)} MiB`;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto w-full flex flex-col min-h-full">
            {/* Header */}
            <div className="flex items-center gap-6 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-white)] hover:border-[var(--accent)]/50 transition-all shadow-sm active:scale-95"
                >
                    <ChevronLeft size={22} />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-[0.2em] leading-none">
                            {kind.replace(/s$/, '')}
                        </span>
                        <h2 className="text-3xl font-black text-[var(--text-white)] tracking-tight">
                            {name}
                        </h2>
                    </div>
                    <p className="text-[var(--text-secondary)] text-xs mt-2 font-medium flex items-center gap-2">
                        {t('label_namespace')} <ChevronRight size={12} className="text-[var(--text-muted)]" />
                        <span className="text-[var(--accent)] font-bold">{namespace === '-' ? t('cluster_scoped') : namespace}</span>
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-2 bg-[var(--bg-sidebar)]/80 p-1 rounded-2xl border border-[var(--border-color)] w-max backdrop-blur-md">
                {[
                    { id: 'overview', label: t('overview'), icon: Info },
                    { id: 'yaml', label: t('yaml'), icon: FileText },
                    { id: 'events', label: t('events'), icon: List },
                    { id: 'logs', label: t('logs'), icon: Terminal, hidden: kind !== 'pods' },
                    { id: 'exec', label: t('terminal'), icon: SquareTerminal, hidden: kind !== 'pods' },
                    { id: 'trace', label: t('trace'), icon: Activity, hidden: !['ingress', 'ingresses', 'services', 'pods'].includes(kind.toLowerCase()) }
                ].filter(t => !t.hidden).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            if (tab.action) tab.action();
                            else setActiveTab(tab.id);
                        }}
                        className={`flex items-center gap-2.5 px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all rounded-xl
                            ${activeTab === tab.id
                                ? 'text-white bg-[var(--accent)] shadow-lg shadow-indigo-500/20'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-white)] hover:bg-white/5'}`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-2 flex-1 flex flex-col pb-8">
                {activeTab === 'overview' && (
                    <>
                        {/* Section: Status Bar */}
                        <div className="bg-[var(--bg-glass)] glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl">
                            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-6 py-4 bg-[var(--bg-sidebar)]/60">
                                <StatusItem label={t('label_status')}>
                                    <div className={`flex items-center gap-1.5 ${(status.phase === 'Running' || status.phase === 'Active' || status.phase === 'Succeeded' || data.resource?.status === 'Running') ? 'text-success' : 'text-warning'}`}>
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${(status.phase === 'Running' || status.phase === 'Active' || status.phase === 'Succeeded' || data.resource?.status === 'Running') ? 'bg-success' : 'bg-warning'}`} />
                                        <span>{t(status.phase?.toLowerCase()) || t(data.resource?.status?.toLowerCase()) || status.phase || data.resource?.status || t('unknown')}</span>
                                    </div>
                                </StatusItem>

                                {isPod && (
                                    <StatusItem label={t('label_ready')}>
                                        <div className="flex flex-col ml-1">
                                            <span className={readyCount === totalContainers ? 'text-success' : 'text-warning'}>
                                                {readyCount}/{totalContainers}
                                            </span>
                                        </div>
                                    </StatusItem>
                                )}

                                {isPod && (
                                    <StatusItem label={t('label_restarts')}>
                                        <span className={restarts > 0 ? 'text-warning' : 'text-[var(--text-white)]'}>
                                            {restarts}
                                        </span>
                                    </StatusItem>
                                )}

                                {isPod && (
                                    <>
                                        <StatusItem label="CPU">
                                            <span className="text-info font-mono">{cpuUsage}</span>
                                        </StatusItem>
                                        <StatusItem label="RAM">
                                            <span className="text-teal-400 font-mono">{ramUsage}</span>
                                        </StatusItem>
                                    </>
                                )}

                                <StatusItem label={t('label_age')}>
                                    <span className="text-[var(--text-white)]">{data.resource?.age || '—'}</span>
                                </StatusItem>

                                {(status.availableReplicas !== undefined || spec.replicas !== undefined) && (
                                    <StatusItem label={t('replicas')}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-success" title={t('label_ready')}>{status.readyReplicas || status.availableReplicas || 0}</span>
                                            <span className="text-[var(--text-muted)]">/</span>
                                            <span className="text-[var(--text-white)]" title={t('desired')}>{spec.replicas || 0}</span>
                                        </div>
                                    </StatusItem>
                                )}

                                {status.loadBalancer?.ingress?.length > 0 && (
                                    <StatusItem label={t('label_ip_external')}>
                                        <span className="text-info font-mono text-sm">
                                            {status.loadBalancer.ingress[0].ip || status.loadBalancer.ingress[0].hostname}
                                        </span>
                                    </StatusItem>
                                )}

                                {spec.clusterIP && (
                                    <StatusItem label={t('label_ip_cluster')}>
                                        <span className="text-[var(--text-secondary)] font-mono text-sm">{spec.clusterIP}</span>
                                    </StatusItem>
                                )}

                                {isPod && spec.nodeName && (
                                    <StatusItem label={t('label_node')}>
                                        <span className="text-[var(--text-white)] font-mono text-sm">{spec.nodeName}</span>
                                    </StatusItem>
                                )}
                            </div>
                        </div>

                        {/* Section: Metadata */}
                        <DetailSection title={t('metadata')}>
                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-600">
                                <div>
                                    <table className="w-full text-sm text-left border-collapse">
                                        <tbody className="divide-y divide-slate-600">
                                            <DetailRow label={t('label_name')} value={name} />
                                            <DetailRow label={t('label_created')} value={new Date(metadata.creationTimestamp).toLocaleString()} />
                                            <DetailRow label={t('label_labels')}>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {Object.entries(metadata.labels || {}).slice(0, settings.labelsLimit).map(([k, v]) => (
                                                        <span key={k} className="px-2 py-0.5 bg-info/10 border border-info/20 rounded text-sm text-info font-mono">
                                                            {k}: {v}
                                                        </span>
                                                    ))}
                                                    {Object.entries(metadata.labels || {}).length > settings.labelsLimit && (
                                                        <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)]/50 px-2 py-1 rounded border border-[var(--border-color)] self-center">
                                                            + {Object.entries(metadata.labels || {}).length - settings.labelsLimit} {t('more')}
                                                        </span>
                                                    )}
                                                </div>
                                            </DetailRow>
                                        </tbody>
                                    </table>
                                </div>
                                <div>
                                    <table className="w-full text-sm text-left border-collapse">
                                        <tbody className="divide-y divide-slate-600">
                                            <DetailRow label={t('label_namespace')} value={namespace === '-' ? '—' : namespace} />
                                            <DetailRow label={t('label_uid')} value={metadata.uid} />
                                            <DetailRow label={t('label_annotations')}>
                                                <div className="space-y-1">
                                                    {Object.entries(metadata.annotations || {}).map(([k, v]) => (
                                                        <div key={k} className="text-sm font-mono text-[var(--text-secondary)]">
                                                            <span className="text-info">{k}</span>: {v}
                                                        </div>
                                                    ))}
                                                    {Object.entries(metadata.labels || {}).length > settings.labelsLimit && (
                                                        <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-muted)]/50 px-2 py-1 rounded-md border border-[var(--border-color)] self-center">
                                                            + {Object.entries(metadata.labels || {}).length - settings.labelsLimit} {t('more')}
                                                        </span>
                                                    )}
                                                </div>
                                            </DetailRow>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </DetailSection>

                        {/* Section: Resource Info (Spec) */}
                        <DetailSection title={t('resource_info')}>
                            <table className="w-full text-sm text-left border-collapse">
                                <tbody className="divide-y divide-slate-600">
                                    {spec.strategy?.type && <DetailRow label={t('strategy')} value={spec.strategy.type} />}
                                    {spec.clusterIP && <DetailRow label={t('label_ip_cluster')} value={spec.clusterIP} />}

                                    {mountedConfigMaps.length > 0 && (
                                        <DetailRow label="ConfigMaps">
                                            <div className="flex flex-wrap gap-2">
                                                {mountedConfigMaps.map(cm => (
                                                    <span key={cm} className="px-2 py-0.5 bg-warning/10 border border-warning/20 rounded text-sm text-warning font-mono">
                                                        {cm}
                                                    </span>
                                                ))}
                                            </div>
                                        </DetailRow>
                                    )}

                                    {mountedSecrets.length > 0 && (
                                        <DetailRow label="Secrets">
                                            <div className="flex flex-wrap gap-2">
                                                {mountedSecrets.map(s => (
                                                    <span key={s} className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-sm text-purple-400 font-mono">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </DetailRow>
                                    )}


                                    {(spec.selector?.matchLabels || spec.selector) && (
                                        <DetailRow label={t('label_selector')}>
                                            <div className="flex flex-wrap gap-1.5">
                                                {Object.entries(spec.selector?.matchLabels || spec.selector || {}).map(([k, v]) => (
                                                    <span key={k} className="px-2 py-0.5 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded text-sm text-[var(--text-secondary)]">
                                                        {k}: {v}
                                                    </span>
                                                ))}
                                            </div>
                                        </DetailRow>
                                    )}

                                    <DetailRow label={t('containers')}>
                                        <div className="space-y-4">
                                            {(isPod ? (spec.containers || []) : (spec.template?.spec?.containers || [])).map(c => (
                                                <div key={c.name} className="p-4 bg-[var(--bg-muted)]/30 rounded-lg border border-[var(--border-color)]/50">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="font-bold text-[var(--text-white)] flex items-center gap-2">
                                                            <Terminal size={12} className="text-info" />
                                                            {c.name}
                                                        </span>
                                                        <span className="text-sm font-mono text-[var(--text-muted)] bg-black/30 px-2 py-0.5 rounded">
                                                            {c.image}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                                        <div>
                                                            <p className="text-[var(--text-muted)] mb-1">{t('label_port')}s</p>
                                                            <div className="font-mono text-info">
                                                                {c.ports?.map(p => `${p.containerPort || p.port}/${p.protocol || 'TCP'}`).join(', ') || '—'}
                                                            </div>
                                                        </div>
                                                        {(c.resources?.requests || c.resources?.limits) && (
                                                            <div>
                                                                <p className="text-[var(--text-muted)] mb-1">{t('usage_metrics')}</p>
                                                                <div className="font-mono text-[var(--text-secondary)]">
                                                                    {c.resources.requests && `Requests: cpu=${c.resources.requests.cpu}, mem=${c.resources.requests.memory}`}
                                                                    {c.resources.requests && c.resources.limits && <br />}
                                                                    {c.resources.limits && `Limits: cpu=${c.resources.limits.cpu}, mem=${c.resources.limits.memory}`}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-[var(--border-color)]/30">
                                                        <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">{t('health_probes')}</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <ProbeDetail label={t('liveness')} probe={c.livenessProbe} t={t} />
                                                            <ProbeDetail label={t('readiness')} probe={c.readinessProbe} t={t} />
                                                            <ProbeDetail label={t('startup')} probe={c.startupProbe} t={t} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {!(isPod ? (spec.containers) : (spec.template?.spec?.containers)) && (
                                                <div className="text-[var(--text-muted)] italic">No container information available</div>
                                            )}
                                        </div>
                                    </DetailRow>
                                </tbody>
                            </table>
                        </DetailSection>

                        {/* Section: Conditions */}
                        {(status.conditions || []).length > 0 && (
                            <DetailSection title={t('status_conditions')}>
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="text-xs text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b-2 border-slate-600">
                                        <tr>
                                            <th className="px-6 py-3">{t('type')}</th>
                                            <th className="px-6 py-3">{t('label_status')}</th>
                                            <th className="px-6 py-3">{t('last_transition')}</th>
                                            <th className="px-6 py-3">{t('reason')}</th>
                                            <th className="px-6 py-3">{t('message')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)]">
                                        {status.conditions.map(c => (
                                            <tr key={c.type} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-medium text-[var(--text-white)]">{c.type}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${c.status === 'True' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-[var(--text-secondary)]">{new Date(c.lastTransitionTime).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-[var(--text-secondary)]">{c.reason}</td>
                                                <td className="px-6 py-4 text-[var(--text-secondary)] max-w-md break-words">{c.message}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </DetailSection>
                        )}

                        {mountedPvcs.length > 0 && (
                            <DetailSection title={t('mounted_pvcs')} className="mt-4">
                                <div className="p-4 flex flex-wrap gap-3">
                                    {mountedPvcs.map(pvc => (
                                        <div key={pvc} className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-muted)]/30 border border-[var(--border-color)]/50 rounded-xl hover:border-info/50 transition-all group">
                                            <div className="p-2 rounded-lg bg-info/10 text-info group-hover:scale-110 transition-transform">
                                                <Clipboard size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs uppercase font-black text-[var(--text-muted)] tracking-wider">{t('mounted_pvc')}</span>
                                                <span className="text-sm font-mono text-[var(--text-white)]">{pvc}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </DetailSection>
                        )}

                        {kind === 'namespaces' && (
                            <>
                                <DetailSection title={t('resource_quotas')} className="mt-4">
                                    <div className="p-4 space-y-4">
                                        {quotas && quotas.length > 0 ? quotas.map(q => (
                                            <div key={q.metadata.name} className="bg-[var(--bg-muted)]/30 rounded-lg border border-[var(--border-color)]/50 p-4">
                                                <h4 className="font-bold text-[var(--accent)] mb-3 flex items-center gap-2">
                                                    <Activity size={14} /> {q.metadata.name}
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                                    {Object.entries(q.status?.hard || {}).map(([res, hard]) => {
                                                        const used = q.status?.used?.[res] || '0';
                                                        return (
                                                            <div key={res} className="flex flex-col gap-1">
                                                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                                                    <span>{res}</span>
                                                                    <span>{used} / {hard}</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-indigo-500 rounded-full"
                                                                        style={{ width: `${Math.min(100, (parseFloat(used) / parseFloat(hard)) * 100 || 0)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-[var(--text-muted)] italic text-sm">{t('no_resource_quotas_found') || 'No resource quotas defined.'}</p>
                                        )}
                                    </div>
                                </DetailSection>

                                <DetailSection title={t('limit_ranges')} className="mt-4">
                                    <div className="p-4 space-y-4">
                                        {limits && limits.length > 0 ? limits.map(l => (
                                            <div key={l.metadata.name} className="bg-[var(--bg-muted)]/30 rounded-lg border border-[var(--border-color)]/50 p-4 overflow-x-auto">
                                                <h4 className="font-bold text-[var(--accent)] mb-3 flex items-center gap-2">
                                                    <Info size={14} /> {l.metadata.name}
                                                </h4>
                                                <table className="w-full text-xs text-left">
                                                    <thead className="text-xs text-[var(--text-muted)] uppercase tracking-wider bg-black/20 border-b-2 border-slate-600">
                                                        <tr>
                                                            <th className="px-3 py-2">{t('type')}</th>
                                                            <th className="px-3 py-2">{t('usage_metrics')}</th>
                                                            <th className="px-3 py-2">Min</th>
                                                            <th className="px-3 py-2">Max</th>
                                                            <th className="px-3 py-2">Default</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[var(--border-color)]/20">
                                                        {l.spec?.limits?.map((lim, idx) => (
                                                            <tr key={idx}>
                                                                <td className="px-3 py-2 font-bold text-[var(--text-white)]">{lim.type}</td>
                                                                <td className="px-3 py-2 text-[var(--text-secondary)]">CPU/Memory</td>
                                                                <td className="px-3 py-2 text-info font-mono">{lim.min?.cpu || lim.min?.memory || '-'}</td>
                                                                <td className="px-3 py-2 text-error font-mono">{lim.max?.cpu || lim.max?.memory || '-'}</td>
                                                                <td className="px-3 py-2 text-[var(--text-muted)] font-mono">{lim.default?.cpu || lim.default?.memory || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )) : (
                                            <p className="text-[var(--text-muted)] italic text-sm">{t('no_limit_ranges_found') || 'No limit ranges defined.'}</p>
                                        )}
                                    </div>
                                </DetailSection>
                            </>
                        )}

                        {/* Section: Recent Events */}
                        <DetailSection title={t('recent_events')} className="mt-4">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-xs text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b-2 border-slate-600">
                                    <tr>
                                        <th className="px-6 py-3">{t('type')}</th>
                                        <th className="px-6 py-3">{t('reason')}</th>
                                        <th className="px-6 py-3">{t('message')}</th>
                                        <th className="px-6 py-3">{t('label_age')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {events && events.length > 0 ? events.slice(0, 10).map((e, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${e.type === 'Warning' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                                                    {e.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-[var(--text-white)]">{e.reason}</td>
                                            <td className="px-6 py-4 text-[var(--text-secondary)] max-w-md break-words">{e.message}</td>
                                            <td className="px-6 py-4 text-[var(--text-muted)] whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={12} />
                                                    {e.age}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-[var(--text-muted)]">
                                                {t('no_events')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </DetailSection>
                    </>
                )}

                {activeTab === 'yaml' && (
                    <div className="bg-[var(--bg-glass)] glass rounded-2xl border border-[var(--border-color)] overflow-hidden flex flex-col flex-none">
                        <div className="flex items-center justify-between px-4 py-2 bg-[var(--text-white)]/5 border-b border-[var(--border-color)]/20">
                            <div className="flex items-center gap-4">
                                <span className="text-xs uppercase font-bold text-[var(--text-muted)] tracking-widest">
                                    {isEditing ? t('edit_manifest', { format: format.toUpperCase() }) : `${format.toUpperCase()} ${t('manifest') || 'Manifest'}`}
                                </span>
                                {!isEditing && (
                                    <div className="flex bg-black/30 rounded p-0.5">
                                        <button
                                            onClick={() => setFormat('yaml')}
                                            className={`px-2 py-0.5 text-xs font-bold rounded ${format === 'yaml' ? 'bg-info/20 text-info' : 'text-[var(--text-muted)] hover:text-[var(--text-white)]'}`}
                                        >
                                            YAML
                                        </button>
                                        <button
                                            onClick={() => setFormat('json')}
                                            className={`px-2 py-0.5 text-xs font-bold rounded ${format === 'json' ? 'bg-info/20 text-info' : 'text-[var(--text-muted)] hover:text-[var(--text-white)]'}`}
                                        >
                                            JSON
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {saveError && <span className="text-xs text-error mr-2">{saveError}</span>}
                                {canEdit && !isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-xs font-bold px-3 py-1 bg-info/10 text-info rounded hover:bg-info/20 transition-colors uppercase tracking-widest"
                                    >
                                        {t('edit_manifest', { format: format.toUpperCase() })}
                                    </button>
                                )}
                                {isEditing && (
                                    <>
                                        <button
                                            onClick={() => { setIsEditing(false); setEditedYaml(yaml); setSaveError(null); }}
                                            className="text-xs font-bold px-3 py-1 text-[var(--text-muted)] hover:text-[var(--text-white)] transition-colors uppercase tracking-widest"
                                            disabled={isSaving}
                                        >
                                            {t('cancel')}
                                        </button>
                                        <button
                                            onClick={async () => {
                                                setIsSaving(true);
                                                setSaveError(null);
                                                try {
                                                    const nsPath = namespace ? `/${namespace}` : '/-';
                                                    const res = await fetch(`/api/resources/${kind}${nsPath}/${name}/yaml`, {
                                                        method: 'PUT',
                                                        body: editedYaml
                                                    });
                                                    if (!res.ok) {
                                                        const errData = await res.json();
                                                        throw new Error(errData.error || 'Failed to save');
                                                    }
                                                    setYaml(editedYaml);
                                                    setIsEditing(false);
                                                } catch (e) {
                                                    setSaveError(e.message);
                                                } finally {
                                                    setIsSaving(false);
                                                }
                                            }}
                                            className="text-xs font-bold px-3 py-1 bg-success/20 text-success rounded hover:bg-success/30 transition-colors uppercase tracking-widest flex items-center gap-1.5"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? <Activity size={10} className="animate-pulse" /> : <CheckCircle2 size={10} />}
                                            {isSaving ? t('saving') : t('save_changes')}
                                        </button>
                                    </>
                                )}
                                {!isEditing && (
                                    <button className="text-[var(--text-muted)] hover:text-[var(--text-white)] transition-colors">
                                        <Clipboard size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <CodeEditor
                            value={isEditing ? editedYaml : yaml}
                            onChange={isEditing ? setEditedYaml : null}
                            readOnly={!isEditing}
                        />
                    </div>
                )}

                {activeTab === 'events' && (
                    <DetailSection title={t('recent_events')} className="flex-1 min-h-[400px]">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-xs text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b-2 border-slate-600">
                                <tr>
                                    <th className="px-6 py-3">{t('type')}</th>
                                    <th className="px-6 py-3">{t('reason')}</th>
                                    <th className="px-6 py-3">{t('message')}</th>
                                    <th className="px-6 py-3">{t('label_age')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {events && events.length > 0 ? events.map((e, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${e.type === 'Warning' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                                                {e.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-[var(--text-white)]">{e.reason}</td>
                                        <td className="px-6 py-4 text-[var(--text-secondary)] max-w-md break-words">{e.message}</td>
                                        <td className="px-6 py-4 text-[var(--text-muted)] whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={12} />
                                                {e.age}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-[var(--text-muted)]">
                                            {t('no_events')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </DetailSection>
                )}

                {activeTab === 'logs' && (() => {
                    const allLines = logs.split('\n');
                    const filteredLines = allLines.filter(line => {
                        if (!logSearchTerm) return true;
                        if (logSearchRegex) {
                            try {
                                const re = new RegExp(logSearchTerm, 'i');
                                return re.test(line);
                            } catch (e) {
                                return line.toLowerCase().includes(logSearchTerm.toLowerCase());
                            }
                        }
                        return line.toLowerCase().includes(logSearchTerm.toLowerCase());
                    });

                    const totalPages = Math.ceil(filteredLines.length / logLinesPerPage);
                    const displayedLines = logPaginationEnabled
                        ? filteredLines.slice((logPage - 1) * logLinesPerPage, logPage * logLinesPerPage)
                        : filteredLines;

                    return (
                        <div className="bg-[var(--bg-glass)] glass rounded-2xl border border-[var(--border-color)] overflow-hidden flex flex-col flex-1 min-h-[500px]">
                            {/* Log Toolbar */}
                            <div className="px-4 py-3 bg-[var(--text-white)]/5 border-b-2 border-slate-600 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-info transition-colors" />
                                        <input
                                            type="text"
                                            placeholder={t('search_logs')}
                                            value={logSearchTerm}
                                            onChange={(e) => { setLogSearchTerm(e.target.value); setLogPage(1); }}
                                            className="pl-9 pr-4 py-1.5 bg-slate-800 border border-[var(--border-color)]/50 rounded-md text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-info/50 w-64 transition-all"
                                        />
                                        <button
                                            onClick={() => setLogSearchRegex(!logSearchRegex)}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-xs font-black border transition-colors ${logSearchRegex ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-transparent text-white/50 border-transparent hover:text-white'}`}
                                            title={t('regex_tooltip')}
                                        >
                                            .*
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 bg-slate-200/50 p-1 rounded-md border border-slate-300">
                                        <span className="text-xs uppercase font-black text-black pl-2">{t('refresh')}</span>
                                        <select
                                            value={logRefreshInterval}
                                            onChange={(e) => setLogRefreshInterval(parseInt(e.target.value))}
                                            className="bg-slate-800 text-xs font-bold text-white outline-none rounded px-2 py-0.5 cursor-pointer border border-slate-600"
                                        >
                                            <option value="0">OFF</option>
                                            <option value="5">5s</option>
                                            <option value="10">10s</option>
                                            <option value="15">15s</option>
                                            <option value="30">30s</option>
                                            <option value="60">60s</option>
                                        </select>
                                    </div>

                                    {spec?.containers?.length > 1 && (
                                        <div className="flex items-center gap-2 bg-black/20 p-1 rounded-md border border-[var(--border-color)]/30 ml-2">
                                            <span className="text-xs uppercase font-bold text-[var(--text-muted)] pl-2">{t('label_container')}</span>
                                            <select
                                                value={logContainer}
                                                onChange={(e) => {
                                                    setLogContainer(e.target.value);
                                                    setLogPage(1);
                                                    setLogs('');
                                                }}
                                                className="bg-transparent text-xs font-bold text-info outline-none pr-1 px-2 py-0.5 cursor-pointer"
                                            >
                                                {spec.containers.map(c => (
                                                    <option key={c.name} value={c.name}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div
                                            className={`w-8 h-4 rounded-full relative transition-colors ${logWrapLines ? 'bg-info' : 'bg-slate-700'}`}
                                            onClick={() => setLogWrapLines(!logWrapLines)}
                                        >
                                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${logWrapLines ? 'translate-x-4' : ''}`} />
                                        </div>
                                        <span className="text-xs uppercase font-bold text-[var(--text-muted)] group-hover:text-[var(--text-white)] transition-colors">{t('wrap_lines')}</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div
                                            className={`w-8 h-4 rounded-full relative transition-colors ${logPaginationEnabled ? 'bg-info' : 'bg-slate-700'}`}
                                            onClick={() => setLogPaginationEnabled(!logPaginationEnabled)}
                                        >
                                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${logPaginationEnabled ? 'translate-x-4' : ''}`} />
                                        </div>
                                        <span className="text-xs uppercase font-bold text-[var(--text-muted)] group-hover:text-[var(--text-white)] transition-colors">{t('pagination')}</span>
                                    </label>

                                    {logPaginationEnabled && totalPages > 1 && (
                                        <div className="flex items-center gap-1 bg-black/30 rounded px-2 py-1 border border-[var(--border-color)]/30">
                                            <button
                                                disabled={logPage === 1}
                                                onClick={() => setLogPage(1)}
                                                className="p-0.5 text-[var(--text-muted)] hover:text-info disabled:opacity-30 disabled:hover:text-[var(--text-muted)] transition-colors"
                                                title={t('first_page')}
                                            >
                                                <ChevronsLeft size={14} />
                                            </button>
                                            <button
                                                disabled={logPage === 1}
                                                onClick={() => setLogPage(p => Math.max(1, p - 1))}
                                                className="p-0.5 text-[var(--text-muted)] hover:text-info disabled:opacity-30 disabled:hover:text-[var(--text-muted)] transition-colors"
                                                title={t('prev_page')}
                                            >
                                                <ChevronLeft size={14} />
                                            </button>
                                            <span className="text-xs font-mono text-white font-bold px-1 min-w-[4rem] text-center">
                                                {logPage} / {totalPages}
                                            </span>
                                            <button
                                                disabled={logPage === totalPages}
                                                onClick={() => setLogPage(p => Math.min(totalPages, p + 1))}
                                                className="p-0.5 text-[var(--text-muted)] hover:text-info disabled:opacity-30 disabled:hover:text-[var(--text-muted)] transition-colors"
                                                title={t('next_page')}
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                            <button
                                                disabled={logPage === totalPages}
                                                onClick={() => setLogPage(totalPages)}
                                                className="p-0.5 text-[var(--text-muted)] hover:text-info disabled:opacity-30 disabled:hover:text-[var(--text-muted)] transition-colors"
                                                title={t('last_page')}
                                            >
                                                <ChevronsRight size={14} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="text-[var(--text-muted)] text-xs font-mono flex items-center gap-3">
                                        <span className="flex items-center gap-1.5 text-info font-bold">
                                            <List size={10} />
                                            {filteredLines.length} {t('matches')}
                                        </span>
                                        {logRefreshInterval > 0 && (
                                            <span className="flex items-center gap-1.5 text-success font-bold animate-pulse">
                                                <RefreshCw size={10} className="animate-spin-slow" />
                                                {t('live')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Log Display */}
                            <div className={`flex-1 pt-2 px-6 pb-6 font-mono text-xs overflow-auto scrollbar-thin scrollbar-thumb-[var(--border-color)] bg-[var(--bg-editor)] ${logWrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}>
                                {displayedLines.length > 0 ? (
                                    displayedLines.map((line, i) => {
                                        // Simple syntax highlighting hint (can be expanded)
                                        const isError = /error|fail|severe/i.test(line);
                                        const isWarn = /warn|attention/i.test(line);
                                        const isInfo = /info|success/i.test(line);

                                        return (
                                            <div key={i} className={`hover:bg-[var(--bg-muted)] px-2 -mx-2 transition-colors ${isError ? 'text-error' : isWarn ? 'text-warning' : isInfo ? 'text-info' : 'text-[var(--text-secondary)]'}`}>
                                                {line}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-3 italic">
                                        <Search size={32} className="opacity-20" />
                                        {logSearchTerm ? t('no_logs_matching') : t('no_logs_found')}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {activeTab === 'exec' && (
                    <PodTerminal
                        pod={name}
                        namespace={namespace !== '-' ? namespace : ''}
                        containers={isPod ? (spec?.containers || []) : (spec?.template?.spec?.containers || [])}
                    />
                )}
                {activeTab === 'trace' && (
                    <NetworkTrace
                        kind={kind === 'ingresses' ? 'ingress' : kind === 'services' ? 'service' : kind === 'pods' ? 'pod' : kind}
                        namespace={namespace !== '-' ? namespace : ''}
                        name={name}
                    />
                )}
            </div>
        </div>
    );
}

function StatusItem({ label, value, children }) {
    return (
        <div className="flex flex-col gap-1 min-w-[100px]">
            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{label}</span>
            <div className="text-base font-bold text-[var(--text-white)] flex items-center min-h-[1.5rem] tracking-tight">
                {children || (value ?? '—')}
            </div>
        </div>
    );
}

function DetailSection({ title, children, className = "" }) {
    return (
        <div className={`bg-[var(--bg-glass)] glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl flex flex-col ${className}`}>
            <div className="px-6 py-3 border-b-2 border-slate-600 bg-[var(--bg-sidebar)]/30 flex-shrink-0">
                <h3 className="text-xs font-black text-[var(--accent)] uppercase tracking-[0.2em]">{title}</h3>
            </div>
            <div className="overflow-auto flex-1">
                {children}
            </div>
        </div>
    );
}

function DetailRow({ label, value, children }) {
    return (
        <tr className="group border-b border-slate-600">
            <td className="px-4 py-3 w-48 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-sidebar)]/10">
                {label}
            </td>
            <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                {children || (
                    <span className={label === 'UID' || label === 'Name' ? 'font-mono text-info' : 'text-[var(--text-white)]'}>
                        {value ?? '—'}
                    </span>
                )}
            </td>
        </tr>
    );
}

function CodeEditor({ value, onChange, readOnly }) {
    const lines = value.split('\n');
    const lineCount = lines.length;
    const LINE_HEIGHT = '1.4rem';

    return (
        <div className="bg-[var(--bg-main)]/20 border-t border-[var(--border-color)]/20 overflow-hidden flex flex-col" style={{ maxHeight: '70vh' }}>
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-[var(--border-color)] flex items-start">
                {/* Gutter */}
                <div
                    className="sticky left-0 z-10 w-12 flex-shrink-0 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)]/20 py-4 font-mono text-xs text-[var(--text-muted)] text-right pr-3 select-none"
                >
                    {lines.map((_, i) => (
                        <div key={i} style={{ height: LINE_HEIGHT, lineHeight: LINE_HEIGHT }}>{i + 1}</div>
                    ))}
                </div>

                {/* Text Area / Code View */}
                {readOnly ? (
                    <pre
                        className="flex-1 p-4 font-mono text-xs text-[var(--text-editor-code)] whitespace-pre"
                        style={{ lineHeight: LINE_HEIGHT }}
                    >
                        {value}
                    </pre>
                ) : (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="flex-1 p-4 font-mono text-xs bg-transparent text-[var(--text-editor-code)] outline-none resize-none focus:ring-0 overflow-hidden"
                        spellCheck="false"
                        rows={lineCount}
                        style={{ lineHeight: LINE_HEIGHT, display: 'block' }}
                    />
                )}
            </div>
        </div >
    );
}

function ConditionBadge({ label, status }) {
    const isTrue = status === 'True';
    return (
        <div className="flex items-center gap-1.5 py-1">
            {isTrue ? (
                <CheckCircle2 size={12} className="text-success" />
            ) : (
                <AlertCircle size={12} className="text-warning" />
            )}
            <span className="text-xs text-[var(--text-secondary)]">{label}</span>
        </div>
    );
}

function ProbeDetail({ label, probe, t }) {
    if (!probe) return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
            <span className="text-[var(--text-muted)] italic">{t('not_defined')}</span>
        </div>
    );

    let details = '';
    if (probe.httpGet) details = `HTTP ${probe.httpGet.port} ${probe.httpGet.path}`;
    else if (probe.tcpSocket) details = `TCP ${probe.tcpSocket.port}`;
    else if (probe.exec) details = `Exec ${probe.exec.command?.join(' ')}`;
    else if (probe.grpc) details = `GRPC ${probe.grpc.port || ''} ${probe.grpc.service || ''}`;

    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-[var(--text-white)] uppercase tracking-wider">{label}</span>
            <div className="text-sm font-mono text-info bg-info/10 p-1.5 rounded border border-info/20">
                {details || 'Unknown'}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1 flex flex-wrap gap-x-3">
                <span>{t('delay')}: {probe.initialDelaySeconds || 0}s</span>
                <span>{t('timeout')}: {probe.timeoutSeconds || 1}s</span>
                <span>{t('period')}: {probe.periodSeconds || 10}s</span>
            </div>
        </div>
    );
}
