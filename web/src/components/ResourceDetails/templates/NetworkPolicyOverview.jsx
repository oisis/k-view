import React from 'react';
import DetailSection from '../DetailSection';

const VerbsList = ({ items, title, t }) => {
    if (!items || !Array.isArray(items) || items.length === 0) return null;
    return (
        <div className="mb-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-text-muted mb-3 px-1">{title}</h4>
            <div className="bg-white/5 rounded-2xl border border-border overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-white/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                        <tr>
                            <th className="px-6 py-3 w-2/3">Source / Destination (Peers)</th>
                            <th className="px-6 py-3 text-center">Allowed Ports</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {items.map((rule, idx) => (
                            <tr key={idx} className="hover:bg-white/10 transition-all">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-2">
                                        {(rule.from || rule.to || []).length > 0 ? (
                                            (rule.from || rule.to).map((peer, i) => (
                                                <div key={i} className="flex flex-wrap gap-2 items-center">
                                                    {peer.podSelector && (
                                                        <span className="px-2 py-1 bg-white/10 border border-white/10 text-accent rounded text-[10px] font-bold shadow-sm">
                                                            PODS: {peer.podSelector.matchLabels ? Object.entries(peer.podSelector.matchLabels).map(([k,v]) => `${k}=${v}`).join(', ') : 'ALL'}
                                                        </span>
                                                    )}
                                                    {peer.namespaceSelector && (
                                                        <span className="px-2 py-1 bg-white/10 border border-white/10 text-info rounded text-[10px] font-bold shadow-sm">
                                                            NS: {peer.namespaceSelector.matchLabels ? Object.entries(peer.namespaceSelector.matchLabels).map(([k,v]) => `${k}=${v}`).join(', ') : 'ALL'}
                                                        </span>
                                                    )}
                                                    {peer.ipBlock && (
                                                        <span className="px-2 py-1 bg-white/10 border border-white/10 text-warning rounded text-[10px] font-mono font-bold shadow-sm">
                                                            IP: {peer.ipBlock.cidr} {peer.ipBlock.except ? `(exc: ${peer.ipBlock.except.join(',')})` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-text-muted italic flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                                                Anywhere (No selector defined)
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-wrap justify-center gap-1.5">
                                        {rule.ports && rule.ports.length > 0 ? (
                                            rule.ports.map((p, i) => (
                                                <span key={i} className="px-2 py-1 bg-white/10 border border-white/10 text-success rounded text-xs font-mono font-black shadow-sm">
                                                    {p.port}/{p.protocol}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-tighter bg-white/10 px-2 py-0.5 rounded shadow-sm border border-white/5">All Ports</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function NetworkPolicyOverview({ spec, t }) {
    const podSelector = spec?.podSelector?.matchLabels || {};
    const policyTypes = spec?.policyTypes || [];

    return (
        <div className="space-y-6">
            <DetailSection title="Resource Info">
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Pod Selector</td>
                            <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(podSelector).length > 0 ? (
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
                                    {policyTypes.map(type => (
                                        <span key={type} className="px-2 py-0.5 bg-white/10 border border-white/10 text-accent rounded text-[10px] font-black uppercase tracking-widest shadow-sm">{type}</span>
                                    ))}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </DetailSection>

            {spec?.ingress && (
                <DetailSection title="Ingress Rules (Incoming Traffic)">
                    <VerbsList items={spec.ingress} title="Allow Inbound Traffic From" t={t} />
                </DetailSection>
            )}

            {spec?.egress && (
                <DetailSection title="Egress Rules (Outgoing Traffic)">
                    <VerbsList items={spec.egress} title="Allow Outbound Traffic To" t={t} />
                </DetailSection>
            )}
        </div>
    );
}
