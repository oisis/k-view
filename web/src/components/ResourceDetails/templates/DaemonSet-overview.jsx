import React from 'react';
import { Link } from 'react-router-dom';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import CommonTable from '../../Common/CommonTable';

export default function DaemonSetOverview({ data, spec, status, relatedPods, relatedServices, t }) {
    if (!data) return null;
    const pods = Array.isArray(relatedPods) ? relatedPods : [];
    const services = Array.isArray(relatedServices) ? relatedServices : [];

    const podColumns = [
        { header: t('label_name'), accessor: (p) => <Link to={`/pods/${p.namespace}/${p.name}`} className="hover:underline text-accent font-bold font-mono">{p.name}</Link> },
        { header: t('label_namespace'), accessor: 'namespace' },
        { header: 'Images', accessor: (p) => p.extra?.images || '—', className: 'text-xs font-mono' },
        { header: 'Labels', accessor: (p) => p.extra?.labels || '—', className: 'text-xs' },
        { header: 'Node', accessor: (p) => p.extra?.node || '—' },
        { header: 'Status', accessor: 'status', className: 'text-center' },
        { header: 'Restarts', accessor: (p) => p.extra?.restarts || 0, className: 'text-center' },
        { header: 'CPU', accessor: (p) => p.extra?.cpu || '—', className: 'text-center' },
        { header: 'RAM', accessor: (p) => p.extra?.ram || '—', className: 'text-center' },
        { header: 'Created', accessor: 'age' }
    ];

    const svcColumns = [
        { header: t('label_name'), accessor: (s) => <Link to={`/services/${s.namespace}/${s.name}`} className="hover:underline text-accent font-bold font-mono">{s.name}</Link> },
        { header: t('label_namespace'), accessor: 'namespace' },
        { header: 'Labels', accessor: (s) => s.extra?.labels || '—', className: 'text-xs' },
        { header: 'Type', accessor: (s) => s.extra?.type || '—' },
        { header: 'cluster ip', accessor: (s) => s.extra?.['cluster-ip'] || '—' },
        { header: 'int endpoints', accessor: (s) => s.extra?.['int-endpoints'] || '—' },
        { header: 'ext endpoints', accessor: (s) => s.extra?.['ext-endpoints'] || '—' },
        { header: 'Created', accessor: 'age' }
    ];

    const conditionColumns = [
        { header: 'type', accessor: 'type', className: 'font-bold text-info' },
        { header: t('label_status'), accessor: (c) => <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${c.status === 'True' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{c.status}</span>, className: 'text-center' },
        { header: 'last_probe', accessor: 'lastUpdateTime' },
        { header: 'last_transition', accessor: 'lastTransitionTime' },
        { header: 'reason', accessor: 'reason' },
        { header: 'message', accessor: 'message', className: 'text-xs' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <ResourceInfoSection isDeployment={true} resource={data.resource} extra={data.extra} spec={spec} status={status} t={t} />
            <CommonTable title="pods" columns={podColumns} data={pods} t={t} />
            <CommonTable title="Services" columns={svcColumns} data={services} t={t} />
            <CommonTable title="status_conditions" columns={conditionColumns} data={status?.conditions || []} t={t} />
        </div>
    );
}
