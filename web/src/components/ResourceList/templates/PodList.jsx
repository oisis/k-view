export const PodListSchema = {
    title: 'Pods',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'status', label: 'Status', badge: true },
        { key: 'extra.restarts', label: 'Restarts' },
        { key: 'extra.cpu', label: 'CPU(usage)' },
        { key: 'extra.memory', label: 'RAM(usage)' },
        { key: 'age', label: 'Created' },
    ],
};
