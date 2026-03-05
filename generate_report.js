const fs = require('fs');
const path = require('path');
// Use the js-yaml from the web/node_modules directory
const yaml = require('./web/node_modules/js-yaml');

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
    'replicationcontrollers': 'ReplicaSetList.jsx',
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

let report = '# K-View Compatibility Report: YAML vs Code\n\nGenerated on: 2026-03-05\n\n';

Object.entries(mapping).sort().forEach(([yamlName, fileName]) => {
    const yamlPath = path.join(yamlDir, yamlName + '.yaml');
    const jsPath = path.join(listTemplatesDir, fileName);

    if (!fs.existsSync(yamlPath)) return;

    report += `## ${yamlName.toUpperCase()}\n`;

    const yamlContent = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
    const expected = (yamlContent['General overview'] || []);
    const normExpected = expected.map(normalize);

    if (fs.existsSync(jsPath)) {
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        const labelRegex = /label: ['"]([^'"]+)['"]/g;
        let match;
        const actual = [];
        while ((match = labelRegex.exec(jsContent)) !== null) {
            actual.push(match[1]);
        }
        const normActual = actual.map(normalize);

        const missing = expected.filter(e => !normActual.includes(normalize(e)));
        const extra = actual.filter(a => !normExpected.includes(normalize(a)));

        if (missing.length === 0 && extra.length === 0) {
            report += '✅ **List View:** 100% Zgodności\n';
        } else {
            if (missing.length > 0) report += `- ❌ **Brakuje w UI:** ${missing.join(', ')}\n`;
            if (extra.length > 0) report += `- ⚠️ **Nadmiarowe w UI:** ${extra.join(', ')}\n`;
        }
    } else {
        report += `- ❌ Brak pliku schematu: \`${fileName}\`\n`;
    }

    const expectedSections = Object.keys(yamlContent).filter(k => !['Section', 'General overview', 'detail_tabs'].includes(k));
    report += `- **Sekcje w YAML:** ${expectedSections.join(', ')}\n\n---\n\n`;
});

fs.writeFileSync('raport-yaml-js.md', report);
console.log('Report generated successfully: raport-yaml-js.md');
