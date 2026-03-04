import React from 'react';
import CommonTable from '../../Common/CommonTable';
import ExpandableCell from '../ExpandableCell';

export default function SecretOverview({ data, t }) {
    const dataItems = Object.entries(data?.data || {}).map(([k, v]) => ({
        key: k,
        value: v
    }));

    const columns = [
        { header: 'Key', accessor: 'key', className: 'font-mono font-bold text-warning w-1/4' },
        { header: 'Value', accessor: (d) => <ExpandableCell value={d.value} type="secret" limit={1} />, className: 'w-2/3' },
        { header: 'Actions', accessor: () => '—', className: 'text-center' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <CommonTable title="Data" columns={columns} data={dataItems} t={t} />
        </div>
    );
}
