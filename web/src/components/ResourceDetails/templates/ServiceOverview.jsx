import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';
import EndpointsTable from '../EndpointsTable';
import PodsTable from '../PodsTable';
import IngressTable from '../IngressTable';

export default function ServiceOverview({ data, metadata, spec, status, relatedPods, relatedEndpoints, relatedIngresses, t, icons }) {
    // Process raw endpoints object from backend
    const processedEndpoints = [];
    if (relatedEndpoints && relatedEndpoints.subsets) {
        relatedEndpoints.subsets.forEach(subset => {
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
        <>
            <DetailSection title={t('resource_info')}>
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <DetailRow label="Type">
                            <span className="px-2 py-0.5 rounded-md bg-info/10 text-info text-xs font-black uppercase">
                                {spec.type}
                            </span>
                        </DetailRow>
                        <DetailRow label="Cluster IP">
                            <span className="font-mono text-primary">{spec.clusterIP || 'None'}</span>
                        </DetailRow>
                        <DetailRow label="Session Affinity">
                            <span className={`text-sm font-bold ${spec.sessionAffinity !== 'None' ? 'text-accent' : 'text-primary'}`}>
                                {spec.sessionAffinity || 'None'}
                            </span>
                        </DetailRow>
                        {spec.selector && (
                            <DetailRow label="Selector">
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(spec.selector).map(([k, v]) => (
                                        <span key={k} className="px-2 py-0.5 bg-[var(--bg-muted)] rounded text-xs text-secondary font-mono">
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

            {relatedPods && <PodsTable pods={relatedPods} t={t} icons={icons} />}
        </>
    );
}
