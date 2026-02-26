import React from 'react';
import { useTheme } from '../../ThemeContext';
import DetailSection from './DetailSection';
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
import PersistentVolumesTable from './PersistentVolumesTable';
import SubjectsTable from './SubjectsTable';
import RulesTable from './RulesTable';
import ResourceQuotasTable from './ResourceQuotasTable';
import LimitRangesTable from './LimitRangesTable';
import PolicyRulesTable from './PolicyRulesTable';
import SourceTable from './SourceTable';
import SecretsTable from './SecretsTable';
import ImagePullSecretsTable from './ImagePullSecretsTable';

// Modular Sections
import MetadataSection from './sections/MetadataSection';
import ResourceInfoSection from './sections/ResourceInfoSection';
import ContainersSection from './sections/ContainersSection';

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
    const isPvc = kindLower.includes('persistentvolumeclaim') || kindLower.includes('pvc');
    const isClusterRoleBinding = kindLower.includes('cluster') && kindLower.includes('role') && kindLower.includes('binding');
    const isRoleBinding = (kindLower === 'rolebindings' || kindLower === 'rolebinding' || kindLower === 'role-bindings') && !kindLower.includes('cluster');
    const isRole = (kindLower === 'roles' || kindLower === 'role') && !kindLower.includes('cluster');
    const isServiceAccount = kindLower === 'service-accounts' || kindLower === 'serviceaccounts' || kindLower === 'serviceaccount';
    const isService = kindLower.includes('service') && !isIngressClass && !isServiceAccount;
    const isClusterRole = (kindLower.includes('cluster') && kindLower.includes('role') && !kindLower.includes('binding')) || kindLower === 'clusterroles';
    const isNamespace = kindLower === 'namespaces' || kindLower === 'namespace';
    const isNetworkPolicy = kindLower === 'networkpolicies' || kindLower === 'networkpolicy' || kindLower === 'network-policies';
    const isNode = kindLower === 'nodes' || kindLower === 'node';
    const isPv = kindLower === 'persistentvolumes' || kindLower === 'persistentvolume' || kindLower === 'pvs';

    const podSpec = isPod ? spec : (spec.template?.spec || {});
    
    const restarts = isPod && status?.containerStatuses
        ? status.containerStatuses.reduce((acc, c) => acc + (c.restartCount || 0), 0)
        : 0;

    const readyCount = isPod && status?.containerStatuses
        ? status.containerStatuses.filter(c => c.ready).length
        : 0;
    const totalContainers = isPod && status?.containerStatuses
        ? status.containerStatuses.length
        : 0;

    const sectionProps = {
        data, metadata, spec, status, kind, kindLower, namespace, name, t, settings, icons,
        isPod, isJob, isCronJob, isDaemonSet, isDeployment, isStorageClass, isIngressClass,
        isIngress, isPvc, isClusterRoleBinding, isRoleBinding, isRole, isServiceAccount,
        isService, isClusterRole, isNamespace, isNetworkPolicy, isNode, isPv,
        restarts, readyCount, totalContainers, podSpec
    };

    return (
        <div className="space-y-4">
            <MetadataSection {...sectionProps} />

            <ResourceInfoSection {...sectionProps} />

            {kindLower.includes('configmap') && data.data && (
                <DetailSection title="Data" className="mt-4">
                    <CodeEditor
                        value={JSON.stringify(data.data, null, 2)}
                        readOnly={true}
                        fontSize={13}
                    />
                </DetailSection>
            )}

            {(isClusterRoleBinding || isRoleBinding) && (
                <>
                    <DetailSection title={t('resource_info')} className="mt-4">
                        <table className="w-full text-sm text-left border-collapse">
                            <tbody className="divide-y divide-slate-600">
                                <tr className="border-b border-slate-600">
                                    <td className="px-4 py-3 text-[var(--text-muted)] font-bold uppercase text-[10px] w-1/4">Role Reference</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-black uppercase tracking-wider">
                                                {data.roleRef?.kind || (isClusterRoleBinding ? 'ClusterRole' : 'Role')}
                                            </span>
                                            <span className="font-mono text-info font-bold">{data.roleRef?.name || '—'}</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </DetailSection>
                    <SubjectsTable subjects={data.subjects} t={t} />
                </>
            )}

            {(isClusterRole || isRole) && (
                <RulesTable rules={data.rules} t={t} />
            )}

            {!isNamespace && !isNode && !isClusterRole && !isClusterRoleBinding && !isRole && !isRoleBinding && !isServiceAccount && !isStorageClass && !isIngressClass && (
                <DetailSection title={t('resource_info')} className="mt-4">
                    <table className="w-full text-sm text-left border-collapse">
                        <tbody className="divide-y divide-slate-600">
                            <ContainersSection {...sectionProps} />
                        </tbody>
                    </table>
                </DetailSection>
            )}

            {kindLower.includes('secret') && data.data && (
                <SecretDataSection
                    data={data.data}
                    kind={kind}
                    namespace={namespace}
                    name={name}
                    t={t}
                />
            )}

            {/* Related Resources Tables */}
            {relatedPods && <PodsTable pods={relatedPods} t={t} icons={icons} />}
            {relatedJobs && <JobsTable jobs={relatedJobs} t={t} icons={icons} />}
            {relatedReplicaSets && <ReplicaSetsTable replicaSets={relatedReplicaSets} t={t} icons={icons} />}
            {relatedServices && <EndpointsTable services={relatedServices} t={t} icons={icons} />}
            {relatedHpas && <HpaTable hpas={relatedHpas} t={t} icons={icons} />}
            
            {status?.conditions && (
                <ConditionsTable conditions={status.conditions} t={t} icons={icons} />
            )}

            {metadata.ownerReferences && (
                <ControlledByTable owners={metadata.ownerReferences} namespace={namespace} t={t} icons={icons} />
            )}
        </div>
    );
}
