export const NetworkPolicyListSchema = {
    title: 'NetworkPolicies',
    cols: [
        { key: 'name', label: 'Name' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'extra.labels', label: 'Labels' },
        { key: 'age', label: 'Created' },
    ],
};
