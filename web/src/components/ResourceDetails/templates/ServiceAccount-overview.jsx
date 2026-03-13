import React from 'react';
import DetailSection from '../DetailSection';
import CommonTable from '../../Common/CommonTable';
import { Link } from 'react-router-dom';

export default function ServiceAccountOverview({ data, metadata, spec, namespace, relatedSecrets = [], relatedImagePullSecrets = [], t, icons }) {
    const secretColumns = [
        { header: 'Name', accessor: (s) => <Link to={`/resources/Secrets/${s.namespace}/${s.name}`} className="text-warning hover:underline font-mono">{s.name}</Link> },
        { header: 'Type', accessor: (s) => s.extra?.type || '—', className: 'text-xs' },
        { header: 'Created', accessor: 'age' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <CommonTable title="Related Secrets" columns={secretColumns} data={relatedSecrets} t={t} />
            <CommonTable title="Image Pull Secrets" columns={secretColumns} data={relatedImagePullSecrets} t={t} />
        </div>
    );
}
