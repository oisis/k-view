import React from 'react';
import MetadataSection from './sections/MetadataSection';
import ResourceInfoSection from './sections/ResourceInfoSection';
import PodOverview from './templates/PodOverview';
import DeploymentOverview from './templates/DeploymentOverview';
import ServiceOverview from './templates/ServiceOverview';
import CronJobOverview from './templates/CronJobOverview';
import NodeOverview from './templates/NodeOverview';
import ConfigMapOverview from './templates/ConfigMapOverview';
import IngressOverview from './templates/IngressOverview';
import PvcOverview from './templates/PvcOverview';
import RbacOverview from './templates/RbacOverview';
import NamespaceOverview from './templates/NamespaceOverview';
import CrdOverview from './templates/CrdOverview';
import IngressClassOverview from './templates/IngressClassOverview';
import SecretOverview from './templates/SecretOverview';
import StorageClassOverview from './templates/StorageClassOverview';

export default function OverviewTab({ 
    data, kind, namespace, name, quotas, limits, 
    relatedJobs, relatedPods, relatedServices, relatedReplicaSets, relatedHpas, relatedEndpoints, relatedPvs, 
    t, settings 
}) {
    const { metadata, spec = {}, status = {} } = data;
    const kindLower = kind?.toLowerCase() || '';

    const isPod = kindLower.includes('pod');
    const isDeployment = kindLower === 'deployment' || kindLower === 'deployments';
    const isStatefulSet = kindLower.includes('statefulset');
    const isDaemonSet = kindLower.includes('daemonset');
    const isJob = kindLower === 'job' || kindLower === 'jobs';
    const isCronJob = kindLower.includes('cronjob');
    const isNode = kindLower === 'node' || kindLower === 'nodes';
    const isIngressClass = kindLower === 'ingressclass' || kindLower === 'ingressclasses' || (kindLower.includes('ingress') && kindLower.includes('class'));
    const isIngress = (kindLower === 'ingress' || kindLower === 'ingresses') && !isIngressClass;
    const isPvc = kindLower === 'pvc' || kindLower === 'pvcs' || kindLower === 'persistentvolumeclaim' || kindLower === 'persistentvolumeclaims';
    const isPv = kindLower === 'pv' || kindLower === 'pvs' || kindLower === 'persistentvolume' || kindLower === 'persistentvolumes';
    const isRole = kindLower === 'role' || kindLower === 'roles';
    const isClusterRole = kindLower === 'clusterrole' || kindLower === 'clusterroles' || kindLower === 'cluster-role' || kindLower === 'cluster-roles';
    const isRoleBinding = kindLower === 'rolebinding' || kindLower === 'rolebindings' || kindLower === 'role-binding' || kindLower === 'role-bindings';
    const isClusterRoleBinding = kindLower === 'clusterrolebinding' || kindLower === 'clusterrolebindings' || kindLower === 'cluster-role-binding' || kindLower === 'cluster-role-bindings';
    const isServiceAccount = kindLower === 'serviceaccount' || kindLower === 'serviceaccounts' || kindLower === 'service-account' || kindLower === 'service-accounts';
    const isService = (kindLower === 'service' || kindLower === 'services') && !isIngressClass && !isServiceAccount;
    const isNamespace = kindLower === 'namespace' || kindLower === 'namespaces';
    const isStorageClass = kindLower.includes('storage') && kindLower.includes('class');
    const isCrd = kindLower === 'crd' || kindLower === 'crds' || kindLower === 'customresourcedefinition' || kindLower === 'customresourcedefinitions';
    const isNetworkPolicy = kindLower.includes('network') && kindLower.includes('policy');
    const isReplicaSet = kindLower === 'replicaset' || kindLower === 'replicasets' || kindLower === 'replica-set' || kindLower === 'replica-sets';

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
            />

            {/* Do not show generic Resource Info for Ingress, IngressClass or Namespace */}
            {!isIngress && !isIngressClass && !isNamespace && (
                <ResourceInfoSection 
                    isPod={isPod}
                    isDaemonSet={isDaemonSet}
                    isCronJob={isCronJob}
                    isJob={isJob}
                    isNode={isNode}
                    isStorageClass={isStorageClass}
                    data={data}
                    spec={spec}
                    status={status}
                    t={t}
                />
            )}

            {isPod && <PodOverview data={data} spec={spec} status={status} t={t} />}
            {isDeployment && <DeploymentOverview data={data} spec={spec} status={status} relatedReplicaSets={relatedReplicaSets} relatedPods={relatedPods} relatedHpas={relatedHpas} t={t} />}
            {isService && <ServiceOverview data={data} spec={spec} status={status} relatedEndpoints={relatedEndpoints} relatedPods={relatedPods} t={t} />}
            {isCronJob && <CronJobOverview data={data} metadata={metadata} spec={spec} status={status} relatedJobs={relatedJobs} t={t} />}
            {isNode && <NodeOverview data={data} metadata={metadata} spec={spec} status={status} relatedPods={relatedPods} t={t} />}
            {kindLower.includes('configmap') && <ConfigMapOverview data={data} metadata={metadata} t={t} />}
            {kindLower.includes('secret') && <SecretOverview data={data} kind={kind} namespace={namespace} name={name} t={t} />}
            {isIngress && <IngressOverview data={data} metadata={metadata} spec={spec} status={status} t={t} />}
            {isIngressClass && <IngressClassOverview spec={spec} t={t} />}
            {isPvc && <PvcOverview data={data} metadata={metadata} spec={spec} status={status} t={t} />}
            {(isRole || isClusterRole) && <RbacOverview data={data} metadata={metadata} t={t} />}
            {isNamespace && <NamespaceOverview data={data} metadata={metadata} quotas={quotas} limits={limits} t={t} />}
            {isCrd && <CrdOverview data={data} metadata={metadata} spec={spec} t={t} />}
            {isStorageClass && <StorageClassOverview data={data} spec={spec} t={t} />}

            {!isPod && !isDeployment && !isStatefulSet && !isDaemonSet && !isJob && !isCronJob && !isService && !isNode && !kindLower.includes('configmap') && !kindLower.includes('secret') && !isIngress && !isPvc && !isRole && !isClusterRole && !isRoleBinding && !isClusterRoleBinding && !isNamespace && !isServiceAccount && !isStorageClass && !isIngressClass && !isCrd && !isNetworkPolicy && !isPv && !isReplicaSet && (
                <div className="p-8 text-center text-text-muted italic border border-dashed border-border rounded-2xl">
                    No specialized overview available for this resource type.
                </div>
            )}
        </div>
    );
}
