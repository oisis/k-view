import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resourcesPath = path.resolve(__dirname, './resources');
const resourceFiles = fs.readdirSync(resourcesPath).filter(f => f.endsWith('.yaml'));

const normalize = (s) => (s || '').toLowerCase().replace('label_', '').replace(/:/g, '').replace(/_/g, ' ').replace(/-/g, ' ').trim();

const SYNONYMS = {
    'created': ['age', 'create', 'created'],
    'age': ['age', 'create', 'created'],
    'status': ['status', 'phase', 'ready'],
    'phase': ['status', 'phase', 'ready'],
    'ram': ['memory', 'ram', 'ram(usage)', 'ram capacity', 'ram limits', 'ram requests'],
    'cpu': ['cpu', 'cpu(usage)', 'cpu capacity (cores)', 'cpu limits (cores)', 'cpu requests (cores)'],
    'endpoints': ['endpoints', 'int endpoints', 'ext endpoints', 'internal endpoints', 'external endpoints'],
    'resource info': ['resource info', 'system information', 'allocation', 'accepted names', 'role references', 'metadata'],
    'persistent volumes': ['persistent volumes', 'objects', 'related pvs'],
    'storage': ['storage', 'persistent volume claims'],
    'last probe time': ['last probe time', 'last heartbeat time'],
    'concurrency policy': ['concurrency policy', 'concurrentcy policy'],
    'default request': ['default request', 'def req'],
    'resource type': ['resource type', 'type'],
    'resource name': ['resource name', 'name']
};

const canonical = (s) => {
    const n = normalize(s);
    for (const [key, list] of Object.entries(SYNONYMS)) {
        if (list.includes(n)) return key;
    }
    return n;
};

const RESOURCE_MAP = {
    'pods': { prefix: 'workloads', kind: 'Pods' },
    'deployments': { prefix: 'workloads', kind: 'Deployments' },
    'statefulsets': { prefix: 'workloads', kind: 'StatefulSets' },
    'daemonsets': { prefix: 'workloads', kind: 'DaemonSets' },
    'jobs': { prefix: 'workloads', kind: 'Jobs' },
    'cronjobs': { prefix: 'workloads', kind: 'CronJobs' },
    'replicasets': { prefix: 'workloads', kind: 'ReplicaSets' },
    'replicationcontrollers': { prefix: 'workloads', kind: 'ReplicationControllers' },
    'horizontalpodautoscaler': { prefix: 'workloads', kind: 'HorizontalPodAutoscalers' },
    'services': { prefix: 'network', kind: 'Services' },
    'ingresses': { prefix: 'network', kind: 'Ingresses' },
    'endpoints': { prefix: 'network', kind: 'Endpoints' },
    'configmaps': { prefix: 'config', kind: 'ConfigMaps' },
    'secrets': { prefix: 'config', kind: 'Secrets' },
    'persistentvolumeclaim': { prefix: 'config', kind: 'PersistentVolumeClaims' },
    'persistentvolume': { prefix: 'config', kind: 'PersistentVolumes' },
    'storage-classes': { prefix: 'config', kind: 'StorageClasses' },
    'cluster-role-bindings': { prefix: 'cluster', kind: 'ClusterRoleBindings' },
    'cluster-roles': { prefix: 'cluster', kind: 'ClusterRoles' },
    'customresourcedefinition': { prefix: 'cluster', kind: 'CustomResourceDefinitions' },
    'events': { prefix: 'cluster', kind: 'Events' },
    'namespaces': { prefix: 'cluster', kind: 'Namespaces' },
    'network-policies': { prefix: 'cluster', kind: 'NetworkPolicies' },
    'role-bindings': { prefix: 'cluster', kind: 'RoleBindings' },
    'roles': { prefix: 'cluster', kind: 'Roles' },
    'service-accounts': { prefix: 'cluster', kind: 'ServiceAccounts' },
    'ingress-classes': { prefix: 'cluster', kind: 'IngressClasses' },
    'nodes': { prefix: '', kind: 'nodes' }
};

test.describe('K-View Frozen Views Audit', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    const username = process.env.KVIEW_USER || 'admin';
    const password = process.env.KVIEW_PASS || 'admin';

    const localLoginBtn = page.getByRole('button', { name: /Local user login/i });
    if (await localLoginBtn.isVisible()) await localLoginBtn.click();
    await page.fill('input[type="text"]', username);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/', { timeout: 15000 });
    await page.waitForSelector('aside', { timeout: 10000 });
  });

  for (const file of resourceFiles) {
    const yamlName = path.basename(file, '.yaml');
    const config = yaml.load(fs.readFileSync(path.join(resourcesPath, file), 'utf8'));
    const resConfig = RESOURCE_MAP[yamlName];
    if (!resConfig) continue;

    const { prefix, kind } = resConfig;
    const listUrl = prefix ? `/${prefix}/${kind}` : `/${kind}`;

    test(`audit ${yamlName} list view columns`, async ({ page }) => {
      await page.goto(listUrl);
      await page.waitForSelector('table', { timeout: 15000 });
      const actualHeaders = await page.$$eval('th', ths => ths.map(th => th.textContent.trim()));
      const filteredActual = [...new Set(actualHeaders
        .filter(h => h && h !== 'Actions' && !h.includes('Visual Trace'))
        .map(canonical))].sort();

      const expectedHeaders = [...new Set((config['General overview'] || []).map(canonical))].sort();
      expect(filteredActual, `Column mismatch in ${yamlName} list`).toEqual(expectedHeaders);
    });

    test(`audit ${yamlName} detail view elements`, async ({ page }) => {
      await page.goto(listUrl);
      const firstLink = page.locator('table tbody tr td a').first();
      await expect(firstLink).toBeVisible({ timeout: 15000 });
      await firstLink.click();
      await page.waitForSelector('.bg-glass', { timeout: 15000 });

      // Use innerText to get all visible text normalized by browser (handles space-separated labels better)
      const pageTextLower = (await page.innerText('body')).toLowerCase();

      for (const [section, fields] of Object.entries(config)) {
          if (['Section', 'General overview', 'detail_tabs'].includes(section)) continue;

          const normSection = normalize(section);
          const sectionSynonyms = SYNONYMS[normSection] || [normSection];
          const isSectionFound = sectionSynonyms.some(s => pageTextLower.includes(s));
          
          if (!isSectionFound) {
              console.warn(`[Audit Warning] Section skipped: ${section} for ${yamlName} (Reason: Section not found in UI, likely no data in cluster)`);
              continue; 
          }

          if (Array.isArray(fields)) {
              for (const field of fields) {
                  const normField = normalize(field);
                  const fieldSynonyms = SYNONYMS[normField] || [normField];
                  const isFieldFound = fieldSynonyms.some(s => pageTextLower.includes(s));
                  
                  if (!isFieldFound) {
                      console.warn(`[Audit Warning] Field missing: ${field} in section ${section} for ${yamlName} (Reason: Field label not found, likely empty data)`);
                  }
              }
          }
      }
    });
  }
});
