import React from 'react';
import DetailSection from '../DetailSection';

export default function NetworkPolicyOverview({ data, spec, t }) {
    if (!data) return null;
    const podSelector = spec?.podSelector?.matchLabels || {};
    const policyTypes = spec?.policyTypes || [];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Pod Selector</td>
                            <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(podSelector || {}).length > 0 ? (
                                        Object.entries(podSelector).map(([k, v]) => (
                                            <span key={k} className="px-2 py-0.5 bg-white/10 text-info rounded text-xs font-mono border border-white/10 shadow-sm">{k}={v}</span>
                                        ))
                                    ) : (
                                        <span className="px-2 py-0.5 bg-white/10 text-warning rounded text-xs font-bold border border-white/10 shadow-sm">ALL PODS IN NAMESPACE</span>
                                    )}
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Policy Types</td>
                            <td className="px-4 py-3">
                                <div className="flex gap-4">
                                    {(policyTypes || []).map(type => (
                                        <span key={type} className="px-2 py-0.5 bg-white/10 border border-white/10 text-accent rounded text-[10px] font-black uppercase tracking-widest shadow-sm">{type}</span>
                                    ))}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </DetailSection>
        </div>
    );
}
