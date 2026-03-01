import React from 'react';
import DetailSection from '../DetailSection';
import JobsTable from '../JobsTable';

export default function CronJobOverview({ data, metadata, spec, status, relatedJobs, t, icons }) {
    return (
        <>
            <DetailSection title={t('resource_info')}>
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border bg-[var(--bg-sidebar)]/5">
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs text-text-muted uppercase font-bold mb-1">Schedule</span>
                        <span className="text-sm font-mono text-info font-bold">{spec.schedule}</span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs text-text-muted uppercase font-bold mb-1">Suspend</span>
                        <span className={`text-sm font-bold ${spec.suspend ? 'text-warning' : 'text-success'}`}>
                            {spec.suspend ? 'True' : 'False'}
                        </span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs text-text-muted uppercase font-bold mb-1">Last Schedule</span>
                        <span className="text-sm text-primary font-bold">{status.lastScheduleTime || '—'}</span>
                    </div>
                </div>
            </DetailSection>

            {relatedJobs && <JobsTable jobs={relatedJobs} t={t} icons={icons} title="Recent Jobs" />}
        </>
    );
}
