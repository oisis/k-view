export const HpaListSchema = {
    title: 'HorizontalPodAutoscalers',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.reference', label: 'Reference' },
        { key: 'extra.targets', label: 'Targets' },
        { key: 'extra.minReplicas', label: 'Min' },
        { key: 'extra.maxReplicas', label: 'Max' },
        { key: 'extra.currentReplicas', label: 'Replicas' },
        { key: 'age', label: 'Age' },
    ],
};
