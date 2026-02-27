import React from 'react';
import DetailSection from '../DetailSection';
import PodsTable from '../PodsTable';
import ReplicaSetsTable from '../ReplicaSetsTable';
import HpaTable from '../HpaTable';
import ConditionsTable from '../ConditionsTable';

export default function DeploymentOverview({ data, metadata, spec, status, relatedPods, relatedReplicaSets, relatedHpas, t, icons }) {
    const pods = Array.isArray(relatedPods) ? relatedPods : [];
    const rss = Array.isArray(relatedReplicaSets) ? relatedReplicaSets : [];
    const hpas = Array.isArray(relatedHpas) ? relatedHpas : [];

    return (
        <>
            <DetailSection title={t('resource_info') || "Resource Info"}>
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border bg-[var(--bg-sidebar)]/5 border-b border-border">
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
            </DetailSection>

            <PodsTable pods={pods} t={t} title={t('pods') || "Pods"} />
            <ReplicaSetsTable replicaSets={rss} t={t} title={t('replica_sets') || "Replica Sets"} />
            <HpaTable hpas={hpas} t={t} />
            
            {status?.conditions && Array.isArray(status.conditions) && (
                <ConditionsTable conditions={status.conditions} t={t} />
            )}
        </>
    );
}
