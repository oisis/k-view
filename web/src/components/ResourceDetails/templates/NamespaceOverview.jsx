import React from 'react';
import DetailSection from '../DetailSection';
import ResourceQuotasTable from '../ResourceQuotasTable';
import LimitRangesTable from '../LimitRangesTable';

export default function NamespaceOverview({ data, metadata, status, quotas, limits, t, icons }) {
    return (
        <>
            <DetailSection title={t('resource_info')}>
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <tr className="border-b border-border">
                            <td className="px-4 py-3 text-text-muted font-bold uppercase text-xs w-1/4">Status</td>
                            <td className="px-4 py-3">
                                <span className={`font-bold ${status?.phase === 'Active' ? 'text-success' : 'text-warning'}`}>
                                    {status?.phase || 'Unknown'}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </DetailSection>

            {quotas && quotas.length > 0 && (
                <ResourceQuotasTable quotas={quotas} t={t} icons={icons} />
            )}
            
            {limits && limits.length > 0 && (
                <LimitRangesTable limits={limits} t={t} icons={icons} />
            )}
        </>
    );
}
