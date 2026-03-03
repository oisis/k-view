import React from 'react';
import MetadataSection from '../sections/MetadataSection';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import ContainersSection from '../sections/ContainersSection';
import DetailSection from '../DetailSection';

export default function JobOverview({ data, spec, status, t }) {
    if (!data) return null;

    const containers = spec?.template?.spec?.containers || [];
    const initContainers = spec?.template?.spec?.initContainers || [];

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

            <DetailSection title="Job Status">
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Parallelism</td>
                            <td className="px-4 py-3 text-primary">{spec?.parallelism || 1}</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Completions</td>
                            <td className="px-4 py-3 text-primary">{spec?.completions || 1}</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Pods Active</td>
                            <td className="px-4 py-3 font-bold text-success">{status?.active || 0}</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Pods Succeeded</td>
                            <td className="px-4 py-3 font-bold text-success">{status?.succeeded || 0}</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Pods Failed</td>
                            <td className="px-4 py-3 font-bold text-error">{status?.failed || 0}</td>
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
