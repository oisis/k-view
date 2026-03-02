export const HpaListSchema = {
    title: 'Horizontal Pod Autoscalers',
    cols: [
        { key: 'name', label: 'label_name', sortable: true },
        { key: 'namespace', label: 'label_namespace', sortable: true },
        { key: 'extra.reference', label: 'Reference' },
        { key: 'extra.target', label: 'Targets' },
        { key: 'extra.min', label: 'Min', align: 'center' },
        { key: 'extra.max', label: 'Max', align: 'center' },
        { key: 'extra.replicas', label: 'Replicas', align: 'center' },
        { key: 'age', label: 'label_age', sortable: true, align: 'right' },
    ]
};
