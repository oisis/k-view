import React from 'react';
import CommonTable from '../../Common/CommonTable';
import SecretsTable from '../SecretsTable';

/**
 * ServiceAccountOverview - Cleanup Duplicate Metadata
 */
export default function ServiceAccountOverview({ data, t, icons }) {
    if (!data) return null;
    const ips = data.relatedImagePullSecrets || [];
    const secrets = data.relatedSecrets || [];

    const ipsColumns = [
        { header: 'Name', accessor: 'name', className: 'font-bold text-accent font-mono' },
        { header: 'Namespace', accessor: 'namespace', className: 'text-secondary font-medium' },
        { header: 'Type', accessor: (s) => <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[10px] font-black uppercase border border-purple-500/20">{s.extra?.type || 'dockerconfigjson'}</span> },
        { header: 'Created', accessor: 'age', className: 'text-right font-mono text-xs' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            {secrets.length > 0 && <SecretsTable title="Secrets" secrets={secrets} t={t} icons={icons} />}
            <CommonTable title="Image Pull Secrets" columns={ipsColumns} data={ips} t={t} />
        </div>
    );
}
