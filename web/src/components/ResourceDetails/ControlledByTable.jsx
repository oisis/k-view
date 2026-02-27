import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';

export default function ControlledByTable({ owners, namespace, t }) {
    return (
        <DetailSection title={t('controlled_by')} className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-[var(--font-size-sm)] border-collapse">
                    <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-sidebar)]/10 border-b-2 border-border">
                        <tr>
                            <th className="px-4 py-3 text-left">{t('label_name')}</th>
                            <th className="px-4 py-3 text-left">{t('resource_kind') || 'Kind'}</th>
                            <th className="px-4 py-3 text-center">{t('pods')}</th>
                            <th className="px-4 py-3 text-left">{t('label_age')}</th>
                            <th className="px-4 py-3 text-left">{t('label_labels')}</th>
                            <th className="px-4 py-3 text-left">{t('label_image')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {(!owners || owners.length === 0) ? (
                            <tr><td colSpan="6" className="px-4 py-8 text-center text-text-muted italic">{t('no_controller_found')}</td></tr>
                        ) : (
                            owners.map((ref, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2 font-bold text-accent font-mono text-xs">
                                        <Link to={`/${ref.kind.toLowerCase()}s/${namespace}/${ref.name}`} className="hover:underline">{ref.name}</Link>
                                    </td>
                                    <td className="px-4 py-2 text-xs font-bold uppercase text-text-muted tracking-wider">{ref.kind}</td>
                                    <td className="px-4 py-2 text-center">—</td>
                                    <td className="px-4 py-2 text-xs text-text-muted">—</td>
                                    <td className="px-4 py-2"><span className="text-text-muted italic">—</span></td>
                                    <td className="px-4 py-2"><span className="text-text-muted italic">—</span></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </DetailSection>
    );
}
