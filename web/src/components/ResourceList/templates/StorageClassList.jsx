export const StorageClassListSchema = {
    title: 'StorageClasses',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'extra.provisioner', label: 'Provisioner' },
        { key: 'extra.parameters', label: 'Parameters' },
        { key: 'age', label: 'Created' },
    ],
};
