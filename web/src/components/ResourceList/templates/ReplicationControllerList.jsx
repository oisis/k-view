export const ReplicationControllerListSchema = {
    title: 'ReplicationControllers',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.images', label: 'Images' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'extra.readyReplicas', label: 'Ready' },
        { key: 'extra.currentReplicas', label: 'Current' },
        { key: 'extra.replicas', label: 'Desired' },
        { key: 'age', label: 'Created' },
    ],
};
