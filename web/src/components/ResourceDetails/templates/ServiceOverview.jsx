import React from 'react';
import MetadataSection from '../sections/MetadataSection';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import DetailSection from '../DetailSection';
import EndpointsTable from '../EndpointsTable';

/**
 * Dumb Component for Service Details.
 */
export default function ServiceOverview({ data, t, settings }) {
    if (!data) return null;

    const { resource, metadata, spec, status, extra, relatedEndpoints } = data;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MetadataSection metadata={metadata} t={t} />
                <ResourceInfoSection 
                    resource={resource} 
                    extra={extra} 
                    t={t} 
                />
            </div>

            {spec?.ports && (
                <DetailSection title={t('ports')} icon="network">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-text-muted text-xs uppercase font-black border-b border-border/50">
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Protocol</th>
                                    <th className="px-4 py-3">Port</th>
                                    <th className="px-4 py-3">Target Port</th>
                                    <th className="px-4 py-3">Node Port</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {spec.ports.map((p, i) => (
                                    <tr key={i} className="text-sm">
                                        <td className="px-4 py-3 font-bold">{p.name || '—'}</td>
                                        <td className="px-4 py-3">{p.protocol}</td>
                                        <td className="px-4 py-3">{p.port}</td>
                                        <td className="px-4 py-3">{p.targetPort}</td>
                                        <td className="px-4 py-3">{p.nodePort || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </DetailSection>
            )}

            {relatedEndpoints?.subsets && (
                <DetailSection title={t('endpoints')} icon="anchor">
                    <EndpointsTable subsets={relatedEndpoints.subsets} t={t} />
                </DetailSection>
            )}
        </div>
    );
}
