export const RbacListSchema = {
    title: 'RBAC',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'extra.annotations', label: 'Annotations' },
        { key: 'age', label: 'Created' },
    ],
};
// This schema is used for Roles, RoleBindings
