import React from 'react';
import DetailSection from '../DetailSection';
import ResourceQuotasTable from '../ResourceQuotasTable';
import LimitRangesTable from '../LimitRangesTable';

/**
 * NamespaceOverview - RESTORED FROZEN VIEW FROM MAIN
 * Cleanly rewritten to consume DTO structure.
 */
export default function NamespaceOverview({ data, metadata, status, quotas, limits, t, icons }) {
    if (!data) return null;

    // Use pre-fetched data from DTO if available
    const nsQuotas = data.quotas || quotas || [];
    const nsLimits = data.limits || limits || [];
    const phase = data.resource?.status?.phase || status?.phase || data.status?.phase || 'Active';

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title={t('resource_info')}>
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <tr className="border-b border-border">
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-xs w-1/4">Status</td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${phase === 'Active' ? 'bg-success animate-pulse' : 'bg-warning'}`} />
                                    <span className={`font-bold uppercase tracking-wider ${phase === 'Active' ? 'text-success' : 'text-warning'}`}>
                                        {t(phase.toLowerCase()) || phase}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </DetailSection>

            {nsQuotas && nsQuotas.length > 0 && (
                <ResourceQuotasTable quotas={nsQuotas} t={t} icons={icons} />
            )}
            
            {nsLimits && nsLimits.length > 0 && (
                <LimitRangesTable limits={nsLimits} t={t} icons={icons} />
            )}
        </div>
    );
}
