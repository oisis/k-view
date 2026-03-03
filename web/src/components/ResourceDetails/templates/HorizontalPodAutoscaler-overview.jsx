import React from 'react';
import CommonTable from '../../Common/CommonTable';

export default function HpaOverview({ spec, status, t }) {
    const metrics = spec?.metrics || [];
    const currentMetrics = status?.currentMetrics || [];

    const metricColumns = [
        { header: 'Type', accessor: 'type', className: 'font-bold text-secondary uppercase text-xs' },
        { header: 'Resource / Name', accessor: (m) => m.resource?.name || '—', className: 'text-primary font-mono' },
        { 
            header: 'Target', 
            accessor: (m) => m.resource?.target?.averageUtilization ? `${m.resource.target.averageUtilization}%` : m.resource?.target?.averageValue || '—',
            className: 'text-center font-bold text-accent'
        },
        { 
            header: 'Current', 
            accessor: (m) => {
                const current = (currentMetrics || []).find(cm => cm.type === m.type && cm.resource?.name === m.resource?.name);
                return current?.resource?.current?.averageUtilization ? `${current.resource.current.averageUtilization}%` : current?.resource?.current?.averageValue || '—';
            },
            className: 'text-center font-bold text-info'
        }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <CommonTable title="Metrics" columns={metricColumns} data={metrics} t={t} />
        </div>
    );
}
