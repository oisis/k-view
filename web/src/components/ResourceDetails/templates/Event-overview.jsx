import React from 'react';
import DetailSection from '../DetailSection';

export default function EventOverview({ data, extra, t }) {
    if (!data) return null;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="status">
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Reason</td>
                            <td className="px-4 py-3 font-bold text-accent">{data.extra?.reason || extra?.reason || '—'}</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Message</td>
                            <td className="px-4 py-3 text-foreground">{data.extra?.message || extra?.message || '—'}</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Source</td>
                            <td className="px-4 py-3 text-secondary font-mono text-xs">{data.extra?.source || extra?.source || '—'}</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Object</td>
                            <td className="px-4 py-3 text-info font-mono text-xs">{data.extra?.object || extra?.object || '—'}</td>
                        </tr>
                    </tbody>
                </table>
            </DetailSection>
        </div>
    );
}
