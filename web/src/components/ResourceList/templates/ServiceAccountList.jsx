export const ServiceAccountListSchema = {
    title: 'Service Accounts',
    cols: [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'namespace', label: 'Namespace', sortable: true },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'age', label: 'Created', sortable: true, align: 'right' },
    ],
};
