export const ServiceListSchema = {
    title: 'Services',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'status', label: 'Type', badge: true },
        { key: 'extra.cluster-ip', label: 'cluster ip' },
        { key: 'extra.endpoints', label: 'int endpoints' },
        { key: 'extra.external', label: 'ext endpoints' },
        { key: 'age', label: 'Created' },
    ],
};
