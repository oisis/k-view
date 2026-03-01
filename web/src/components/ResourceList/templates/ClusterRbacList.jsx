export const ClusterRbacListSchema = {
    title: 'Cluster RBAC',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'extra.annotations', label: 'Annotations' },
        { key: 'age', label: 'Created' },
    ],
};
