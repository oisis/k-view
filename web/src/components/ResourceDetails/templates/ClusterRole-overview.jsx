import React from 'react';
import CommonTable from '../../Common/CommonTable';

/**
 * ClusterRole-overview - Exact column structure requested by user
 */
export default function ClusterRoleOverview({ data, spec, t }) {
    if (!data) return null;
    const rules = data.rules || spec?.rules || data.extra?.rules || [];

    const ruleColumns = [
        { 
            header: 'Resources', 
            accessor: (r) => (
                <div className="flex flex-wrap gap-1">
                    {(r.resources || []).map((res, i) => <span key={i} className="bg-success/10 text-success px-1.5 py-0.5 rounded text-xs">{res}</span>)}
                </div>
            )
        },
        { header: 'Non-resource URL', accessor: (r) => (r.nonResourceURLs || r.non_resource_urls || []).join(', ') || '—', className: 'font-mono text-xs' },
        { header: 'Resource Names', accessor: (r) => (r.resourceNames || r.resource_names || []).join(', ') || '—', className: 'font-mono text-xs' },
        { header: 'Verbs', accessor: (r) => (r.verbs || []).join(', ') || '—', className: 'font-mono text-info' },
        { header: 'API Groups', accessor: (r) => (r.apiGroups || []).map(g => g === "" ? "(core)" : g).join(', ') || '—', className: 'font-mono text-xs' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <CommonTable title="Rules" columns={ruleColumns} data={rules} t={t} />
        </div>
    );
}
