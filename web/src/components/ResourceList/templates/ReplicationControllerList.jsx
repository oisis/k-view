export const ReplicationControllerListSchema = {
    title: 'ReplicationControllers',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.images', label: 'Images' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'extra.ready', label: 'Ready' },
        { key: 'extra.current', label: 'Current' },
        { key: 'extra.desired', label: 'Desired' },
        { key: 'age', label: 'Created' },
    ],
};
