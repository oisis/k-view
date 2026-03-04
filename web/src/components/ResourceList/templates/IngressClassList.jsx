export const IngressClassListSchema = {
    title: 'IngressClasses',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'extra.controller', label: 'Controller' },
        { key: 'age', label: 'Created' },
    ],
};
