import React from 'react';
import { Link } from 'react-router-dom';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import CommonTable from '../../Common/CommonTable';
import DetailSection from '../DetailSection';
import ExpandableCell from '../ExpandableCell';
import { useTheme } from '../../../ThemeContext';

export default function StatefulSetOverview({ data, spec, status, relatedPods = [], t, icons }) {
    const { icons: themeIcons } = useTheme();

    const podColumns = [
        { header: t('label_name'), accessor: (p) => <Link to={`/resources/Pods/${p.namespace}/${p.name}`} className="hover:underline text-accent font-bold font-mono">{p.name}</Link> },
        { header: t('label_namespace'), accessor: 'namespace' },
        { header: t('images'), accessor: (p) => <ExpandableCell value={p.extra?.images || []} type="images" icons={themeIcons} /> },
        { header: t('label_labels'), accessor: (p) => <ExpandableCell value={p.extra?.labels || {}} type="labels" icons={themeIcons} /> },
        { header: t('node'), accessor: (p) => p.extra?.node || '—' },
        { header: t('label_status'), accessor: 'status', badge: true },
        { header: t('label_restarts'), accessor: (p) => p.extra?.restarts || 0, className: 'text-center' },
        { header: 'CPU', accessor: (p) => p.extra?.cpu || '—', className: 'text-center' },
        { header: 'RAM', accessor: (p) => p.extra?.memory || '—', className: 'text-center' },
        { header: t('label_created'), accessor: 'age' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <div className="glass rounded-2xl border border-border overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                                <th className="px-6 py-2 text-center border-r border-border">Selector</th>
                                <th className="px-6 py-2 text-center border-r border-border">Images</th>
                                <th className="px-6 py-2 text-center border-r border-border">Init Images</th>
                                <th className="px-6 py-2 text-center">Service Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-primary font-bold align-middle">
                                <td className="px-6 py-4 text-center border-r border-border">
                                    <ExpandableCell value={spec?.selector?.matchLabels || {}} type="labels" icons={themeIcons} />
                                </td>
                                <td className="px-6 py-4 text-center border-r border-border">
                                    <ExpandableCell value={data?.extra?.images || []} type="images" icons={themeIcons} />
                                </td>
                                <td className="px-6 py-4 text-center border-r border-border">
                                    <ExpandableCell value={data?.extra?.initImages || []} type="images" icons={themeIcons} />
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {spec?.serviceName || '—'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </DetailSection>

            <DetailSection title="Pods status">
                <div className="grid grid-cols-2 divide-x divide-border bg-sidebar/10 rounded-xl border border-border py-4">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-black text-text-muted mb-1">Running</span>
                        <span className="text-lg font-bold text-success">{status?.readyReplicas || 0}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-black text-text-muted mb-1">Desired</span>
                        <span className="text-lg font-bold text-primary">{spec?.replicas || 0}</span>
                    </div>
                </div>
            </DetailSection>

            <CommonTable title="Pods" columns={podColumns} data={relatedPods} t={t} />
        </div>
    );
}
