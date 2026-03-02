import React from 'react';
import DetailSection from '../DetailSection';
import IngressRulesTable from '../IngressRulesTable';
import IngressTable from '../IngressTable';

export default function IngressOverview({ data, metadata, spec, status, t, icons }) {
    // Session Affinity often comes from annotations in Ingress
    const sessionAffinity = metadata?.annotations?.['nginx.ingress.kubernetes.io/affinity'] || 
                           metadata?.annotations?.['traefik.ingress.kubernetes.io/sticky'] || 
                           'None';

    // Current Ingress as a single-item array for the table
    const currentIngress = data ? [{
        name: metadata?.name,
        namespace: metadata?.namespace,
        extra: data.extra,
        age: data.resource?.age
    }] : [];

    return (
        <>
            <DetailSection title="Resources Info">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-border bg-[var(--bg-sidebar)]/5 border-b border-border">
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Session Affinity</span>
                        <span className={`text-sm font-bold ${sessionAffinity !== 'None' ? 'text-accent' : 'text-primary'}`}>
                            {sessionAffinity}
                        </span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Address</span>
                        <span className="text-sm font-mono text-info font-bold">
                            {data?.extra?.address || '—'}
                        </span>
                    </div>
                </div>
            </DetailSection>

            {spec?.rules && <IngressRulesTable spec={spec} t={t} />}

            <IngressTable title="Ingress Details" ingresses={currentIngress} t={t} icons={icons} />
        </>
    );
}
