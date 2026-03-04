export const EndpointsListSchema = {
    title: 'Endpoints',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.ips', label: 'Endpoints' },
        { key: 'status', label: 'Status', badge: true },
        { key: 'age', label: 'Created' },
    ],
};
