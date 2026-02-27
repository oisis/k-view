import React from 'react';
import DetailSection from './DetailSection';

export default function CapacityTable({ capacity, allocatable, t }) {
    const resources = Object.keys(capacity || {});
    if (resources.length === 0) return null;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
                <thead>
                    <tr className="bg-[var(--bg-sidebar)]/10 text-[var(--text-muted)] uppercase text-[10px] tracking-widest border-b border-slate-600/50">
                        <th className="px-4 py-3 font-black">Resource</th>
                        <th className="px-4 py-3 font-black">Capacity</th>
                        <th className="px-4 py-3 font-black">Allocatable</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-600/30">
                    {resources.map((res) => (
                        <tr key={res} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 font-bold text-info uppercase text-[11px]">{res}</td>
                            <td className="px-4 py-3 font-mono text-[var(--text-primary)]">{capacity[res]}</td>
                            <td className="px-4 py-3 font-mono text-success">{allocatable?.[res] || '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
