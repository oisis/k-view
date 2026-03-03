import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    useSearchParams: () => [new URLSearchParams({ tab: 'overview' }), vi.fn()],
    useNavigate: () => vi.fn()
  };
});

vi.mock('../src/SettingsContext', () => ({
  useSettings: () => ({
    settings: { resourceRefreshInterval: 0, labelsLimit: 10 }
  }),
  useTranslation: () => ({
    t: (key) => key
  })
}));

vi.mock('../src/ThemeContext', () => ({
  useTheme: () => ({
    icons: {
      chevron_left: () => null,
      refresh: () => null,
      terminal: () => null,
      list: () => null,
      search: () => null,
      chevron_up: () => null,
      chevron_down: () => null,
      chevron_right: () => null,
      alert: () => null,
      nodes: () => null,
      about: () => null,
      activity: () => null,
      layers: () => null,
      pod: () => null,
      cpu: () => null,
      pvc: () => null,
      zap: () => null,
      shield: () => null,
      lock: () => null,
      languages: () => null,
      globe: () => null,
      user: () => null,
      clusterrole: () => null,
      admin_panel: () => null,
      deployment: () => null,
      check_circle: () => null,
      check: () => null,
      palette: () => null,
      fingerprint: () => null,
      trash: () => null,
      more: () => null,
      edit: () => null,
      download: () => null,
      external_link: () => null,
      alert_triangle: () => null,
      close: () => null,
      sort: () => null,
      chevrons_left: () => null,
      chevrons_right: () => null,
    }
  })
}));

const mockFetch = (data) => {
  global.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    })
  );
};

const renderWithRouter = (ui) => {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {ui}
    </MemoryRouter>
  );
};

describe('ResourceDetails "Frozen" View Tests - Human YAML', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  Object.entries(resources).forEach(([kind, config]) => {
    it(`enforces structural integrity for ${kind}`, async () => {
      useParams.mockReturnValue({ kind, namespace: 'default', name: 'resource-1' });
      
      const dummyItem = { 
        metadata: { name: 'dummy' }, 
        name: 'dummy', 
        status: 'Active', 
        extra: { 'owner-uid': 'uid-1', pods: '1/1', restarts: 0, cpu: '10m', ram: '100Mi', 'cluster-ip': '10.0.0.1' }, 
        namespace: 'default', 
        age: '10m' 
      };
      
      mockFetch({
        resource: { name: 'resource-1', namespace: 'default', age: '10m', status: 'Running' },
        metadata: { uid: 'uid-1', name: 'resource-1', namespace: 'default', creationTimestamp: '2024-01-01T00:00:00Z' },
        spec: { 
            containers: [{ name: 'main', image: 'nginx' }], 
            template: { spec: { containers: [{ name: 'main', image: 'nginx' }] } },
            jobTemplate: { spec: { template: { spec: { containers: [{ name: 'main', image: 'nginx' }] } } } },
            strategy: { type: 'RollingUpdate' },
            provisioner: 'k-view',
            ports: [{ port: 80, protocol: 'TCP' }]
        },
        status: { 
            phase: 'Running', 
            conditions: [{type: 'Ready', status: 'True', lastProbeTime: '2024-01-01T00:00:00Z', lastTransitionTime: '2024-01-01T00:00:00Z', reason: 'Ready', message: 'Stable'}]
        },
        extra: { kind: kind.toUpperCase() },
        relatedReplicaSets: [dummyItem], 
        relatedPods: [dummyItem], 
        relatedServices: [dummyItem], 
        relatedJobs: [dummyItem],
        relatedEndpoints: { subsets: [{ addresses: [{ ip: '1.1.1.1' }], ports: [{ port: 80 }] }] }, 
        relatedIngresses: [dummyItem], 
        relatedSecrets: [dummyItem], 
        relatedImagePullSecrets: [dummyItem], 
        relatedPvs: [dummyItem],
        quotas: [dummyItem],
        limits: [dummyItem]
      });

      renderWithRouter(<ResourceDetails />);

      await waitFor(() => {
        let missingItems = [];

        Object.entries(config).forEach(([title, values]) => {
            if (title === 'General overview' || title === 'detail_tabs') return;

            // 1. Find the Section/Table Title
            const expectedTitle = title.toLowerCase();
            const titleFound = screen.queryAllByText((content) => {
                const text = (content || '').toLowerCase();
                return text === expectedTitle || 
                       text === `label_${expectedTitle.replace(/\s+/g, '_')}` ||
                       text === expectedTitle.replace(/\s+/g, '_') ||
                       text.includes(expectedTitle);
            });
            if (titleFound.length === 0) missingItems.push(`Section Title: '${title}'`);

            // 2. Verify fields or columns inside this section
            if (Array.isArray(values)) {
                values.forEach(val => {
                    const expectedVal = val.toLowerCase();
                    const valFound = screen.queryAllByText((content) => {
                        const text = (content || '').toLowerCase();
                        // Match literal, snake_case, or label_ prefix
                        return text === expectedVal || 
                               text === expectedVal.replace(/\s+/g, '_') ||
                               text === `label_${expectedVal.replace(/\s+/g, '_')}` ||
                               text.includes(expectedVal);
                    });
                    if (valFound.length === 0) missingItems.push(`Element: '${val}' in Section: '${title}'`);
                });
            }
        });

        expect(missingItems, `Missing UI elements for ${kind}`).toEqual([]);
      }, { timeout: 3000 });
    });
  });
});
