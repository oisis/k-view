export const NamespaceListSchema = {
    title: 'Namespaces',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'status', label: 'Phase', badge: true },
        { key: 'age', label: 'Created' },
    ],
};
