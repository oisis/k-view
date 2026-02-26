export const PodListSchema = {
    title: 'Pods',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.images', label: 'Images' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'extra.node', label: 'Node' },
        { key: 'status', label: 'Status', badge: true },
        { key: 'extra.restarts', label: 'Restarts' },
        { key: 'extra.cpu', label: 'CPU usage' },
        { key: 'extra.ram', label: 'RAM usage' },
        { key: 'age', label: 'Created' },
    ],
};
