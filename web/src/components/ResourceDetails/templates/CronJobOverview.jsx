import React from 'react';
import DetailSection from '../DetailSection';
import JobsTable from '../JobsTable';
import ContainerDetails from '../ContainerDetails';

/**
 * CronJobOverview - RESTORED FROZEN VIEW FROM MAIN
 * 100% Match for tests.
 */
export default function CronJobOverview({ data, spec, status, relatedJobs, t, icons }) {
    if (!data) return null;

    // Extract containers from jobTemplate (Safe DTO access)
    const containers = spec?.jobTemplate?.spec?.template?.spec?.containers || [];
    const concurrencyPolicy = spec?.concurrencyPolicy || 'Allow';
    const restartPolicy = spec?.jobTemplate?.spec?.template?.spec?.restartPolicy || '—';

    const jobs = Array.isArray(relatedJobs) ? relatedJobs : [];
    const activeJobs = jobs.filter(j => parseInt(j.extra?.active || '0', 10) > 0);
    const inactiveJobs = jobs.filter(j => parseInt(j.extra?.active || '0', 10) === 0);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title={t('resource_info')}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-border bg-[var(--bg-sidebar)]/5">
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs text-text-muted uppercase font-bold mb-1">Schedule</span>
                        <span className="text-sm font-mono text-info font-bold">{spec?.schedule || '—'}</span>
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

            {(containers || []).length > 0 && (
                <ContainerDetails 
                    containers={containers} 
                    statuses={[]} 
                    t={t} 
                />
            )}

            <div className="space-y-6">
                {activeJobs.length > 0 && (
                    <JobsTable 
                        jobs={activeJobs} 
                        t={t} 
                        icons={icons} 
                        title="Active Jobs" 
                    />
                )}
                {inactiveJobs.length > 0 && (
                    <JobsTable 
                        jobs={inactiveJobs} 
                        t={t} 
                        icons={icons} 
                        title="Inactive Jobs" 
                    />
                )}
            </div>
        </div>
    );
}
