import React from 'react';
import CommonTable from '../../Common/CommonTable';

export default function HpaOverview({ data, spec, status, t }) {
    const metrics = spec?.metrics || [];

    const metricColumns = [
        { header: 'Type', accessor: 'type', className: 'font-bold' },
        { header: 'Resource / Name', accessor: (m) => m.resource?.name || '—' },
        { header: 'Target', accessor: (m) => m.resource?.target?.averageUtilization ? `${m.resource.target.averageUtilization}%` : '—', className: 'text-center' },
        { header: 'Current', accessor: () => data?.extra?.targets || '—', className: 'text-center text-info font-bold' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <CommonTable title="Metrics" columns={metricColumns} data={metrics} t={t} />
        </div>
    );
}
