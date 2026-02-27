import React from 'react';
import DetailSection from './DetailSection';

export default function ResourceQuotasTable({ quotas, t, icons }) {
    return (
        <DetailSection title={t('resource_quotas')} className="mt-4">
            <div className="p-4 space-y-4">
                {quotas && quotas.length > 0 ? quotas.map(q => (
                                         <div key={q.metadata?.name || q.name} className="bg-[var(--bg-muted)]/30 rounded-lg p-4">                        <h4 className="font-bold text-[var(--accent)] mb-3 flex items-center gap-2">
                            {icons?.activity && <icons.activity size={14} />} {q.metadata?.name || q.name}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                            {Object.entries(q.status?.hard || {}).map(([res, hard]) => {
                                const used = q.status?.used?.[res] || '0';
                                return (
                                    <div key={res} className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                                            <span>{res}</span>
                                            <span>{used} / {hard}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full"
                                                style={{ width: `${Math.min(100, (parseFloat(used) / parseFloat(hard)) * 100 || 0)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )) : (
                    <p className="text-[var(--text-muted)] italic text-sm">{t('no_resource_quotas_found') || 'No resource quotas defined.'}</p>
                )}
            </div>
        </DetailSection>
    );
}
