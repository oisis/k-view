import React from 'react';
import { Link } from 'react-router-dom';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import CommonTable from '../../Common/CommonTable';
import DetailSection from '../DetailSection';

export default function NodeOverview({ data, t }) {
    if (!data) return null;
    const { resource, metadata, spec, status, extra, allocation = {}, relatedPods = [] } = data;

    const conditionColumns = [
        { header: 'type', accessor: 'type', className: 'font-bold text-info' },
        { header: t('label_status'), accessor: (c) => <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${c.status === 'True' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{c.status}</span>, className: 'text-center' },
        { header: 'last_probe', accessor: 'lastProbeTime', className: 'font-mono text-xs' },
        { header: 'last_transition', accessor: 'lastTransitionTime', className: 'font-mono text-xs' },
        { header: 'reason', accessor: 'reason' },
        { header: 'message', accessor: 'message', className: 'text-xs' }
    ];

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

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <ResourceInfoSection isNode={true} resource={resource} extra={extra} spec={spec} status={status} t={t} />
            <DetailSection title="System Information">
                <div className="p-4 text-sm text-secondary grid grid-cols-2 gap-4">
                    <div>Machine ID: {status?.nodeInfo?.machineID || '—'}</div>
                    <div>Kernel: {status?.nodeInfo?.kernelVersion || '—'}</div>
                </div>
            </DetailSection>
            <DetailSection title="Allocation">
                <div className="p-4 text-sm text-secondary">Simplified Allocation summary</div>
            </DetailSection>
            <CommonTable title="status_conditions" columns={conditionColumns} data={status?.conditions || []} t={t} />
            <CommonTable title="Allocated Pods" columns={podColumns} data={relatedPods} t={t} />
        </div>
    );
}
