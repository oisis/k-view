import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';

export default function PvcOverview({ data, metadata, spec, status, t }) {
    return (
        <DetailSection title={t('resource_info')}>
            <table className="w-full text-sm text-left border-collapse">
                <tbody className="divide-y divide-slate-600">
                    <DetailRow label="Status">
                        <span className={`font-bold ${status.phase === 'Bound' ? 'text-success' : 'text-warning'}`}>{status.phase}</span>
                    </DetailRow>
                    <DetailRow label="Volume">
                        <span className="font-mono text-info font-bold">{spec.volumeName}</span>
                    </DetailRow>
                    <DetailRow label="Storage Class">
                        <span className="text-primary">{spec.storageClassName}</span>
                    </DetailRow>
                    <DetailRow label="Access Modes">
                        <span className="text-secondary">{spec.accessModes?.join(', ')}</span>
                    </DetailRow>
                    <DetailRow label="Capacity">
                        <span className="font-bold text-primary">{status.capacity?.storage}</span>
                    </DetailRow>
                </tbody>
            </table>
        </DetailSection>
    );
}
