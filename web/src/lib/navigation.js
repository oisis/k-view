export const NAVIGATION_CONFIG = [
    {
        id: 'workloads',
        label: 'workloads',
        items: [
            { kind: 'CronJobs', iconKey: 'cronjob' },
            { kind: 'DaemonSets', iconKey: 'daemonset' },
            { kind: 'Deployments', iconKey: 'deployment' },
            { kind: 'Jobs', iconKey: 'job' },
            { kind: 'Pods', iconKey: 'pod' },
            { kind: 'ReplicaSets', iconKey: 'replicaset' },
            { kind: 'ReplicationControllers', iconKey: 'replicationcontroller' },
            { kind: 'StatefulSets', iconKey: 'statefulset' },
            { kind: 'HorizontalPodAutoscalers', iconKey: 'hpa' },
        ]
    },
    {
        id: 'network',
        label: 'Services',
        items: [
            { kind: 'IngressClasses', iconKey: 'ingressclass', category: 'cluster' },
            { kind: 'Ingresses', iconKey: 'ingress', category: 'network' },
            { kind: 'Services', iconKey: 'service', category: 'network' },
            { kind: 'Endpoints', iconKey: 'network', category: 'network' },
        ]
    },
    {
        id: 'config',
        label: 'config',
        items: [
            { kind: 'ConfigMaps', iconKey: 'configmap' },
            { kind: 'PersistentVolumeClaims', iconKey: 'pvc' },
            { kind: 'Secrets', iconKey: 'secret' },
            { kind: 'StorageClasses', iconKey: 'storageclass' },
        ]
    },
    {
        id: 'cluster',
        label: 'cluster',
        items: [
            { kind: 'ClusterRoleBindings', iconKey: 'clusterrolebinding' },
            { kind: 'ClusterRoles', iconKey: 'clusterrole' },
            { kind: 'CustomResourceDefinitions', iconKey: 'crd' },
            { kind: 'Events', iconKey: 'event' },
            { kind: 'Namespaces', iconKey: 'namespace' },
            { kind: 'NetworkPolicies', iconKey: 'networkpolicy' },
            { kind: 'Nodes', iconKey: 'nodes' },
            { kind: 'PersistentVolumes', iconKey: 'pv' },
            { kind: 'RoleBindings', iconKey: 'rolebinding' },
            { kind: 'Roles', iconKey: 'role' },
            { kind: 'ServiceAccounts', iconKey: 'serviceaccount' },
        ]
    }
];

export const TOOLS_CONFIG = [
    { id: 'access', kind: 'AdminPanel', iconKey: 'admin_panel', label: 'admin_panel', href: '/access', adminOnly: true },
    { id: 'about', kind: 'About', iconKey: 'about', label: 'about', href: '/about' },
    { id: 'console', kind: 'Console', iconKey: 'console', label: 'console', href: '/console' },
    { id: 'settings', kind: 'Settings', iconKey: 'settings', label: 'settings', href: '/settings' },
];
