export const IngressListSchema = {
    title: 'Ingresses',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'extra.hosts', label: 'Hosts' },
        { key: 'extra.address', label: 'Address' },
        { key: 'extra.endpoints', label: 'Endpoints' },
        { key: 'age', label: 'Created' },
    ],
};
