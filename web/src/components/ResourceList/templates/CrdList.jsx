export const CrdListSchema = {
    title: 'Custom Resource Definitions',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'extra.group', label: 'Group' },
        { key: 'extra.version', label: 'Version' },
        { key: 'extra.scope', label: 'Scope' },
        { key: 'status', label: 'Status', badge: true },
        { key: 'age', label: 'Age' },
    ],
};
