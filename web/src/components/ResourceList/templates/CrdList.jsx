export const CrdListSchema = {
    title: 'Custom Resource Definitions',
    cols: [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'extra.group', label: 'Group', sortable: true },
        { key: 'extra.fullname', label: 'Full Name', sortable: true },
        { key: 'extra.namespaced', label: 'Namespaced', align: 'center' },
        { key: 'age', label: 'Created', sortable: true, align: 'right' },
    ],
};
