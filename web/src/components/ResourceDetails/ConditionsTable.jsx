import React from 'react';
import DetailSection from './DetailSection';

export default function ConditionsTable({ conditions, t }) {
    return (
        <DetailSection title={t('status_conditions')} className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead className="text-xs text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-sidebar)]/10 border-b-2 border-border text-center">
                        <tr>
                            <th className="px-4 py-3 text-left">{t('type')}</th>
                            <th className="px-4 py-3">{t('label_status')}</th>
                            <th className="px-4 py-3">{t('last_probe')}</th>
                            <th className="px-4 py-3">{t('last_transition')}</th>
                            <th className="px-4 py-3 text-left">{t('reason')}</th>
                            <th className="px-4 py-3 text-left">{t('message')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)] text-left">
                        {(conditions || []).length === 0 ? (
                            <tr><td colSpan="6" className="px-4 py-8 text-center text-text-muted italic">No conditions found.</td></tr>
                        ) : (
                            conditions.map((c, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-medium text-primary">{c.type}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded text-sm font-bold ${c.status === 'True' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-text-muted text-xs">
                                        {c.lastProbeTime ? new Date(c.lastProbeTime).toLocaleString() : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center text-secondary text-xs">
                                        {c.lastTransitionTime ? new Date(c.lastTransitionTime).toLocaleString() : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-secondary">{c.reason || '—'}</td>
                                    <td className="px-4 py-3 text-text-muted text-xs max-w-xs break-words">{c.message || '—'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </DetailSection>
    );
}
