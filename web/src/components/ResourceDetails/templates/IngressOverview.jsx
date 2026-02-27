import React from 'react';
import DetailSection from '../DetailSection';
import IngressRulesTable from '../IngressRulesTable';

export default function IngressOverview({ data, metadata, spec, status, t }) {
    return (
        <>
            <DetailSection title={t('resource_info') || 'Resource Info'}>
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        {status?.loadBalancer?.ingress && (
                            <tr className="border-b border-border">
                                <td className="px-4 py-3 text-text-muted font-bold uppercase text-xs w-1/4">Endpoints</td>
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

            {spec?.rules && <IngressRulesTable spec={spec} t={t} />}
        </>
    );
}
