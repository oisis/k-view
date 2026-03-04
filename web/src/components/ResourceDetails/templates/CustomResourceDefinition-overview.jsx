import React from 'react';
import DetailSection from '../DetailSection';
import CommonTable from '../../Common/CommonTable';
import ExpandableCell from '../ExpandableCell';
import { useTheme } from '../../../ThemeContext';

export default function CrdOverview({ data, metadata, spec, status, relatedCrdObjects = [], t }) {
    const { icons: themeIcons } = useTheme();
    const names = spec?.names || {};
    const versions = spec?.versions || [];
    const conditions = status?.conditions || [];

    const objColumns = [
        { header: 'Name', accessor: 'name', className: 'font-mono text-info' },
        { header: 'Namespace', accessor: 'namespace' },
        { header: 'Age', accessor: 'age' }
    ];

    const verColumns = [
        { header: 'Name', accessor: 'name', className: 'font-bold' },
        { header: 'Served', accessor: (v) => String(v.served), className: 'text-center' },
        { header: 'Storage', accessor: (v) => String(v.storage), className: 'text-center' }
    ];

    const condColumns = [
        { header: 'Type', accessor: 'type', className: 'font-bold' },
        { header: 'Status', accessor: 'status', className: 'text-center' },
        { header: 'Reason', accessor: 'reason' },
        { header: 'Message', accessor: 'message', className: 'text-xs opacity-70' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <div className="glass rounded-2xl border border-border overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                                <th className="px-6 py-2 text-center border-r border-border">Version</th>
                                <th className="px-6 py-2 text-center border-r border-border">Scope</th>
                                <th className="px-6 py-2 text-center">Group</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-primary font-bold align-middle text-center">
                                <td className="px-4 py-4 border-r border-border">{spec?.versions?.[0]?.name || '—'}</td>
                                <td className="px-4 py-4 border-r border-border">{spec?.scope || '—'}</td>
                                <td className="px-4 py-4">{spec?.group || '—'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </DetailSection>

            <DetailSection title="Accepted Names">
                <div className="glass rounded-2xl border border-border p-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div><span className="text-[10px] text-text-muted uppercase font-bold block">Plural</span>{names.plural}</div>
                    <div><span className="text-[10px] text-text-muted uppercase font-bold block">Singular</span>{names.singular}</div>
                    <div><span className="text-[10px] text-text-muted uppercase font-bold block">Kind</span>{names.kind}</div>
                    <div><span className="text-[10px] text-text-muted uppercase font-bold block">List Kind</span>{names.listKind}</div>
                    <div><span className="text-[10px] text-text-muted uppercase font-bold block">Short Names</span>
                        <ExpandableCell value={names.shortNames || []} type="labels" icons={themeIcons} />
                    </div>
                </div>
            </DetailSection>

            <CommonTable title="Objects" columns={objColumns} data={relatedCrdObjects} t={t} />
            <CommonTable title="Versions" columns={verColumns} data={versions} t={t} />
            <CommonTable title="Conditions" columns={condColumns} data={conditions} t={t} />
        </div>
    );
}
