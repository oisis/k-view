import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';

/**
 * PvcOverview - RESTORED FROZEN VIEW FROM MAIN
 */
export default function PvcOverview({ data, metadata, spec, status, t }) {
    if (!data) return null;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title={t('resource_info')}>
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <DetailRow label="Status">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                status?.phase === 'Bound' ? 'bg-success/10 text-success border-success/20' : 
                                status?.phase === 'Pending' ? 'bg-warning/10 text-warning border-warning/20' : 
                                'bg-error/10 text-error border-error/20'
                            }`}>
                                {status?.phase || 'Unknown'}
                            </span>
                        </DetailRow>
                        <DetailRow label="Storage Class">
                            <span className="text-accent font-bold">{spec?.storageClassName || '—'}</span>
                        </DetailRow>
                        <DetailRow label="Volume">
                            <span className="font-mono text-primary">{spec?.volumeName || '—'}</span>
                        </DetailRow>
                        <DetailRow label="Access Modes">
                            <span className="text-secondary font-medium">{spec?.accessModes?.join(', ') || '—'}</span>
                        </DetailRow>
                    </tbody>
                </table>
            </DetailSection>

            <DetailSection title="Capacity & Resources">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border bg-[var(--bg-sidebar)]/5 border-b border-border rounded-xl overflow-hidden border border-border/30">
                    <div className="px-6 py-4 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Requested</span>
                        <span className="text-sm font-bold text-primary">{spec?.resources?.requests?.storage || '—'}</span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Capacity</span>
                        <span className="text-sm font-bold text-success">{status?.capacity?.storage || '—'}</span>
                    </div>
                </div>
            </DetailSection>
        </div>
    );
}
