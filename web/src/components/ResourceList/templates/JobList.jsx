export const JobListSchema = {
    title: 'Jobs',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.images', label: 'Images' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'status', label: 'Status', badge: true },
        { key: 'extra.pods', label: 'Pods' },
        { key: 'age', label: 'Created' },
    ],
};
