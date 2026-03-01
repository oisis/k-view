import React from 'react';
import DetailSection from '../DetailSection';
import ContainerDetails from '../ContainerDetails';
import PodsTable from '../PodsTable';
import ConditionsTable from '../ConditionsTable';

export default function JobOverview({ data, metadata, spec, status, relatedPods, t, icons }) {
    const containers = spec?.template?.spec?.containers || [];
    const parallelism = spec?.parallelism ?? 1;
    const completions = spec?.completions ?? 1;
    const active = status?.active ?? 0;
    const succeeded = status?.succeeded ?? 0;
    const failed = status?.failed ?? 0;
    const restartPolicy = spec?.template?.spec?.restartPolicy || '—';

    return (
        <>
            <DetailSection title={t('resource_info')}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-border bg-[var(--bg-sidebar)]/5 border-b border-border text-center">
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Active</span>
                        <span className="text-sm font-bold text-info">{active}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Succeeded</span>
                        <span className="text-sm font-bold text-success">{succeeded}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Failed</span>
                        <span className={`text-sm font-bold ${failed > 0 ? 'text-error' : 'text-primary'}`}>{failed}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Parallelism</span>
                        <span className="text-sm font-bold text-primary">{parallelism}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Completions</span>
                        <span className="text-sm font-bold text-primary">{completions}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Restart Policy</span>
                        <span className="text-sm font-bold text-primary">{restartPolicy}</span>
                    </div>
                </div>
            </DetailSection>

            {containers.length > 0 && (
                <ContainerDetails 
                    containers={containers} 
                    statuses={[]} 
                    t={t} 
                />
            )}

            {relatedPods && relatedPods.length > 0 && (
                <PodsTable pods={relatedPods} t={t} title={t('pods') || "Pods"} />
            )}

            {status?.conditions && Array.isArray(status.conditions) && (
                <ConditionsTable conditions={status.conditions} t={t} />
            )}
        </>
    );
}
