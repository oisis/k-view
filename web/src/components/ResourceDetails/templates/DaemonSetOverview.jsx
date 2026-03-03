import React from 'react';
import MetadataSection from '../sections/MetadataSection';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import ContainersSection from '../sections/ContainersSection';
import DetailSection from '../DetailSection';
import ConditionsTable from '../ConditionsTable';

export default function DaemonSetOverview({ data, spec, status, t }) {
    if (!data) return null;

    const containers = spec?.template?.spec?.containers || [];
    const initContainers = spec?.template?.spec?.initContainers || [];
    const selector = spec?.selector?.matchLabels || {};

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MetadataSection metadata={data.metadata} t={t} />
                <ResourceInfoSection 
                    resource={data.resource} 
                    extra={data.extra} 
                    t={t} 
                />
            </div>

            <DetailSection title="Scheduling Info">
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Status</td>
                            <td className="px-4 py-3">
                                <span className="font-bold text-success">{status?.numberReady || 0}</span> Ready / <span className="font-bold text-primary">{status?.desiredNumberScheduled || 0}</span> Desired
                            </td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Selector</td>
                            <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(selector || {}).map(([k, v]) => (
                                        <span key={k} className="px-2 py-0.5 bg-info/10 text-info rounded text-xs font-mono border border-info/20">
                                            {k}={v}
                                        </span>
                                    ))}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </DetailSection>

            <ContainersSection 
                containers={containers} 
                initContainers={initContainers}
                t={t} 
            />

            {status?.conditions && (
                <DetailSection title={t('conditions')} icon="activity">
                    <ConditionsTable conditions={status.conditions} t={t} />
                </DetailSection>
            )}
        </div>
    );
}
