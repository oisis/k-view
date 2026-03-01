import React from 'react';
import DetailSection from '../DetailSection';
import JobsTable from '../JobsTable';
import ContainerDetails from '../ContainerDetails';

export default function CronJobOverview({ data, metadata, spec, status, relatedJobs, t, icons }) {
    // Extract containers from jobTemplate
    const containers = spec?.jobTemplate?.spec?.template?.spec?.containers || [];
    const concurrencyPolicy = spec?.concurrencyPolicy || 'Allow';
    const restartPolicy = spec?.jobTemplate?.spec?.template?.spec?.restartPolicy || '—';

    return (
        <>
            <DetailSection title={t('resource_info')}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-border bg-[var(--bg-sidebar)]/5">
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs text-text-muted uppercase font-bold mb-1">Schedule</span>
                        <span className="text-sm font-mono text-info font-bold">{spec?.schedule}</span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs text-text-muted uppercase font-bold mb-1">Suspend</span>
                        <span className={`text-sm font-bold ${spec?.suspend ? 'text-warning' : 'text-success'}`}>
                            {spec?.suspend ? 'True' : 'False'}
                        </span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs text-text-muted uppercase font-bold mb-1">Concurrency</span>
                        <span className="text-sm text-primary font-bold">{concurrencyPolicy}</span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs text-text-muted uppercase font-bold mb-1">Restart Policy</span>
                        <span className="text-sm text-primary font-bold">{restartPolicy}</span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs text-text-muted uppercase font-bold mb-1">Last Schedule</span>
                        <span className="text-sm text-primary font-bold">{status?.lastScheduleTime || '—'}</span>
                    </div>
                </div>
            </DetailSection>

            {containers.length > 0 && (
                <ContainerDetails 
                    containers={containers} 
                    statuses={[]} 
                    t={t} 
                />
            )}

            {relatedJobs && relatedJobs.length > 0 && (
                <JobsTable jobs={relatedJobs} t={t} icons={icons} title="Recent Jobs" />
            )}
        </>
    );
}
