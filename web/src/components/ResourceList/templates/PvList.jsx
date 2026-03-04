export const PvListSchema = {
    title: 'PersistentVolumes',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'extra.capacity', label: 'Capacity' },
        { key: 'extra.accessModes', label: 'Access Modes' },
        { key: 'extra.reclaimPolicy', label: 'Reclaim Policy' },
        { key: 'status', label: 'Status', badge: true },
        { key: 'extra.claimRef', label: 'Claim' },
        { key: 'extra.storageClass', label: 'Storage Class' },
        { key: 'extra.reason', label: 'Reason' },
        { key: 'age', label: 'Created' },
    ],
};
