export const NodeListSchema = {
    title: 'Nodes',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'status', label: 'Status', badge: true },
        { key: 'age', label: 'Created' },
    ],
};
