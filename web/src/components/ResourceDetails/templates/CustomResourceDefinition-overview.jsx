import React from 'react';
import CommonTable from '../../Common/CommonTable';

export default function CrdOverview({ data, spec, status, t }) {
    if (!data) return null;
    const versions = spec?.versions || [];
    const conditions = status?.conditions || [];

    const verColumns = [
        { header: 'Name', accessor: 'name', className: 'font-mono font-bold text-primary' },
        { header: 'Served', accessor: (v) => String(v.served), className: 'text-center' },
        { header: 'Storage', accessor: (v) => String(v.storage), className: 'text-center' }
    ];

    const condColumns = [
        { header: 'Type', accessor: 'type', className: 'font-bold text-primary' },
        { header: 'Status', accessor: 'status', className: 'text-center' },
        { header: 'Last Transition', accessor: 'lastTransitionTime', className: 'text-center text-xs' },
        { header: 'Reason', accessor: 'reason' },
        { header: 'Message', accessor: 'message', className: 'text-xs' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <CommonTable title="Accepted Names" columns={[{header:'Key', accessor:'k'}, {header:'Value', accessor:'v'}]} data={[
                {k:'Plural', v:data.extra?.plural},
                {k:'Singular', v:data.extra?.singular},
                {k:'Kind', v:data.extra?.['crd-kind']}
            ]} t={t} />
            <CommonTable title="Versions" columns={verColumns} data={versions} t={t} />
            <CommonTable title="Conditions" columns={condColumns} data={conditions} t={t} />
        </div>
    );
}
