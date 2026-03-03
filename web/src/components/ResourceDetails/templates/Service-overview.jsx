import React from 'react';
import { Link } from 'react-router-dom';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import CommonTable from '../../Common/CommonTable';

/**
 * ServiceOverview - Cleanup Duplicate Metadata
 */
export default function ServiceOverview({ data, t }) {
    if (!data) return null;
    const { resource, metadata, spec, status, extra, relatedPods = [], relatedEndpoints = {}, relatedIngresses = [] } = data;

    const epColumns = [
        { header: 'Host', accessor: 'host' },
        { header: 'Ports', accessor: (ep) => ep.ports?.map(p => `${p.port}/${p.protocol}`).join(', ') || '—' },
        { header: 'Node', accessor: 'node' },
        { header: 'Ready', accessor: 'ready', className: 'text-center' }
    ];

    const ingColumns = [
        { header: t('label_name'), accessor: (i) => <Link to={`/ingresses/${i.namespace}/${i.name}`} className="hover:underline text-accent font-bold font-mono">{i.name}</Link> },
        { header: t('label_namespace'), accessor: 'namespace' },
        { header: 'Labels', accessor: (i) => i.extra?.labels || '—', className: 'text-xs' },
        { header: 'Endpoints', accessor: (i) => i.extra?.endpoints || '—' },
        { header: 'Hosts', accessor: (i) => i.extra?.hosts || '—' },
        { header: 'Created', accessor: 'age' }
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

    // Process endpoints
    const processedEndpoints = [];
    if (relatedEndpoints.subsets) {
        relatedEndpoints.subsets.forEach(subset => {
            const ports = subset.ports || [];
            subset.addresses?.forEach(addr => processedEndpoints.push({ host: addr.ip, node: addr.nodeName, ready: 'True', ports }));
            subset.notReadyAddresses?.forEach(addr => processedEndpoints.push({ host: addr.ip, node: addr.nodeName, ready: 'False', ports }));
        });
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <ResourceInfoSection isService={true} resource={resource} extra={extra} spec={spec} status={status} t={t} />
            <CommonTable title="Endpoints" columns={epColumns} data={processedEndpoints} t={t} />
            <CommonTable title="Ingresses" columns={ingColumns} data={relatedIngresses} t={t} />
            <CommonTable title="pods" columns={podColumns} data={relatedPods} t={t} />
        </div>
    );
}
