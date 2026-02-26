import React from 'react';
import DetailSection from '../DetailSection';
import PodsTable from '../PodsTable';
import ReplicaSetsTable from '../ReplicaSetsTable';
import HpaTable from '../HpaTable';
import ConditionsTable from '../ConditionsTable';

export default function DeploymentOverview({ data, metadata, spec, status, relatedPods, relatedReplicaSets, relatedHpas, t, icons }) {
    return (
        <>
            <DetailSection title={t('resource_info')}>
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-600 bg-[var(--bg-sidebar)]/5 border-b border-slate-600">
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Replicas</span>
                        <span className="text-sm font-bold text-[var(--text-primary)]">{status.replicas || 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Ready</span>
                        <span className="text-sm font-bold text-success">{status.readyReplicas || 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Updated</span>
                        <span className="text-sm font-bold text-info">{status.updatedReplicas || 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">Available</span>
                        <span className="text-sm font-bold text-success">{status.availableReplicas || 0}</span>
                    </div>
                </div>
            </DetailSection>

            {relatedPods && <PodsTable pods={relatedPods} t={t} icons={icons} />}
            {relatedReplicaSets && <ReplicaSetsTable replicaSets={relatedReplicaSets} t={t} icons={icons} />}
            {relatedHpas && <HpaTable hpas={relatedHpas} t={t} icons={icons} />}
            
            {status?.conditions && (
                <ConditionsTable conditions={status.conditions} t={t} icons={icons} />
            )}
        </>
    );
}
