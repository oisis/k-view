import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';
import EndpointsTable from '../EndpointsTable';
import PodsTable from '../PodsTable';
import IngressTable from '../IngressTable';

/**
 * ServiceOverview - RESTORED FROZEN VIEW FROM MAIN
 * Cleanly rewritten to consume DTO structure.
 */
export default function ServiceOverview({ data, spec, status, relatedPods, relatedEndpoints, relatedIngresses, t, icons }) {
    if (!data) return null;

    // Use relatedEndpoints from DTO (backend now sends this pre-fetched)
    const endpointsSource = data.relatedEndpoints || relatedEndpoints;
    const processedEndpoints = [];
    
    if (endpointsSource && (endpointsSource.subsets || endpointsSource.Object?.subsets)) {
        const subsets = endpointsSource.subsets || endpointsSource.Object?.subsets || [];
        subsets.forEach(subset => {
            const ports = subset.ports || [];
            
            if (subset.addresses) {
                subset.addresses.forEach(addr => {
                    processedEndpoints.push({
                        host: addr.ip,
                        node: addr.nodeName,
                        ready: 'True',
                        ports: ports
                    });
                });
            }
            
            if (subset.notReadyAddresses) {
                subset.notReadyAddresses.forEach(addr => {
                    processedEndpoints.push({
                        host: addr.ip,
                        node: addr.nodeName,
                        ready: 'False',
                        ports: ports
                    });
                });
            }
        });
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title={t('resource_info')}>
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <DetailRow label="Type">
                            <span className="px-2 py-0.5 rounded-md bg-info/10 text-info text-xs font-black uppercase">
                                {spec?.type || '—'}
                            </span>
                        </DetailRow>
                        <DetailRow label="Cluster IP">
                            <span className="font-mono text-primary font-bold">{spec?.clusterIP || 'None'}</span>
                        </DetailRow>
                        <DetailRow label="Session Affinity">
                            <span className={`text-sm font-bold ${spec?.sessionAffinity !== 'None' ? 'text-accent' : 'text-primary'}`}>
                                {spec?.sessionAffinity || 'None'}
                            </span>
                        </DetailRow>
                        {spec?.selector && (
                            <DetailRow label="Selector">
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(spec.selector || {}).map(([k, v]) => (
                                        <span key={k} className="px-2 py-0.5 bg-[var(--bg-muted)] rounded text-xs text-secondary font-mono border border-border/50">
                                            {k}: {v}
                                        </span>
                                    ))}
                                </div>
                            </DetailRow>
                        )}
                    </tbody>
                </table>
            </DetailSection>

            {processedEndpoints.length > 0 && <EndpointsTable endpoints={processedEndpoints} t={t} icons={icons} />}
            
            {relatedIngresses && relatedIngresses.length > 0 && (
                <IngressTable title="Ingresses" ingresses={relatedIngresses} t={t} icons={icons} />
            )}

            {relatedPods && <PodsTable pods={Array.isArray(relatedPods) ? relatedPods : []} t={t} icons={icons} />}
        </div>
    );
}
