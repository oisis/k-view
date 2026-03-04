export const EndpointsListSchema = {
    title: 'Endpoints',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'extra.ips', label: 'Endpoints' },
        { key: 'age', label: 'Created' },
    ],
};
