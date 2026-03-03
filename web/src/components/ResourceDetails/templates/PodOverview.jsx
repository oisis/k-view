import React from 'react';
import DetailSection from '../DetailSection';
import ContainerDetails from '../ContainerDetails';
import ConditionsTable from '../ConditionsTable';
import PersistenceVolumeClaimsTable from '../PersistenceVolumeClaimsTable';

/**
 * PodOverview - RESTORED FROZEN VIEW FROM MAIN
 * Cleanly rewritten to consume DTO structure.
 */
export default function PodOverview({ data, metadata, spec, status, t, icons, namespace }) {
    if (!data) return null;

    // Use pre-calculated metrics from backend DTO if available, 
    // or fallback to local calculation logic from main branch (safe mode)
    let cpuUsage = '—';
    let ramUsage = '—';
    
    if (data.metrics) {
        // Backend now provides these already parsed in the DTO 'metrics' field
        const cpu = data.metrics.cpu;
        const mem = data.metrics.memory;
        
        if (typeof cpu === 'number') {
            cpuUsage = cpu >= 1 ? `${cpu.toFixed(2)}` : `${Math.round(cpu * 1000)}m`;
        }
        if (typeof mem === 'number') {
            const mb = mem / (1024 * 1024);
            const gb = mem / (1024 * 1024 * 1024);
            ramUsage = gb >= 1 ? `${gb.toFixed(2)} GiB` : `${Math.round(mb)} MiB`;
        }
    }

    // Recover mounted PVCs from spec (Volumes)
    const mountedPvcs = (spec?.volumes || [])
        .filter(v => v.persistentVolumeClaim)
        .map(v => v.persistentVolumeClaim.claimName);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title={t('resource_info')}>
                <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-border bg-[var(--bg-sidebar)]/5 rounded-xl border border-border/30 overflow-hidden">
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">CPU (usage)</span>
                        <span className="text-sm font-bold text-info">{cpuUsage}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">RAM (usage)</span>
                        <span className="text-sm font-bold text-info">{ramUsage}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">IP Address</span>
                        <span className="text-sm font-mono text-primary font-bold">{(status?.podIP || data.resource?.status?.podIP) || '—'}</span>
                    </div>
                </div>
            </DetailSection>

            {/* Container details remains a core part of Pod view */}
            <ContainerDetails 
                containers={spec?.containers || []} 
                statuses={status?.containerStatuses || []} 
                t={t} 
            />
            
            {/* Safe extraction of conditions */}
            {(status?.conditions || data.resource?.status?.conditions) && (
                <DetailSection title={t('conditions')} icon="activity">
                    <ConditionsTable 
                        conditions={status?.conditions || data.resource?.status?.conditions || []} 
                        t={t} 
                        icons={icons} 
                    />
                </DetailSection>
            )}

            {/* Mounted PVCs list */}
            {mountedPvcs && mountedPvcs.length > 0 && (
                <PersistenceVolumeClaimsTable 
                    pvcNames={mountedPvcs} 
                    namespace={namespace || data.resource?.namespace} 
                    t={t} 
                />
            )}
        </div>
    );
}
