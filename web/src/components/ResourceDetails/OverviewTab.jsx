import React from 'react';
import { Link } from 'react-router-dom';
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

// Resource Templates
import PodOverview from './templates/PodOverview';
import DeploymentOverview from './templates/DeploymentOverview';
import ServiceOverview from './templates/ServiceOverview';
import CronJobOverview from './templates/CronJobOverview';
import NodeOverview from './templates/NodeOverview';
import ConfigMapOverview from './templates/ConfigMapOverview';
import SecretOverview from './templates/SecretOverview';
import IngressOverview from './templates/IngressOverview';
import PvcOverview from './templates/PvcOverview';
import RbacOverview from './templates/RbacOverview';
import NamespaceOverview from './templates/NamespaceOverview';
import EventOverview from './templates/EventOverview';
import DaemonSetOverview from './templates/DaemonSetOverview';
import StatefulSetOverview from './templates/StatefulSetOverview';
import PvOverview from './templates/PvOverview';
import NetworkPolicyOverview from './templates/NetworkPolicyOverview';
import ServiceAccountOverview from './templates/ServiceAccountOverview';
import CrdOverview from './templates/CrdOverview';

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
    const isCrd = kindLower.includes('customresourcedefinition') || kindLower === 'crds';
    const isReplicaSet = kindLower.includes('replicaset');

    const podSpec = isPod ? spec : (spec.template?.spec || {});
    const volumes = podSpec.volumes || [];
    const mountedConfigMaps = Array.from(new Set(volumes.filter(v => v.configMap).map(v => v.configMap.name)));
    const mountedSecrets = Array.from(new Set(volumes.filter(v => v.secret).map(v => v.secret.secretName)));
    const mountedPvcs = Array.from(new Set(volumes.filter(v => v.persistentVolumeClaim).map(v => v.persistentVolumeClaim.claimName)));
    
    const restarts = (isPod && Array.isArray(status?.containerStatuses))
        ? status.containerStatuses.reduce((acc, c) => acc + (c?.restartCount || 0), 0)
        : 0;

    const readyCount = (isPod && Array.isArray(status?.containerStatuses))
        ? status.containerStatuses.filter(c => c?.ready).length
        : 0;
    const totalContainers = (isPod && Array.isArray(status?.containerStatuses))
        ? status.containerStatuses.length
        : 0;

    const sectionProps = {
        data, metadata, spec, status, kind, kindLower, namespace, name, t, settings, icons,
        isPod, isJob, isCronJob, isDaemonSet, isDeployment, isStorageClass, isIngressClass,
        isIngress, isPvc, isClusterRoleBinding, isRoleBinding, isRole, isServiceAccount,
        isService, isClusterRole, isNamespace, isNetworkPolicy, isNode, isPv, isCrd, isReplicaSet,
        restarts, readyCount, totalContainers, podSpec,
        relatedJobs, relatedPods, relatedServices, relatedReplicaSets, relatedHpas, relatedEndpoints, relatedPvs,
        mountedConfigMaps, mountedSecrets, mountedPvcs
    };

    const renderResourceSpecific = () => {
        if (isPod) return <PodOverview {...sectionProps} />;
        if (isDeployment || isJob || isReplicaSet) return <DeploymentOverview {...sectionProps} />;
        if (isStatefulSet) return <StatefulSetOverview {...sectionProps} />;
        if (isDaemonSet) return <DaemonSetOverview {...sectionProps} />;
        if (isCronJob) return <CronJobOverview {...sectionProps} />;
        if (isService) return <ServiceOverview {...sectionProps} />;
        if (isNode) return <NodeOverview {...sectionProps} />;
        if (kindLower.includes('configmap')) return <ConfigMapOverview {...sectionProps} />;
        if (kindLower.includes('secret')) return <SecretOverview {...sectionProps} />;
        if (isIngress) return <IngressOverview {...sectionProps} />;
        if (isPvc) return <PvcOverview {...sectionProps} />;
        if (isPv) return <PvOverview {...sectionProps} />;
        if (isNetworkPolicy) return <NetworkPolicyOverview {...sectionProps} />;
        if (isServiceAccount) return <ServiceAccountOverview {...sectionProps} />;
        if (isCrd) return <CrdOverview {...sectionProps} />;
        if (isRole || isClusterRole || isRoleBinding || isClusterRoleBinding) return <RbacOverview {...sectionProps} isBinding={isRoleBinding || isClusterRoleBinding} />;
        if (isNamespace) return <NamespaceOverview {...sectionProps} />;
        if (kindLower.includes('event')) return <EventOverview {...sectionProps} />;
        
        return <ResourceInfoSection {...sectionProps} />;
    };

    const isStatefulSet = kindLower.includes('statefulset');
    const ownerRefs = metadata?.ownerReferences || data?.ownerReferences || data?.resource?.ownerReferences;

    return (
        <div className="space-y-4">
            <MetadataSection {...sectionProps} />

            {renderResourceSpecific()}

            {!isPod && !isDeployment && !isStatefulSet && !isDaemonSet && !isJob && !isCronJob && !isService && !isNode && !kindLower.includes('configmap') && !kindLower.includes('secret') && !isIngress && !isPvc && !isRole && !isClusterRole && !isRoleBinding && !isClusterRoleBinding && !isNamespace && !isServiceAccount && !isStorageClass && !isIngressClass && !isCrd && !isNetworkPolicy && !isPv && !isReplicaSet && (
                <DetailSection title={t('resource_info')} className="mt-4">
                    <table className="w-full text-sm text-left border-collapse">
                        <tbody className="divide-y divide-border">
                            <ContainersSection {...sectionProps} />
                        </tbody>
                    </table>
                </DetailSection>
            )}

            {isNamespace && (
                <>
                    {quotas && <ResourceQuotasTable quotas={quotas} t={t} />}
                    {limits && <LimitRangesTable limits={limits} t={t} />}
                </>
            )}

            {/* Mounted Resources Links */}
            {(mountedConfigMaps.length > 0 || mountedSecrets.length > 0 || mountedPvcs.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {mountedConfigMaps.length > 0 && (
                        <DetailSection title={t('mounted_configmaps')}>
                            <div className="p-2 space-y-1">
                                {mountedConfigMaps.map(cm => (
                                                                         <Link key={cm} to={`/configmaps/${namespace}/${cm}`} className="block px-3 py-2 bg-sidebar/30 rounded-lg hover:bg-card-hover text-xs font-mono text-info truncate">                                        {cm}
                                    </Link>
                                ))}
                            </div>
                        </DetailSection>
                    )}
                    {mountedSecrets.length > 0 && (
                        <DetailSection title={t('mounted_secrets')}>
                            <div className="p-2 space-y-1">
                                {mountedSecrets.map(s => (
                                                                         <Link key={s} to={`/secrets/${namespace}/${s}`} className="block px-3 py-2 bg-sidebar/30 rounded-lg hover:bg-card-hover text-xs font-mono text-info truncate">                                        {s}
                                    </Link>
                                ))}
                            </div>
                        </DetailSection>
                    )}
                    {mountedPvcs.length > 0 && (
                        <DetailSection title={t('mounted_pvcs')}>
                            <div className="p-2 space-y-1">
                                {mountedPvcs.map(pvc => (
                                                                         <Link key={pvc} to={`/pvcs/${namespace}/${pvc}`} className="block px-3 py-2 bg-sidebar/30 rounded-lg hover:bg-card-hover text-xs font-mono text-info truncate">                                        {pvc}
                                    </Link>
                                ))}
                            </div>
                        </DetailSection>
                    )}
                </div>
            )}

            {ownerRefs && (
                <ControlledByTable owners={ownerRefs} namespace={namespace} t={t} icons={icons} />
            )}
        </div>
    );
}
