import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';
import SourceTable from '../SourceTable';

export default function PvOverview({ data, metadata, spec, status, t }) {
    const formatCapacity = (val) => {
        if (!val) return '—';
        let bytes = 0;
        const numeric = parseFloat(val);
        
        if (val.endsWith('Ki')) bytes = numeric * 1024;
        else if (val.endsWith('Mi')) bytes = numeric * 1024 * 1024;
        else if (val.endsWith('Gi')) bytes = numeric * 1024 * 1024 * 1024;
        else if (val.endsWith('Ti')) bytes = numeric * 1024 * 1024 * 1024 * 1024;
        else bytes = numeric;

        const mb = bytes / (1024 * 1024);
        const gb = bytes / (1024 * 1024 * 1024);
        const tb = bytes / (1024 * 1024 * 1024 * 1024);

        if (tb >= 1) return `${tb.toFixed(2)} TB`;
        if (gb >= 1) return `${gb.toFixed(2)} GB`;
        return `${mb.toFixed(2)} MB`;
    };

    return (
        <>
            <DetailSection title={t('resource_info')}>
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <DetailRow label="Status">
                            <span className={`font-bold ${status.phase === 'Bound' ? 'text-success' : 'text-warning'}`}>{status.phase}</span>
                        </DetailRow>
                        <DetailRow label="Capacity">
                            <span className="font-bold text-primary">{formatCapacity(spec.capacity?.storage)}</span>
                        </DetailRow>
                        <DetailRow label="Access Modes">
                            <span className="text-secondary">{spec.accessModes?.join(', ')}</span>
                        </DetailRow>
                        <DetailRow label="Reclaim Policy">
                            <span className="text-primary">{spec.persistentVolumeReclaimPolicy}</span>
                        </DetailRow>
                        <DetailRow label="Claim">
                            <span className="font-mono text-info">{spec.claimRef?.namespace}/{spec.claimRef?.name}</span>
                        </DetailRow>
                        <DetailRow label="Storage Class">
                            <span className="text-primary">{spec.storageClassName}</span>
                        </DetailRow>
                    </tbody>
                </table>
            </DetailSection>

            <SourceTable source={spec} t={t} />
        </>
    );
}
