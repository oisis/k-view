export const DeploymentListSchema = {
    title: 'Deployments',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.images', label: 'Images' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'extra.readyReplicas', label: 'Pods' },
        { key: 'age', label: 'Created' },
    ],
};
