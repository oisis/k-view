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
                    <tr className="bg-muted/50 border-b border-border">
                        <th className="px-4 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-widest text-center">Resource</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-widest text-center">Capacity</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-widest text-center">Allocatable</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {['cpu', 'memory', 'pods'].map(res => (
                        <tr key={res} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-bold text-foreground text-center uppercase text-[10px] tracking-wider">{res}</td>
                            <td className="px-4 py-3 font-mono text-foreground text-center">{formatResourceValue(res, capacity[res])}</td>
                            <td className="px-4 py-3 font-mono text-foreground text-center">{formatResourceValue(res, allocatable[res])}</td>
                        </tr>
                    ))}
                </tbody>

            </table>
        </div>
    );
}
