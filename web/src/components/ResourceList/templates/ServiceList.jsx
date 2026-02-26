export const ServiceListSchema = {
    title: 'Services',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'status', label: 'Type', badge: true },
        { key: 'extra.cluster-ip', label: 'Cluster IP' },
        { key: 'extra.endpoints', label: 'Int Endpoints' },
        { key: 'extra.external', label: 'Ext Endpoints' },
        { key: 'age', label: 'Created' },
    ],
};
