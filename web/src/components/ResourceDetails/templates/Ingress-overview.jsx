import React from 'react';
import DetailSection from '../DetailSection';
import CommonTable from '../../Common/CommonTable';

export default function IngressOverview({ data, metadata, spec, status, t, icons }) {
    const rules = data?.rules || [];

    const ruleColumns = [
        { header: 'Host', accessor: 'host', className: 'font-bold text-info' },
        { header: 'Path', accessor: 'path', className: 'font-mono text-xs' },
        { header: 'Path type', accessor: 'pathType', className: 'text-xs' },
        { header: 'Service name', accessor: 'serviceName' },
        { header: 'Service port', accessor: 'servicePort', className: 'text-center' },
        { header: 'TLS secret', accessor: (r) => spec?.tls?.[0]?.secretName || '—', className: 'text-xs italic opacity-70' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <CommonTable title="Rules" columns={ruleColumns} data={rules} t={t} />
        </div>
    );
}
