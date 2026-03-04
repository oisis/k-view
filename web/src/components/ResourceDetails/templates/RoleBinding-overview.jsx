import React from 'react';
import DetailSection from '../DetailSection';
import CommonTable from '../../Common/CommonTable';

export default function RoleBindingOverview({ data, spec, t }) {
    const subjects = spec?.subjects || [];

    const subjectColumns = [
        { header: 'Name', accessor: 'name', className: 'font-bold text-accent' },
        { header: 'Namespaces', accessor: 'namespace' },
        { header: 'Kind', accessor: 'kind', className: 'text-xs' },
        { header: 'API Group', accessor: 'apiGroup', className: 'text-[10px] opacity-50' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <div className="glass rounded-2xl border border-border p-4">
                    <span className="text-[10px] font-black uppercase text-text-muted block mb-2 text-center">Role Reference</span>
                    <div className="flex justify-center items-center gap-4 text-sm font-mono bg-black/10 p-3 rounded-xl border border-border/30">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-text-muted uppercase">Kind</span>
                            <span className="text-primary font-bold">{spec?.roleRef?.kind}</span>
                        </div>
                        <div className="w-px h-8 bg-border/50" />
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-text-muted uppercase">Name</span>
                            <span className="text-info font-bold">{spec?.roleRef?.name}</span>
                        </div>
                    </div>
                </div>
            </DetailSection>

            <CommonTable title="Subjects" columns={subjectColumns} data={subjects} t={t} />
        </div>
    );
}
