export const PvListSchema = {
    title: 'Persistent Volumes',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'extra.capacity', label: 'Capacity' },
        { key: 'extra.access-modes', label: 'access modes' },
        { key: 'extra.reclaim-policy', label: 'reclaim policy' },
        { key: 'status', label: 'Status', badge: true },
        { key: 'extra.claim', label: 'Claim' },
        { key: 'extra.storage-class', label: 'storage class' },
        { key: 'extra.reason', label: 'Reason' },
        { key: 'age', label: 'Created' },
    ],
};
