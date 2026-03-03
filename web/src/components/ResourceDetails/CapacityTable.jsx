import React from 'react';

export default function CapacityTable({ capacity, allocatable, t }) {
    const resources = Object.keys(capacity || {});
    if (resources.length === 0) return null;

    const formatResourceValue = (key, val) => {
        if (!val) return '—';
        const safeKey = (key || '').toLowerCase();
        if (safeKey.includes('memory') || safeKey.includes('storage') || safeKey.includes('ephemeral-storage')) {
            let bytes = 0;
            const numeric = parseFloat(val);
            
            if (val.endsWith('Ki')) bytes = numeric * 1024;
            else if (val.endsWith('Mi')) bytes = numeric * 1024 * 1024;
            else if (val.endsWith('Gi')) bytes = numeric * 1024 * 1024 * 1024;
            else if (val.endsWith('Ti')) bytes = numeric * 1024 * 1024 * 1024 * 1024;
            else bytes = numeric; // Assume bytes

            const mb = bytes / (1024 * 1024);
            const gb = bytes / (1024 * 1024 * 1024);

            if (gb >= 1) {
                return `${gb.toFixed(2)} GB`;
            }
            return `${mb.toFixed(2)} MB`;
        }
        return val;
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse table-fixed">
                <thead>
                    <tr className="bg-white/5 border-b border-border/20">
                        <th className="px-4 py-3 font-black text-white uppercase text-[10px] tracking-widest text-center">Resource</th>
                        <th className="px-4 py-3 font-black text-white uppercase text-[10px] tracking-widest text-center">Capacity</th>
                        <th className="px-4 py-3 font-black text-white uppercase text-[10px] tracking-widest text-center">Allocatable</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                    {(resources || []).map((res) => (
                        <tr key={res} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 font-bold text-info uppercase text-xs">{res}</td>
                            <td className="px-4 py-3 font-mono text-primary text-center">{formatResourceValue(res, capacity[res])}</td>
                            <td className="px-4 py-3 font-mono text-success text-center">{formatResourceValue(res, allocatable?.[res])}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
