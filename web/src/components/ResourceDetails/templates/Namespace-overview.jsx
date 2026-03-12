import React from 'react';
import DetailSection from '../DetailSection';
import CommonTable from '../../Common/CommonTable';

export default function NamespaceOverview({ data, metadata, status, quotas = [], limits = [], t, icons }) {
    const quotaColumns = [
        { header: 'Name', accessor: 'name', className: 'font-mono font-bold text-accent' },
        { header: 'Age', accessor: 'age' },
        { 
            header: 'Hard / Used', 
            accessor: (q) => {
                const hard = q.extra?.hard || {};
                const used = q.extra?.used || {};
                return (
                    <div className="flex flex-col gap-1">
                        {Object.keys(hard).map(k => (
                            <div key={k} className="text-[10px] flex gap-2">
                                <span className="font-bold text-text-muted w-24 uppercase truncate">{k}:</span>
                                <span className="text-foreground font-mono">{used[k] || '0'} / {hard[k]}</span>
                            </div>
                        ))}
                    </div>
                );
            }
        }
    ];

    const limitColumns = [
        { header: 'Resource Name', accessor: 'name', className: 'font-mono font-bold text-info' },
        { 
            header: 'Limits', 
            accessor: (l) => {
                const items = l.extra?.limits || [];
                return (
                    <div className="space-y-2">
                        {items.map((item, i) => (
                            <div key={i} className="text-[10px] bg-white/5 p-2 rounded border border-border/30">
                                <div className="font-black text-accent uppercase mb-1">{item.type}</div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-text-muted uppercase">Def Limit:</span>
                                        <span className="font-mono text-primary">{JSON.stringify(item.default || '—')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-muted uppercase">Def Req:</span>
                                        <span className="font-mono text-primary">{JSON.stringify(item.defaultRequest || '—')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-muted uppercase">Min:</span>
                                        <span className="font-mono text-primary">{JSON.stringify(item.min || '—')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-muted uppercase">Max:</span>
                                        <span className="font-mono text-primary">{JSON.stringify(item.max || '—')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <div className="glass rounded-2xl border border-border overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                                <th className="px-4 py-2 text-center border-r border-border">Status</th>
                                <th className="px-4 py-2 text-center border-r border-border">Age</th>
                                <th className="px-4 py-2 text-center">Labels</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-primary font-bold align-middle text-center">
                                <td className={`px-4 py-4 border-r border-border ${status?.phase === 'Active' ? 'text-success' : 'text-warning'}`}>
                                    {status?.phase || 'Unknown'}
                                </td>
                                <td className="px-4 py-4 border-r border-border font-mono">{data?.age || '—'}</td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-wrap justify-center gap-1">
                                        {Object.entries(data?.labels || {}).map(([k, v]) => (
                                            <span key={k} className="text-[10px] bg-white/5 border border-border/30 rounded px-1.5 py-0.5" title={`${k}=${v}`}>
                                                {k}
                                            </span>
                                        ))}
                                        {Object.keys(data?.labels || {}).length === 0 && <span className="text-text-muted italic">—</span>}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </DetailSection>

            <CommonTable title="Resource Quotas" columns={quotaColumns} data={quotas} t={t} />
            <CommonTable title="Resource Limits" columns={limitColumns} data={limits} t={t} />
        </div>
    );
}
