export const CronJobListSchema = {
    title: 'CronJobs',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.images', label: 'Images' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'extra.schedule', label: 'Schedule' },
        { key: 'extra.suspend', label: 'Suspend' },
        { key: 'extra.activeJobsCount', label: 'Active' },
        { key: 'extra.lastScheduleTime', label: 'Last Schedule' },
        { key: 'age', label: 'Created' },
    ],
};
