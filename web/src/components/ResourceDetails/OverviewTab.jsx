import React from 'react';
import { useTheme } from '../../ThemeContext';
import MetadataSection from './sections/MetadataSection';
import ResourceInfoSection from './sections/ResourceInfoSection';
import PodOverview from './templates/Pod-overview';
import DeploymentOverview from './templates/Deployment-overview';
// Templates under construction will be enabled batch by batch
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

            {/* BATCH 1: Pods & Deployments */}
            {isPod && <PodOverview data={data} spec={spec} status={status} t={t} icons={icons} namespace={namespace} />}
            {isDeployment && <DeploymentOverview data={data} metadata={metadata} spec={spec} status={status} relatedReplicaSets={relatedReplicaSets} relatedPods={relatedPods} relatedHpas={relatedHpas} t={t} icons={icons} />}

            {/* BATCH 2: STS, DS, RS, RC, Job, CronJob */}
            {isStatefulSet && <StatefulSetOverview data={data} spec={spec} status={status} relatedPods={relatedPods} t={t} icons={icons} />}
            {isDaemonSet && <DaemonSetOverview data={data} spec={spec} status={status} relatedPods={relatedPods} t={t} icons={icons} />}
            {isReplicaSet && <ReplicaSetOverview data={data} spec={spec} status={status} relatedPods={relatedPods} t={t} icons={icons} />}
            {isReplicationController && <ReplicationControllerOverview data={data} spec={spec} status={status} relatedPods={relatedPods} t={t} icons={icons} />}
            {isJob && <JobOverview data={data} spec={spec} status={status} relatedPods={relatedPods} t={t} icons={icons} />}
            {isCronJob && <CronJobOverview data={data} metadata={metadata} spec={spec} status={status} relatedJobs={relatedJobs} t={t} icons={icons} />}

            {!isEventResource && !isPod && !isDeployment && !isStatefulSet && !isDaemonSet && !isJob && !isCronJob && !isReplicaSet && !isReplicationController && (
                <div className="p-8 text-center text-text-muted italic border border-dashed border-border rounded-2xl">
                    No specialized overview available for this resource type ({kind}). Implementation in progress.
                </div>
            )}
        </div>
    );
}
