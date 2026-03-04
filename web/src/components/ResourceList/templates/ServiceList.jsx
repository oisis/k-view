export const ServiceListSchema = {
    title: 'Services',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'extra.type', label: 'Type', badge: true },
        { key: 'extra.clusterIP', label: 'Cluster Ip' },
        { key: 'extra.endpoints', label: 'Internal Endpoints' },
        { key: 'extra.external', label: 'External Endpoints' },
        { key: 'age', label: 'Created' },
    ],
};
