import React from 'react';
import { Link } from 'react-router-dom';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import CommonTable from '../../Common/CommonTable';
import ExpandableCell from '../ExpandableCell';
import { useTheme } from '../../../ThemeContext';

/**
 * ReplicationControllerOverview - Fixed to handle objects in cells
 */
export default function ReplicationControllerOverview({ data, spec, status, relatedPods, relatedServices, t, icons }) {
    const { icons: themeIcons } = useTheme();
    if (!data) return null;
    const pods = Array.isArray(relatedPods) ? relatedPods : [];
    const services = Array.isArray(relatedServices) ? relatedServices : [];

    const podColumns = [
        { header: t('label_name'), accessor: (p) => <Link to={`/resources/Pods/${p.namespace}/${p.name}`} className="hover:underline text-accent font-bold font-mono">{p.name}</Link> },
        { header: t('label_namespace'), accessor: 'namespace' },
        { header: 'Images', accessor: (p) => <ExpandableCell value={p.extra?.images || []} type="images" icons={themeIcons} /> },
        { header: 'Labels', accessor: (p) => <ExpandableCell value={p.extra?.labels || {}} type="labels" icons={themeIcons} /> },
        { header: 'Node', accessor: (p) => p.extra?.node || '—' },
        { header: 'Status', accessor: 'status', badge: true },
        { header: 'Restarts', accessor: (p) => p.extra?.restarts || 0, className: 'text-center' },
        { header: 'CPU', accessor: (p) => p.extra?.cpu || '—', className: 'text-center' },
        { header: 'RAM', accessor: (p) => p.extra?.memory || '—', className: 'text-center' },
        { header: 'Created', accessor: 'age' }
    ];

    const svcColumns = [
        { header: 'Name', accessor: (s) => <Link to={`/resources/Services/${s.namespace}/${s.name}`} className="hover:underline text-accent font-bold font-mono">{s.name}</Link> },
        { header: 'Namespace', accessor: 'namespace' },
        { header: 'Type', accessor: (s) => s.extra?.type || '—' },
        { header: 'Cluster Ip', accessor: (s) => s.extra?.clusterIP || '—' },
        { header: 'Internal Endpoints', accessor: (s) => <ExpandableCell value={s.extra?.endpoints || []} type="images" icons={themeIcons} /> },
        { header: 'External Endpoints', accessor: (s) => <ExpandableCell value={s.extra?.external || []} type="images" icons={themeIcons} /> },
        { header: 'Created', accessor: 'age' }
    ];

    const conditionColumns = [
        { header: 'Type', accessor: 'type', className: 'font-bold text-info' },
        { header: 'Status', accessor: (c) => <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${c.status === 'True' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{c.status}</span>, className: 'text-center' },
        { header: 'Last Probe', accessor: 'lastUpdateTime' },
        { header: 'Last Transition', accessor: 'lastTransitionTime' },
        { header: 'Reason', accessor: 'reason' },
        { header: 'Message', accessor: 'message', className: 'text-xs' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <ResourceInfoSection isDeployment={true} resource={data.resource} extra={data.extra} spec={spec} status={status} t={t} />
            <CommonTable title="Pods" columns={podColumns} data={pods} t={t} />
            <CommonTable title="Services" columns={svcColumns} data={services} t={t} />
            <CommonTable title="Status Conditions" columns={conditionColumns} data={status?.conditions || []} t={t} />
        </div>
    );
}
