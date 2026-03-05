const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const yamlDir = 'web/tests/resources';
const listTemplatesDir = 'web/src/components/ResourceList/templates';

const normalize = (s) => (s || '').toLowerCase().replace('label_', '').replace(/_/g, ' ').replace(/-/g, ' ').trim();

const mapping = {
    'pods': 'PodList.jsx',
    'deployments': 'DeploymentList.jsx',
    'configmaps': 'ConfigMapList.jsx',
    'secrets': 'SecretList.jsx',
    'persistentvolume': 'PvList.jsx',
    'persistentvolumeclaim': 'PvcList.jsx',
    'nodes': 'NodeList.jsx',
    'namespaces': 'NamespaceList.jsx',
    'services': 'ServiceList.jsx',
    'ingresses': 'IngressList.jsx',
    'cronjobs': 'CronJobList.jsx',
    'daemonsets': 'DaemonSetList.jsx',
    'statefulsets': 'StatefulSetList.jsx',
    'jobs': 'JobList.jsx',
    'replicasets': 'ReplicaSetList.jsx',
    'replicationcontrollers': 'ReplicationControllerList.jsx',
    'horizontalpodautoscaler': 'HpaList.js',
    'ingress-classes': 'IngressClassList.jsx',
    'endpoints': 'EndpointsList.jsx',
    'cluster-role-bindings': 'ClusterRbacList.jsx',
    'cluster-roles': 'ClusterRbacList.jsx',
    'role-bindings': 'RbacList.jsx',
    'roles': 'RbacList.jsx',
    'service-accounts': 'ServiceAccountList.jsx',
    'customresourcedefinition': 'CrdList.jsx',
    'network-policies': 'NetworkPolicyList.jsx'
};

console.log('# K-View Compatibility Report: YAML vs Code\n');

Object.entries(mapping).forEach(([yamlName, fileName]) => {
    const yamlPath = path.join(yamlDir, yamlName + '.yaml');
    const jsPath = path.join(listTemplatesDir, fileName);

    if (!fs.existsSync(yamlPath)) {
        return;
    }
    if (!fs.existsSync(jsPath)) {
        console.log(`## ${yamlName}: ❌ Brak pliku JS: ${fileName}\n`);
        return;
    }

    const yamlContent = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
    const jsContent = fs.readFileSync(jsPath, 'utf8');

    const expectedCols = (yamlContent['General overview'] || []).map(normalize);
    
    const labelRegex = /label: ['"]([^'"]+)['"]/g;
    let match;
    const actualCols = [];
    while ((match = labelRegex.exec(jsContent)) !== null) {
        actualCols.push(normalize(match[1]));
    }

    const missing = expectedCols.filter(e => !actualCols.includes(e));
    const extra = actualCols.filter(a => !expectedCols.includes(a));

    if (missing.length > 0 || extra.length > 0) {
        console.log(`## ${yamlName}`);
        if (missing.length > 0) console.log(`- ❌ Brakuje w kodzie (UI): ${missing.join(', ')}`);
        if (extra.length > 0) console.log(`- ⚠️ Nadmiarowe w kodzie (UI): ${extra.join(', ')}`);
        console.log('');
    } else {
        console.log(`## ${yamlName}: ✅ Zgodność 1:1 (Lista)\n`);
    }
});
