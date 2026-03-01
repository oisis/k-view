export const IngressClassListSchema = {
    title: 'Ingress Classes',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'extra.controller', label: 'Controller' },
        { key: 'age', label: 'Created' },
    ],
};
