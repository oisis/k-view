import React from 'react';
import DetailSection from '../DetailSection';
import PodsTable from '../PodsTable';
import ReplicaSetsTable from '../ReplicaSetsTable';
import HpaTable from '../HpaTable';
import ConditionsTable from '../ConditionsTable';
import ContainersSection from '../sections/ContainersSection';

/**
 * DeploymentOverview - RESTORED FROZEN VIEW FROM MAIN
 * Cleanly rewritten to consume DTO structure.
 */
export default function DeploymentOverview({ data, metadata, spec, status, relatedPods, relatedReplicaSets, relatedHpas, t, icons }) {
    if (!data) return null;

    const pods = Array.isArray(relatedPods) ? relatedPods : [];
    const rss = Array.isArray(relatedReplicaSets) ? relatedReplicaSets : [];
    const hpas = Array.isArray(relatedHpas) ? relatedHpas : [];

    const deploymentRevision = metadata?.annotations?.['deployment.kubernetes.io/revision'];
    const newRS = rss.filter(rs => rs.extra?.revision && String(rs.extra.revision) === String(deploymentRevision));
    const oldRS = rss.filter(rs => !rs.extra?.revision || String(rs.extra.revision) !== String(deploymentRevision));

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title={t('resource_info') || "Resource Info"}>
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border bg-[var(--bg-sidebar)]/5 border-b border-border rounded-t-xl overflow-hidden">
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Replicas</span>
                        <span className="text-sm font-bold text-primary">{status?.replicas ?? 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Ready</span>
                        <span className="text-sm font-bold text-success">{status?.readyReplicas ?? 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Updated</span>
                        <span className="text-sm font-bold text-info">{status?.updatedReplicas ?? 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Available</span>
                        <span className="text-sm font-bold text-success">{status?.availableReplicas ?? 0}</span>
                    </div>
                </div>
                <div className="p-4 bg-[var(--bg-sidebar)]/5 border-t border-border rounded-b-xl">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">Strategy</span>
                    <span className="text-sm text-primary font-medium">{spec?.strategy?.type || 'RollingUpdate'}</span>
                </div>
            </DetailSection>

            <ContainersSection 
                containers={spec?.template?.spec?.containers || []} 
                initContainers={spec?.template?.spec?.initContainers || []}
                t={t} 
            />

            {pods.length > 0 && <PodsTable pods={pods} t={t} title={t('pods') || "Pods"} />}
            
            {newRS.length > 0 && (
                <ReplicaSetsTable replicaSets={newRS} t={t} title="New Replica Set" />
            )}

            {oldRS.length > 0 && (
                <ReplicaSetsTable replicaSets={oldRS} t={t} title="Old Replica Set" />
            )}

            {hpas.length > 0 && <HpaTable hpas={hpas} t={t} />}
            
            {(status?.conditions || data.resource?.status?.conditions) && (
                <DetailSection title={t('conditions')} icon="activity">
                    <ConditionsTable 
                        conditions={status?.conditions || data.resource?.status?.conditions || []} 
                        t={t} 
                    />
                </DetailSection>
            )}
        </div>
    );
}
