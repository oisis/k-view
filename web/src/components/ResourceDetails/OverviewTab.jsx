import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import DetailSection from './DetailSection';
import DetailRow from './DetailRow';
import ExpandableCell from './ExpandableCell';
import ProbeDetail from './ProbeDetail';
import ProbeSummary from './ProbeSummary';
import ContainerDetails from './ContainerDetails';
import SecretDataSection from './SecretDataSection';
import JobsTable from './JobsTable';
import PodsTable from './PodsTable';
import EndpointsTable from './EndpointsTable';
import ReplicaSetsTable from './ReplicaSetsTable';
import HpaTable from './HpaTable';
import ConditionsTable from './ConditionsTable';
import PersistenceVolumeClaimsTable from './PersistenceVolumeClaimsTable';
import ControlledByTable from './ControlledByTable';
import IngressRulesTable from './IngressRulesTable';
import CodeEditor from './CodeEditor';
import ResourceActionMenu from '../ResourceActionMenu.jsx';

export default function OverviewTab({
    data, kind, namespace, name, quotas, limits,
    relatedJobs, relatedPods, relatedServices, relatedReplicaSets, relatedHpas, relatedEndpoints, t, settings
}) {
    const { icons } = useTheme();
    const kindLower = kind?.toLowerCase() || '';

    const { metadata } = data;
    const spec = data.spec || {};
    const status = data.status || {};
    const isPod = kindLower.includes('pod');
    const isJob = (kindLower === 'job' || kindLower === 'jobs') && !kindLower.includes('cron');
    const isCronJob = kindLower.includes('cronjob');
    const isDaemonSet = kindLower.includes('daemonset');
    const isDeployment = kindLower.includes('deployment');
    const isIngressClass = kindLower.includes('ingress') && kindLower.includes('class');
    const isIngress = kindLower.includes('ingress') && !isIngressClass;
    const isService = kindLower.includes('service') && !isIngressClass;

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
        <div className="space-y-4">
            <DetailSection title={t('metadata')}>
                {isIngressClass ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-600 border-b border-slate-600 bg-[var(--bg-sidebar)]/10">
                        <div className="px-6 py-4 flex flex-col items-center text-center">
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">{t('label_name')}</span>
                            <span className="text-sm font-mono text-info font-bold break-all">{name}</span>
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
                ) : (isDeployment || isJob || isCronJob || isIngress || isService) ? (
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
                        <div className={`grid grid-cols-1 ${(kindLower.includes('configmap') || kindLower.includes('pvc') || kindLower.includes('secret')) ? 'md:grid-cols-4' : 'md:grid-cols-3'} divide-y md:divide-y-0 md:divide-x divide-slate-600 border-b border-slate-600 bg-[var(--bg-sidebar)]/10`}>
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
                            {(kindLower.includes('configmap') || kindLower.includes('pvc') || kindLower.includes('secret')) && (
                                <div className="px-6 py-4 flex flex-col items-center text-center border-l border-slate-600">
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">{t('label_age')}</span>
                                    <span className="text-sm text-[var(--text-primary)] font-bold">{data.resource?.age || '—'}</span>
                                </div>
                            )}
                        </div>

                        {!kindLower.includes('configmap') && !kindLower.includes('pvc') && !kindLower.includes('secret') && (
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
                        )}
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
                                        <DetailRow label={t('label_cpu_usage')}>
                                            <span className="text-info font-mono font-bold">{cpuUsage}</span>
                                        </DetailRow>
                                        <DetailRow label={t('label_ram_usage')}>
                                            <span className="text-teal-400 font-mono font-bold">{ramUsage}</span>
                                        </DetailRow>
                                    </>
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

            {kindLower.includes('configmap') && data.data && (
                <DetailSection title="Data" className="mt-4">
                    <CodeEditor
                        value={JSON.stringify(data.data, null, 2)}
                        readOnly={true}
                        fontSize={13}
                    />
                </DetailSection>
            )}

            {!isDaemonSet && !isPod && !isIngressClass && !isIngress && !isService && !kindLower.includes('configmap') && !kindLower.includes('secret') && (
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
                                <>
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
                                                    <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Running</span>
                                                    <span className="font-bold text-success">{status.active || 0}</span>
                                                </div>
                                                <div className="px-4 py-3 flex flex-col items-center text-center">
                                                    <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Desired</span>
                                                    <span className="font-bold text-[var(--text-primary)]">{spec.completions ?? 1}</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
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
                                </>
                            )}
                            {isService && (
                                <tr className="border-b border-slate-600">
                                    <td colSpan="2" className="p-0">
                                        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-600 text-[var(--font-size-sm)] bg-[var(--bg-sidebar)]/5">
                                            <div className="px-4 py-3 flex flex-col items-center text-center">
                                                <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Type</span>
                                                <span className="font-bold text-[var(--text-primary)]">{spec.type || 'ClusterIP'}</span>
                                            </div>
                                            <div className="px-4 py-3 flex flex-col items-center text-center">
                                                <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Cluster IP</span>
                                                <span className="font-mono text-info font-bold">{spec.clusterIP || '—'}</span>
                                            </div>
                                            <div className="px-4 py-3 flex flex-col items-center text-center">
                                                <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Session Affinity</span>
                                                <span className="text-[var(--text-primary)]">{spec.sessionAffinity || 'None'}</span>
                                            </div>
                                            <div className="px-4 py-3 flex flex-col items-center text-center">
                                                <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Selector</span>
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {Object.entries(spec.selector || {}).map(([k, v]) => (
                                                        <span key={k} className="px-1.5 py-0.5 bg-black/20 rounded text-[10px] font-mono">{k}={v}</span>
                                                    ))}
                                                    {!spec.selector && <span className="text-[var(--text-muted)] italic">—</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {(kindLower.includes('pvc')) && (
                                <tr className="border-b border-slate-600">
                                    <td colSpan="2" className="p-0">
                                        <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-slate-600 text-[var(--font-size-sm)] bg-[var(--bg-sidebar)]/5">
                                            <div className="px-4 py-3 flex flex-col items-center text-center">
                                                <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">{t('label_status')}</span>
                                                <span className={`font-bold ${status?.phase === 'Bound' ? 'text-success' : 'text-warning'}`}>{status?.phase || '—'}</span>
                                            </div>
                                            <div className="px-4 py-3 flex flex-col items-center text-center">
                                                <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Storage Class</span>
                                                <span className="text-[var(--text-primary)] font-mono">{spec.storageClassName || '—'}</span>
                                            </div>
                                            <div className="px-4 py-3 flex flex-col items-center text-center">
                                                <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Volume Name</span>
                                                <span className="text-info font-mono truncate w-full">{spec.volumeName || '—'}</span>
                                            </div>
                                            <div className="px-4 py-3 flex flex-col items-center text-center">
                                                <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Capacity</span>
                                                <span className="text-[var(--text-primary)] font-bold">{status?.capacity?.storage || '—'}</span>
                                            </div>
                                            <div className="px-4 py-3 flex flex-col items-center text-center">
                                                <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">Access Modes</span>
                                                <span className="text-[var(--text-secondary)] font-mono text-xs">{spec.accessModes?.join(', ') || '—'}</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!isCronJob && !isDeployment && !isJob && !isPod && !isIngress && !isService && !kindLower.includes('pvc') && (spec.strategy?.type || spec.minReadySeconds !== undefined || spec.revisionHistoryLimit !== undefined || spec.nodeName) && (
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

                            {!isService && !isPod && (mountedConfigMaps.length > 0 || mountedSecrets.length > 0) && (
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

                            {spec.clusterIP && !isService && <DetailRow label={t('label_ip_cluster')} value={spec.clusterIP} />}

                            {!isCronJob && !isDeployment && !isJob && !isPod && !isService && !kindLower.includes('pvc') && (
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

                            {status?.podIP && !isDeployment && !isPod && !isService && <DetailRow label={t('label_pod_ip')} value={status.podIP} />}
                            {spec.qosClass && !isDeployment && !isPod && !isService && <DetailRow label={t('label_qos_class')} value={spec.qosClass} />}

                            {!isCronJob && !isDeployment && !isJob && !isPod && !isService && !kindLower.includes('pvc') && (
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

            {isPod && (
                <>
                    <ControlledByTable ownerReferences={metadata.ownerReferences} namespace={namespace} t={t} />
                    <PersistenceVolumeClaimsTable pvcNames={mountedPvcs} namespace={namespace} t={t} />
                    <ContainerDetails containers={spec.containers} statuses={status.containerStatuses} t={t} />
                </>
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

            {isIngress && (
                <IngressRulesTable spec={spec} t={t} />
            )}

            {isService && (
                <>
                    <EndpointsTable endpoints={relatedEndpoints} t={t} />
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

            {kindLower.includes('secret') && data.data && (
                <SecretDataSection
                    data={data.data}
                    kind={kind}
                    namespace={namespace}
                    name={name}
                    t={t}
                    onRefresh={() => window.location.reload()}
                />
            )}

            {!isCronJob && !isDaemonSet && !isDeployment && !isJob && !isPod && !isIngressClass && !isIngress && !isService && !kindLower.includes('configmap') && !kindLower.includes('pvc') && !kindLower.includes('secret') && (status?.conditions || []).length > 0 && (
                <ConditionsTable conditions={status.conditions} t={t} />
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
        </div>
    );
}
