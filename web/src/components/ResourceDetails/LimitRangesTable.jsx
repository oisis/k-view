import React from 'react';
import DetailSection from './DetailSection';

export default function LimitRangesTable({ limits, t, icons }) {
    return (
        <DetailSection title={t('limit_ranges')} className="mt-4">
            <div className="p-4 space-y-4">
                {limits && limits.length > 0 ? limits.map(l => (
                    <div key={l.metadata?.name || l.name} className="bg-[var(--bg-muted)]/30 rounded-lg border border-[var(--border-color)]/50 p-4 overflow-x-auto">
                        <h4 className="font-bold text-[var(--accent)] mb-3 flex items-center gap-2">
                            {icons.about && <icons.about size={14} />} {l.metadata?.name || l.name}
                        </h4>
                        <table className="w-full text-[var(--font-size-xs)]">
                            <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-black/20 border-b-2 border-slate-600 text-center">
                                <tr>
                                    <th className="px-3 py-2">{t('type')}</th>
                                    <th className="px-3 py-2">{t('usage_metrics')}</th>
                                    <th className="px-3 py-2">Min</th>
                                    <th className="px-3 py-2">Max</th>
                                    <th className="px-3 py-2">Default</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]/20 text-left">
                                {l.spec?.limits?.map((lim, idx) => (
                                    <tr key={idx}>
                                        <td className="px-3 py-2 font-bold text-[var(--text-primary)]">{lim.type}</td>
                                        <td className="px-3 py-2 text-[var(--text-secondary)]">CPU/Memory</td>
                                        <td className="px-3 py-2 text-info font-mono">{lim.min?.cpu || lim.min?.memory || '-'}</td>
                                        <td className="px-3 py-2 text-error font-mono">{lim.max?.cpu || lim.max?.memory || '-'}</td>
                                        <td className="px-3 py-2 text-[var(--text-muted)] font-mono">{lim.default?.cpu || lim.default?.memory || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )) : (
                    <p className="text-[var(--text-muted)] italic text-sm">{t('no_limit_ranges_found') || 'No limit ranges defined.'}</p>
                )}
            </div>
        </DetailSection>
    );
}
