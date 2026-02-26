export const PvcListSchema = {
    title: 'PersistentVolumeClaims',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'status', label: 'Status', badge: true },
        { key: 'extra.volume', label: 'Volume' },
        { key: 'extra.capacity', label: 'Capacity' },
        { key: 'extra.access-modes', label: 'Access Modes' },
        { key: 'extra.storage-class', label: 'Storage Class' },
        { key: 'age', label: 'Created' },
    ],
};
