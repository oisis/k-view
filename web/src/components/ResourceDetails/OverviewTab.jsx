import React from 'react';
import { useTheme } from '../../ThemeContext';
import MetadataSection from './sections/MetadataSection';
import ResourceInfoSection from './sections/ResourceInfoSection';
import PodOverview from './templates/Pod-overview';
import DeploymentOverview from './templates/Deployment-overview';
import ServiceOverview from './templates/Service-overview';
import CronJobOverview from './templates/CronJob-overview';
import NodeOverview from './templates/Node-overview';
import ConfigMapOverview from './templates/ConfigMap-overview';
import IngressOverview from './templates/Ingress-overview';
import StatefulSetOverview from './templates/StatefulSet-overview';
import PvcOverview from './templates/PersistentVolumeClaim-overview';
import RbacOverview from './templates/Role-overview';
import NamespaceOverview from './templates/Namespace-overview';
import CrdOverview from './templates/CustomResourceDefinition-overview';
import IngressClassOverview from './templates/IngressClass-overview';
import SecretOverview from './templates/Secret-overview';
import StorageClassOverview from './templates/StorageClass-overview';
import NetworkPolicyOverview from './templates/NetworkPolicy-overview';
import ServiceAccountOverview from './templates/ServiceAccount-overview';
import PvOverview from './templates/PersistentVolume-overview';
import RbacBindingOverview from './templates/RoleBinding-overview';
import DaemonSetOverview from './templates/DaemonSet-overview';
import JobOverview from './templates/Job-overview';
import HpaOverview from './templates/HorizontalPodAutoscaler-overview';
import ReplicaSetOverview from './templates/ReplicaSet-overview';
import ReplicationControllerOverview from './templates/ReplicationController-overview';
import EventOverview from './templates/Event-overview';

/**
 * OverviewTab - RESTORED FROZEN VIEW FROM MAIN
 * Orchestrates all specific resource templates.
 */
export default function OverviewTab({
    data, kind, namespace, name, quotas, limits, 
    relatedJobs, relatedPods, relatedServices, relatedReplicaSets, relatedHpas, relatedIngresses, relatedCrdObjects, relatedEndpoints, relatedPvs, 
    relatedSecrets, relatedImagePullSecrets,
    t, settings 
}) {
    const { icons } = useTheme();
    if (!data) return null;
    const { metadata, spec = {}, status = {} } = data;
    const kindLower = kind?.toLowerCase() || '';

    // Robust resource detection
    const isPod = kindLower.includes('pod');
    const isDeployment = kindLower === 'deployment' || kindLower === 'deployments';
    const isStatefulSet = kindLower.includes('statefulset');
    const isDaemonSet = kindLower.includes('daemonset');
    const isJob = kindLower === 'job' || kindLower === 'jobs';
    const isCronJob = kindLower.includes('cronjob');
    const isNode = kindLower === 'node' || kindLower === 'nodes';
    const isIngressClass = kindLower.includes('ingress') && kindLower.includes('class');
    const isIngress = (kindLower.includes('ingress') && !kindLower.includes('class'));
    const isPvc = kindLower.includes('pvc') || kindLower.includes('persistentvolumeclaim');
    const isPv = kindLower === 'pv' || kindLower === 'pvs' || (kindLower.includes('persistentvolume') && !kindLower.includes('claim'));
    const isRole = (kindLower === 'role' || kindLower === 'roles');
    const isClusterRole = (kindLower === 'clusterrole' || kindLower === 'clusterroles' || kindLower === 'cluster-role' || kindLower === 'cluster-roles');
    const isRoleBinding = kindLower.includes('rolebinding') || kindLower.includes('role-binding');
    const isClusterRoleBinding = kindLower.includes('clusterrolebinding') || kindLower.includes('cluster-role-binding');
    const isServiceAccount = kindLower.includes('serviceaccount') || kindLower.includes('service-account');
    const isService = (kindLower === 'service' || kindLower === 'services') && !isIngressClass && !isServiceAccount;
    const isNamespace = kindLower.includes('namespace');
    const isStorageClass = kindLower.includes('storage') && kindLower.includes('class');
    const isCrd = kindLower.includes('crd') || kindLower.includes('customresourcedefinitions');
    const isNetworkPolicy = kindLower.includes('network') && (kindLower.includes('policy') || kindLower.includes('policies'));
    const isReplicaSet = kindLower.includes('replicaset') || kindLower.includes('replica-set');
    const isReplicationController = kindLower === 'replicationcontroller' || kindLower === 'replicationcontrollers';
    const isHpa = kindLower === 'hpas' || kindLower === 'hpa' || kindLower === 'horizontalpodautoscalers';

    return (
        <div className="space-y-4">
            <MetadataSection 
                metadata={metadata} 
                namespace={namespace} 
                t={t} 
                settings={settings} 
                data={data}
                kindLower={kindLower}
                status={status}
                spec={spec}
                isNode={isNode}
                isPv={isPv}
                isIngressClass={isIngressClass}
                isStorageClass={isStorageClass}
                isClusterRoleBinding={isClusterRoleBinding}
                isRoleBinding={isRoleBinding}
                isRole={isRole}
                isServiceAccount={isServiceAccount}
                isClusterRole={isClusterRole}
                isNamespace={isNamespace}
                isNetworkPolicy={isNetworkPolicy}
                isDaemonSet={isDaemonSet}
                isReplicaSet={isReplicaSet}
                isReplicationController={isReplicationController}
            />

            {!isIngress && !isIngressClass && !isNamespace && !isNetworkPolicy && !isStorageClass && !isPv && !isRoleBinding && !isClusterRoleBinding && !isDaemonSet && !isJob && !isReplicaSet && !isReplicationController && (
                <ResourceInfoSection 
                    isPod={isPod}
                    isDaemonSet={isDaemonSet}
                    isCronJob={isCronJob}
                    isJob={isJob}
                    isReplicaSet={isReplicaSet}
                    isReplicationController={isReplicationController}
                    isNode={isNode}
                    isStorageClass={isStorageClass}
                    data={data}
                    spec={spec}
                    status={status}
                    t={t}
                    icons={icons}
                />
            )}

            {isPod && <PodOverview data={data} spec={spec} status={status} t={t} icons={icons} namespace={namespace} />}
            {isDeployment && <DeploymentOverview data={data} metadata={metadata} spec={spec} status={status} relatedReplicaSets={relatedReplicaSets} relatedPods={relatedPods} relatedHpas={relatedHpas} t={t} icons={icons} />}
            {isStatefulSet && <StatefulSetOverview data={data} spec={spec} status={status} relatedPods={relatedPods} relatedServices={relatedServices} relatedHpas={relatedHpas} t={t} icons={icons} />}
            {isDaemonSet && <DaemonSetOverview data={data} spec={spec} status={status} relatedPods={relatedPods} relatedServices={relatedServices} t={t} icons={icons} />}
            {isJob && <JobOverview data={data} spec={spec} status={status} relatedPods={relatedPods} t={t} icons={icons} />}
            {isReplicaSet && <ReplicaSetOverview data={data} spec={spec} status={status} relatedPods={relatedPods} relatedServices={relatedServices} t={t} icons={icons} />}
            {isReplicationController && <ReplicationControllerOverview data={data} spec={spec} status={status} relatedPods={relatedPods} relatedServices={relatedServices} t={t} icons={icons} />}
            {isHpa && <HpaOverview spec={spec} status={status} t={t} />}
            {isService && <ServiceOverview data={data} spec={spec} status={status} relatedEndpoints={relatedEndpoints} relatedPods={relatedPods} relatedIngresses={relatedIngresses} t={t} icons={icons} />}
            {isCronJob && <CronJobOverview data={data} metadata={metadata} spec={spec} status={status} relatedJobs={relatedJobs} t={t} icons={icons} />}
            {isNode && <NodeOverview data={data} metadata={metadata} spec={spec} status={status} relatedPods={relatedPods} t={t} icons={icons} />}
            {kindLower.includes('configmap') && <ConfigMapOverview data={data} metadata={metadata} kind={kind} namespace={namespace} name={name} t={t} />}
            {kindLower.includes('secret') && <SecretOverview data={data} kind={kind} namespace={namespace} name={name} t={t} />}
            {isIngress && <IngressOverview data={data} metadata={metadata} spec={spec} status={status} t={t} icons={icons} />}
            {isIngressClass && <IngressClassOverview spec={spec} t={t} />}
            {isPvc && <PvcOverview data={data} metadata={metadata} spec={spec} status={status} t={t} />}
            {isPv && <PvOverview data={data} metadata={metadata} spec={spec} status={status} t={t} />}
            {(isRole || isClusterRole) && <RbacOverview data={data} metadata={metadata} spec={spec} t={t} isBinding={false} />}
            {(isRoleBinding || isClusterRoleBinding) && <RbacBindingOverview data={data} spec={spec} t={t} />}
            {isNamespace && <NamespaceOverview data={data} metadata={metadata} status={status} quotas={quotas} limits={limits} t={t} icons={icons} />}
            {isCrd && <CrdOverview data={data} metadata={metadata} spec={spec} status={status} relatedCrdObjects={relatedCrdObjects} t={t} />}
            {isStorageClass && <StorageClassOverview data={data} spec={spec} relatedPvs={relatedPvs} t={t} icons={icons} />}
            {isNetworkPolicy && <NetworkPolicyOverview spec={spec} t={t} />}
            {isServiceAccount && <ServiceAccountOverview data={data} metadata={metadata} spec={spec} namespace={namespace} relatedSecrets={relatedSecrets} relatedImagePullSecrets={relatedImagePullSecrets} t={t} icons={icons} />}

            {!isPod && !isDeployment && !isStatefulSet && !isDaemonSet && !isJob && !isCronJob && !isService && !isNode && !kindLower.includes('configmap') && !kindLower.includes('secret') && !isIngress && !isPvc && !isRole && !isClusterRole && !isRoleBinding && !isClusterRoleBinding && !isNamespace && !isServiceAccount && !isStorageClass && !isIngressClass && !isCrd && !isNetworkPolicy && !isPv && !isReplicaSet && !isHpa && !isReplicationController && (
                <div className="p-8 text-center text-text-muted italic border border-dashed border-border rounded-2xl">
                    No specialized overview available for this resource type ({kind}).
                </div>
            )}
        </div>
    );
}
