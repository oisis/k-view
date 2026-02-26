import React from 'react';
import DetailSection from '../DetailSection';
import IngressRulesTable from '../IngressRulesTable';

export default function IngressOverview({ data, metadata, spec, status, t }) {
    return (
        <>
            <DetailSection title={t('resource_info')}>
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-slate-600">
                        {status.loadBalancer?.ingress && (
                            <tr className="border-b border-slate-600">
                                <td className="px-4 py-3 text-[var(--text-muted)] font-bold uppercase text-[10px] w-1/4">Endpoints</td>
                                <td className="px-4 py-3">
                                    {status.loadBalancer.ingress.map((ing, i) => (
                                        <div key={i} className="font-mono text-info font-bold">{ing.ip || ing.hostname}</div>
                                    ))}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </DetailSection>

            {spec.rules && <IngressRulesTable rules={spec.rules} t={t} />}
        </>
    );
}
