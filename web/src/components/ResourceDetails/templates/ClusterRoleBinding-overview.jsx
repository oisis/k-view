import React from 'react';
import CommonTable from '../../Common/CommonTable';

/**
 * ClusterRoleBinding-overview - Role References Implementation
 */
export default function ClusterRoleBindingOverview({ data, spec, t }) {
    if (!data) return null;
    const subjects = spec?.subjects || data.subjects || [];
    const roleRef = spec?.roleRef || data.roleRef || {};

    const roleRefColumns = [
        { header: 'Name', accessor: 'name', className: 'font-mono font-bold text-primary' },
        { header: 'Kind', accessor: (r) => <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-black uppercase border border-primary/20">{r.kind}</span> },
        { header: 'API Group', accessor: 'apiGroup', className: 'font-mono text-xs text-text-muted' }
    ];

    const subColumns = [
        { header: 'Name', accessor: 'name', className: 'text-foreground' },
        { header: 'Namespaces', accessor: 'namespace', className: 'text-secondary font-medium' },
        { header: 'Kind', accessor: (s) => <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-black uppercase border border-primary/20">{s.kind}</span> },
        { header: 'API Group', accessor: (s) => s.apiGroup || (s.kind === 'ServiceAccount' ? 'core' : 'rbac.authorization.k8s.io'), className: 'font-mono text-xs' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <CommonTable 
                title="Role References" 
                columns={roleRefColumns} 
                data={[roleRef]} 
                t={t} 
            />
            
            <CommonTable 
                title="Subjects" 
                columns={subColumns} 
                data={subjects} 
                t={t} 
            />
        </div>
    );
}
