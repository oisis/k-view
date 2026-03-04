import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from '../DetailSection';
import CommonTable from '../../Common/CommonTable';
import ExpandableCell from '../ExpandableCell';
import { useTheme } from '../../../ThemeContext';

export default function ServiceOverview({ data, spec, status, relatedEndpoints = [], relatedPods = [], relatedIngresses = [], t, icons }) {
    const { icons: themeIcons } = useTheme();

    const podColumns = [
        { header: 'Name', accessor: (p) => <Link to={`/pods/${p.namespace}/${p.name}`} className="text-info hover:underline">{p.name}</Link> },
        { header: 'Namespace', accessor: 'namespace' },
        { header: 'Images', accessor: (p) => <ExpandableCell value={p.extra?.images || []} type="images" icons={themeIcons} /> },
        { header: 'Labels', accessor: (p) => <ExpandableCell value={p.extra?.labels || {}} type="labels" icons={themeIcons} /> },
        { header: 'Node', accessor: (p) => p.extra?.nodeName || '—' },
        { header: 'Status', accessor: 'status', badge: true },
        { header: 'Restarts', accessor: (p) => p.extra?.restarts || 0, className: 'text-center' },
        { header: 'CPU', accessor: (p) => p.extra?.cpu || '—', className: 'text-center' },
        { header: 'RAM', accessor: (p) => p.extra?.memory || '—', className: 'text-center' },
        { header: 'Created', accessor: 'age' }
    ];

    const ingressColumns = [
        { header: 'Name', accessor: (i) => <Link to={`/ingresses/${i.namespace}/${i.name}`} className="text-accent hover:underline">{i.name}</Link> },
        { header: 'Namespace', accessor: 'namespace' },
        { header: 'Labels', accessor: (i) => <ExpandableCell value={i.extra?.labels || {}} type="labels" icons={themeIcons} /> },
        { header: 'Endpoints', accessor: (i) => <ExpandableCell value={i.extra?.endpoints || []} type="endpoints" icons={themeIcons} /> },
        { header: 'Hosts', accessor: (i) => <ExpandableCell value={i.extra?.hosts || []} type="hosts" icons={themeIcons} /> },
        { header: 'Created', accessor: 'age' }
    ];

    const epColumns = [
        { header: 'Host', accessor: 'host', className: 'font-mono' },
        { header: 'Ports', accessor: 'ports', className: 'text-xs' },
        { header: 'Node', accessor: 'node' },
        { header: 'Ready', accessor: 'ready', className: 'text-center text-success font-bold' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <div className="glass rounded-2xl border border-border overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                                <th className="px-6 py-2 text-center border-r border-border">Type</th>
                                <th className="px-6 py-2 text-center border-r border-border">Cluster IP</th>
                                <th className="px-6 py-2 text-center border-r border-border">Session Affinity</th>
                                <th className="px-6 py-2 text-center">Selector</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-primary font-bold align-middle">
                                <td className="px-6 py-4 text-center border-r border-border">{spec?.type || '—'}</td>
                                <td className="px-6 py-4 text-center border-r border-border font-mono">{spec?.clusterIP || '—'}</td>
                                <td className="px-6 py-4 text-center border-r border-border">{spec?.sessionAffinity || 'None'}</td>
                                <td className="px-6 py-4 text-center">
                                    <ExpandableCell value={spec?.selector || {}} type="labels" icons={themeIcons} />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </DetailSection>

            <CommonTable title="Endpoints" columns={epColumns} data={relatedEndpoints} t={t} />
            <CommonTable title="Pods" columns={podColumns} data={relatedPods} t={t} />
            <CommonTable title="Ingresses" columns={ingressColumns} data={relatedIngresses} t={t} />
        </div>
    );
}
