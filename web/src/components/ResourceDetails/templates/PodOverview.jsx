import React from 'react';
import DetailSection from '../DetailSection';
import ContainerDetails from '../ContainerDetails';
import ConditionsTable from '../ConditionsTable';
import PersistenceVolumeClaimsTable from '../PersistenceVolumeClaimsTable';

export default function PodOverview({ data, metadata, spec, status, t, icons, mountedPvcs, namespace }) {
    let cpuUsage = '—';
    let ramUsage = '—';
    if (data.metrics?.containers) {
        const cpuSum = data.metrics.containers.reduce((acc, c) => {
            const val = c.usage?.cpu || '0m';
            if (val.endsWith('n')) return acc + (parseInt(val) / 1000000);
            if (val.endsWith('u')) return acc + (parseInt(val) / 1000);
            if (val.endsWith('m')) return acc + parseInt(val);
            return acc + (parseInt(val) * 1000);
        }, 0);
        cpuUsage = cpuSum >= 1000 ? `${(cpuSum / 1000).toFixed(2)}` : `${Math.round(cpuSum)}m`;

        const ramSum = data.metrics.containers.reduce((acc, c) => {
            const val = c.usage?.memory || '0Ki';
            if (val.endsWith('Ki')) return acc + (parseInt(val) / 1024);
            if (val.endsWith('Mi')) return acc + parseInt(val);
            if (val.endsWith('Gi')) return acc + (parseInt(val) * 1024);
            return acc + (parseInt(val) / (1024 * 1024));
        }, 0);
        ramUsage = ramSum >= 1024 ? `${(ramSum / 1024).toFixed(2)} GiB` : `${Math.round(ramSum)} MiB`;
    }

    return (
        <>
            <DetailSection title={t('resource_info')}>
                <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-slate-600 bg-[var(--bg-sidebar)]/5">
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">CPU Usage</span>
                        <span className="text-sm font-bold text-info">{cpuUsage}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">RAM Usage</span>
                        <span className="text-sm font-bold text-info">{ramUsage}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">IP Address</span>
                        <span className="text-sm font-mono text-[var(--text-primary)]">{status.podIP || '—'}</span>
                    </div>
                </div>
            </DetailSection>

            <ContainerDetails containers={spec.containers || []} statuses={status.containerStatuses} t={t} />
            
            {status?.conditions && (
                <ConditionsTable conditions={status.conditions} t={t} icons={icons} />
            )}

            {mountedPvcs && mountedPvcs.length > 0 && (
                <PersistenceVolumeClaimsTable pvcNames={mountedPvcs} namespace={namespace} t={t} />
            )}
        </>
    );
}
