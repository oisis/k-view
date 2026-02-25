import React from 'react';
import DetailSection from './DetailSection';

export default function CapacityTable({ capacity, t }) {
    if (!capacity || capacity.length === 0) return null;

    return (
        <DetailSection title={t('label_capacity')}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--bg-sidebar)]/20 text-[var(--text-muted)] uppercase text-[10px] tracking-widest border-b border-slate-600/50">
                            <th className="px-4 py-3 font-black">{t('label_resource_name')}</th>
                            <th className="px-4 py-3 font-black">{t('label_quantity')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-600/30">
                        {capacity.map((item, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 font-bold text-info">{item.resourceName}</td>
                                <td className="px-4 py-3 font-mono text-[var(--text-primary)]">{item.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DetailSection>
    );
}
