export const PvListSchema = {
    title: 'Persistent Volumes',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'extra.capacity', label: 'Capacity' },
        { key: 'extra.access-modes', label: 'Access Modes' },
        { key: 'extra.reclaim-policy', label: 'Reclaim Policy' },
        { key: 'status', label: 'Status', badge: true },
        { key: 'extra.claim', label: 'Claim' },
        { key: 'extra.storage-class', label: 'Storage Class' },
        { key: 'extra.reason', label: 'Reason' },
        { key: 'age', label: 'Created' },
    ],
};
