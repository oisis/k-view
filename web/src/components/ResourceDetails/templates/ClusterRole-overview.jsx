import React from 'react';
import CommonTable from '../../Common/CommonTable';

/**
 * ClusterRole-overview - RESTORED FROZEN VIEW
 */
export default function ClusterRoleOverview({ data, spec, t }) {
    if (!data) return null;
    const rules = spec?.rules || data.rules || [];

    const ruleColumns = [
        { header: t('api_groups'), accessor: (r) => r.apiGroups?.map(g => g === "" ? "(core)" : g).join(', ') || '—', className: 'font-mono text-xs' },
        { 
            header: t('resources'), 
            accessor: (r) => (
                <div className="flex flex-wrap gap-1">
                    {r.resources?.map((res, i) => <span key={i} className="bg-success/10 text-success px-1.5 py-0.5 rounded text-xs">{res}</span>)}
                </div>
            )
        },
        { header: t('verbs'), accessor: (r) => r.verbs?.join(', ') || '—', className: 'font-mono text-info' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <CommonTable title="Rules" columns={ruleColumns} data={rules} t={t} />
        </div>
    );
}
