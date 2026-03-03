import React from 'react';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import CommonTable from '../../Common/CommonTable';
import PersistenceVolumeClaimsTable from '../PersistenceVolumeClaimsTable';

/**
 * PodOverview - RESTORED FROZEN VIEW (Cleanup Duplicate Metadata)
 */
export default function PodOverview({ data, t, icons, namespace }) {
    if (!data) return null;
    const { resource, metadata, spec, status, metrics, extra } = data;
    
    const mountedPvcs = (spec?.volumes || []).filter(v => v.persistentVolumeClaim).map(v => v.persistentVolumeClaim.claimName);

    const conditionColumns = [
        { header: 'type', accessor: 'type', className: 'font-bold text-info' },
        { header: t('label_status'), accessor: (c) => <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${c.status === 'True' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{c.status}</span>, className: 'text-center' },
        { header: 'last_probe', accessor: 'lastProbeTime', className: 'text-text-muted font-mono text-xs' },
        { header: 'last_transition', accessor: 'lastTransitionTime', className: 'text-text-muted font-mono text-xs' },
        { header: 'reason', accessor: 'reason' },
        { header: 'message', accessor: 'message', className: 'text-text-muted text-xs max-w-xs break-words' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <ResourceInfoSection isPod={true} resource={resource} extra={extra} metrics={metrics} spec={spec} status={status} t={t} />

            {(status?.conditions || resource?.status?.conditions) && (
                <CommonTable title="status_conditions" icon="activity" columns={conditionColumns} data={status?.conditions || resource?.status?.conditions || []} t={t} />
            )}

            {mountedPvcs.length > 0 && <PersistenceVolumeClaimsTable pvcNames={mountedPvcs} namespace={namespace || resource?.namespace} t={t} />}
        </div>
    );
}
