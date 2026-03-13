import React from 'react';
import { Link } from 'react-router-dom';
import CommonTable from '../../Common/CommonTable';

const KIND_MAP = {
    'Deployment': 'Deployments',
    'StatefulSet': 'StatefulSets',
    'DaemonSet': 'DaemonSets',
    'ReplicaSet': 'ReplicaSets',
    'ReplicationController': 'ReplicationControllers',
    'CronJob': 'CronJobs',
    'Job': 'Jobs',
    'Pod': 'Pods'
};

export default function HpaOverview({ data, spec, status, t }) {
    const metrics = spec?.metrics || [];

    const targetColumns = [
        { header: 'apiVersion', accessor: 'apiVersion' },
        { header: 'kind', accessor: 'kind' },
        { 
            header: 'name', 
            accessor: (row) => {
                const pluralKind = KIND_MAP[row.kind] || row.kind;
                return <Link to={`/resources/${pluralKind}/${data.resource.namespace}/${row.name}`} className="hover:underline text-accent font-bold font-mono">{row.name}</Link>
            } 
        }
    ];

    const scaleTargetData = spec?.scaleTargetRef ? [{
        apiVersion: spec.scaleTargetRef.apiVersion || data?.extra?.targetAPIVersion || '—',
        kind: spec.scaleTargetRef.kind || data?.extra?.targetKind || '—',
        name: spec.scaleTargetRef.name || data?.extra?.targetName || '—'
    }] : [];

    const metricColumns = [
        { header: t('type'), accessor: 'type', className: 'font-bold' },
        { header: t('label_resource_name'), accessor: (m) => m.resource?.name || '—' },
        { header: t('targets'), accessor: (m) => m.resource?.target?.averageUtilization ? `${m.resource.target.averageUtilization}%` : '—', className: 'text-center' },
        { header: t('current'), accessor: () => data?.extra?.targets || '—', className: 'text-center text-info font-bold' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <CommonTable title="Scale Target Ref" columns={targetColumns} data={scaleTargetData} t={t} />
            <CommonTable title="Metrics" columns={metricColumns} data={metrics} t={t} />
        </div>
    );
}
