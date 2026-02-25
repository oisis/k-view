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
import PersistentVolumesTable from './PersistentVolumesTable';
import SubjectsTable from './SubjectsTable';
import RulesTable from './RulesTable';
import ResourceQuotasTable from './ResourceQuotasTable';
import LimitRangesTable from './LimitRangesTable';
import PolicyRulesTable from './PolicyRulesTable';
import PieChart from './PieChart';
import SourceTable from './SourceTable';

export default function OverviewTab({
    data, kind, namespace, name, quotas, limits,
    relatedJobs, relatedPods, relatedServices, relatedReplicaSets, relatedHpas, relatedEndpoints, relatedPvs, t, settings
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
    const isStorageClass = kindLower.includes('storage') && kindLower.includes('class');
    const isIngressClass = kindLower.includes('ingress') && kindLower.includes('class');
    const isIngress = kindLower.includes('ingress') && !isIngressClass;
    const isService = kindLower.includes('service') && !isIngressClass;
    const isPvc = kindLower.includes('persistentvolumeclaim') || kindLower.includes('pvc');
    const isClusterRoleBinding = kindLower.includes('cluster') && kindLower.includes('role') && kindLower.includes('binding');
    const isClusterRole = (kindLower.includes('cluster') && kindLower.includes('role') && !kindLower.includes('binding')) || kindLower === 'clusterroles';
    const isNamespace = kindLower === 'namespaces' || kindLower === 'namespace';
    const isNetworkPolicy = kindLower === 'networkpolicies' || kindLower === 'networkpolicy' || kindLower === 'network-policies';
    const isNode = kindLower === 'nodes' || kindLower === 'node';
    const isPv = kindLower === 'persistentvolumes' || kindLower === 'persistentvolume' || kindLower === 'pvs';

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
                {(isIngressClass || isStorageClass || isClusterRoleBinding || isClusterRole || isNamespace || isNetworkPolicy || isNode || isPv) ? (
                    <div className={`grid grid-cols-1 ${isNode || isPv ? 'hidden' : (kindLower.includes('configmap') || kindLower.includes('pvc') || kindLower.includes('secret')) ? 'md:grid-cols-4' : 'md:grid-cols-3'} divide-y md:divide-y-0 md:divide-x divide-slate-600 border-b border-slate-600 bg-[var(--bg-sidebar)]/10`}>
                        <div className="px-6 py-4 flex flex-col items-center text-center text-info">
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">{t('label_name')}</span>
                            <span className="text-sm font-mono font-bold break-all">{name}</span>
                        </div>
                        <div className="px-6 py-4 flex flex-col items-center text-center">
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">{t('label_uid')}</span>
                            <span className="text-[var(--font-size-xs)] font-mono text-[var(--text-secondary)] truncate w-full">{metadata.uid}</span>
                        </div>
                        <div className="px-6 py-4 flex flex-col items-center text-center">
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">{t('label_created')}</span>
                            <span className="text-sm text-[var(--text-primary)] font-bold">{new Date(metadata.creationTimestamp).toLocaleString()}</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={`grid grid-cols-1 ${isNode || isPv ? 'hidden' : (kindLower.includes('configmap') || kindLower.includes('pvc') || kindLower.includes('secret')) ? 'md:grid-cols-4' : 'md:grid-cols-3'} divide-y md:divide-y-0 md:divide-x divide-slate-600 border-b border-slate-600 bg-[var(--bg-sidebar)]/10`}>
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

                        {!isNode && !kindLower.includes('configmap') && !kindLower.includes('pvc') && !kindLower.includes('secret') && (
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

            {isStorageClass && (
                <DetailSection title={t('resource_info')} className="mt-4">
                    <table className="w-full text-sm text-left border-collapse">
                        <tbody className="divide-y divide-slate-600">
                            <DetailRow label="Provisioner">
                                <span className="font-mono text-info font-bold">{data.provisioner || spec.provisioner || '—'}</span>
                            </DetailRow>
                        </tbody>
                    </table>
                </DetailSection>
            )}

            {isClusterRoleBinding && (
                <>
                    <DetailSection title={t('resource_info')} className="mt-4">
                        <table className="w-full text-sm text-left border-collapse">
                            <tbody className="divide-y divide-slate-600">
                                <DetailRow label="Role Reference">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-black uppercase tracking-wider">
                                            {data.roleRef?.kind || 'ClusterRole'}
                                        </span>
                                        <span className="font-mono text-info font-bold">{data.roleRef?.name || '—'}</span>
                                    </div>
                                </DetailRow>
                            </tbody>
                        </table>
                    </DetailSection>

                    <SubjectsTable subjects={data.subjects} t={t} />
                </>
            )}

            {isClusterRole && (
                <RulesTable rules={data.rules} t={t} />
            )}

            {isNamespace && (
                <DetailSection title={t('resource_info')} className="mt-4">
                    <table className="w-full text-sm text-left border-collapse">
                        <tbody className="divide-y divide-slate-600">
                            <DetailRow label={t('label_status')}>
                                <div className={`flex items-center gap-1.5 ${status?.phase === 'Active' ? 'text-success' : 'text-warning'}`}>
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${status?.phase === 'Active' ? 'bg-success' : 'bg-warning'}`} />
                                    <span className="text-sm font-bold uppercase tracking-wide">{status?.phase || '—'}</span>
                                </div>
                            </DetailRow>
                        </tbody>
                    </table>
                </DetailSection>
            )}

            {isNetworkPolicy && (
                <DetailSection title={t('resource_info')} className="mt-4">
                    <table className="w-full text-sm text-left border-collapse">
                        <tbody className="divide-y divide-slate-600">
                            <DetailRow label="Pod Selector">
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(spec.podSelector?.matchLabels || {}).map(([k, v]) => (
                                        <span key={k} className="px-2 py-0.5 bg-info/10 border border-info/20 rounded text-sm text-info font-mono">
                                            {k}: {v}
                                        </span>
                                    )) || <span className="text-[var(--text-muted)] italic">{"<all>"}</span>}
                                    {(!spec.podSelector?.matchLabels || Object.keys(spec.podSelector.matchLabels).length === 0) && <span className="text-[var(--text-muted)] italic">{"<all>"}</span>}
                                </div>
                            </DetailRow>
                            <DetailRow label="Policy Types">
                                <div className="flex flex-wrap gap-1.5">
                                    {spec.policyTypes?.map(pt => (
                                        <span key={pt} className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-sm text-purple-400 font-mono">
                                            {pt}
                                        </span>
                                    )) || <span className="text-[var(--text-muted)] italic">—</span>}
                                </div>
                            </DetailRow>
                        </tbody>
                    </table>
                </DetailSection>
            )}

            {isNode && (
                <DetailSection title="Addresses">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(data.addresses || []).map((addr, idx) => (
                            <div key={idx} className="bg-[var(--bg-sidebar)]/20 p-4 rounded border border-slate-600/50 flex flex-col">
                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-1">{addr.type}</span>
                                <span className="text-sm font-mono font-bold text-info">{addr.address}</span>
                            </div>
                        ))}
                    </div>
                </DetailSection>
            )}

            {isPv && (
                <DetailSection title={t('resource_info')}>
                    <table className="w-full text-sm text-left border-collapse">
                        <tbody className="divide-y divide-slate-600">
                            <tr className="border-b border-slate-600">
                                <td colSpan="2" className="p-0">
                                    <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-slate-600 text-[var(--font-size-sm)] bg-[var(--bg-sidebar)]/5">
                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                            <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">{t('label_status')}</span>
                                            <span className={`font-bold ${status.phase === 'Bound' ? 'text-success' : 'text-warning'}`}>{status.phase || '—'}</span>
                                        </div>
                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                            <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">{t('label_reclaim_policy')}</span>
                                            <span className="font-bold text-[var(--text-primary)]">{spec.persistentVolumeReclaimPolicy || '—'}</span>
                                        </div>
                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                            <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">{t('label_storage_class')}</span>
                                            <span className="font-mono text-info font-bold">{spec.storageClassName || '—'}</span>
                                        </div>
                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                            <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">{t('label_mount_options')}</span>
                                            <span className="text-[var(--text-primary)] font-bold">{spec.mountOptions?.join(', ') || '—'}</span>
                                        </div>
                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                            <span className="text-[var(--font-size-xs)] text-[var(--text-muted)] uppercase font-bold mb-1">{t('label_access_modes')}</span>
                                            <span className="text-[var(--text-primary)] font-bold text-xs">{spec.accessModes?.join(', ') || '—'}</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </DetailSection>
            )}

            {!isNode && !kindLower.includes('configmap') && !kindLower.includes('secret') && !kindLower.includes('role') && !isNamespace && !isNetworkPolicy && !isPv && (
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

            {isNetworkPolicy && (
                <>
                    <PolicyRulesTable title="Ingress Rules" rules={spec.ingress} t={t} />
                    <PolicyRulesTable title="Egress Rules" rules={spec.egress} t={t} />
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

            {isNode && (
                <>
                    <DetailSection title="System Information">
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-600 border-b border-slate-600">
                            <div className="overflow-hidden">
                                <table className="w-full text-sm text-left border-collapse">
                                    <tbody className="divide-y divide-slate-600">
                                        <DetailRow label="Machine ID">
                                            <span className="font-mono text-xs">{spec.nodeInfo?.machineID || '—'}</span>
                                        </DetailRow>
                                        <DetailRow label="System UUID">
                                            <span className="font-mono text-xs">{spec.nodeInfo?.systemUUID || '—'}</span>
                                        </DetailRow>
                                        <DetailRow label="Boot ID">
                                            <span className="font-mono text-xs">{spec.nodeInfo?.bootID || '—'}</span>
                                        </DetailRow>
                                        <DetailRow label="Kernel Version">
                                            <span className="font-bold">{spec.nodeInfo?.kernelVersion || '—'}</span>
                                        </DetailRow>
                                        <DetailRow label="OS Image">
                                            <span className="font-bold">{spec.nodeInfo?.osImage || '—'}</span>
                                        </DetailRow>
                                    </tbody>
                                </table>
                            </div>
                            <div className="overflow-hidden">
                                <table className="w-full text-sm text-left border-collapse">
                                    <tbody className="divide-y divide-slate-600">
                                        <DetailRow label="Container Runtime Version">
                                            <span className="font-bold text-info">{spec.nodeInfo?.containerRuntimeVersion || '—'}</span>
                                        </DetailRow>
                                        <DetailRow label="Kubelet Version">
                                            <span className="font-bold text-info">{spec.nodeInfo?.kubeletVersion || '—'}</span>
                                        </DetailRow>
                                        <DetailRow label="Kube-Proxy Version">
                                            <span className="font-bold text-info">{spec.nodeInfo?.kubeProxyVersion || '—'}</span>
                                        </DetailRow>
                                        <DetailRow label="Operating System">
                                            <span className="font-bold capitalize">{spec.nodeInfo?.operatingSystem || '—'}</span>
                                        </DetailRow>
                                        <DetailRow label="Architecture">
                                            <span className="font-bold uppercase">{spec.nodeInfo?.architecture || '—'}</span>
                                        </DetailRow>
                                        <DetailRow label="CPU Capacity">
                                            <span className="font-bold">{spec.nodeInfo?.cpuCapacity || '—'}</span>
                                        </DetailRow>
                                        <DetailRow label="Memory Capacity">
                                            <span className="font-bold">{spec.nodeInfo?.memoryCapacity || '—'}</span>
                                        </DetailRow>
                                        <DetailRow label="Pods Capacity">
                                            <span className="font-bold">{spec.nodeInfo?.podsCapacity || '—'}</span>
                                        </DetailRow>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </DetailSection>

                    <DetailSection title="Allocation">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 p-6 bg-[var(--bg-sidebar)]/5 rounded border border-slate-600/30">
                            <PieChart
                                percent={(data.allocation?.cpu?.requests / data.allocation?.cpu?.capacity) * 100 || 0}
                                label="CPU Requests"
                                subLabel={`Cores: ${data.allocation?.cpu?.requests || '0'}`}
                                color="var(--text-info)"
                            />
                            <PieChart
                                percent={(data.allocation?.cpu?.limits / data.allocation?.cpu?.capacity) * 100 || 0}
                                label="CPU Limits"
                                subLabel={`Cores: ${data.allocation?.cpu?.limits || '0'}`}
                                color="var(--text-info)"
                            />
                            <PieChart
                                percent={(data.allocation?.memory?.requests / parseFloat(data.allocation?.memory?.capacity)) * 100 || 0}
                                label="Memory Requests"
                                subLabel={`MiB: ${data.allocation?.memory?.requests || '0'}`}
                                color="var(--text-info)"
                            />
                            <PieChart
                                percent={(data.allocation?.memory?.limits / parseFloat(data.allocation?.memory?.capacity)) * 100 || 0}
                                label="Memory Limits"
                                subLabel={`MiB: ${data.allocation?.memory?.limits || '0'}`}
                                color="var(--text-info)"
                            />
                            <PieChart
                                percent={(data.allocation?.pods?.allocation / data.allocation?.pods?.capacity) * 100 || 0}
                                label="Pods"
                                subLabel={`Pods ${data.allocation?.pods?.allocation || '0'}`}
                                color="var(--text-success)"
                            />
                        </div>
                    </DetailSection>

                    <DetailSection title="Conditions">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="bg-[var(--bg-sidebar)]/20 uppercase text-[10px] font-black tracking-widest text-[var(--text-muted)] border-b border-slate-600">
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Last probe time</th>
                                        <th className="px-4 py-3">Last transition time</th>
                                        <th className="px-4 py-3">Reason</th>
                                        <th className="px-4 py-3">Message</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-600/50">
                                    {(status.conditions || []).map((cond, idx) => (
                                        <tr key={idx} className="hover:bg-slate-700/10 transition-colors">
                                            <td className="px-4 py-3 font-bold text-info">{cond.type}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${cond.status === 'True' ? (cond.type === 'Ready' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning') : (cond.type === 'Ready' ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success')}`}>
                                                    {cond.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-[var(--text-muted)] font-mono">{cond.lastProbeTime ? new Date(cond.lastProbeTime).toLocaleString() : '—'}</td>
                                            <td className="px-4 py-3 text-xs text-[var(--text-muted)] font-mono">{cond.lastTransitionTime ? new Date(cond.lastTransitionTime).toLocaleString() : '—'}</td>
                                            <td className="px-4 py-3 font-medium">{cond.reason}</td>
                                            <td className="px-4 py-3 text-xs text-[var(--text-secondary)] italic max-w-xs truncate" title={cond.message}>{cond.message}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </DetailSection>

                    <PodsTable pods={relatedPods} t={t} />
                </>
            )}

            {!isCronJob && !isDaemonSet && !isDeployment && !isJob && !isPod && !isStorageClass && !isIngressClass && !isClusterRoleBinding && !isClusterRole && !isIngress && !isService && !isNamespace && !isNetworkPolicy && !isNode && !isPv && !kindLower.includes('configmap') && !kindLower.includes('pvc') && !kindLower.includes('secret') && (status?.conditions || []).length > 0 && (
                <ConditionsTable conditions={status.conditions} t={t} />
            )}

            {isPv && (
                <>
                    <SourceTable source={data.source} t={t} />
                </>
            )}

            {isStorageClass && (
                <PersistentVolumesTable pvs={relatedPvs} t={t} />
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

            {isNamespace && (
                <>
                    <ResourceQuotasTable quotas={quotas} t={t} icons={icons} />
                    <LimitRangesTable limits={limits} t={t} icons={icons} />
                </>
            )}
        </div>
    );
}
