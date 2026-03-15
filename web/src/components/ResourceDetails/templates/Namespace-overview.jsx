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
                <div className="p-6">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-bold text-muted-foreground uppercase tracking-widest">Status:</span>
                        <span className={`font-mono font-bold ${status?.phase === 'Active' ? 'text-emerald-400' : 'text-orange-400'}`}>
                            {status?.phase || 'Unknown'}
                        </span>
                    </div>
                </div>
            </DetailSection>

            <CommonTable title="Resource Quotas" columns={quotaColumns} data={quotas} t={t} />
            <CommonTable title="Resource Limits" columns={limitColumns} data={limits} t={t} />
        </div>
    );
}
