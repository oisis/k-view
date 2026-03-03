import React from 'react';
import CommonTable from '../../Common/CommonTable';

export default function IngressClassOverview({ spec, t }) {
    const params = spec?.parameters ? [spec.parameters] : [];

    const paramColumns = [
        { header: 'API Group', accessor: 'apiGroup' },
        { header: 'Kind', accessor: 'kind' },
        { header: 'Name', accessor: 'name', className: 'font-bold text-accent' },
        { header: 'Namespace', accessor: 'namespace' },
        { header: 'Scope', accessor: 'scope', className: 'uppercase text-xs font-bold' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <CommonTable title="Parameters Reference" columns={paramColumns} data={params} t={t} />
        </div>
    );
}
