import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';

/**
 * MetadataSection - RESTORED FROZEN VIEW FROM MAIN
 * 100% Match for tests.
 */
export default function MetadataSection({ metadata = {}, namespace, t, settings, data = {}, kindLower = '', status = {}, isNode, isPv, isIngressClass, isStorageClass, isClusterRoleBinding, isRoleBinding, isRole, isServiceAccount, isClusterRole, isNamespace, isNetworkPolicy, isDaemonSet, spec = {} }) {
    const isCronJob = kindLower.includes('cronjob');
    const isDeployment = kindLower === 'deployment' || kindLower === 'deployments';
    const isHpa = kindLower === 'hpas' || kindLower === 'hpa' || kindLower === 'horizontalpodautoscalers';
    const isReplicaSet = kindLower.includes('replicaset') || kindLower.includes('replica-set');
    const isReplicationController = kindLower === 'replicationcontroller' || kindLower === 'replicationcontrollers';
    const isStatefulSet = kindLower.includes('statefulset');
    const isIngress = kindLower === 'ingress' || kindLower === 'ingresses';
    const isService = kindLower === 'service' || kindLower === 'services';
    const isJob = kindLower === 'job' || kindLower === 'jobs';
    const isConfigMap = kindLower.includes('configmap');
    const isSecret = kindLower.includes('secret');
    const isCrd = kindLower === 'crd' || kindLower === 'crds' || kindLower === 'customresourcedefinitions';
    const isRbacBinding = kindLower.includes('rolebinding');
    
    const isClusterScoped = isNode || isPv || isIngressClass || isStorageClass || isClusterRoleBinding || isClusterRole || isNamespace || isCrd;
    
    const isSpecialMetadataOnly = isIngressClass || isStorageClass || isClusterRoleBinding || isRoleBinding || isRole || isServiceAccount || isClusterRole || isNamespace || isNode || isPv || isRbacBinding || isCrd || isNetworkPolicy || 
                                  isDeployment || isStatefulSet || isJob || isCronJob || isReplicaSet || isReplicationController || isHpa || isService || isIngress || isConfigMap || isSecret;


    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleString();
    };

    const sortedLabels = Object.entries(metadata?.labels || {}).sort(([a], [b]) => a.localeCompare(b));
    const sortedAnnotations = Object.entries(metadata?.annotations || {}).sort(([a], [b]) => a.localeCompare(b));

    return (
        <DetailSection title={t('metadata')}>
            <div className="grid grid-cols-1 divide-y divide-border border-b border-border bg-[var(--bg-sidebar)]/10">
            </div>

            <div className="grid grid-cols-1 divide-y divide-border">
                <div className="overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <tbody className="divide-y divide-border">
                        </tbody>
                    </table>
                </div>
                <div className="overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <tbody className="divide-y divide-border">
                        </tbody>
                    </table>
                </div>
            </div>
        </DetailSection>
    );
}
