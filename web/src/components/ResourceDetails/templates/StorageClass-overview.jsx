import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from '../DetailSection';
import CommonTable from '../../Common/CommonTable';
import ExpandableCell from '../ExpandableCell';
import { useTheme } from '../../../ThemeContext';

export default function StorageClassOverview({ data, spec, relatedPvs = [], t, icons }) {
    const { icons: themeIcons } = useTheme();

    const pvColumns = [
        { header: 'Name', accessor: (p) => <Link to={`/persistentvolumes/-/${p.name}`} className="text-info hover:underline font-mono">{p.name}</Link> },
        { header: 'Capacity', accessor: (p) => p.extra?.capacity || '—' },
        { header: 'Status', accessor: 'status', badge: true },
        { header: 'Claim', accessor: (p) => p.extra?.claimRef || '—', className: 'text-xs opacity-70' },
        { header: 'Created', accessor: 'age' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <div className="glass rounded-2xl border border-border overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                                <th className="px-4 py-2 text-center border-r border-border">Provisioner</th>
                                <th className="px-4 py-2 text-center border-r border-border">Reclaim Policy</th>
                                <th className="px-4 py-2 text-center border-r border-border">Volume Binding Mode</th>
                                <th className="px-4 py-2 text-center border-r border-border">Allow Volume Expansion</th>
                                <th className="px-4 py-2 text-center">Parameters</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-primary font-bold align-middle text-center">
                                <td className="px-4 py-4 border-r border-border text-xs">{spec?.provisioner || '—'}</td>
                                <td className="px-4 py-4 border-r border-border">{spec?.reclaimPolicy || '—'}</td>
                                <td className="px-4 py-4 border-r border-border">{spec?.volumeBindingMode || '—'}</td>
                                <td className="px-4 py-4 border-r border-border">{String(spec?.allowVolumeExpansion || false)}</td>
                                <td className="px-4 py-4">
                                    <ExpandableCell value={spec?.parameters || {}} type="labels" icons={themeIcons} />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </DetailSection>

            <CommonTable title="Persistent Volumes" columns={pvColumns} data={relatedPvs} t={t} />
        </div>
    );
}
