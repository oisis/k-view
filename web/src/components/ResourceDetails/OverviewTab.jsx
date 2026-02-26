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
        restarts, readyCount, totalContainers, podSpec,
        relatedJobs, relatedPods, relatedServices, relatedReplicaSets, relatedHpas, relatedEndpoints, relatedPvs
    };

    const renderResourceSpecific = () => {
        if (isPod) return <PodOverview {...sectionProps} />;
        if (isDeployment || isJob) return <DeploymentOverview {...sectionProps} />;
        if (isStatefulSet) return <StatefulSetOverview {...sectionProps} />;
        if (isDaemonSet) return <DaemonSetOverview {...sectionProps} />;
        if (isCronJob) return <CronJobOverview {...sectionProps} />;
        if (isService) return <ServiceOverview {...sectionProps} />;
        if (isNode) return <NodeOverview {...sectionProps} />;
        if (kindLower.includes('configmap')) return <ConfigMapOverview {...sectionProps} />;
        if (kindLower.includes('secret')) return <SecretOverview {...sectionProps} />;
        if (isIngress) return <IngressOverview {...sectionProps} />;
        if (isPvc) return <PvcOverview {...sectionProps} />;
        if (isRole || isClusterRole || isRoleBinding || isClusterRoleBinding) return <RbacOverview {...sectionProps} isBinding={isRoleBinding || isClusterRoleBinding} />;
        if (isNamespace) return <NamespaceOverview {...sectionProps} />;
        if (kindLower.includes('event')) return <EventOverview {...sectionProps} />;
        
        return <ResourceInfoSection {...sectionProps} />;
    };

    const isStatefulSet = kindLower.includes('statefulset');

    return (
        <div className="space-y-4">
            <MetadataSection {...sectionProps} />

            {renderResourceSpecific()}

            {!isPod && !isDeployment && !isStatefulSet && !isDaemonSet && !isJob && !isCronJob && !isService && !isNode && !kindLower.includes('configmap') && !kindLower.includes('secret') && !isIngress && !isPvc && !isRole && !isClusterRole && !isRoleBinding && !isClusterRoleBinding && !isNamespace && !isServiceAccount && !isStorageClass && !isIngressClass && (
                <DetailSection title={t('resource_info')} className="mt-4">
                    <table className="w-full text-sm text-left border-collapse">
                        <tbody className="divide-y divide-slate-600">
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

            {metadata.ownerReferences && (
                <ControlledByTable owners={metadata.ownerReferences} namespace={namespace} t={t} icons={icons} />
            )}
        </div>
    );
}
