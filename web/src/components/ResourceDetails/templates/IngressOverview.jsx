import React from 'react';
import DetailSection from '../DetailSection';
import IngressRulesTable from '../IngressRulesTable';

/**
 * IngressOverview - RESTORED FROZEN VIEW FROM MAIN
 */
export default function IngressOverview({ data, metadata, spec, status, t, icons }) {
    if (!data) return null;

    const ingressStatus = status?.loadBalancer?.ingress || [];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title={t('resource_info')}>
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-xs w-1/4">Class Name</td>
                            <td className="px-4 py-3 font-bold text-accent">{spec?.ingressClassName || '—'}</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-xs w-1/4">Endpoints</td>
                            <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                    {(ingressStatus || []).map((ing, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded bg-info/10 text-info font-mono text-xs border border-info/20">
                                            {ing.ip || ing.hostname}
                                        </span>
                                    ))}
                                    {ingressStatus.length === 0 && <span className="text-text-muted italic">—</span>}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </DetailSection>

            <IngressRulesTable spec={spec} t={t} />
        </div>
    );
}
