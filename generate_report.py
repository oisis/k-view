import os
import yaml
import re

yaml_dir = 'web/tests/resources'
js_dir = 'web/src/components/ResourceList/templates'

mapping = {
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
}

def normalize(s):
    if not s: return ''
    # Map synonyms to match YAML vs Code
    n = s.lower().replace('label_', '').replace('_', ' ').replace('-', ' ').strip()
    if n in ['age', 'create', 'created']: return 'age/created'
    if n in ['cpu', 'cpu(usage)']: return 'cpu'
    if n in ['ram', 'memory', 'ram(usage)']: return 'ram'
    return n

report = ['# K-View Compatibility Report: YAML vs Code\n', 'Generated on: 2026-03-05\n']

for yaml_name, js_name in sorted(mapping.items()):
    yaml_path = os.path.join(yaml_dir, yaml_name + '.yaml')
    js_path = os.path.join(js_dir, js_name)
    
    if not os.path.exists(yaml_path):
        continue
        
    report.append(f'## {yaml_name.upper()}')
    
    # 1. Compare List View (General overview)
    with open(yaml_path, 'r') as f:
        config = yaml.safe_load(f)
    
    expected = config.get('General overview', [])
    norm_expected = [normalize(c) for c in expected]
    
    if os.path.exists(js_path):
        with open(js_path, 'r') as f:
            js_content = f.read()
        # Find labels in cols array: label: 'Name'
        actual = re.findall(r"label: ['\"]([^'\"]+)['\"]", js_content)
        norm_actual = [normalize(a) for a in actual]
        
        missing = [e for e in expected if normalize(e) not in norm_actual]
        extra = [a for a in actual if normalize(a) not in norm_expected]
        
        if not missing and not extra:
            report.append('✅ **List View:** 100% Zgodności')
        else:
            if missing: report.append(f'- ❌ **Brakuje w UI:** {", ".join(missing)}')
            if extra: report.append(f'- ⚠️ **Nadmiarowe w UI:** {", ".join(extra)}')
    else:
        report.append(f'- ❌ Brak pliku schematu: `{js_name}`')
    
    # 2. Section Analysis (Briefly)
    expected_sections = [k for k in config.keys() if k not in ['Section', 'General overview', 'detail_tabs']]
    report.append(f'- **Sekcje w YAML:** {", ".join(expected_sections)}')
    report.append('\n---\n')

with open('raport-yaml-js.md', 'w') as f:
    f.write('\n'.join(report))

print('Report generated successfully: raport-yaml-js.md')
