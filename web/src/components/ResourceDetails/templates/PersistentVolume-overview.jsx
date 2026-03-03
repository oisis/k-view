import React from 'react';
import CommonTable from '../../Common/CommonTable';

export default function PvOverview({ data, spec, status, t }) {
    if (!data) return null;
    const capacity = spec?.capacity || {};
    const capacityData = Object.entries(capacity).map(([res, qty]) => ({ res, qty }));

    const capColumns = [
        { header: 'Resource name', accessor: 'res', className: 'font-bold text-primary' },
        { header: 'Quantity', accessor: 'qty', className: 'font-mono text-info font-bold' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <CommonTable title="Capacity" columns={capColumns} data={capacityData} t={t} />
        </div>
    );
}
