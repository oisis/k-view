import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronLeft, FileText, List, Terminal, Search, RefreshCw, ChevronRight,
    Info, Clipboard, CheckCircle2, AlertCircle, Clock, Activity, SquareTerminal,
    ChevronRight as ChevronRightIcon
} from 'lucide-react';
import NetworkTraceModal from './NetworkTraceModal';
import TerminalModal from './TerminalModal';

export default function ResourceDetails({ user }) {
    const { kind, namespace, name } = useParams();
    const navigate = useNavigate();
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
    const [traceModalOpen, setTraceModalOpen] = useState(false);
    const [terminalModalOpen, setTerminalModalOpen] = useState(false);
    const [quotas, setQuotas] = useState([]);
    const [limits, setLimits] = useState([]);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    // Logs enhancements state
    const [logRefreshInterval, setLogRefreshInterval] = useState(0); // in seconds
    const [logSearchTerm, setLogSearchTerm] = useState('');
    const [logSearchRegex, setLogSearchRegex] = useState(false);
    const [logPaginationEnabled, setLogPaginationEnabled] = useState(true);
    const [logPage, setLogPage] = useState(1);
    const [logLinesPerPage] = useState(100);
    const [logContainer, setLogContainer] = useState('');

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
                setTerminalModalOpen(true);
            }
        }
    }, [loading, data, searchParams, canEdit, kind]);

    if (loading) return <div className="p-8 text-[var(--text-secondary)]">Loading resource...</div>;
    if (error) return <div className="p-8 text-red-400">Error: {error}</div>;
    if (!data) return <div className="p-8 text-[var(--text-muted)]">Resource not found</div>;

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
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-[0.2em] leading-none">
                            {kind.replace(/s$/, '')}
                        </span>
                        <h2 className="text-3xl font-black text-[var(--text-white)] tracking-tight">
                            {name}
                        </h2>
                    </div>
                    <p className="text-[var(--text-secondary)] text-xs mt-2 font-medium flex items-center gap-2">
                        Namespace <ChevronRight size={12} className="text-[var(--text-muted)]" />
                        <span className="text-[var(--accent)] font-bold">{namespace === '-' ? 'Cluster-scoped' : namespace}</span>
                    </p>
                </div>
                {(kind === 'ingress' || kind === 'ingresses' || kind === 'services' || kind === 'pods') && (
                    <button
                        onClick={() => setTraceModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                    >
                        <Activity size={16} />
                        Visual Trace
                    </button>
                )}
                {kind === 'pods' && (
                    <button
                        onClick={() => setTerminalModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 ml-2"
                    >
                        <SquareTerminal size={16} />
                        Exec Terminal
                    </button>
                )}
            </div>

            <NetworkTraceModal
                isOpen={traceModalOpen}
                onClose={() => setTraceModalOpen(false)}
                kind={kind === 'ingresses' ? 'ingress' : kind === 'services' ? 'service' : kind === 'pods' ? 'pod' : kind}
                namespace={namespace !== '-' ? namespace : ''}
                name={name}
            />

            <TerminalModal
                isOpen={terminalModalOpen}
                onClose={() => setTerminalModalOpen(false)}
                pod={name}
                namespace={namespace !== '-' ? namespace : ''}
                containers={isPod ? (spec?.containers || []) : (spec?.template?.spec?.containers || [])}
            />

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-2 bg-[var(--bg-sidebar)]/30 p-1 rounded-2xl border border-[var(--border-color)] w-max">
                {[
                    { id: 'overview', label: 'Overview', icon: Info },
                    { id: 'yaml', label: 'YAML', icon: FileText },
                    { id: 'events', label: 'Events', icon: List },
                    { id: 'logs', label: 'Logs', icon: Terminal, hidden: kind !== 'pods' }
                ].filter(t => !t.hidden).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2.5 px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all rounded-xl
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
                            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-6 py-4 bg-[var(--bg-sidebar)]/20">
                                <StatusItem label="Status">
                                    <div className={`flex items-center gap-1.5 ${(status.phase === 'Running' || status.phase === 'Active' || status.phase === 'Succeeded' || data.resource?.status === 'Running') ? 'text-green-400' : 'text-yellow-400'}`}>
                                        <Activity size={14} />
                                        {data.resource?.status || status.phase || 'Unknown'}
                                    </div>
                                </StatusItem>

                                {isPod && (
                                    <StatusItem label="Ready">
                                        <span className={readyCount === totalContainers ? 'text-green-400' : 'text-yellow-400'}>
                                            {readyCount}/{totalContainers}
                                        </span>
                                    </StatusItem>
                                )}

                                {isPod && (
                                    <StatusItem label="Restarts">
                                        <span className={restarts > 0 ? 'text-yellow-400' : 'text-[var(--text-white)]'}>
                                            {restarts}
                                        </span>
                                    </StatusItem>
                                )}

                                {isPod && (
                                    <>
                                        <StatusItem label="CPU">
                                            <span className="text-blue-400 font-mono">{cpuUsage}</span>
                                        </StatusItem>
                                        <StatusItem label="RAM">
                                            <span className="text-teal-400 font-mono">{ramUsage}</span>
                                        </StatusItem>
                                    </>
                                )}

                                <StatusItem label="Age">
                                    <span className="text-[var(--text-white)]">{data.resource?.age || '—'}</span>
                                </StatusItem>

                                {(status.availableReplicas !== undefined || spec.replicas !== undefined) && (
                                    <StatusItem label="Replicas">
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-400" title="Ready">{status.readyReplicas || status.availableReplicas || 0}</span>
                                            <span className="text-[var(--text-muted)]">/</span>
                                            <span className="text-[var(--text-white)]" title="Desired">{spec.replicas || 0}</span>
                                        </div>
                                    </StatusItem>
                                )}

                                {status.loadBalancer?.ingress?.length > 0 && (
                                    <StatusItem label="External IP">
                                        <span className="text-blue-300 font-mono text-xs">
                                            {status.loadBalancer.ingress[0].ip || status.loadBalancer.ingress[0].hostname}
                                        </span>
                                    </StatusItem>
                                )}

                                {spec.clusterIP && (
                                    <StatusItem label="Cluster IP">
                                        <span className="text-[var(--text-secondary)] font-mono text-xs">{spec.clusterIP}</span>
                                    </StatusItem>
                                )}

                                {(status.conditions || []).length > 0 && (
                                    <div className="flex-1 border-l border-[var(--border-color)]/50 pl-12">
                                        <StatusItem label="Conditions">
                                            <div className="flex flex-wrap gap-3">
                                                {status.conditions.slice(0, 4).map(c => (
                                                    <ConditionBadge key={c.type} label={c.type} status={c.status} />
                                                ))}
                                            </div>
                                        </StatusItem>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section: Metadata */}
                        <DetailSection title="Metadata">
                            <table className="w-full text-sm text-left border-collapse">
                                <tbody className="divide-y divide-[var(--border-color)]/30">
                                    <DetailRow label="Name" value={name} />
                                    <DetailRow label="Namespace" value={namespace === '-' ? '—' : namespace} />
                                    <DetailRow label="UID" value={metadata.uid} />
                                    <DetailRow label="Created" value={new Date(metadata.creationTimestamp).toLocaleString()} />
                                    <DetailRow label="Labels">
                                        <div className="flex flex-wrap gap-1.5">
                                            {Object.entries(metadata.labels || {}).map(([k, v]) => (
                                                <span key={k} className="px-2 py-0.5 bg-blue-900/10 border border-blue-800/30 rounded text-[10px] text-blue-300 font-mono">
                                                    {k}: {v}
                                                </span>
                                            ))}
                                        </div>
                                    </DetailRow>
                                    <DetailRow label="Annotations">
                                        <div className="space-y-1">
                                            {Object.entries(metadata.annotations || {}).map(([k, v]) => (
                                                <div key={k} className="text-[10px] font-mono text-[var(--text-secondary)]">
                                                    <span className="text-blue-400/70">{k}</span>: {v}
                                                </div>
                                            ))}
                                        </div>
                                    </DetailRow>
                                </tbody>
                            </table>
                        </DetailSection>

                        {/* Section: Resource Info (Spec) */}
                        <DetailSection title="Resource Info">
                            <table className="w-full text-sm text-left border-collapse">
                                <tbody className="divide-y divide-[var(--border-color)]/30">
                                    {spec.strategy?.type && <DetailRow label="Strategy" value={spec.strategy.type} />}
                                    {spec.clusterIP && <DetailRow label="Cluster IP" value={spec.clusterIP} />}

                                    {mountedConfigMaps.length > 0 && (
                                        <DetailRow label="ConfigMaps">
                                            <div className="flex flex-wrap gap-2">
                                                {mountedConfigMaps.map(cm => (
                                                    <span key={cm} className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-500 font-mono">
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
                                                    <span key={s} className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[10px] text-purple-400 font-mono">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </DetailRow>
                                    )}

                                    {mountedPvcs.length > 0 && (
                                        <DetailRow label="Volumes (PVC)">
                                            <div className="flex flex-wrap gap-2">
                                                {mountedPvcs.map(pvc => (
                                                    <span key={pvc} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-400 font-mono">
                                                        {pvc}
                                                    </span>
                                                ))}
                                            </div>
                                        </DetailRow>
                                    )}

                                    {(spec.selector?.matchLabels || spec.selector) && (
                                        <DetailRow label="Selectors">
                                            <div className="flex flex-wrap gap-1.5">
                                                {Object.entries(spec.selector?.matchLabels || spec.selector || {}).map(([k, v]) => (
                                                    <span key={k} className="px-2 py-0.5 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded text-[10px] text-[var(--text-secondary)]">
                                                        {k}: {v}
                                                    </span>
                                                ))}
                                            </div>
                                        </DetailRow>
                                    )}

                                    <DetailRow label="Containers">
                                        <div className="space-y-4">
                                            {(isPod ? (spec.containers || []) : (spec.template?.spec?.containers || [])).map(c => (
                                                <div key={c.name} className="p-4 bg-[var(--bg-muted)]/30 rounded-lg border border-[var(--border-color)]/50">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="font-bold text-[var(--text-white)] flex items-center gap-2">
                                                            <Terminal size={12} className="text-blue-400" />
                                                            {c.name}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-[var(--text-muted)] bg-black/30 px-2 py-0.5 rounded">
                                                            {c.image}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                                        <div>
                                                            <p className="text-[var(--text-muted)] mb-1">Ports</p>
                                                            <div className="font-mono text-blue-300">
                                                                {c.ports?.map(p => `${p.containerPort || p.port}/${p.protocol || 'TCP'}`).join(', ') || '—'}
                                                            </div>
                                                        </div>
                                                        {(c.resources?.requests || c.resources?.limits) && (
                                                            <div>
                                                                <p className="text-[var(--text-muted)] mb-1">Resources</p>
                                                                <div className="font-mono text-[var(--text-secondary)]">
                                                                    {c.resources.requests && `Requests: cpu=${c.resources.requests.cpu}, mem=${c.resources.requests.memory}`}
                                                                    {c.resources.requests && c.resources.limits && <br />}
                                                                    {c.resources.limits && `Limits: cpu=${c.resources.limits.cpu}, mem=${c.resources.limits.memory}`}
                                                                </div>
                                                            </div>
                                                        )}
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

                        {kind === 'namespaces' && (
                            <>
                                <DetailSection title="Resource Quotas" className="mt-4">
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
                                                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
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
                                            <p className="text-[var(--text-muted)] italic text-sm">No resource quotas defined.</p>
                                        )}
                                    </div>
                                </DetailSection>

                                <DetailSection title="Limit Ranges" className="mt-4">
                                    <div className="p-4 space-y-4">
                                        {limits && limits.length > 0 ? limits.map(l => (
                                            <div key={l.metadata.name} className="bg-[var(--bg-muted)]/30 rounded-lg border border-[var(--border-color)]/50 p-4 overflow-x-auto">
                                                <h4 className="font-bold text-[var(--accent)] mb-3 flex items-center gap-2">
                                                    <Info size={14} /> {l.metadata.name}
                                                </h4>
                                                <table className="w-full text-xs text-left">
                                                    <thead className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider bg-black/20">
                                                        <tr>
                                                            <th className="px-3 py-2">Type</th>
                                                            <th className="px-3 py-2">Resource</th>
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
                                                                <td className="px-3 py-2 text-blue-400 font-mono">{lim.min?.cpu || lim.min?.memory || '-'}</td>
                                                                <td className="px-3 py-2 text-rose-400 font-mono">{lim.max?.cpu || lim.max?.memory || '-'}</td>
                                                                <td className="px-3 py-2 text-[var(--text-muted)] font-mono">{lim.default?.cpu || lim.default?.memory || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )) : (
                                            <p className="text-[var(--text-muted)] italic text-sm">No limit ranges defined.</p>
                                        )}
                                    </div>
                                </DetailSection>
                            </>
                        )}
                    </>
                )}

                {activeTab === 'yaml' && (
                    <div className="bg-[var(--bg-glass)] glass rounded-2xl border border-[var(--border-color)] overflow-hidden flex flex-col flex-1 min-h-[400px]">
                        <div className="flex items-center justify-between px-4 py-2 bg-[var(--text-white)]/5 border-b border-[var(--border-color)]/20">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest">
                                    {isEditing ? `Editing ${format.toUpperCase()}` : `${format.toUpperCase()} Manifest`}
                                </span>
                                {!isEditing && (
                                    <div className="flex bg-black/30 rounded p-0.5">
                                        <button
                                            onClick={() => setFormat('yaml')}
                                            className={`px-2 py-0.5 text-[9px] font-bold rounded ${format === 'yaml' ? 'bg-blue-500/20 text-blue-400' : 'text-[var(--text-muted)] hover:text-[var(--text-white)]'}`}
                                        >
                                            YAML
                                        </button>
                                        <button
                                            onClick={() => setFormat('json')}
                                            className={`px-2 py-0.5 text-[9px] font-bold rounded ${format === 'json' ? 'bg-blue-500/20 text-blue-400' : 'text-[var(--text-muted)] hover:text-[var(--text-white)]'}`}
                                        >
                                            JSON
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {saveError && <span className="text-xs text-red-400 mr-2">{saveError}</span>}
                                {canEdit && !isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-[10px] font-bold px-3 py-1 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors uppercase tracking-widest"
                                    >
                                        Edit {format.toUpperCase()}
                                    </button>
                                )}
                                {isEditing && (
                                    <>
                                        <button
                                            onClick={() => { setIsEditing(false); setEditedYaml(yaml); setSaveError(null); }}
                                            className="text-[10px] font-bold px-3 py-1 text-[var(--text-muted)] hover:text-[var(--text-white)] transition-colors uppercase tracking-widest"
                                            disabled={isSaving}
                                        >
                                            Cancel
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
                                            className="text-[10px] font-bold px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors uppercase tracking-widest flex items-center gap-1.5"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? <Activity size={10} className="animate-pulse" /> : <CheckCircle2 size={10} />}
                                            {isSaving ? 'Saving...' : 'Save Changes'}
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
                    <DetailSection title="Recent Events" className="flex-1 min-h-[400px]">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b border-[var(--border-color)]">
                                <tr>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Reason</th>
                                    <th className="px-6 py-3">Message</th>
                                    <th className="px-6 py-3">Age</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {events && events.length > 0 ? events.map((e, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.type === 'Warning' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
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
                                            No recent events found.
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
                            <div className="px-4 py-3 bg-[var(--text-white)]/5 border-b border-[var(--border-color)]/20 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-blue-400 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search logs..."
                                            value={logSearchTerm}
                                            onChange={(e) => { setLogSearchTerm(e.target.value); setLogPage(1); }}
                                            className="pl-9 pr-4 py-1.5 bg-black/40 border border-[var(--border-color)]/50 rounded-md text-xs text-[var(--text-white)] focus:outline-none focus:border-blue-500/50 w-64 transition-all"
                                        />
                                        <button
                                            onClick={() => setLogSearchRegex(!logSearchRegex)}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[8px] font-bold border transition-colors ${logSearchRegex ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-transparent text-[var(--text-muted)] border-transparent hover:text-[var(--text-white)]'}`}
                                            title="Use Regular Expression"
                                        >
                                            .*
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 bg-black/20 p-1 rounded-md border border-[var(--border-color)]/30">
                                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] pl-2">Refresh</span>
                                        <select
                                            value={logRefreshInterval}
                                            onChange={(e) => setLogRefreshInterval(parseInt(e.target.value))}
                                            className="bg-transparent text-[10px] font-bold text-blue-400 outline-none pr-1 px-2 py-0.5 cursor-pointer"
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
                                            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] pl-2">Container</span>
                                            <select
                                                value={logContainer}
                                                onChange={(e) => {
                                                    setLogContainer(e.target.value);
                                                    setLogPage(1);
                                                    setLogs('');
                                                }}
                                                className="bg-transparent text-[10px] font-bold text-blue-400 outline-none pr-1 px-2 py-0.5 cursor-pointer"
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
                                            className={`w-8 h-4 rounded-full relative transition-colors ${logPaginationEnabled ? 'bg-blue-600' : 'bg-[var(--border-color)]'}`}
                                            onClick={() => setLogPaginationEnabled(!logPaginationEnabled)}
                                        >
                                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${logPaginationEnabled ? 'translate-x-4' : ''}`} />
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] group-hover:text-[var(--text-white)] transition-colors">Pagination</span>
                                    </label>

                                    {logPaginationEnabled && totalPages > 1 && (
                                        <div className="flex items-center gap-2 bg-black/30 rounded px-2 py-1 border border-[var(--border-color)]/30">
                                            <button
                                                disabled={logPage === 1}
                                                onClick={() => setLogPage(p => Math.max(1, p - 1))}
                                                className="p-0.5 text-[var(--text-muted)] hover:text-blue-400 disabled:opacity-30 disabled:hover:text-[var(--text-muted)] transition-colors"
                                            >
                                                <ChevronLeft size={14} />
                                            </button>
                                            <span className="text-[10px] font-mono text-blue-400 font-bold px-1 min-w-[3rem] text-center">
                                                PAGE {logPage} / {totalPages}
                                            </span>
                                            <button
                                                disabled={logPage === totalPages}
                                                onClick={() => setLogPage(p => Math.min(totalPages, p + 1))}
                                                className="p-0.5 text-[var(--text-muted)] hover:text-blue-400 disabled:opacity-30 disabled:hover:text-[var(--text-muted)] transition-colors"
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="text-[var(--text-muted)] text-[10px] font-mono flex items-center gap-3">
                                        <span className="flex items-center gap-1.5 text-blue-400/80">
                                            <List size={10} />
                                            {filteredLines.length} MATCHES
                                        </span>
                                        {logRefreshInterval > 0 && (
                                            <span className="flex items-center gap-1.5 text-green-500/80 animate-pulse">
                                                <RefreshCw size={10} className="animate-spin-slow" />
                                                LIVE
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Log Display */}
                            <div className="flex-1 p-6 font-mono text-xs overflow-auto text-[var(--text-secondary)] whitespace-pre scrollbar-thin scrollbar-thumb-[var(--border-color)] bg-black/20">
                                {displayedLines.length > 0 ? (
                                    displayedLines.map((line, i) => {
                                        // Simple syntax highlighting hint (can be expanded)
                                        const isError = /error|fail|severe/i.test(line);
                                        const isWarn = /warn|attention/i.test(line);
                                        const isInfo = /info|success/i.test(line);

                                        return (
                                            <div key={i} className={`hover:bg-white/[0.03] px-2 -mx-2 transition-colors ${isError ? 'text-red-400/90' : isWarn ? 'text-yellow-400/90' : isInfo ? 'text-blue-300/80' : ''}`}>
                                                {line}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-3 italic">
                                        <Search size={32} className="opacity-20" />
                                        {logSearchTerm ? 'No logs matching your search criteria.' : 'No logs found for this container.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}

function StatusItem({ label, value, children }) {
    return (
        <div className="flex flex-col gap-1 min-w-[100px]">
            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{label}</span>
            <div className="text-base font-bold text-[var(--text-white)] flex items-center min-h-[1.5rem] tracking-tight">
                {children || (value ?? '—')}
            </div>
        </div>
    );
}

function DetailSection({ title, children, className = "" }) {
    return (
        <div className={`bg-[var(--bg-glass)] glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl flex flex-col ${className}`}>
            <div className="px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/30 flex-shrink-0">
                <h3 className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.2em]">{title}</h3>
            </div>
            <div className="overflow-auto flex-1">
                {children}
            </div>
        </div>
    );
}

function DetailRow({ label, value, children }) {
    return (
        <tr className="group border-b border-[var(--border-color)]">
            <td className="px-4 py-3 w-48 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-sidebar)]/10">
                {label}
            </td>
            <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                {children || (
                    <span className={label === 'UID' || label === 'Name' ? 'font-mono text-blue-300' : 'text-[var(--text-white)]'}>
                        {value ?? '—'}
                    </span>
                )}
            </td>
        </tr>
    );
}

function CodeEditor({ value, onChange, readOnly }) {
    const lineCount = value.split('\n').length;
    const lines = Array.from({ length: lineCount }, (_, i) => i + 1);
    const gutterRef = React.useRef(null);
    const textRef = React.useRef(null);

    const handleScroll = () => {
        if (gutterRef.current && textRef.current) {
            gutterRef.current.scrollTop = textRef.current.scrollTop;
        }
    };

    return (
        <div className="relative flex flex-1 bg-transparent overflow-hidden">
            {/* Gutter */}
            <div
                ref={gutterRef}
                className="w-12 flex-shrink-0 bg-[var(--bg-main)]/50 border-r border-[var(--border-color)]/20 py-6 font-mono text-[10px] text-[var(--text-muted)] text-right pr-3 select-none overflow-hidden"
            >
                {lines.map(line => (
                    <div key={line} className="h-[1.625rem] leading-[1.625rem]">{line}</div>
                ))}
            </div>

            {/* Text Area / Code View */}
            {readOnly ? (
                <pre
                    ref={textRef}
                    onScroll={handleScroll}
                    className="flex-1 p-6 font-mono text-xs text-[var(--text-editor-code)] leading-relaxed overflow-auto scrollbar-thin scrollbar-thumb-[var(--border-color)]"
                >
                    <code>{value}</code>
                </pre>
            ) : (
                <textarea
                    ref={textRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onScroll={handleScroll}
                    className="flex-1 p-6 font-mono text-xs bg-transparent text-[var(--text-editor-code)] leading-relaxed outline-none resize-none focus:ring-0 overflow-auto scrollbar-thin scrollbar-thumb-[var(--border-color)]"
                    spellCheck="false"
                    style={{ lineHeight: '1.625rem' }}
                />
            )}
        </div>
    );
}

function ConditionBadge({ label, status }) {
    const isTrue = status === 'True';
    return (
        <div className="flex items-center gap-1.5 py-1">
            {isTrue ? (
                <CheckCircle2 size={12} className="text-green-400" />
            ) : (
                <AlertCircle size={12} className="text-red-400" />
            )}
            <span className="text-xs text-[var(--text-secondary)]">{label}</span>
        </div>
    );
}
