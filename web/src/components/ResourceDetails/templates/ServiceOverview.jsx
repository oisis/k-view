import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';
import EndpointsTable from '../EndpointsTable';
import PodsTable from '../PodsTable';

export default function ServiceOverview({ data, metadata, spec, status, relatedPods, relatedEndpoints, t, icons }) {
    return (
        <>
            <DetailSection title={t('resource_info')}>
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <DetailRow label="Type">
                                                         <span className="px-2 py-0.5 rounded-md bg-info/10 text-info text-xs font-black uppercase">                                {spec.type}
                            </span>
                        </DetailRow>
                        <DetailRow label="Cluster IP">
                            <span className="font-mono text-primary">{spec.clusterIP || 'None'}</span>
                        </DetailRow>
                        {spec.selector && (
                            <DetailRow label="Selector">
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(spec.selector).map(([k, v]) => (
                                                                                 <span key={k} className="px-2 py-0.5 bg-[var(--bg-muted)] rounded text-xs text-secondary font-mono">                                            {k}: {v}
                                        </span>
                                    ))}
                                </div>
                            </DetailRow>
                        )}
                    </tbody>
                </table>
            </DetailSection>

            {relatedEndpoints && <EndpointsTable services={[data]} t={t} icons={icons} />}
            {relatedPods && <PodsTable pods={relatedPods} t={t} icons={icons} />}
        </>
    );
}
