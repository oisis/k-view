export const PvcListSchema = {
    title: 'PersistentVolumeClaims',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'status', label: 'Status', badge: true },
        { key: 'extra.volumeName', label: 'Volume' },
        { key: 'extra.capacity', label: 'Capacity' },
        { key: 'extra.accessModes', label: 'Access Modes' },
        { key: 'extra.storageClass', label: 'Storage Class' },
        { key: 'age', label: 'Created' },
    ],
};
