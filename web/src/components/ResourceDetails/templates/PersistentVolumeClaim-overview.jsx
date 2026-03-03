import React from 'react';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import DetailSection from '../DetailSection';

export default function PvcOverview({ data, metadata, spec, status, t }) {
    if (!data) return null;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <ResourceInfoSection isPvc={true} resource={data.resource} extra={data.extra} spec={spec} status={status} t={t} />
            <DetailSection title="Capacity & Resources">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border bg-[var(--bg-sidebar)]/5 border-b border-border rounded-xl overflow-hidden border border-border/30">
                    <div className="px-6 py-4 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Requested</span>
                        <span className="text-sm font-bold text-primary">{spec?.resources?.requests?.storage || '—'}</span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Capacity</span>
                        <span className="text-sm font-bold text-success">{status?.capacity?.storage || '—'}</span>
                    </div>
                </div>
            </DetailSection>
        </div>
    );
}
