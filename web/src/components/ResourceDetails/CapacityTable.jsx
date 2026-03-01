import React from 'react';
import DetailSection from './DetailSection';

export default function CapacityTable({ capacity, allocatable, t }) {
    const resources = Object.keys(capacity || {});
    if (resources.length === 0) return null;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
                <thead>
                    <tr>
                        <th className="px-4 py-3 font-black">Resource</th>
                        <th className="px-4 py-3 font-black">Capacity</th>
                        <th className="px-4 py-3 font-black">Allocatable</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                    {resources.map((res) => (
                        <tr key={res} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 font-bold text-info uppercase text-xs">{res}</td>
                            <td className="px-4 py-3 font-mono text-primary">{capacity[res]}</td>
                            <td className="px-4 py-3 font-mono text-success">{allocatable?.[res] || '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
