import React from 'react';
import MetadataSection from '../sections/MetadataSection';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import ContainersSection from '../sections/ContainersSection';
import DetailSection from '../DetailSection';

export default function CronJobOverview({ data, metadata, spec, status, t }) {
    if (!data) return null;

    const containers = spec?.jobTemplate?.spec?.template?.spec?.containers || [];
    const initContainers = spec?.jobTemplate?.spec?.template?.spec?.initContainers || [];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MetadataSection metadata={metadata} t={t} />
                <ResourceInfoSection 
                    resource={data.resource} 
                    extra={data.extra} 
                    t={t} 
                />
            </div>

            <DetailSection title="Schedule Settings">
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Schedule</td>
                            <td className="px-4 py-3 font-mono text-accent font-bold">{spec?.schedule || '—'}</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Suspend</td>
                            <td className="px-4 py-3 text-primary">{String(spec?.suspend || false)}</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Last Schedule</td>
                            <td className="px-4 py-3 text-secondary">{status?.lastScheduleTime || 'Never'}</td>
                        </tr>
                    </tbody>
                </table>
            </DetailSection>

            <ContainersSection 
                containers={containers} 
                initContainers={initContainers}
                t={t} 
            />
        </div>
    );
}
