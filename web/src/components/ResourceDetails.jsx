import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import NetworkTrace from './NetworkTrace';
import PodTerminal from './PodTerminal';
import ResourceActionMenu from './ResourceActionMenu';
import { useSettings, useTranslation } from '../SettingsContext';
import { useTheme } from '../ThemeContext';

function ExpandableCell({ value, type }) {
    const [expanded, setExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);

    if (!value || value === '—') return <span className="text-[var(--text-muted)]">—</span>;

    const items = typeof value === 'string' ? value.split(',').map(s => s.trim()) : (Array.isArray(value) ? value : [String(value)]);
    if (items.length === 0) return <span className="text-[var(--text-muted)]">—</span>;

    const handleMouseEnter = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({ top: rect.top - 10, left: rect.left });
        }
        setIsHovered(true);
    };

    return (
        <div className="relative group/expandable">
            {!expanded ? (
                <button
                    ref={buttonRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                    className="text-[13px] font-bold text-[var(--accent)] hover:text-[var(--text-primary)] bg-[var(--accent)]/10 px-2 py-0.5 rounded transition-all flex items-center gap-1 active:scale-95"
                >
                    Show all ({items.length})
                </button>
            ) : (
                <div className="flex flex-col gap-1 py-1 max-w-[300px]">
                    {items.map((it, idx) => (
                        <div key={idx} className="text-[12px] font-mono bg-[var(--bg-sidebar)]/50 px-2 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)] truncate" title={it}>
                            {it}
                        </div>
                    ))}
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                        className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] mt-1 text-left px-1 underline"
                    >
                        Hide
                    </button>
                </div>
            )}

            {isHovered && !expanded && createPortal(
                <div 
                    style={{ 
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        transform: 'translateY(-100%)',
                        zIndex: 9999
                    }}
                    className="mb-2 bg-[var(--bg-tooltip)] border border-[var(--border-tooltip)] rounded-lg shadow-2xl p-3 min-w-[240px] pointer-events-none glass animate-in fade-in zoom-in duration-200 backdrop-blur-xl"
                >
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-2 border-b border-[var(--border-tooltip)] pb-1">
                        {type === 'labels' ? 'Labels' : 'Images'}
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-2">
                        {items.map((it, idx) => (
                            <div key={idx} className="text-[12px] font-mono text-[var(--text-tooltip)] break-all leading-tight">
                                {it}
                            </div>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

function DetailSection({ title, children, className = "" }) {
    return (
        <div className={`bg-[var(--bg-glass)] glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl flex flex-col ${className}`}>
            <div className="px-6 py-2.5 border-b-2 border-slate-600 bg-black/20 flex-shrink-0 text-center">
                <h3 className="text-[13px] font-bold text-[var(--accent)] uppercase tracking-widest">{title}</h3>
            </div>
            <div className="overflow-auto flex-1">
                {children}
            </div>
        </div>
    );
}

function DetailRow({ label, value, children }) {
    return (
        <tr className="group">
            <td className="px-4 py-3 w-48 text-[var(--font-size-xs)] font-bold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-sidebar)]/10">
                {label}
            </td>
            <td className="px-4 py-3 text-[var(--font-size-sm)] text-[var(--text-primary)]">
                {children || (
                    <span className={label === 'UID' || label === 'Name' ? 'font-mono text-info' : 'text-[var(--text-[var(--text-white)])]'}>
                        {value ?? '—'}
                    </span>
                )}
            </td>
        </tr>
    );
}

function JobsTable({ title, jobs, t, kind, namespace }) {
    return (
        <DetailSection title={title} className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-[var(--font-size-sm)] border-collapse">
                    <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b-2 border-slate-600">
                        <tr>
                            <th className="px-4 py-3 text-left">{t('label_name')}</th>
                            <th className="px-4 py-3 text-left">{t('label_namespace')}</th>
                            <th className="px-4 py-3 text-left">Images</th>
                            <th className="px-4 py-3 text-left">Labels</th>
                            <th className="px-4 py-3 text-center">Pods</th>
                            <th className="px-4 py-3 text-left">Created</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {jobs.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-4 py-8 text-center text-[var(--text-muted)] italic">
                                    No jobs found.
                                </td>
                            </tr>
                        ) : (
                            jobs.map((job, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2">
                                        <Link to={`/jobs/${job.namespace}/${job.name}`} className="font-bold text-[var(--accent)] hover:underline font-mono">
                                            {job.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2 text-[var(--text-secondary)]">{job.namespace}</td>
                                    <td className="px-4 py-2">
                                        <ExpandableCell value={job.extra?.images} type="images" />
                                    </td>
                                    <td className="px-4 py-2">
                                        <ExpandableCell value={job.extra?.labels} type="labels" />
                                    </td>
                                    <td className="px-4 py-2 text-center font-bold text-[var(--text-primary)]">
                                        {job.extra?.ready || '1/1'}
                                    </td>
                                    <td className="px-4 py-2 text-[var(--text-muted)]">{job.age}</td>
                                    <td className="px-4 py-2 text-right">
                                        <ResourceActionMenu
                                            kind="jobs"
                                            namespace={job.namespace}
                                            name={job.name}
                                            onRefresh={() => window.location.reload()}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </DetailSection>
    );
}

function StatusItem({ label, value, children }) {
    return (
        <div className="flex flex-col gap-1 min-w-[100px]">
            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{label}</span>
            <div className="text-base font-bold text-[var(--text-[var(--text-white)])] flex items-center min-h-[1.5rem] tracking-tight">
                {children || (value ?? '—')}
            </div>
        </div>
    );
}

function CodeEditor({ value, onChange, readOnly, fontSize = 12 }) {
    const lines = value.split('\n');
    const lineCount = lines.length;
    const LINE_HEIGHT = '1.6rem';

    return (
        <div className="bg-[var(--bg-main)]/20 border-t border-[var(--border-color)]/20 overflow-hidden flex flex-col" style={{ maxHeight: '70vh' }}>
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-[var(--border-color)] flex items-start">
                <div
                    className="sticky left-0 z-10 w-12 flex-shrink-0 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)]/20 py-4 font-mono text-[var(--font-size-xs)] text-[var(--text-muted)] text-right pr-3 select-none"
                    style={{ fontSize: `${fontSize}px` }}
                >
                    {lines.map((_, i) => (
                        <div key={i} style={{ height: LINE_HEIGHT, lineHeight: LINE_HEIGHT }}>{i + 1}</div>
                    ))}
                </div>

                {readOnly ? (
                    <pre
                        className="flex-1 p-4 font-mono text-[var(--text-editor-code)] whitespace-pre"
                        style={{ lineHeight: LINE_HEIGHT, fontSize: `${fontSize}px` }}
                    >
                        {value}
                    </pre>
                ) : (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="flex-1 p-4 font-mono bg-transparent text-[var(--text-editor-code)] outline-none resize-none focus:ring-0 overflow-hidden"
                        spellCheck="false"
                        rows={lineCount}
                        style={{ lineHeight: LINE_HEIGHT, display: 'block', fontSize: `${fontSize}px` }}
                    />
                )}
            </div>
        </div >
    );
}

function ConditionBadge({ label, status }) {
    const { icons } = useTheme();
    const isTrue = status === 'True';
    return (
        <div className="flex items-center gap-1.5 py-1">
            {isTrue ? (
                <icons.check_circle_alt size={12} className="text-success" />
            ) : (
                <icons.alert size={12} className="text-warning" />
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
            <span className="text-xs font-bold text-[var(--text-[var(--text-white)])] uppercase tracking-wider">{label}</span>
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

function ConditionsTable({ conditions, t }) {
    return (
        <DetailSection title={t('status_conditions')} className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-[var(--font-size-sm)] border-collapse">
                    <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b-2 border-slate-600 text-center">
                        <tr>
                            <th className="px-4 py-3 text-left">{t('type')}</th>
                            <th className="px-4 py-3">{t('label_status')}</th>
                            <th className="px-4 py-3">{t('last_probe')}</th>
                            <th className="px-4 py-3">{t('last_transition')}</th>
                            <th className="px-4 py-3 text-left">{t('reason')}</th>
                            <th className="px-4 py-3 text-left">{t('message')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)] text-left">
                        {(conditions || []).length === 0 ? (
                            <tr><td colSpan="6" className="px-4 py-8 text-center text-[var(--text-muted)] italic">No conditions found.</td></tr>
                        ) : (
                            conditions.map((c, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{c.type}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[var(--font-size-sm)] font-bold ${c.status === 'True' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-[var(--text-muted)] text-xs">
                                        {c.lastProbeTime ? new Date(c.lastProbeTime).toLocaleString() : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center text-[var(--text-secondary)] text-xs">
                                        {c.lastTransitionTime ? new Date(c.lastTransitionTime).toLocaleString() : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-[var(--text-secondary)]">{c.reason || '—'}</td>
                                    <td className="px-4 py-3 text-[var(--text-muted)] text-xs max-w-xs break-words">{c.message || '—'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </DetailSection>
    );
}

function ReplicaSetsTable({ title, replicaSets, t }) {
    return (
        <DetailSection title={title} className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-[var(--font-size-sm)] border-collapse">
                    <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b-2 border-slate-600">
                        <tr>
                            <th className="px-4 py-3 text-left">{t('label_name')}</th>
                            <th className="px-4 py-3 text-left">{t('label_namespace')}</th>
                            <th className="px-4 py-3 text-left">Age</th>
                            <th className="px-4 py-3 text-center">Pods</th>
                            <th className="px-4 py-3 text-left">Labels</th>
                            <th className="px-4 py-3 text-left">Images</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {replicaSets.length === 0 ? (
                            <tr><td colSpan="7" className="px-4 py-8 text-center text-[var(--text-muted)] italic">No replica sets found.</td></tr>
                        ) : (
                            replicaSets.map((rs, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2 font-bold text-[var(--accent)] font-mono">
                                        <Link to={`/replicasets/${rs.namespace}/${rs.name}`} className="hover:underline">{rs.name}</Link>
                                    </td>
                                    <td className="px-4 py-2 text-[var(--text-secondary)]">{rs.namespace}</td>
                                    <td className="px-4 py-2 text-[var(--text-muted)] text-xs">{rs.age}</td>
                                    <td className="px-4 py-2 text-center font-bold">
                                        {rs.extra?.ready || '0'}/{rs.extra?.desired || '0'}
                                    </td>
                                    <td className="px-4 py-2"><ExpandableCell value={rs.extra?.labels} type="labels" /></td>
                                    <td className="px-4 py-2"><ExpandableCell value={rs.extra?.images} type="images" /></td>
                                    <td className="px-4 py-2 text-right">
                                        <ResourceActionMenu kind="replicasets" namespace={rs.namespace} name={rs.name} onRefresh={() => window.location.reload()} />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </DetailSection>
    );
}

function PodsTable({ pods, t }) {
    return (
        <DetailSection title="Pods" className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-[var(--font-size-sm)] border-collapse">
                    <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b-2 border-slate-600">
                        <tr>
                            <th className="px-4 py-3 text-left">{t('label_name')}</th>
                            <th className="px-4 py-3 text-left">{t('label_namespace')}</th>
                            <th className="px-4 py-3 text-left">Images</th>
                            <th className="px-4 py-3 text-left">Labels</th>
                            <th className="px-4 py-3 text-left">Node</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-center">Restarts</th>
                            <th className="px-4 py-3 text-left">CPU</th>
                            <th className="px-4 py-3 text-left">RAM</th>
                            <th className="px-4 py-3 text-left">Created</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {pods.length === 0 ? (
                            <tr><td colSpan="11" className="px-4 py-8 text-center text-[var(--text-muted)] italic">No pods found.</td></tr>
                        ) : (
                            pods.map((pod, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2">
                                        <Link to={`/pods/${pod.namespace}/${pod.name}`} className="font-bold text-[var(--accent)] hover:underline font-mono">
                                            {pod.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2 text-[var(--text-secondary)]">{pod.namespace}</td>
                                    <td className="px-4 py-2"><ExpandableCell value={pod.extra?.images} type="images" /></td>
                                    <td className="px-4 py-2"><ExpandableCell value={pod.extra?.labels} type="labels" /></td>
                                    <td className="px-4 py-2 text-xs font-mono text-info truncate max-w-[120px]">{pod.extra?.node || '—'}</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${pod.status === 'Running' || pod.status === 'Succeeded' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                                            {pod.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-center font-bold">{pod.extra?.restarts || 0}</td>
                                    <td className="px-4 py-2 font-mono text-xs text-info">{pod.extra?.cpu || '—'}</td>
                                    <td className="px-4 py-2 font-mono text-xs text-teal-400">{pod.extra?.ram || '—'}</td>
                                    <td className="px-4 py-2 text-[var(--text-muted)] text-xs">{pod.age}</td>
                                    <td className="px-4 py-2 text-right">
                                        <ResourceActionMenu kind="pods" namespace={pod.namespace} name={pod.name} onRefresh={() => window.location.reload()} />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </DetailSection>
    );
}

function HpaTable({ hpas, t }) {
    return (
        <DetailSection title="Horizontal Pod Autoscalers" className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-[var(--font-size-sm)] border-collapse">
                    <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b-2 border-slate-600">
                        <tr>
                            <th className="px-4 py-3 text-left">{t('label_name')}</th>
                            <th className="px-4 py-3 text-left">{t('label_namespace')}</th>
                            <th className="px-4 py-3 text-center">Min</th>
                            <th className="px-4 py-3 text-center">Max</th>
                            <th className="px-4 py-3 text-center">Current</th>
                            <th className="px-4 py-3 text-left">Target</th>
                            <th className="px-4 py-3 text-left">Age</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {hpas.length === 0 ? (
                            <tr><td colSpan="8" className="px-4 py-8 text-center text-[var(--text-muted)] italic">No HPAs found.</td></tr>
                        ) : (
                            hpas.map((hpa, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2 font-bold text-[var(--accent)] font-mono">
                                        <Link to={`/hpas/${hpa.namespace}/${hpa.name}`} className="hover:underline">{hpa.name}</Link>
                                    </td>
                                    <td className="px-4 py-2 text-[var(--text-secondary)]">{hpa.namespace}</td>
                                    <td className="px-4 py-2 text-center">{hpa.extra?.min || '—'}</td>
                                    <td className="px-4 py-2 text-center">{hpa.extra?.max || '—'}</td>
                                    <td className="px-4 py-2 text-center font-bold text-info">{hpa.extra?.current || '—'}</td>
                                    <td className="px-4 py-2 text-xs font-mono">{hpa.extra?.target || '—'}</td>
                                    <td className="px-4 py-2 text-[var(--text-muted)] text-xs">{hpa.age}</td>
                                    <td className="px-4 py-2 text-right">
                                        <ResourceActionMenu kind="hpas" namespace={hpa.namespace} name={hpa.name} onRefresh={() => window.location.reload()} />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </DetailSection>
    );
}

export default function ResourceDetails({ user }) {
    const { settings } = useSettings();
    const { kind, namespace, name } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { icons } = useTheme();
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
    const [format, setFormat] = useState('yaml');
    const [events, setEvents] = useState([]);
    const [logs, setLogs] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quotas, setQuotas] = useState([]);
    const [limits, setLimits] = useState([]);
    const [relatedJobs, setRelatedJobs] = useState([]);
    const [relatedPods, setRelatedPods] = useState([]);
    const [relatedServices, setRelatedServices] = useState([]);
    const [relatedReplicaSets, setRelatedReplicaSets] = useState([]);
    const [relatedHpas, setRelatedHpas] = useState([]);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const [confirmTrigger, setConfirmTrigger] = useState(false);
    const [isTriggering, setIsTriggering] = useState(false);
    const [editorFontSize, setEditorFontSize] = useState(12);

    const [logRefreshInterval, setLogRefreshInterval] = useState(settings.logsRefreshInterval);
    const [logSearchTerm, setLogSearchTerm] = useState('');
    const [logSearchRegex, setLogSearchRegex] = useState(false);
    const [logPaginationEnabled, setLogPaginationEnabled] = useState(true);
    const [logPage, setLogPage] = useState(1);
    const [logLinesPerPage] = useState(36);
    const [logContainer, setLogContainer] = useState('');
    const [logWrapLines, setLogWrapLines] = useState(false);
    const [logFontSize, setLogFontSize] = useState(14);

    const canEdit = user && (user.role === 'kview-cluster-admin' || user.role === 'admin' || user.role === 'edit');

    const executeTrigger = async () => {
        setIsTriggering(true);
        try {
            const nsPath = namespace ? `/${namespace}` : '/-';
            const url = `/api/resources/${kind}${nsPath}/${name}/trigger`;
            const res = await fetch(url, { method: 'POST' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to trigger resource');
            }
            setConfirmTrigger(false);
            window.location.reload();
        } catch (err) {
            alert('Trigger failed: ' + err.message);
        } finally {
            setIsTriggering(false);
        }
    };

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
                const [detailsRes, yamlRes, eventsRes] = await Promise.all([
                    fetch(`/api/resources/${kind}${nsPath}/${name}`),
                    fetch(`/api/resources/${kind}${nsPath}/${name}/yaml?format=${format}`),
                    fetch(`/api/resources/${kind}${nsPath}/${name}/events`)
                ]);

                if (!detailsRes.ok) throw new Error('Failed to fetch resource details');

                const [detailsData, yamlData, eventsData] = await Promise.all([
                    detailsRes.json(),
                    yamlRes.text(),
                    eventsRes.json()
                ]);

                setData(detailsData);
                setYaml(yamlData);
                setEditedYaml(yamlData);
                setEvents(Array.isArray(eventsData) ? eventsData : []);

                if (kind === 'namespaces') {
                    const [qRes, lRes] = await Promise.all([
                        fetch(`/api/resources/resourcequotas?namespace=${name}`),
                        fetch(`/api/resources/limitranges?namespace=${name}`)
                    ]);
                    if (qRes.ok) setQuotas(await qRes.json());
                    if (lRes.ok) setLimits(await lRes.json());
                }

                const kindLower = kind?.toLowerCase() || '';
                const nsQuery = namespace === '-' ? '' : namespace;
                
                if (kindLower.includes('cronjob')) {
                    const jobsRes = await fetch(`/api/resources/jobs?namespace=${nsQuery}`);
                    if (jobsRes.ok) {
                        const jobsData = await jobsRes.json();
                        if (Array.isArray(jobsData)) {
                            setRelatedJobs(jobsData.filter(j => j.extra?.['owner-uid'] === detailsData.metadata?.uid));
                        }
                    }
                }

                if (kindLower.includes('daemonset') || kindLower === 'job' || kindLower === 'jobs') {
                    const [podsRes, svcsRes] = await Promise.all([
                        fetch(`/api/resources/pods?namespace=${nsQuery}`),
                        kindLower.includes('daemonset') ? fetch(`/api/resources/services?namespace=${nsQuery}`) : Promise.resolve(null)
                    ]);
                    if (podsRes && podsRes.ok) {
                        const podsData = await podsRes.json();
                        if (Array.isArray(podsData)) {
                            setRelatedPods(podsData.filter(p => p.extra?.['owner-uid'] === detailsData.metadata?.uid));
                        }
                    }
                    if (svcsRes && svcsRes.ok) {
                        const svcsData = await svcsRes.json();
                        setRelatedServices(Array.isArray(svcsData) ? svcsData : []);
                    }
                }

                if (kindLower.includes('deploy')) {
                    const [rsRes, hpaRes] = await Promise.all([
                        fetch(`/api/resources/replicasets?namespace=${nsQuery}`),
                        fetch(`/api/resources/hpas?namespace=${nsQuery}`)
                    ]);
                    if (rsRes && rsRes.ok) {
                        const rsData = await rsRes.json();
                        if (Array.isArray(rsData)) {
                            setRelatedReplicaSets(rsData.filter(rs => rs.extra?.['owner-uid'] === detailsData.metadata?.uid));
                        }
                    }
                    if (hpaRes && hpaRes.ok) {
                        const hpaData = await hpaRes.json();
                        if (Array.isArray(hpaData)) {
                            // HPA selector is usually by name/kind in spec.scaleTargetRef
                            // Since we don't have the full spec easily here for filtering by scaleTargetRef, we'll try to find matching HPAs
                            setRelatedHpas(hpaData.filter(hpa => hpa.extra?.['target-name'] === name || hpa.name === name));
                        }
                    }
                }

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

    if (loading) return (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
                <icons.refresh size={32} className="animate-spin text-info" />
                <p className="text-[var(--text-muted)] font-medium">{t('loading')}</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-8">
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <icons.alert size={20} /> {t('error') || 'Error'}
                </h3>
                <p className="text-sm opacity-90">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-xs font-black transition-all"
                >
                    {t('retry') || 'Retry'}
                </button>
            </div>
        </div>
    );

    if (!data || !data.metadata) return (
        <div className="p-8 text-center text-[var(--text-muted)] italic">
            {t('resource_not_found') || 'Resource not found.'}
        </div>
    );

    const { metadata } = data;
    const spec = data.spec || {};
    const status = data.status || {};
    const kindLower = kind?.toLowerCase() || '';
    const isPod = kindLower.startsWith('pod');
    const isJob = kindLower === 'job' || kindLower === 'jobs';
    const isCronJob = kindLower.startsWith('cronjob');
    const isDaemonSet = kindLower.includes('daemonset');
    const isDeployment = kindLower.startsWith('deploy');

    const podSpec = isPod ? spec : (spec.template?.spec || {});
    const volumes = podSpec.volumes || [];
    const mountedConfigMaps = Array.from(new Set(volumes.filter(v => v.configMap).map(v => v.configMap.name)));
    const mountedSecrets = Array.from(new Set(volumes.filter(v => v.secret).map(v => v.secret.secretName)));
    const mountedPvcs = Array.from(new Set(volumes.filter(v => v.persistentVolumeClaim).map(v => v.persistentVolumeClaim.claimName)));

    const restarts = isPod && status?.containerStatuses
        ? status.containerStatuses.reduce((acc, c) => acc + (c.restartCount || 0), 0)
        : 0;

    const readyCount = isPod && status?.containerStatuses
        ? status.containerStatuses.filter(c => c.ready).length
        : 0;
    const totalContainers = isPod && status?.containerStatuses
        ? status.containerStatuses.length
        : 0;

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
            <div className="flex items-center gap-6 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/50 transition-all shadow-sm active:scale-95"
                >
                    <icons.chevron_left size={22} />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-[0.2em] leading-none">
                            {t(kindLower.replace(/s$/, '')) || (kindLower.replace(/s$/, ''))}
                        </span>
                        <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                            {name}
                        </h2>
                    </div>
                    <p className="text-[var(--text-white)] light:text-blue-600 text-xs mt-2 font-mono flex items-center gap-2">
                        UID: {metadata.uid}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2 bg-[var(--bg-sidebar)]/80 p-1 rounded-2xl border border-[var(--accent)] mx-auto backdrop-blur-md shadow-lg shadow-indigo-500/10">
                {[
                    { id: 'overview', label: t('overview'), icon: icons.about },
                    { id: 'events', label: t('events'), icon: icons.list },
                    { id: 'yaml', label: t('yaml'), icon: icons.manifest },
                    { id: 'logs', label: t('logs'), icon: icons.terminal, hidden: !['pods', 'jobs'].includes(kind.toLowerCase()) },
                    { id: 'exec', label: t('terminal'), icon: icons.terminal, hidden: kind !== 'pods' },
                    { id: 'trace', label: t('trace'), icon: icons.activity, hidden: !['ingress', 'ingresses', 'services', 'pods'].includes(kind.toLowerCase()) }
                ].filter(t => !t.hidden).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2.5 px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all rounded-xl
                            ${activeTab === tab.id
                                ? 'text-[var(--text-white)] bg-[var(--accent)] shadow-lg shadow-indigo-500/20'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)]/20'}`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
                {isCronJob && canEdit && (
                    <button
                        onClick={() => setConfirmTrigger(true)}
                        className="flex items-center gap-2.5 px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all rounded-xl text-emerald-400 hover:text-[var(--text-white)] hover:bg-emerald-500/30"
                    >
                        <icons.zap size={14} />
                        {t('trigger')}
                    </button>
                )}
            </div>

            {confirmTrigger && createPortal(
                <div id="modal-portal-root" className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmTrigger(false)} />
                    <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl glass overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 text-emerald-400 mb-6">
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                    <icons.zap size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('confirm_trigger')}</h3>
                                    <p className="text-sm text-[var(--text-secondary)]">{name}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmTrigger(false)} className="flex-1 py-2.5 bg-[var(--bg-muted)] hover:bg-[var(--sidebar-hover)] text-[var(--text-primary)] text-sm font-bold uppercase rounded-xl transition-all active:scale-95">
                                    {t('cancel')}
                                </button>
                                <button onClick={executeTrigger} disabled={isTriggering} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold uppercase rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                                    {isTriggering ? '...' : t('trigger_now')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <div className="space-y-2 flex-1 flex flex-col pb-8">
                {activeTab === 'overview' && (
                    <>
                        <DetailSection title={t('metadata')}>
                            {(isDeployment || isJob) ? (
                                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-600 border-b border-slate-600 bg-[var(--bg-sidebar)]/10">
                                    <div className="px-6 py-4 flex flex-col items-center text-center">
                                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">{t('label_name')}</span>
                                        <span className="text-sm font-mono text-info font-bold break-all">{name}</span>
                                    </div>
                                    <div className="px-6 py-4 flex flex-col items-center text-center">
                                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">{t('label_namespace')}</span>
                                        {namespace === '-' ? (
                                            <span className="text-sm text-[var(--text-muted)] font-bold italic">—</span>
                                        ) : (
                                            <Link to={`/namespaces/-/${namespace}`} className="text-sm text-[var(--accent)] font-bold hover:underline">
                                                {namespace}
                                            </Link>
                                        )}
                                    </div>
                                    <div className="px-6 py-4 flex flex-col items-center text-center">
                                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">{t('label_created')}</span>
                                        <span className="text-sm text-[var(--text-primary)] font-bold">{new Date(metadata.creationTimestamp).toLocaleString()}</span>
                                    </div>
                                    <div className="px-6 py-4 flex flex-col items-center text-center">
                                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">{t('label_age')}</span>
                                        <span className="text-sm text-[var(--text-primary)] font-bold">{data.resource?.age || '—'}</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-600 border-b border-slate-600 bg-[var(--bg-sidebar)]/10">
                                        <div className="px-6 py-4 flex flex-col items-center text-center">
                                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">{t('label_name')}</span>
                                            <span className="text-sm font-mono text-info font-bold break-all">{name}</span>
                                        </div>
                                        <div className="px-6 py-4 flex flex-col items-center text-center">
                                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">{t('label_namespace')}</span>
                                            {namespace === '-' ? (
                                                <span className="text-sm text-[var(--text-muted)] font-bold italic">—</span>
                                            ) : (
                                                <Link to={`/namespaces/-/${namespace}`} className="text-sm text-[var(--accent)] font-bold hover:underline">
                                                    {namespace}
                                                </Link>
                                            )}
                                        </div>
                                        <div className="px-6 py-4 flex flex-col items-center text-center">
                                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">{t('label_created')}</span>
                                            <span className="text-sm text-[var(--text-primary)] font-bold">{new Date(metadata.creationTimestamp).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-600 border-b border-slate-600">
                                        <div className="px-6 py-4 flex flex-col items-center text-center">
                                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">
                                                {isDaemonSet ? 'Pods Running' : t('label_status')}
                                            </span>
                                            {isDaemonSet ? (
                                                <span className="text-sm font-bold text-success">{status?.numberReady || 0}</span>
                                            ) : (
                                                <div className={`flex items-center gap-1.5 ${(status?.phase === 'Running' || status?.phase === 'Active' || status?.phase === 'Succeeded' || data.resource?.status === 'Running') ? 'text-success' : 'text-warning'}`}>
                                                    <div className={`w-2 h-2 rounded-full animate-pulse ${(status?.phase === 'Running' || status?.phase === 'Active' || status?.phase === 'Succeeded' || data.resource?.status === 'Running') ? 'bg-success' : 'bg-warning'}`} />
                                                    <span className="text-sm font-bold uppercase tracking-wide">{t(status?.phase?.toLowerCase()) || t(data.resource?.status?.toLowerCase()) || status?.phase || data.resource?.status || t('unknown')}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="px-6 py-4 flex flex-col items-center text-center">
                                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">
                                                {isDaemonSet ? 'Pods Desired' : t('label_node')}
                                            </span>
                                            {isDaemonSet ? (
                                                <span className="text-sm font-bold text-[var(--text-primary)]">{status?.desiredNumberScheduled || 0}</span>
                                            ) : spec.nodeName ? (
                                                <Link to={`/nodes/-/${spec.nodeName}`} className="text-sm text-info font-bold hover:underline font-mono">
                                                    {spec.nodeName}
                                                </Link>
                                            ) : (
                                                <span className="text-sm text-[var(--text-muted)] font-bold italic">—</span>
                                            )}
                                        </div>
                                        <div className="px-6 py-4 flex flex-col items-center text-center">
                                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">{t('label_age')}</span>
                                            <span className="text-sm text-[var(--text-primary)] font-bold">{data.resource?.age || '—'}</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-600">
                                <div className="overflow-hidden">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <tbody className="divide-y divide-slate-600">
                                            {isPod && (
                                                <DetailRow label={t('label_ready')}>
                                                    <span className={`font-bold ${readyCount === totalContainers ? 'text-success' : 'text-warning'}`}>
                                                        {readyCount}/{totalContainers}
                                                    </span>
                                                </DetailRow>
                                            )}
                                            {isPod && (
                                                <DetailRow label={t('label_restarts')}>
                                                    <span className={`font-bold ${restarts > 0 ? 'text-warning' : 'text-[var(--text-primary)]'}`}>
                                                        {restarts}
                                                    </span>
                                                </DetailRow>
                                            )}
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
                                <div className="overflow-hidden">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <tbody className="divide-y divide-slate-600">
                                            {isPod && (
                                                <>
                                                    <DetailRow label="CPU Usage">
                                                        <span className="text-info font-mono font-bold">{cpuUsage}</span>
                                                    </DetailRow>
                                                    <DetailRow label="RAM Usage">
                                                        <span className="text-teal-400 font-mono font-bold">{ramUsage}</span>
                                                    </DetailRow>
                                                </>
                                            )}
                                            {isPod && spec.nodeName && (
                                                <DetailRow label={t('label_node')}>
                                                    <Link to={`/nodes/-/${spec.nodeName}`} className="text-[var(--text-primary)] font-mono hover:text-[var(--accent)] transition-colors font-bold underline decoration-dotted decoration-[var(--accent)]/40 underline-offset-4">
                                                        {spec.nodeName}
                                                    </Link>
                                                </DetailRow>
                                            )}
                                            {status?.loadBalancer?.ingress?.length > 0 && (
                                                <DetailRow label={t('label_ip_external')}>
                                                    <span className="text-info font-mono font-bold">
                                                        {status.loadBalancer.ingress[0].ip || status.loadBalancer.ingress[0].hostname}
                                                    </span>
                                                </DetailRow>
                                            )}
                                            <DetailRow label={t('label_annotations')}>
                                                <div className="space-y-1">
                                                    {Object.entries(metadata.annotations || {}).map(([k, v]) => (
                                                        <div key={k} className="text-sm font-mono text-[var(--text-secondary)]">
                                                            <span className="text-info">{k}</span>: {v}
                                                        </div>
                                                    ))}
                                                </div>
                                            </DetailRow>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </DetailSection>

                        {!isDaemonSet && (
                            <DetailSection title={t('resource_info')}>
                                <table className="w-full text-sm text-left border-collapse">
                                    <tbody className="divide-y divide-slate-600">
                                        {isCronJob && (
                                            <tr className="border-b border-slate-600">
                                                <td colSpan="2" className="p-0">
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-slate-600 text-[var(--font-size-sm)] bg-[var(--bg-sidebar)]/5">
                                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                                            <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Schedule</span>
                                                            <span className="font-mono text-info font-bold truncate w-full">{spec.schedule}</span>
                                                        </div>
                                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                                            <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Active Jobs</span>
                                                            <span className="font-bold text-[var(--text-primary)]">{status?.active ? status.active.length : 0}</span>
                                                        </div>
                                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                                            <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Suspend</span>
                                                            <span className={`font-bold ${spec.suspend ? 'text-warning' : 'text-success'}`}>{spec.suspend ? 'True' : 'False'}</span>
                                                        </div>
                                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                                            <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Last Schedule</span>
                                                            <span className="text-[var(--text-secondary)] text-xs truncate w-full">{status?.lastScheduleTime ? new Date(status.lastScheduleTime).toLocaleString() : '—'}</span>
                                                        </div>
                                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                                            <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Concurrency Policy</span>
                                                            <span className="font-mono text-[var(--text-primary)] truncate w-full">{spec.concurrencyPolicy || 'Allow'}</span>
                                                        </div>
                                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                                            <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Starting Deadline</span>
                                                            <span className="font-mono text-[var(--text-primary)]">{spec.startingDeadlineSeconds ?? '—'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    {isJob && (
                                        <tr className="border-b border-slate-600">
                                            <td colSpan="2" className="p-0">
                                                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-600 text-[var(--font-size-sm)] bg-[var(--bg-sidebar)]/5">
                                                    <div className="px-4 py-3 flex flex-col items-center text-center">
                                                        <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Completions</span>
                                                        <span className="font-mono text-info font-bold">{spec.completions ?? '1'}</span>
                                                    </div>
                                                    <div className="px-4 py-3 flex flex-col items-center text-center">
                                                        <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Parallelism</span>
                                                        <span className="font-mono text-info font-bold">{spec.parallelism ?? '1'}</span>
                                                    </div>
                                                    <div className="px-4 py-3 flex flex-col items-center text-center">
                                                        <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Succeeded</span>
                                                        <span className="font-bold text-success">{status.succeeded || 0}</span>
                                                    </div>
                                                    <div className="px-4 py-3 flex flex-col items-center text-center">
                                                        <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Desired</span>
                                                        <span className="font-bold text-[var(--text-primary)]">{spec.completions ?? 1}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {isJob && (
                                        <tr>
                                            <td colSpan="2" className="p-0">
                                                <div className="px-4 py-3 bg-[var(--bg-sidebar)]/5 border-b border-slate-600">
                                                    <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold block mb-2">Images</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(isPod ? (spec.containers || []) : (spec.template?.spec?.containers || [])).map(c => (
                                                            <span key={c.name} className="px-2 py-0.5 bg-black/30 rounded text-xs font-mono text-white border border-white/10">
                                                                {c.image}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {!isCronJob && !isDeployment && !isJob && (spec.strategy?.type || spec.minReadySeconds !== undefined || spec.revisionHistoryLimit !== undefined || spec.nodeName) && (
                                        <tr className="border-b border-slate-600">
                                            <td colSpan="2" className="p-0">
                                                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-600 text-[var(--font-size-sm)] bg-[var(--bg-sidebar)]/5">
                                                    <div className="px-4 py-3 flex flex-col items-center text-center">
                                                        <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">{t('strategy')}</span>
                                                        <span className="font-mono text-info truncate w-full">{spec.strategy?.type || '—'}</span>
                                                    </div>
                                                    <div className="px-4 py-3 flex flex-col items-center text-center">
                                                        <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Min Ready</span>
                                                        <span className="font-mono text-info">{spec.minReadySeconds !== undefined ? `${spec.minReadySeconds}s` : '—'}</span>
                                                    </div>
                                                    <div className="px-4 py-3 flex flex-col items-center text-center">
                                                        <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Rev. History</span>
                                                        <span className="font-mono text-info">{spec.revisionHistoryLimit ?? '—'}</span>
                                                    </div>
                                                    <div className="px-4 py-3 flex flex-col items-center text-center">
                                                        <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">{t('label_node')}</span>
                                                        <Link to={`/nodes/-/${spec.nodeName}`} className="font-mono text-info truncate w-full hover:underline">
                                                            {spec.nodeName || '—'}
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {(mountedConfigMaps.length > 0 || mountedSecrets.length > 0) && (
                                        <DetailRow label="">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {mountedConfigMaps.length > 0 && (
                                                    <div>
                                                        <p className="text-[var(--font-size-xs)] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">ConfigMaps</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {mountedConfigMaps.map(cm => (
                                                                <Link key={cm} to={`/configmaps/${namespace}/${cm}`} className="px-2 py-0.5 bg-warning/10 border border-warning/20 rounded text-sm text-warning font-mono hover:bg-warning/20 transition-colors">
                                                                    {cm}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {mountedSecrets.length > 0 && (
                                                    <div>
                                                        <p className="text-[var(--font-size-xs)] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Secrets</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {mountedSecrets.map(s => (
                                                                <Link key={s} to={`/secrets/${namespace}/${s}`} className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-sm text-purple-400 font-mono hover:bg-purple-500/20 transition-colors">
                                                                    {s}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </DetailRow>
                                    )}

                                    {spec.clusterIP && <DetailRow label={t('label_ip_cluster')} value={spec.clusterIP} />}

                                    {!isCronJob && !isDeployment && !isJob && (
                                        <DetailRow label={t('label_selector')}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {Object.entries(spec.selector?.matchLabels || spec.selector || {}).map(([k, v]) => (
                                                            <span key={k} className="px-2 py-0.5 bg-[var(--bg-muted)] border border-[var(--border-color)] rounded text-sm text-[var(--text-secondary)] font-mono">
                                                                {k}: {v}
                                                            </span>
                                                        ))}
                                                        {!(spec.selector?.matchLabels || spec.selector) && <span className="text-[var(--text-muted)] italic">—</span>}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 border-l border-slate-600 pl-8">
                                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t('label_service_account')}</span>
                                                    <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold font-mono text-sm">
                                                        <icons.terminal size={14} className="text-info" />
                                                        {spec.serviceAccountName || spec.serviceAccount || 'default'}
                                                    </div>
                                                </div>
                                            </div>
                                        </DetailRow>
                                    )}

                                        {isDeployment && spec.strategy?.rollingUpdate && (
                                            <DetailRow label={t('rolling_update_strategy')}>
                                                <div className="flex gap-4 text-xs font-mono">
                                                    <span className="text-[var(--text-secondary)]">{t('max_surge')}: <span className="text-info font-bold">{spec.strategy.rollingUpdate.maxSurge}</span></span>
                                                    <span className="text-[var(--text-secondary)]">{t('max_unavailable')}: <span className="text-error font-bold">{spec.strategy.rollingUpdate.maxUnavailable}</span></span>
                                                </div>
                                            </DetailRow>
                                        )}

                                        {isDeployment && (
                                            <DetailRow label={t('pods_status')}>
                                                <div className="flex gap-4 text-xs font-mono">
                                                    <span className="text-[var(--text-secondary)]">{t('updated')}: <span className="text-success font-bold">{status?.updatedReplicas || 0}</span></span>
                                                    <span className="text-[var(--text-secondary)]">{t('total')}: <span className="text-[var(--text-primary)] font-bold">{status?.replicas || 0}</span></span>
                                                    <span className="text-[var(--text-secondary)]">{t('available')}: <span className="text-info font-bold">{status?.availableReplicas || 0}</span></span>
                                                </div>
                                            </DetailRow>
                                        )}

                                        {status?.podIP && !isDeployment && <DetailRow label={t('label_pod_ip')} value={status.podIP} />}
                                        {spec.qosClass && !isDeployment && <DetailRow label={t('label_qos_class')} value={spec.qosClass} />}

                                        {!isCronJob && !isDeployment && (
                                            <DetailRow label={t('containers')}>
                                                <div className="space-y-4">
                                                    {(isPod ? (spec.containers || []) : (spec.template?.spec?.containers || [])).map(c => (
                                                        <div key={c.name} className="p-4 bg-[var(--bg-muted)]/30 rounded-lg border border-[var(--border-color)] shadow-sm">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                                                                    <icons.terminal size={12} className="text-info" />
                                                                    {c.name}
                                                                </span>
                                                                <span className="text-[var(--font-size-xs)] font-mono text-white bg-black/30 px-2 py-0.5 rounded">
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
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                                    <div>
                                                                        <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">{t('label_env_variables')}</p>
                                                                        <div className="space-y-1">
                                                                            {c.env?.map(ev => (
                                                                                <div key={ev.name} className="flex text-xs font-mono">
                                                                                    <span className="text-info w-32 shrink-0">{ev.name}:</span>
                                                                                    <span className="text-[var(--text-secondary)] truncate">{ev.value || (ev.valueFrom ? '<from-source>' : '—')}</span>
                                                                                </div>
                                                                            )) || <p className="text-xs text-[var(--text-muted)] italic">No env variables</p>}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-6 pt-4 border-t border-[var(--border-color)]/20">
                                                                    <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">{t('health_probes')}</p>
                                                                    <div className="flex flex-wrap gap-x-12 gap-y-4 mb-6">
                                                                        <ProbeDetail label={t('liveness')} probe={c.livenessProbe} t={t} />
                                                                        <ProbeDetail label={t('readiness')} probe={c.readinessProbe} t={t} />
                                                                        <ProbeDetail label={t('startup')} probe={c.startupProbe} t={t} />
                                                                    </div>
                                                                </div>

                                                                <div className="mt-6 pt-4 border-t border-[var(--border-color)]/20">
                                                                    <p className="text-[var(--font-size-xs)] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">{t('label_mounts')}</p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {c.volumeMounts?.map(vm => (
                                                                            <div key={vm.mountPath} className="text-[var(--font-size-xs)] p-2 bg-black/20 rounded border border-white/5 min-w-[200px]">
                                                                                <div className="font-bold text-info mb-1">{vm.name}</div>
                                                                                <div className="grid grid-cols-2 gap-x-2 text-[var(--text-muted)]">
                                                                                    <span>Path: <span className="text-[var(--text-secondary)]">{vm.mountPath}</span></span>
                                                                                    <span>ReadOnly: <span className="text-[var(--text-secondary)]">{vm.readOnly ? 'Yes' : 'No'}</span></span>
                                                                                    {vm.subPath && <span className="col-span-2">SubPath: <span className="text-[var(--text-secondary)]">{vm.subPath}</span></span>}
                                                                                </div>
                                                                            </div>
                                                                        )) || <p className="text-[var(--font-size-xs)] text-[var(--text-muted)] italic">No mounts</p>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {!(isPod ? (spec.containers) : (spec.template?.spec?.containers)) && (
                                                        <div className="text-[var(--text-muted)] italic">No container information available</div>
                                                    )}
                                                </div>
                                            </DetailRow>
                                        )}
                                    </tbody>
                                </table>
                            </DetailSection>
                        )}

                        {!isCronJob && !isDaemonSet && !isDeployment && (status?.conditions || []).length > 0 && (
                            <DetailSection title={t('status_conditions')}>
                                <table className="w-full text-[var(--font-size-sm)] border-collapse">
                                    <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b-2 border-slate-600 text-center">
                                        <tr>
                                            <th className="px-6 py-3">{t('type')}</th>
                                            <th className="px-6 py-3">{t('label_status')}</th>
                                            <th className="px-6 py-3">{t('last_transition')}</th>
                                            <th className="px-6 py-3">{t('last_probe')}</th>
                                            <th className="px-6 py-3">{t('reason')}</th>
                                            <th className="px-6 py-3">{t('message')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)] text-left">
                                        {status.conditions.map(c => (
                                            <tr key={c.type} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{c.type}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[var(--font-size-sm)] font-bold ${c.status === 'True' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-[var(--text-secondary)]">{new Date(c.lastTransitionTime).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-[var(--text-muted)] italic text-xs">{c.lastProbeTime ? new Date(c.lastProbeTime).toLocaleString() : '—'}</td>
                                                <td className="px-6 py-4 text-[var(--text-secondary)]">{c.reason}</td>
                                                <td className="px-6 py-4 text-[var(--text-secondary)] max-w-md break-words">{c.message}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </DetailSection>
                        )}

                        {isDeployment && (
                            <>
                                <ConditionsTable 
                                    conditions={status.conditions} 
                                    t={t} 
                                />
                                <ReplicaSetsTable 
                                    title="New Replica Set"
                                    replicaSets={relatedReplicaSets.filter(rs => rs.extra?.revision === status.observedGeneration?.toString())}
                                    t={t}
                                />
                                <ReplicaSetsTable 
                                    title="Old Replica Sets"
                                    replicaSets={relatedReplicaSets.filter(rs => rs.extra?.revision !== status.observedGeneration?.toString())}
                                    t={t}
                                />
                                <HpaTable hpas={relatedHpas} t={t} />
                            </>
                        )}

                        {isCronJob && (
                            <>
                                <JobsTable 
                                    title="Active Jobs" 
                                    jobs={relatedJobs.filter(j => {
                                        const status = j.status?.toLowerCase() || '';
                                        const comps = j.extra?.completions?.toLowerCase() || '';
                                        return status === 'active' || (comps.includes('active') && !comps.includes('0 active'));
                                    })} 
                                    t={t}
                                    kind={kind}
                                    namespace={namespace}
                                />
                                <JobsTable 
                                    title="Inactive Jobs" 
                                    jobs={relatedJobs.filter(j => {
                                        const status = j.status?.toLowerCase() || '';
                                        const comps = j.extra?.completions?.toLowerCase() || '';
                                        return status !== 'active' && (!comps.includes('active') || comps.includes('0 active'));
                                    })} 
                                    t={t}
                                    kind={kind}
                                    namespace={namespace}
                                />
                            </>
                        )}

                        {isJob && (
                            <>
                                <ConditionsTable 
                                    conditions={status.conditions} 
                                    t={t} 
                                />
                                <PodsTable pods={relatedPods} t={t} />
                            </>
                        )}

                        {isDaemonSet && (
                            <>
                                <PodsTable pods={relatedPods} t={t} />

                                <DetailSection title="Services" className="mt-4">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-[var(--font-size-sm)] border-collapse">
                                            <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b-2 border-slate-600">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">{t('label_name')}</th>
                                                    <th className="px-4 py-3 text-left">{t('label_namespace')}</th>
                                                    <th className="px-4 py-3 text-left">Labels</th>
                                                    <th className="px-4 py-3 text-left">Type</th>
                                                    <th className="px-4 py-3 text-left">Cluster IP</th>
                                                    <th className="px-4 py-3 text-left">Endpoints</th>
                                                    <th className="px-4 py-3 text-left">External</th>
                                                    <th className="px-4 py-3 text-left">Created</th>
                                                    <th className="px-4 py-3 text-right"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--border-color)]">
                                                {relatedServices.length === 0 ? (
                                                    <tr><td colSpan="9" className="px-4 py-8 text-center text-[var(--text-muted)] italic">No services found.</td></tr>
                                                ) : (
                                                    relatedServices.map((svc, i) => (
                                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                                            <td className="px-4 py-2 font-bold text-[var(--accent)] font-mono">
                                                                <Link to={`/services/${svc.namespace}/${svc.name}`} className="hover:underline">{svc.name}</Link>
                                                            </td>
                                                            <td className="px-4 py-2 text-[var(--text-secondary)]">{svc.namespace}</td>
                                                            <td className="px-4 py-2"><ExpandableCell value={svc.extra?.labels} type="labels" /></td>
                                                            <td className="px-4 py-2"><span className="px-2 py-0.5 rounded bg-slate-500/10 text-[10px] font-bold uppercase border border-slate-500/20">{svc.status || 'ClusterIP'}</span></td>
                                                            <td className="px-4 py-2 font-mono text-xs text-[var(--text-secondary)]">{svc.extra?.['cluster-ip'] || '—'}</td>
                                                            <td className="px-4 py-2 text-xs text-info">{svc.extra?.endpoints || '—'}</td>
                                                            <td className="px-4 py-2 text-xs text-purple-400">{svc.extra?.external || '—'}</td>
                                                            <td className="px-4 py-2 text-[var(--text-muted)] text-xs">{svc.age}</td>
                                                            <td className="px-4 py-2 text-right">
                                                                <ResourceActionMenu kind="services" namespace={svc.namespace} name={svc.name} onRefresh={() => window.location.reload()} />
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </DetailSection>
                            </>
                        )}

                        {!isCronJob && !isDaemonSet && mountedPvcs.length > 0 && (
                            <DetailSection title={t('mounted_pvcs')} className="mt-4">
                                <div className="p-4 flex flex-wrap gap-3">
                                    {mountedPvcs.map(pvc => (
                                        <Link key={pvc} to={`/pvcs/${namespace}/${pvc}`} className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-muted)]/30 border border-[var(--border-color)]/50 rounded-xl hover:border-info/50 transition-all group">
                                            <div className="p-2 rounded-lg bg-info/10 text-info group-hover:scale-110 transition-transform">
                                                <icons.clipboard size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs uppercase font-black text-[var(--text-muted)] tracking-wider">{t('mounted_pvc')}</span>
                                                <span className="text-sm font-mono text-[var(--text-primary)]">{pvc}</span>
                                            </div>
                                        </Link>
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
                                                    <icons.activity size={14} /> {q.metadata.name}
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
                                                    <icons.about size={14} /> {l.metadata.name}
                                                </h4>
                                                <table className="w-full text-[var(--font-size-xs)]">
                                                    <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-black/20 border-b-2 border-slate-600 text-center">
                                                        <tr>
                                                            <th className="px-3 py-2">{t('type')}</th>
                                                            <th className="px-3 py-2">{t('usage_metrics')}</th>
                                                            <th className="px-3 py-2">Min</th>
                                                            <th className="px-3 py-2">Max</th>
                                                            <th className="px-3 py-2">Default</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[var(--border-color)]/20 text-left">
                                                        {l.spec?.limits?.map((lim, idx) => (
                                                            <tr key={idx}>
                                                                <td className="px-3 py-2 font-bold text-[var(--text-primary)]">{lim.type}</td>
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
                    </>
                )}

                {activeTab === 'yaml' && (
                    <div className="bg-[var(--bg-glass)] glass rounded-2xl border border-[var(--border-color)] overflow-hidden flex flex-col flex-none">
                        <div className="flex items-center justify-between px-4 py-2 bg-[var(--text-[var(--text-white)])]/5 border-b border-[var(--border-color)]/20">
                            <div className="flex items-center gap-4">
                                <span className="text-xs uppercase font-bold text-[var(--text-muted)] tracking-widest">
                                    {isEditing ? t('edit_manifest', { format: format.toUpperCase() }) : `${format.toUpperCase()} ${t('manifest') || 'Manifest'}`}
                                </span>
                                {!isEditing && (
                                    <div className="flex bg-black/30 rounded p-0.5">
                                        <button
                                            onClick={() => setFormat('yaml')}
                                            className={`px-2 py-0.5 text-xs font-bold rounded ${format === 'yaml' ? 'bg-info/20 text-info' : 'text-[var(--text-muted)] hover:text-[var(--text-[var(--text-white)])]'}`}
                                        >
                                            YAML
                                        </button>
                                        <button
                                            onClick={() => setFormat('json')}
                                            className={`px-2 py-0.5 text-xs font-bold rounded ${format === 'json' ? 'bg-info/20 text-info' : 'text-[var(--text-muted)] hover:text-[var(--text-[var(--text-white)])]'}`}
                                        >
                                            JSON
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 bg-[var(--bg-muted)]/50 p-1 rounded-md border border-[var(--border-color)]/50 mr-2">
                                    <span className="text-[10px] uppercase font-black text-[var(--text-muted)] pl-2">Size</span>
                                    <select
                                        value={editorFontSize}
                                        onChange={(e) => setEditorFontSize(parseInt(e.target.value))}
                                        className="bg-[var(--bg-input)] text-xs font-bold text-[var(--text-input)] outline-none rounded px-2 py-0.5 cursor-pointer border border-[var(--border-color)]"
                                    >
                                        {[10, 11, 12, 13, 14, 16].map(size => (
                                            <option key={size} value={size}>{size}px</option>
                                        ))}
                                    </select>
                                </div>
                                {saveError && <span className="text-xs text-error mr-2 animate-pulse">{saveError}</span>}
                                {showSuccess && <span className="text-xs text-success mr-2 flex items-center gap-1"><icons.check_circle_alt size={12} /> {t('resource_updated_successfully') || 'Resource updated successfully'}</span>}
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
                                            className="text-xs font-bold px-3 py-1 text-[var(--text-muted)] hover:text-[var(--text-[var(--text-white)])] transition-colors uppercase tracking-widest"
                                            disabled={isSaving}
                                        >
                                            {t('cancel')}
                                        </button>
                                        <button
                                            onClick={async () => {
                                                setIsSaving(true);
                                                setSaveError(null);
                                                try {
                                                    const nsPath = namespace && namespace !== '-' ? `/${namespace}` : '/-';
                                                    const res = await fetch(`/api/resources/${kind}${nsPath}/${name}/yaml`, {
                                                        method: 'PUT',
                                                        body: editedYaml
                                                    });
                                                    if (!res.ok) {
                                                        let errorMessage = 'Failed to save';
                                                        try {
                                                            const errData = await res.json();
                                                            errorMessage = errData.error || errorMessage;
                                                        } catch (jsonErr) {
                                                            const textErr = await res.text();
                                                            if (textErr) errorMessage = textErr;
                                                        }
                                                        throw new Error(errorMessage);
                                                    }
                                                    setYaml(editedYaml);
                                                    setIsEditing(false);
                                                    setShowSuccess(true);
                                                    setTimeout(() => setShowSuccess(false), 5000);
                                                    fetchData();
                                                } catch (e) {
                                                    setSaveError(e.message);
                                                } finally {
                                                    setIsSaving(false);
                                                }
                                            }}
                                            className="text-xs font-bold px-3 py-1 bg-success/20 text-success rounded hover:bg-success/30 transition-colors uppercase tracking-widest flex items-center gap-1.5"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? <icons.refresh size={10} className="animate-pulse" /> : <icons.check_circle_alt size={10} />}
                                            {isSaving ? t('saving') : t('save_changes')}
                                        </button>
                                    </>
                                )}
                                {!isEditing && (
                                    <button className="text-[var(--text-muted)] hover:text-[var(--text-[var(--text-white)])] transition-colors">
                                        <icons.clipboard size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <CodeEditor
                            value={isEditing ? editedYaml : yaml}
                            onChange={isEditing ? setEditedYaml : null}
                            readOnly={!isEditing}
                            fontSize={editorFontSize}
                        />
                    </div>
                )}

                {activeTab === 'events' && (
                    <DetailSection title={t('recent_events')} className="flex-1 min-h-[400px]">
                        <table className="w-full text-[var(--font-size-sm)] border-collapse">
                            <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b-2 border-slate-600 text-left">
                                <tr>
                                    <th className="px-6 py-3">{t('label_name')}</th>
                                    <th className="px-6 py-3">{t('reason')}</th>
                                    <th className="px-6 py-3">{t('message')}</th>
                                    <th className="px-6 py-3">{t('label_source')}</th>
                                    <th className="px-6 py-3">Sub-object</th>
                                    <th className="px-6 py-3 text-center">{t('label_count')}</th>
                                    <th className="px-6 py-3">First Seen</th>
                                    <th className="px-6 py-3">Last Seen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)] text-left">
                                {events && events.length > 0 ? events.map((e, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${e.type === 'Warning' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                                                {e.name || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-[var(--text-[var(--text-white)])]">{e.reason}</td>
                                        <td className="px-6 py-4 text-[var(--text-secondary)] max-w-md break-words">{e.message}</td>
                                        <td className="px-6 py-4 text-[var(--text-muted)] text-xs">
                                            {e.source?.component || e.source || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--text-secondary)] text-xs font-mono break-all max-w-[150px]">
                                            {e.subObject || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--text-secondary)] text-center font-bold">
                                            {e.count || 1}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--text-muted)] whitespace-nowrap text-xs">
                                            {e.firstSeen || e.age || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--text-primary)] font-bold whitespace-nowrap text-xs">
                                            {e.lastSeen || e.age || '—'}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-8 text-center text-[var(--text-muted)]">
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
                            <div className="px-4 py-3 bg-[var(--bg-muted)]/30 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <icons.search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" />
                                        <input
                                            type="text"
                                            placeholder={t('search_logs')}
                                            value={logSearchTerm}
                                            onChange={(e) => { setLogSearchTerm(e.target.value); setLogPage(1); }}
                                            className="pl-9 pr-4 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-md text-xs text-[var(--text-input)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50 w-64 transition-all"
                                        />
                                        <button
                                            onClick={() => setLogSearchRegex(!logSearchRegex)}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-xs font-black border transition-colors ${logSearchRegex ? 'bg-[var(--accent)] text-[var(--text-white)] border-[var(--accent)]' : 'bg-transparent text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)]'}`}
                                            title={t('regex_tooltip')}
                                        >
                                            .*
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 bg-[var(--bg-muted)]/50 p-1 rounded-md border border-[var(--border-color)]/50">
                                        <span className="text-xs uppercase font-black text-[var(--text-muted)] pl-2">{t('refresh')}</span>
                                        <select
                                            value={logRefreshInterval}
                                            onChange={(e) => setLogRefreshInterval(parseInt(e.target.value))}
                                            className="bg-[var(--bg-input)] text-xs font-bold text-[var(--text-input)] outline-none rounded px-2 py-0.5 cursor-pointer border border-[var(--border-color)]"
                                        >
                                            <option value="0">OFF</option>
                                            <option value="5">5s</option>
                                            <option value="10">10s</option>
                                            <option value="15">15s</option>
                                            <option value="30">30s</option>
                                            <option value="60">60s</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2 bg-[var(--bg-muted)]/50 p-1 rounded-md border border-[var(--border-color)]/50">
                                        <span className="text-[10px] uppercase font-black text-[var(--text-muted)] pl-2">Size</span>
                                        <select
                                            value={logFontSize}
                                            onChange={(e) => setLogFontSize(parseInt(e.target.value))}
                                            className="bg-[var(--bg-input)] text-xs font-bold text-[var(--text-input)] outline-none rounded px-2 py-0.5 cursor-pointer border border-[var(--border-color)]"
                                        >
                                            {[10, 12, 14, 16].map(size => (
                                                <option key={size} value={size}>{size}px</option>
                                            ))}
                                        </select>
                                    </div>

                                    {spec?.containers?.length > 1 && (
                                        <div className="flex items-center gap-2 bg-[var(--bg-muted)]/50 p-1 rounded-md border border-[var(--border-color)]/50 ml-2">
                                            <span className="text-xs uppercase font-bold text-[var(--text-muted)] pl-2">{t('label_container')}</span>
                                            <select
                                                value={logContainer}
                                                onChange={(e) => {
                                                    setLogContainer(e.target.value);
                                                    setLogPage(1);
                                                    setLogs('');
                                                }}
                                                className="bg-transparent text-xs font-bold text-[var(--accent)] outline-none pr-1 px-2 py-0.5 cursor-pointer"
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
                                            className={`w-8 h-4 rounded-full relative transition-colors ${logWrapLines ? 'bg-[var(--accent)]' : 'bg-slate-400/40 border border-[var(--border-color)]'}`}
                                            onClick={() => setLogWrapLines(!logWrapLines)}
                                        >
                                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${logWrapLines ? 'translate-x-4' : ''}`} />
                                        </div>
                                        <span className="text-xs uppercase font-bold text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">{t('wrap_lines')}</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div
                                            className={`w-8 h-4 rounded-full relative transition-colors ${logPaginationEnabled ? 'bg-[var(--accent)]' : 'bg-slate-400/40 border border-[var(--border-color)]'}`}
                                            onClick={() => setLogPaginationEnabled(!logPaginationEnabled)}
                                        >
                                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${logPaginationEnabled ? 'translate-x-4' : ''}`} />
                                        </div>
                                        <span className="text-xs uppercase font-bold text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">{t('pagination')}</span>
                                    </label>

                                    {logPaginationEnabled && totalPages > 1 && (
                                        <div className="flex items-center gap-1 bg-[var(--bg-muted)]/50 rounded px-2 py-1 border border-[var(--border-color)]/30">
                                            <button
                                                disabled={logPage === 1}
                                                onClick={() => setLogPage(1)}
                                                className="p-0.5 text-[var(--text-muted)] hover:text-info disabled:opacity-30 disabled:hover:text-[var(--text-muted)] transition-colors"
                                                title={t('first_page')}
                                            >
                                                <icons.chevrons_left size={14} />
                                            </button>
                                            <button
                                                disabled={logPage === 1}
                                                onClick={() => setLogPage(p => Math.max(1, p - 1))}
                                                className="p-0.5 text-[var(--text-muted)] hover:text-info disabled:opacity-30 disabled:hover:text-[var(--text-muted)] transition-colors"
                                                title={t('prev_page')}
                                            >
                                                <icons.chevron_left size={14} />
                                            </button>
                                            <span className="text-xs font-mono text-[var(--text-white)] font-bold px-1 min-w-[4rem] text-center">
                                                {logPage} / {totalPages}
                                            </span>
                                            <button
                                                disabled={logPage === totalPages}
                                                onClick={() => setLogPage(p => Math.min(totalPages, p + 1))}
                                                className="p-0.5 text-[var(--text-muted)] hover:text-info disabled:opacity-30 disabled:hover:text-[var(--text-muted)] transition-colors"
                                                title={t('next_page')}
                                            >
                                                <icons.chevron_right size={14} />
                                            </button>
                                            <button
                                                disabled={logPage === totalPages}
                                                onClick={() => setLogPage(totalPages)}
                                                className="p-0.5 text-[var(--text-muted)] hover:text-info disabled:opacity-30 disabled:hover:text-[var(--text-muted)] transition-colors"
                                                title={t('last_page')}
                                            >
                                                <icons.chevrons_right size={14} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="text-[var(--text-muted)] text-xs font-mono flex items-center gap-3">
                                        <span className="flex items-center gap-1.5 text-info font-bold">
                                            <icons.list size={10} />
                                            {filteredLines.length} {t('matches')}
                                        </span>
                                        {logRefreshInterval > 0 && (
                                            <span className="flex items-center gap-1.5 text-success font-bold animate-pulse">
                                                <icons.refresh size={10} className="animate-spin-slow" />
                                                {t('live')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div 
                                className={`flex-1 pt-2 px-6 pb-6 font-mono overflow-auto scrollbar-thin scrollbar-thumb-[var(--border-color)] bg-[var(--bg-editor)] ${logWrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}
                                style={{ fontSize: `${logFontSize}px` }}
                            >
                                {displayedLines.length > 0 ? (
                                    displayedLines.map((line, i) => {
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
                                        <icons.search size={32} className="opacity-20" />
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
        </div >
    );
}
