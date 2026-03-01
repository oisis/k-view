import React from 'react';
import DetailSection from '../DetailSection';
import PolicyRulesTable from '../PolicyRulesTable';

export default function NetworkPolicyOverview({ data, metadata, spec, t }) {
    return (
        <>
            <DetailSection title={t('resource_info')}>
                <div className="px-4 py-3 bg-[var(--bg-sidebar)]/5 border-b border-border">
                    <span className="text-xs font-bold text-text-muted uppercase block mb-2">Pod Selector</span>
                    <div className="flex flex-wrap gap-1.5">
                        {Object.entries(spec.podSelector?.matchLabels || {}).map(([k, v]) => (
                            <span key={k} className="px-2 py-0.5 bg-[var(--bg-muted)] border border-border rounded text-xs text-secondary font-mono inline-block max-w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
                                {k}: {v}
                            </span>
                        )) || <span className="text-text-muted italic">Match all</span>}
                    </div>
                </div>
            </DetailSection>

            {spec.ingress && <PolicyRulesTable title="Ingress Rules" rules={spec.ingress} t={t} />}
            {spec.egress && <PolicyRulesTable title="Egress Rules" rules={spec.egress} t={t} />}
        </>
    );
}
