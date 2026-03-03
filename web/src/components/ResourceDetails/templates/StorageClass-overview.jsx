import React from 'react';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';
import PersistentVolumesTable from '../PersistentVolumesTable';

export default function StorageClassOverview({ data, spec, relatedPvs, t, icons }) {
    if (!data) return null;
    const extra = data.extra || {};
    const pvs = Array.isArray(data.relatedPvs || relatedPvs) ? (data.relatedPvs || relatedPvs) : [];

    const fields = [
        { key: 'provisioner', label: 'Provisioner' },
        { key: 'reclaimPolicy', label: 'Reclaim Policy' },
        { key: 'volumeBindingMode', label: 'Binding Mode' },
        { key: 'allowVolumeExpansion', label: 'Allow Expansion' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <ResourceInfoSection isStorageClass={true} resource={data.resource} extra={extra} spec={spec} t={t} />
            <DetailSection title="Parameters">
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        {(fields || []).map(f => (
                            <DetailRow key={f.key} label={f.label}>
                                <span className="font-mono text-primary font-bold">{spec?.[f.key] || extra[f.key] || '—'}</span>
                            </DetailRow>
                        ))}
                    </tbody>
                </table>
            </DetailSection>
            {pvs.length > 0 && <PersistentVolumesTable pvs={pvs} t={t} icons={icons} title="Persistent Volumes" />}
        </div>
    );
}
