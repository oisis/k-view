export const IngressListSchema = {
    title: 'Ingresses',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'extra.address', label: 'Endpoints' },
        { key: 'extra.hosts', label: 'Hosts' },
        { key: 'age', label: 'Created' },
    ],
};
