import React from 'react';
import DetailSection from '../DetailSection';
import PodsTable from '../PodsTable';
import HpaTable from '../HpaTable';
import ConditionsTable from '../ConditionsTable';

export default function StatefulSetOverview({ data, metadata, spec, status, relatedPods, relatedHpas, t, icons }) {
    return (
        <>
            <DetailSection title={t('resource_info')}>
                <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-border bg-[var(--bg-sidebar)]/5 border-b border-border">
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Replicas</span>
                        <span className="text-sm font-bold text-primary">{status.replicas || 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Ready</span>
                        <span className="text-sm font-bold text-success">{status.readyReplicas || 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Current</span>
                        <span className="text-sm font-bold text-info">{status.currentReplicas || 0}</span>
                    </div>
                </div>
            </DetailSection>

            {relatedPods && <PodsTable pods={relatedPods} t={t} icons={icons} />}
            {relatedHpas && <HpaTable hpas={relatedHpas} t={t} icons={icons} />}
            
            {status?.conditions && (
                <ConditionsTable conditions={status.conditions} t={t} icons={icons} />
            )}
        </>
    );
}
