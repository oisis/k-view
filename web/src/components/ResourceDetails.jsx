import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, FileText, List, Terminal,
    Info, Clipboard, CheckCircle2, AlertCircle, Clock, Activity, SquareTerminal
} from 'lucide-react';
import NetworkTraceModal from './NetworkTraceModal';
import TerminalModal from './TerminalModal';

export default function ResourceDetails() {
    const { kind, namespace, name } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [data, setData] = useState(null);
    const [yaml, setYaml] = useState('');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [traceModalOpen, setTraceModalOpen] = useState(false);
    const [terminalModalOpen, setTerminalModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const nsPath = namespace ? `/${namespace}` : '/-';
                const [detailsRes, yamlRes, eventsRes] = await Promise.all([
                    fetch(`/api/resources/${kind}${nsPath}/${name}`),
                    fetch(`/api/resources/${kind}${nsPath}/${name}/yaml`),
                    fetch(`/api/resources/${kind}${nsPath}/${name}/events`)
                ]);

                if (!detailsRes.ok) throw new Error('Failed to fetch resource details');

                const detailsData = await detailsRes.json();
                const yamlData = await yamlRes.text();
                const eventsData = await eventsRes.json();

                setData(detailsData);
                setYaml(yamlData);
                setEvents(eventsData);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [kind, namespace, name]);

    if (loading) return <div className="p-8 text-[var(--text-secondary)]">Loading resource...</div>;
    if (error) return <div className="p-8 text-red-400">Error: {error}</div>;
    if (!data) return <div className="p-8 text-[var(--text-muted)]">Resource not found</div>;

    // Safety check: Ensure we have at least metadata
    if (!data.metadata) return <div className="p-8 text-red-400">Error: Invalid resource data received from API</div>;

    const { metadata, spec = {}, status = {} } = data;
    const isPod = kind.toLowerCase().startsWith('pod');
    const isDeployment = kind.toLowerCase().startsWith('deploy');
    const isService = kind.toLowerCase().startsWith('serv');

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-white)] transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-[var(--text-white)] flex items-center gap-3">
                        {name}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 uppercase tracking-widest leading-none">
                            {kind.slice(0, -1)}
                        </span>
                    </h2>
                    <p className="text-[var(--text-secondary)] text-sm mt-0.5">
                        Namespace: <span className="text-blue-400 font-medium">{namespace === '-' ? 'Cluster-scoped' : namespace}</span>
                    </p>
                </div>
                {(kind === 'ingress' || kind === 'services' || kind === 'pods') && (
                    <button
                        onClick={() => setTraceModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-900/40 text-blue-300 border border-blue-800 rounded-lg text-sm font-medium hover:bg-blue-800/50 hover:text-white transition-colors"
                    >
                        <Activity size={16} />
                        Visual Trace
                    </button>
                )}
                {kind === 'pods' && (
                    <button
                        onClick={() => setTerminalModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-900/40 text-green-300 border border-green-800 rounded-lg text-sm font-medium hover:bg-green-800/50 hover:text-white transition-colors"
                    >
                        <SquareTerminal size={16} />
                        Exec Terminal
                    </button>
                )}
            </div>

            <NetworkTraceModal
                isOpen={traceModalOpen}
                onClose={() => setTraceModalOpen(false)}
                kind={kind.replace(/e?s$/, '')}
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
            <div className="flex items-center gap-0 border-b border-[var(--border-color)] mb-6">
                {[
                    { id: 'overview', label: 'Overview', icon: Info },
                    { id: 'yaml', label: 'YAML', icon: FileText },
                    { id: 'events', label: 'Events', icon: List },
                    { id: 'logs', label: 'Logs', icon: Terminal, hidden: kind !== 'pods' }
                ].filter(t => !t.hidden).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative
                            ${activeTab === tab.id
                                ? 'text-blue-400 bg-blue-400/5'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-white)] hover:bg-white/5'}`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-blue-500" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === 'overview' && (
                    <>
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

                        {/* Section: Status */}
                        <DetailSection title="Status">
                            <table className="w-full text-sm text-left border-collapse">
                                <tbody className="divide-y divide-[var(--border-color)]/30">
                                    <DetailRow label="Phase">
                                        <div className={`flex items-center gap-2 font-medium ${(status.phase === 'Running' || status.phase === 'Active') ? 'text-green-400' : 'text-yellow-400'
                                            }`}>
                                            <Activity size={14} />
                                            {status.phase || 'Unknown'}
                                        </div>
                                    </DetailRow>
                                    {status.availableReplicas !== undefined && <DetailRow label="Available Replicas" value={status.availableReplicas} />}
                                    {status.readyReplicas !== undefined && <DetailRow label="Ready Replicas" value={status.readyReplicas} />}
                                    {(status.conditions || []).length > 0 && (
                                        <DetailRow label="Conditions">
                                            <div className="flex flex-wrap gap-4">
                                                {status.conditions.map(c => (
                                                    <ConditionBadge key={c.type} label={c.type} status={c.status} />
                                                ))}
                                            </div>
                                        </DetailRow>
                                    )}
                                </tbody>
                            </table>
                        </DetailSection>

                        {/* Section: Resource Info (Spec) */}
                        <DetailSection title="Resource Info">
                            <table className="w-full text-sm text-left border-collapse">
                                <tbody className="divide-y divide-[var(--border-color)]/30">
                                    {spec.replicas !== undefined && <DetailRow label="Desired Replicas" value={spec.replicas} />}
                                    {spec.strategy?.type && <DetailRow label="Strategy" value={spec.strategy.type} />}
                                    {spec.clusterIP && <DetailRow label="Cluster IP" value={spec.clusterIP} />}

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
                    </>
                )}

                {activeTab === 'yaml' && (
                    <div className="bg-[#0d1117] rounded-lg border border-[var(--border-color)] overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest">Resource Manifest</span>
                            <button className="text-[var(--text-muted)] hover:text-[var(--text-white)] transition-colors">
                                <Clipboard size={14} />
                            </button>
                        </div>
                        <pre className="p-6 font-mono text-xs overflow-auto max-h-[700px] text-blue-200 leading-relaxed">
                            <code>{yaml}</code>
                        </pre>
                    </div>
                )}

                {activeTab === 'events' && (
                    <DetailSection title="Recent Events">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b border-[var(--border-color)]">
                                <tr>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Reason</th>
                                    <th className="px-6 py-3">Message</th>
                                    <th className="px-6 py-3">Age</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]/20">
                                {events.map((e, i) => (
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
                                ))}
                            </tbody>
                        </table>
                    </DetailSection>
                )}

                {activeTab === 'logs' && (
                    <div className="bg-black rounded-lg border border-[var(--border-color)] overflow-hidden flex flex-col h-[650px]">
                        <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                                <span>Container: main</span>
                                <span className="flex items-center gap-1.5 text-green-500/80 font-bold">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Live Stream
                                </span>
                            </div>
                            <div className="text-[var(--text-muted)] text-[10px] font-mono">152 lines</div>
                        </div>
                        <div className="flex-1 p-6 font-mono text-xs overflow-auto text-gray-400 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
                            <div>2024-02-18 10:00:01 [info] Starting Application...</div>
                            <div>2024-02-18 10:00:02 [info] Configuration loaded.</div>
                            <div>2024-02-18 10:00:05 [info] Connected to database clusters.</div>
                            <div>2024-02-18 10:00:06 [info] Listening on :8080</div>
                            <div className="text-blue-400">2024-02-18 10:15:23 GET /health 200 OK</div>
                            <div className="text-yellow-500/80">2024-02-18 10:20:44 WARN High latency detected on upstream-01</div>
                            <div className="text-blue-400">2024-02-18 10:25:12 GET /metrics 200 OK</div>
                            <div className="text-gray-500 italic mt-4 italic">// logs continue to stream...</div>
                            <div className="animate-pulse w-2 h-4 bg-gray-500 mt-2" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function DetailSection({ title, children }) {
    return (
        <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] overflow-hidden shadow-sm">
            <div className="px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/30">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function DetailRow({ label, value, children }) {
    return (
        <tr className="group">
            <td className="px-6 py-4 w-60 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-sidebar)]/10">
                {label}
            </td>
            <td className="px-6 py-4 text-sm text-[var(--text-primary)]">
                {children || (
                    <span className={label === 'UID' || label === 'Name' ? 'font-mono text-blue-300' : 'text-[var(--text-white)]'}>
                        {value ?? '—'}
                    </span>
                )}
            </td>
        </tr>
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
