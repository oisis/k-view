export const SecretListSchema = {
    title: 'Secrets',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'extra.type', label: 'Type', badge: true },
        { key: 'age', label: 'Created' },
    ],
};
