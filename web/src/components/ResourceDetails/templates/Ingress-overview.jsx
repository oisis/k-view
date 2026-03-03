import React from 'react';
import CommonTable from '../../Common/CommonTable';
import DetailSection from '../DetailSection';

export default function IngressOverview({ data, spec, status, t }) {
    if (!data) return null;
    const ingressStatus = status?.loadBalancer?.ingress || [];

    const ruleColumns = [
        { header: 'Host', accessor: 'host', className: 'font-bold text-info font-mono' },
        { header: 'Path', accessor: 'path', className: 'font-mono' },
        { header: 'Service', accessor: 'serviceName', className: 'font-bold text-accent' },
        { header: 'Port', accessor: 'port' }
    ];

    const rulesData = [];
    spec?.rules?.forEach(rule => {
        rule.http?.paths?.forEach(path => {
            rulesData.push({
                host: rule.host || '*',
                path: path.path || '/',
                serviceName: path.backend?.service?.name || '—',
                port: path.backend?.service?.port?.number || '—'
            });
        });
    });

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <CommonTable title="Rules" columns={ruleColumns} data={rulesData} t={t} />
            <DetailSection title="Load Balancer">
                <div className="p-4 flex flex-wrap gap-2">
                    {(ingressStatus || []).map((ing, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-info/10 text-info font-mono text-xs border border-info/20">
                            {ing.ip || ing.hostname}
                        </span>
                    ))}
                    {ingressStatus.length === 0 && <span className="text-text-muted italic">Not provisioned</span>}
                </div>
            </DetailSection>
        </div>
    );
}
