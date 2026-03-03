import React from 'react';
import { Link } from 'react-router-dom';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import CommonTable from '../../Common/CommonTable';

export default function CronJobOverview({ data, metadata, spec, status, relatedJobs, t }) {
    if (!data) return null;
    const jobs = Array.isArray(relatedJobs) ? relatedJobs : [];

    const jobColumns = [
        { header: t('label_name'), accessor: (j) => <Link to={`/jobs/${j.namespace}/${j.name}`} className="hover:underline text-accent font-bold font-mono">{j.name}</Link> },
        { header: t('label_namespace'), accessor: 'namespace' },
        { header: 'Images', accessor: (j) => j.extra?.images || '—', className: 'text-xs font-mono' },
        { header: 'Labels', accessor: (j) => j.extra?.labels || '—', className: 'text-xs' },
        { header: 'Status', accessor: 'status', className: 'text-center' },
        { header: 'Pods', accessor: (j) => j.extra?.pods || '—', className: 'text-center' },
        { header: 'Created', accessor: 'age' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <ResourceInfoSection isDeployment={true} resource={data.resource} extra={data.extra} spec={spec} status={status} t={t} />
            <CommonTable title="Active Jobs" columns={jobColumns} data={jobs.filter(j => parseInt(j.extra?.active || '0') > 0)} t={t} />
            <CommonTable title="Inactive Jobs" columns={jobColumns} data={jobs.filter(j => parseInt(j.extra?.active || '0') === 0)} t={t} />
        </div>
    );
}
