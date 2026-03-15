import React from 'react';
import DetailSection from '../DetailSection';
import CommonTable from '../../Common/CommonTable';
import ExpandableCell from '../ExpandableCell';
import { useTheme } from '../../../ThemeContext';

export default function PvOverview({ data, metadata, spec, status, t }) {
    const { icons: themeIcons } = useTheme();
    const source = data?.volumeSource || {};
    const capacity = data?.detailedCapacity || [];

    const capacityColumns = [
        { header: 'Resource Name', accessor: 'resourceName', className: 'font-bold' },
        { header: 'Quantity', accessor: 'quantity', className: 'font-mono text-primary' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <div className="glass rounded-2xl border border-border overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                                <th className="px-4 py-2 text-center border-r border-border">Status</th>
                                <th className="px-4 py-2 text-center border-r border-border">Claim</th>
                                <th className="px-4 py-2 text-center border-r border-border">Reclaim Policy</th>
                                <th className="px-4 py-2 text-center border-r border-border">Storage Class</th>
                                <th className="px-4 py-2 text-center border-r border-border">Mount Options</th>
                                <th className="px-4 py-2 text-center">Access modes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-primary font-bold align-middle text-center">
                                <td className={`px-4 py-4 border-r border-border ${status?.phase === 'Bound' ? 'text-success' : 'text-warning'}`}>
                                    {status?.phase || '—'}
                                </td>
                                <td className="px-4 py-4 border-r border-border font-mono text-xs text-info">
                                    {spec?.claimRef ? `${spec.claimRef.namespace}/${spec.claimRef.name}` : '—'}
                                </td>
                                <td className="px-4 py-4 border-r border-border">{spec?.persistentVolumeReclaimPolicy || '—'}</td>
                                <td className="px-4 py-4 border-r border-border font-mono text-xs">{spec?.storageClassName || '—'}</td>
                                <td className="px-4 py-4 border-r border-border">
                                    <ExpandableCell value={spec?.mountOptions || []} type="mounts" icons={themeIcons} />
                                </td>
                                <td className="px-4 py-4">
                                    <ExpandableCell value={spec?.accessModes || []} type="access-modes" icons={themeIcons} />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </DetailSection>

            <DetailSection title="Source">
                <div className="glass rounded-2xl border border-border overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                                <th className="px-4 py-2 text-center border-r border-border">Type</th>
                                <th className="px-4 py-2 text-center border-r border-border">Driver / Server</th>
                                <th className="px-4 py-2 text-center border-r border-border">Volume Handle / Path</th>
                                <th className="px-4 py-2 text-center">Volume Attributes(Key, Value)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-primary font-bold align-middle text-center">
                                <td className="px-4 py-4 border-r border-border text-accent">{source.type || '—'}</td>
                                <td className="px-4 py-4 border-r border-border font-mono text-xs">{source.driver || source.server || '—'}</td>
                                <td className="px-4 py-4 border-r border-border font-mono text-xs truncate" title={source.volumeHandle || source.path}>{source.volumeHandle || source.path || '—'}</td>
                                <td className="px-4 py-4">
                                    <ExpandableCell value={source.attributes || {}} type="labels" icons={themeIcons} />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </DetailSection>

            <CommonTable title="Capacity" columns={capacityColumns} data={capacity} t={t} />
        </div>
    );
}
