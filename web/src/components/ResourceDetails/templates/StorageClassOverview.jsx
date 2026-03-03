import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';
import PersistentVolumesTable from '../PersistentVolumesTable';

/**
 * StorageClassOverview - RESTORED FROZEN VIEW FROM MAIN
 */
export default function StorageClassOverview({ data, spec, relatedPvs, t, icons }) {
    if (!data) return null;
    const extra = data.extra || {};
    const pvs = Array.isArray(data.relatedPvs || relatedPvs) ? (data.relatedPvs || relatedPvs) : [];

    const fields = [
        { key: 'provisioner', label: 'Provisioner' },
        { key: 'basePath', label: 'basePath' },
        { key: 'directoryPerms', label: 'directoryPerms' },
        { key: 'ensureUniqueDirectory', label: 'ensureUniqueDirectory' },
        { key: 'fileSystemId', label: 'fileSystemId' },
        { key: 'gid', label: 'gid' },
        { key: 'provisioningMode', label: 'provisioningMode' },
        { key: 'subPathPattern', label: 'subPathPattern' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        {(fields || []).map(f => (
                            <DetailRow key={f.key} label={f.label}>
                                <span className="font-mono text-primary font-bold">
                                    {extra[f.key] || '—'}
                                </span>
                            </DetailRow>
                        ))}
                    </tbody>
                </table>
            </DetailSection>

            {pvs.length > 0 && (
                <PersistentVolumesTable pvs={pvs} t={t} icons={icons} title="Persistent Volumes" />
            )}
        </div>
    );
}
