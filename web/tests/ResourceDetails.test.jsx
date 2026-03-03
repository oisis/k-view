import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import ResourceDetails from '../src/components/ResourceDetails';
import { MemoryRouter, useParams } from 'react-router-dom';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const resourcesPath = path.resolve(__dirname, './resources');
const resourceFiles = fs.readdirSync(resourcesPath).filter(f => f.endsWith('.yaml'));
const resources = resourceFiles.reduce((acc, file) => {
  const kind = path.basename(file, '.yaml');
  const content = fs.readFileSync(path.join(resourcesPath, file), 'utf8');
  acc[kind] = yaml.load(content);
  return acc;
}, {});

// Generate timestamped filename (matched with List test)
const now = new Date();
const timestamp = now.toISOString().replace(/T/, '-').replace(/:/g, '-').slice(2, 16);
const logPath = path.resolve(__dirname, `../../test-${timestamp}.log`);

const logAudit = (kind, type, missing = []) => {
    let entry = `\n## ${kind} (${type})\n`;
    if (missing.length > 0) entry += `### ❌ Missing:\n- ${missing.join('\n- ')}\n`;
    else entry += `✅ 100% Match\n`;
    fs.appendFileSync(logPath, entry);
};

beforeAll(() => {
    if (!fs.existsSync(logPath)) {
        fs.writeFileSync(logPath, '# K-View UI Audit Report\nGenerated on: ' + now.toLocaleString() + '\n');
    }
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: vi.fn(), useSearchParams: () => [new URLSearchParams({ tab: 'overview' }), vi.fn()], useNavigate: () => vi.fn() };
});

vi.mock('../src/SettingsContext', () => ({
  useSettings: () => ({ settings: { resourceRefreshInterval: 0, labelsLimit: 10 } }),
  useTranslation: () => ({ t: (key) => key })
}));

vi.mock('../src/ThemeContext', () => ({
  useTheme: () => ({ icons: { 
    chevron_left: () => null, refresh: () => null, terminal: () => null, list: () => null, 
    search: () => null, chevron_up: () => null, chevron_down: () => null, chevron_right: () => null, 
    alert: () => null, nodes: () => null, about: () => null, activity: () => null, 
    layers: () => null, pod: () => null, cpu: () => null, pvc: () => null, zap: () => null, 
    shield: () => null, lock: () => null, languages: () => null, globe: () => null, 
    user: () => null, clusterrole: () => null, admin_panel: () => null, deployment: () => null, 
    check_circle: () => null, check: () => null, palette: () => null, fingerprint: () => null, 
    trash: () => null, more: () => null, edit: () => null, download: () => null, 
    external_link: () => null, alert_triangle: () => null, close: () => null, sort: () => null, 
    chevrons_left: () => null, chevrons_right: () => null 
  } })
}));

const mockFetch = (data) => {
  global.fetch = vi.fn().mockImplementation(() => Promise.resolve({ ok: true, json: () => Promise.resolve(data) }));
};

const renderWithRouter = (ui) => {
  return render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{ui}</MemoryRouter>);
};

describe('ResourceDetails "Frozen" View Tests - Human YAML', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  Object.entries(resources).forEach(([kind, config]) => {
    it(`audits details for ${kind}`, async () => {
      useParams.mockReturnValue({ kind, namespace: 'default', name: 'resource-1' });
      
      const dummyItem = { 
        metadata: { name: 'dummy' }, name: 'dummy', status: 'Active', 
        extra: { 'owner-uid': 'uid-1', pods: '1/1', restarts: 0, cpu: '10m', ram: '100Mi', 'cluster-ip': '10.0.0.1' }, 
        namespace: 'default', age: '10m' 
      };
      
      mockFetch({
        resource: { name: 'resource-1', namespace: 'default', age: '10m', status: 'Running' },
        metadata: { uid: 'uid-1', name: 'resource-1', namespace: 'default', creationTimestamp: '2024-01-01T00:00:00Z' },
        spec: { containers: [{ name: 'main', image: 'nginx' }], strategy: { type: 'RollingUpdate' }, ports: [{ port: 80 }] },
        status: { phase: 'Running', conditions: [{type: 'Ready', status: 'True', lastProbeTime: '2024-01-01T00:00:00Z', reason: 'Ready'}] },
        extra: { kind: kind.toUpperCase() },
        relatedReplicaSets: [dummyItem], relatedPods: [dummyItem], relatedServices: [dummyItem], 
        relatedEndpoints: { subsets: [{ addresses: [{ ip: '1.1.1.1' }], ports: [{ port: 80 }] }] }, 
        relatedIngresses: [dummyItem], relatedSecrets: [dummyItem], relatedImagePullSecrets: [dummyItem], 
        relatedPvs: [dummyItem], quotas: [dummyItem], limits: [dummyItem]
      });

      renderWithRouter(<ResourceDetails />);

      let missingItems = [];
      try {
        await waitFor(() => {
          missingItems = [];
          
          if (config.detail_tabs) {
              config.detail_tabs.forEach(tab => {
                  const expected = tab.toLowerCase();
                  const found = screen.queryAllByRole('button', { name: (c) => (c || '').toLowerCase().includes(expected) });
                  if (found.length === 0) missingItems.push(`Tab: ${tab}`);
              });
          }

          Object.entries(config).forEach(([title, values]) => {
              if (title === 'General overview' || title === 'detail_tabs' || title === 'Section') return;

              const expectedTitle = title.toLowerCase();
              const titleFound = screen.queryAllByText((c) => {
                  const t = (c || '').toLowerCase();
                  return t === expectedTitle || t === `label_${expectedTitle.replace(/\s+/g, '_')}` || t.includes(expectedTitle);
              });
              if (titleFound.length === 0) missingItems.push(`Section: ${title}`);

              if (Array.isArray(values)) {
                  values.forEach(val => {
                      const expectedVal = val.toLowerCase();
                      const valFound = screen.queryAllByText((c) => {
                          const t = (c || '').toLowerCase();
                          return t === expectedVal || t === expectedVal.replace(/\s+/g, '_') || t === `label_${expectedVal.replace(/\s+/g, '_')}` || t.includes(expectedVal);
                      });
                      if (valFound.length === 0) missingItems.push(`Element: '${val}' in Section: '${title}'`);
                  });
              }
          });

          expect(missingItems, `Missing UI elements for ${kind}`).toEqual([]);
        }, { timeout: 3000 });
      } finally {
        logAudit(kind, 'Detail View', missingItems);
      }
    });
  });
});
