export const CronJobListSchema = {
    title: 'CronJobs',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.images', label: 'Images' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'extra.schedule', label: 'Schedule' },
        { key: 'extra.suspend', label: 'Suspend' },
        { key: 'extra.active', label: 'Active' },
        { key: 'extra.last-schedule', label: 'Last run' },
        { key: 'age', label: 'Age' },
    ],
};
