import React from 'react';
import DetailSection from '../DetailSection';
import ResourceQuotasTable from '../ResourceQuotasTable';
import LimitRangesTable from '../LimitRangesTable';

export default function NamespaceOverview({ data, status, quotas, limits, t, icons }) {
    if (!data) return null;
    const phase = data.resource?.status?.phase || status?.phase || data.status?.phase || 'Active';

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="resource_info">
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <tr className="border-b border-border">
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-xs w-1/4">Status</td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${phase === 'Active' ? 'bg-success animate-pulse' : 'bg-warning'}`} />
                                    <span className={`font-bold uppercase tracking-wider ${phase === 'Active' ? 'text-success' : 'text-warning'}`}>
                                        {phase}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </DetailSection>
            {(quotas || data.quotas) && <ResourceQuotasTable quotas={data.quotas || quotas} t={t} icons={icons} />}
            {(limits || data.limits) && <LimitRangesTable limits={data.limits || limits} t={t} icons={icons} />}
        </div>
    );
}
