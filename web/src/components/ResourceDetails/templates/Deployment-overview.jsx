import React from 'react';
import { Link } from 'react-router-dom';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import CommonTable from '../../Common/CommonTable';

/**
 * DeploymentOverview - RESTORED FROZEN VIEW (Cleanup Duplicate Metadata)
 */
export default function DeploymentOverview({ data, t }) {
    if (!data) return null;
    const { resource, metadata, spec, status, extra, relatedPods = [], relatedReplicaSets = [] } = data;

    const deploymentRevision = metadata?.annotations?.['deployment.kubernetes.io/revision'];
    const newRS = relatedReplicaSets.filter(rs => rs.extra?.revision && String(rs.extra.revision) === String(deploymentRevision));
    const oldRS = relatedReplicaSets.filter(rs => !rs.extra?.revision || String(rs.extra.revision) !== String(deploymentRevision));

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

    const rsColumns = [
        { header: t('label_name'), accessor: (rs) => <Link to={`/replicasets/${rs.namespace}/${rs.name}`} className="hover:underline text-accent font-bold font-mono">{rs.name}</Link> },
        { header: t('label_namespace'), accessor: 'namespace' },
        { header: 'Age', accessor: 'age' },
        { header: 'Pods', accessor: (rs) => rs.extra?.pods || '—' },
        { header: 'Labels', accessor: (rs) => rs.extra?.labels || '—', className: 'text-xs' },
        { header: 'Images', accessor: (rs) => rs.extra?.images || '—', className: 'text-xs font-mono' }
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
            <ResourceInfoSection isDeployment={true} resource={resource} extra={extra} spec={spec} status={status} t={t} />
            <CommonTable title="pods" columns={podColumns} data={relatedPods} t={t} />
            <CommonTable title="New Replica Set" columns={rsColumns} data={newRS} t={t} />
            <CommonTable title="Old Replica Set" columns={rsColumns} data={oldRS} t={t} />
            <CommonTable title="status_conditions" columns={conditionColumns} data={status?.conditions || []} t={t} />
        </div>
    );
}
