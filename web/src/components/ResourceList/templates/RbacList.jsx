export const RbacListSchema = {
    title: 'RBAC',
    cols: [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'namespace', label: 'Namespace', sortable: true },
        { key: 'age', label: 'Created', sortable: true, align: 'right' },
    ],
};
// This schema is used for Roles, RoleBindings
