import React from 'react';
import CommonTable from '../../Common/CommonTable';
import DetailSection from '../DetailSection';

/**
 * ClusterRoleBinding-overview - RESTORED FROZEN VIEW
 */
export default function ClusterRoleBindingOverview({ data, spec, t }) {
    if (!data) return null;
    const subjects = spec?.subjects || data.subjects || [];
    const roleRef = spec?.roleRef || data.roleRef || {};

    const subColumns = [
        { header: 'Name', accessor: 'name', className: 'font-bold text-primary' },
        { header: 'Namespaces', accessor: 'namespace', className: 'text-secondary font-medium' },
        { header: 'Kind', accessor: (s) => <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-[10px] font-black uppercase border border-accent/20">{s.kind}</span> },
        { header: 'API Group', accessor: (s) => s.apiGroup || (s.kind === 'ServiceAccount' ? 'core' : 'rbac.authorization.k8s.io'), className: 'font-mono text-xs' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Role Ref</td>
                            <td className="px-4 py-3 font-bold text-accent">{roleRef.kind}: {roleRef.name}</td>
                        </tr>
                    </tbody>
                </table>
            </DetailSection>
            <CommonTable title="Subjects" columns={subColumns} data={subjects} t={t} />
        </div>
    );
}
