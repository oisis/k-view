import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';
import JobsTable from '../JobsTable';

export default function CronJobOverview({ data, metadata, spec, status, relatedJobs, t, icons }) {
    return (
        <>
            <DetailSection title={t('resource_info')}>
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <DetailRow label="Schedule">
                            <span className="font-mono text-info font-bold">{spec.schedule}</span>
                        </DetailRow>
                        <DetailRow label="Suspend">
                            <span className={`font-bold ${spec.suspend ? 'text-warning' : 'text-success'}`}>{String(spec.suspend)}</span>
                        </DetailRow>
                        <DetailRow label="Last Schedule">
                            <span className="text-primary">{status.lastScheduleTime || '—'}</span>
                        </DetailRow>
                    </tbody>
                </table>
            </DetailSection>

            {relatedJobs && <JobsTable jobs={relatedJobs} t={t} icons={icons} title="Recent Jobs" />}
        </>
    );
}
