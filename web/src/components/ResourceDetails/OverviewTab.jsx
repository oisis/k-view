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
import EndpointsOverview from './templates/Endpoint-overview';

/**
 * OverviewTab - Batch Implementation
 * Only enabled resources will render their specific templates.
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

    // Resource detection
    const isPod = kindLower.includes('pod');
    const isDeployment = kindLower === 'deployment' || kindLower === 'deployments';
    const isStatefulSet = kindLower.includes('statefulset');
    const isDaemonSet = kindLower.includes('daemonset');
    const isJob = kindLower === 'job' || kindLower === 'jobs';
    const isCronJob = kindLower.includes('cronjob');
    const isReplicaSet = kindLower.includes('replicaset') || kindLower.includes('replica-set');
    const isReplicationController = kindLower === 'replicationcontroller' || kindLower === 'replicationcontrollers';
    const isService = kindLower === 'service' || kindLower === 'services';
    const isIngress = kindLower === 'ingress' || kindLower === 'ingresses';
    const isEndpoint = kindLower === 'endpoint' || kindLower === 'endpoints';
    const isNetworkPolicy = kindLower.includes('networkpolicy') || kindLower.includes('network-policy');
    const isIngressClass = kindLower === 'ingressclass' || kindLower === 'ingress-class' || kindLower === 'ingressclasses';
    const isConfigMap = kindLower.includes('configmap');
    const isSecret = kindLower.includes('secret');
    const isPvc = kindLower === 'pvc' || kindLower === 'persistentvolumeclaim' || kindLower === 'persistentvolumeclaims';
    const isPv = kindLower === 'pv' || kindLower === 'persistentvolume' || kindLower === 'persistentvolumes';
    const isStorageClass = kindLower === 'storageclass' || kindLower === 'storageclasses';
    const isNode = kindLower === 'node' || kindLower === 'nodes';
    const isNamespace = kindLower === 'namespace' || kindLower === 'namespaces';
    const isHpa = kindLower === 'hpa' || kindLower === 'hpas' || kindLower === 'horizontalpodautoscalers';
    const isServiceAccount = kindLower.includes('serviceaccount') || kindLower.includes('service-account');
    const isCrd = kindLower.includes('crd') || kindLower.includes('customresourcedefinition');
    const isRole = kindLower === 'role' || kindLower === 'roles';
    const isClusterRole = kindLower.includes('clusterrole') && !kindLower.includes('binding');
    const isRoleBinding = kindLower === 'rolebinding' || kindLower === 'role-binding';
    const isClusterRoleBinding = kindLower.includes('clusterrolebinding') || kindLower.includes('cluster-role-binding');
    const isEventResource = kindLower === 'event' || kindLower === 'events';

    return (
        <div className="space-y-4">
            {!isEventResource && (
                <MetadataSection 
                    metadata={metadata} 
                    namespace={namespace} 
                    t={t} 
                    settings={settings} 
                    data={data}
                    kindLower={kindLower}
                    status={status}
                    spec={spec}
                />
            )}

            {isEventResource && <EventOverview data={data} spec={spec} status={status} t={t} icons={icons} />}

            {/* BATCH 1 & 2: Workloads */}
            {isPod && <PodOverview data={data} spec={spec} status={status} t={t} icons={icons} namespace={namespace} />}
            {isDeployment && <DeploymentOverview data={data} metadata={metadata} spec={spec} status={status} relatedReplicaSets={relatedReplicaSets} relatedPods={relatedPods} relatedHpas={relatedHpas} t={t} icons={icons} />}
            {isStatefulSet && <StatefulSetOverview data={data} spec={spec} status={status} relatedPods={relatedPods} t={t} icons={icons} />}
            {isDaemonSet && <DaemonSetOverview data={data} spec={spec} status={status} relatedPods={relatedPods} t={t} icons={icons} />}
            {isReplicaSet && <ReplicaSetOverview data={data} spec={spec} status={status} relatedPods={relatedPods} t={t} icons={icons} />}
            {isReplicationController && <ReplicationControllerOverview data={data} spec={spec} status={status} relatedPods={relatedPods} relatedServices={relatedServices} t={t} icons={icons} />}
            {isJob && <JobOverview data={data} spec={spec} status={status} relatedPods={relatedPods} t={t} icons={icons} />}
            {isCronJob && <CronJobOverview data={data} metadata={metadata} spec={spec} status={status} relatedJobs={relatedJobs} t={t} icons={icons} />}

            {/* BATCH 3: Network */}
            {isService && <ServiceOverview data={data} spec={spec} status={status} relatedEndpoints={relatedEndpoints} relatedPods={relatedPods} relatedIngresses={relatedIngresses} t={t} icons={icons} />}
            {isIngress && <IngressOverview data={data} metadata={metadata} spec={spec} status={status} t={t} icons={icons} />}
            {isEndpoint && <EndpointsOverview data={data} spec={spec} t={t} icons={icons} />}
            {isNetworkPolicy && <NetworkPolicyOverview spec={spec} t={t} />}
            {isIngressClass && <IngressClassOverview spec={spec} t={t} />}

            {/* BATCH 4: Storage & Config */}
            {isConfigMap && <ConfigMapOverview data={data} metadata={metadata} t={t} />}
            {isSecret && <SecretOverview data={data} t={t} />}
            {isPvc && <PvcOverview data={data} metadata={metadata} spec={spec} status={status} t={t} />}
            {isPv && <PvOverview data={data} metadata={metadata} spec={spec} status={status} t={t} />}
            {isStorageClass && <StorageClassOverview data={data} spec={spec} relatedPvs={relatedPvs} t={t} icons={icons} />}

            {/* BATCH 5: Cluster & Metadata */}
            {isNode && <NodeOverview data={data} metadata={metadata} spec={spec} status={status} relatedPods={relatedPods} t={t} icons={icons} />}
            {isNamespace && <NamespaceOverview data={data} metadata={metadata} status={status} quotas={quotas} limits={limits} t={t} icons={icons} />}
            {isHpa && <HpaOverview data={data} spec={spec} status={status} t={t} />}
            {isServiceAccount && <ServiceAccountOverview data={data} metadata={metadata} spec={spec} namespace={namespace} relatedSecrets={relatedSecrets} relatedImagePullSecrets={relatedImagePullSecrets} t={t} icons={icons} />}
            {isCrd && <CrdOverview data={data} metadata={metadata} spec={spec} status={status} relatedCrdObjects={relatedCrdObjects} t={t} />}
            {(isRole || isClusterRole) && <RbacOverview data={data} metadata={metadata} spec={spec} t={t} isBinding={false} />}
            {(isRoleBinding || isClusterRoleBinding) && <RbacBindingOverview data={data} spec={spec} t={t} />}

            {!isEventResource && !isPod && !isDeployment && !isStatefulSet && !isDaemonSet && !isJob && !isCronJob && !isReplicaSet && !isReplicationController && !isService && !isIngress && !isEndpoint && !isNetworkPolicy && !isIngressClass && !isConfigMap && !isSecret && !isPvc && !isPv && !isStorageClass && !isNode && !isNamespace && !isHpa && !isServiceAccount && !isCrd && !isRole && !isClusterRole && !isRoleBinding && !isClusterRoleBinding && (
                <div className="p-8 text-center text-text-muted italic border border-dashed border-border rounded-2xl">
                    No specialized overview available for this resource type ({kind}). Implementation in progress.
                </div>
            )}
        </div>
    );
}
