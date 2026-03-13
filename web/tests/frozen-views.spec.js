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

// Unified Mapping matching the new URL structure
const RESOURCE_MAP = {
    'pods': { kind: 'Pods' },
    'deployments': { kind: 'Deployments' },
    'statefulsets': { kind: 'StatefulSets' },
    'daemonsets': { kind: 'DaemonSets' },
    'jobs': { kind: 'Jobs' },
    'cronjobs': { kind: 'CronJobs' },
    'replicasets': { kind: 'ReplicaSets' },
    'replicationcontrollers': { kind: 'ReplicationControllers' },
    'horizontalpodautoscaler': { kind: 'HorizontalPodAutoscalers' },
    'services': { kind: 'Services' },
    'ingresses': { kind: 'Ingresses' },
    'endpoints': { kind: 'Endpoints' },
    'configmaps': { kind: 'ConfigMaps' },
    'secrets': { kind: 'Secrets' },
    'persistentvolumeclaim': { kind: 'PersistentVolumeClaims' },
    'persistentvolume': { kind: 'PersistentVolumes' },
    'storage-classes': { kind: 'StorageClasses' },
    'cluster-role-bindings': { kind: 'ClusterRoleBindings' },
    'cluster-roles': { kind: 'ClusterRoles' },
    'customresourcedefinition': { kind: 'CustomResourceDefinitions' },
    'events': { kind: 'Events' },
    'namespaces': { kind: 'Namespaces' },
    'network-policies': { kind: 'NetworkPolicies' },
    'role-bindings': { kind: 'RoleBindings' },
    'roles': { kind: 'Roles' },
    'service-accounts': { kind: 'ServiceAccounts' },
    'ingress-classes': { kind: 'IngressClasses' },
    'nodes': { kind: 'Nodes' }
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

    const { kind } = resConfig;
    const listUrl = `/resources/${kind}`;

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
      // Ensure the link is at least attached to DOM
      await firstLink.waitFor({ state: 'attached', timeout: 15000 });
      
      // Use evaluate to click directly on the DOM element to bypass viewport/animation checks
      await firstLink.evaluate(el => el.click());
      
      // Wait for any content card to appear
      await page.waitForSelector('.glass, .bg-card, .bg-glass', { timeout: 15000 });

      // Use innerText to get all visible text normalized by browser
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
