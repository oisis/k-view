import React from 'react';
import DetailSection from '../DetailSection';
import PodsTable from '../PodsTable';
import ConditionsTable from '../ConditionsTable';

export default function DaemonSetOverview({ data, metadata, spec, status, relatedPods, t, icons }) {
    return (
        <>
            <DetailSection title={t('resource_info')}>
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border bg-[var(--bg-sidebar)]/5 border-b border-border">
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Desired</span>
                        <span className="text-sm font-bold text-primary">{status.desiredNumberScheduled || 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Current</span>
                        <span className="text-sm font-bold text-info">{status.currentNumberScheduled || 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Ready</span>
                        <span className="text-sm font-bold text-success">{status.numberReady || 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Available</span>
                        <span className="text-sm font-bold text-success">{status.numberAvailable || 0}</span>
                    </div>
                </div>
            </DetailSection>

            {relatedPods && <PodsTable pods={relatedPods} t={t} icons={icons} />}
            
            {status?.conditions && (
                <ConditionsTable conditions={status.conditions} t={t} icons={icons} />
            )}
        </>
    );
}
