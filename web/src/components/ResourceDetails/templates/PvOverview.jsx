import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';
import SourceTable from '../SourceTable';

export default function PvOverview({ data, metadata, spec, status, t }) {
    const capacity = spec?.capacity || {};

    return (
        <div className="space-y-6">
            <DetailSection title={t('resource_info')}>
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <DetailRow label="Status">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                status?.phase === 'Bound' ? 'bg-success/10 text-success border-success/20' : 
                                status?.phase === 'Available' ? 'bg-info/10 text-info border-info/20' : 
                                'bg-warning/10 text-warning border-warning/20'
                            }`}>
                                {status?.phase || 'Unknown'}
                            </span>
                        </DetailRow>
                        <DetailRow label="Access Modes">
                            <span className="text-secondary font-medium">{spec?.accessModes?.join(', ') || '—'}</span>
                        </DetailRow>
                        <DetailRow label="Reclaim Policy">
                            <span className="text-primary font-bold">{spec?.persistentVolumeReclaimPolicy || '—'}</span>
                        </DetailRow>
                        <DetailRow label="Claim">
                            {spec?.claimRef ? (
                                <span className="font-mono text-info font-bold">{spec.claimRef.namespace}/{spec.claimRef.name}</span>
                            ) : (
                                <span className="text-text-muted italic">—</span>
                            )}
                        </DetailRow>
                        <DetailRow label="Storage Class">
                            <span className="text-accent font-bold">{spec?.storageClassName || '—'}</span>
                        </DetailRow>
                    </tbody>
                </table>
            </DetailSection>

            <DetailSection title="Capacity">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-border uppercase text-[10px] tracking-widest font-black">
                                <th className="px-4 py-3 text-left">Resource name</th>
                                <th className="px-4 py-3 text-left">Quantity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {Object.entries(capacity || {}).length === 0 ? (
                                <tr><td colSpan="2" className="px-4 py-8 text-center text-text-muted italic bg-[var(--bg-sidebar)]/5">No capacity info available.</td></tr>
                            ) : (
                                Object.entries(capacity || {}).map(([res, qty]) => (
                                    <tr key={res} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-3 font-bold text-primary">{res}</td>
                                        <td className="px-4 py-3 font-mono text-info font-bold">{qty}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </DetailSection>

            <SourceTable source={spec} t={t} />
        </div>
    );
}
