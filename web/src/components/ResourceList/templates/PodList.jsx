export const PodListSchema = {
    title: 'Pods',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.images', label: 'Images' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'status', label: 'Pod status', badge: true },
        { key: 'extra.restarts', label: 'Restarts' },
        { key: 'age', label: 'Created' },
    ],
};
