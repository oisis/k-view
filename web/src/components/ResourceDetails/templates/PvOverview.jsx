import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';
import SourceTable from '../SourceTable';

export default function PvOverview({ data, metadata, spec, status, t }) {
    return (
        <>
            <DetailSection title={t('resource_info')}>
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-slate-600">
                        <DetailRow label="Status">
                            <span className={`font-bold ${status.phase === 'Bound' ? 'text-success' : 'text-warning'}`}>{status.phase}</span>
                        </DetailRow>
                        <DetailRow label="Capacity">
                            <span className="font-bold text-[var(--text-primary)]">{spec.capacity?.storage}</span>
                        </DetailRow>
                        <DetailRow label="Access Modes">
                            <span className="text-[var(--text-secondary)]">{spec.accessModes?.join(', ')}</span>
                        </DetailRow>
                        <DetailRow label="Reclaim Policy">
                            <span className="text-[var(--text-primary)]">{spec.persistentVolumeReclaimPolicy}</span>
                        </DetailRow>
                        <DetailRow label="Claim">
                            <span className="font-mono text-info">{spec.claimRef?.namespace}/{spec.claimRef?.name}</span>
                        </DetailRow>
                        <DetailRow label="Storage Class">
                            <span className="text-[var(--text-primary)]">{spec.storageClassName}</span>
                        </DetailRow>
                    </tbody>
                </table>
            </DetailSection>

            {/* PV Source Details from v0.37.0 */}
            <SourceTable source={spec} t={t} />
        </>
    );
}
