export const StatefulSetListSchema = {
    title: 'StatefulSets',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.images', label: 'Images' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'extra.annotations', label: 'Annotations' },
        { key: 'extra.ready', label: 'Ready' },
        { key: 'extra.replicas', label: 'Replicas' },
        { key: 'age', label: 'Created' },
    ],
};
