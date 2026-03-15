import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from '../DetailSection';
import CommonTable from '../../Common/CommonTable';
import ExpandableCell from '../ExpandableCell';
import { useTheme } from '../../../ThemeContext';

export default function StorageClassOverview({ data, relatedPvs = [], t, icons }) {
    const { icons: themeIcons } = useTheme();

    const pvColumns = [
        { header: 'Name', accessor: (p) => <Link to={`/resources/PersistentVolumes/-/${p.name}`} className="text-info hover:underline font-mono">{p.name}</Link> },
        { header: 'Capacity', accessor: (p) => p.extra?.storage || p.extra?.capacity || '—' },
        { header: 'Access Modes', accessor: (p) => <ExpandableCell value={p.extra?.accessModes || []} type="access-modes" icons={themeIcons} /> },
        { header: 'Reclaim Policy', accessor: (p) => p.extra?.reclaimPolicy || '—' },
        { header: 'Status', accessor: 'status', badge: true },
        { header: 'Claim', accessor: (p) => p.extra?.claim || p.extra?.claimRef || '—', className: 'text-xs opacity-70' },
        { header: 'Storage Class', accessor: (p) => p.extra?.storageClass || '—' },
        { header: 'Reason', accessor: (p) => p.extra?.reason || '—' },
        { header: 'Age', accessor: 'age' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <div className="glass rounded-2xl border border-border overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                                <th className="px-4 py-2 text-center border-r border-border">Provisioner</th>
                                <th className="px-4 py-2 text-center border-r border-border">basePath</th>
                                <th className="px-4 py-2 text-center border-r border-border">directoryPerms</th>
                                <th className="px-4 py-2 text-center border-r border-border">ensureUniqueDirectory</th>
                                <th className="px-4 py-2 text-center border-r border-border">fileSystemId</th>
                                <th className="px-4 py-2 text-center border-r border-border">gid</th>
                                <th className="px-4 py-2 text-center border-r border-border">provisioningMode</th>
                                <th className="px-4 py-2 text-center border-r border-border">subPathPattern</th>
                                <th className="px-4 py-2 text-center">uid</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-primary font-bold align-middle text-center">
                                <td className="px-4 py-4 border-r border-border text-xs break-all">{data?.provisioner || '—'}</td>
                                <td className="px-4 py-4 border-r border-border font-mono text-xs">{data?.parameters?.basePath || '—'}</td>
                                <td className="px-4 py-4 border-r border-border font-mono text-xs">{data?.parameters?.directoryPerms || '—'}</td>
                                <td className="px-4 py-4 border-r border-border font-mono text-xs">{data?.parameters?.ensureUniqueDirectory || '—'}</td>
                                <td className="px-4 py-4 border-r border-border font-mono text-xs">{data?.parameters?.fileSystemId || '—'}</td>
                                <td className="px-4 py-4 border-r border-border font-mono text-xs">{data?.parameters?.gid || '—'}</td>
                                <td className="px-4 py-4 border-r border-border font-mono text-xs">{data?.parameters?.provisioningMode || '—'}</td>
                                <td className="px-4 py-4 border-r border-border font-mono text-xs">{data?.parameters?.subPathPattern || '—'}</td>
                                <td className="px-4 py-4 font-mono text-[10px]">{data?.resource?.uid || '—'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </DetailSection>

            <CommonTable title="Persistent Volumes" columns={pvColumns} data={relatedPvs} t={t} />
        </div>
    );
}
