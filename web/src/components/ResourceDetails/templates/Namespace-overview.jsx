import React from 'react';
import DetailSection from '../DetailSection';
import CommonTable from '../../Common/CommonTable';

export default function NamespaceOverview({ data, metadata, status, quotas = [], limits = [], t, icons }) {
    const quotaColumns = [
        { header: 'Name', accessor: 'metadata.name', className: 'font-bold' },
        { header: 'Created', accessor: 'metadata.creationTimestamp' },
        { header: 'Status', accessor: (q) => JSON.stringify(q.status?.used || {}), className: 'text-xs font-mono opacity-70' }
    ];

    const limitColumns = [
        { header: 'Resource name', accessor: 'metadata.name' },
        { header: 'Type', accessor: (l) => l.spec?.limits?.[0]?.type || '—' },
        { header: 'Default', accessor: (l) => JSON.stringify(l.spec?.limits?.[0]?.default || {}), className: 'text-xs font-mono' },
        { header: 'Default request', accessor: (l) => JSON.stringify(l.spec?.limits?.[0]?.defaultRequest || {}), className: 'text-xs font-mono' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <div className="glass rounded-2xl border border-border p-4 text-center">
                    <span className="text-[10px] font-black uppercase text-text-muted block mb-1">Status</span>
                    <span className={`text-lg font-bold ${status?.phase === 'Active' ? 'text-success' : 'text-warning'}`}>{status?.phase || 'Unknown'}</span>
                </div>
            </DetailSection>

            <CommonTable title="Resource Quotas" columns={quotaColumns} data={quotas} t={t} />
            <CommonTable title="Resource Limits" columns={limitColumns} data={limits} t={t} />
        </div>
    );
}
