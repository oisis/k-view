import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResourceDetails from '../src/components/ResourceDetails';
import { MemoryRouter, useParams } from 'react-router-dom';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Load all resource definitions from YAML files
const resourcesPath = path.resolve(__dirname, './resources');
const resourceFiles = fs.readdirSync(resourcesPath).filter(f => f.endsWith('.yaml'));
const resources = resourceFiles.reduce((acc, file) => {
  const kind = path.basename(file, '.yaml');
  const content = fs.readFileSync(path.join(resourcesPath, file), 'utf8');
  acc[kind] = yaml.load(content);
  return acc;
}, {});

// Mocking dependencies
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

describe('ResourceDetails "Frozen" View Tests - YAML Driven', () => {
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
            rules: [{ verbs: ['get'], resources: ['pods'] }],
            provisioner: 'k-view',
            nodeName: 'node-1',
            metrics: [{ type: 'Resource', resource: { name: 'cpu', target: { averageUtilization: 50 } } }],
            schedule: '*/5 * * * *',
            suspend: false,
            controller: 'k-view-controller',
            ports: [{ port: 80, protocol: 'TCP' }]
        },
        status: { 
            phase: 'Running', 
            conditions: [{type: 'Ready', status: 'True', lastProbeTime: '2024-01-01T00:00:00Z', lastTransitionTime: '2024-01-01T00:00:00Z', reason: 'Ready', message: 'Stable'}], 
            numberReady: 1, 
            desiredNumberScheduled: 1, 
            currentReplicas: 1, 
            replicas: 1, 
            updatedReplicas: 1, 
            availableReplicas: 1,
            nodeInfo: { machineID: 'm1', kernelVersion: 'v1', containerRuntimeVersion: 'docker' }
        },
        allocation: { 
            cpu: { requests: '1', capacity: '2' }, 
            memory: { requests: '1Gi', capacity: '2Gi' }, 
            pods: { allocation: 1, capacity: 10 } 
        },
        extra: { kind: kind.toUpperCase(), group: 'example.com', version: 'v1', 'pod-cidr': '10.0.0.0/24' },
        relatedReplicaSets: [dummyItem], 
        relatedPods: [dummyItem], 
        relatedServices: [dummyItem], 
        relatedJobs: [dummyItem],
        relatedEndpoints: { subsets: [{ addresses: [{ ip: '1.1.1.1', nodeName: 'node-1' }], ports: [{ port: 80, protocol: 'TCP' }] }] }, 
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

        // Dynamic detection of sections and tables based on YAML keys
        Object.entries(config).forEach(([key, values]) => {
            if (key === 'general_overview' || key === 'detail_tabs') return;

            if (key === 'metadata_fields') {
                // Assert Metadata Grid Fields
                values.forEach(field => {
                    const expected = field.toLowerCase();
                    const found = screen.queryAllByText((content) => {
                        const text = (content || '').toLowerCase();
                        return text === expected || text === `label_${expected}` || text === field;
                    });
                    if (found.length === 0) missingItems.push(`Metadata Field: ${field}`);
                });
                return;
            }

            // Otherwise, it's a Section Title or Table Title
            const tTitle = key.toLowerCase();
            const titleFound = screen.queryAllByText((content) => {
                const text = (content || '').toLowerCase();
                return text === tTitle || text === `label_${tTitle}` || text.includes(tTitle);
            });
            if (titleFound.length === 0) missingItems.push(`Section/Table Title: ${key}`);

            // If it's a table (value is an array of column names)
            if (Array.isArray(values)) {
                values.forEach(col => {
                    const cName = col.toLowerCase();
                    const colFound = screen.queryAllByText((content) => {
                        const text = (content || '').toLowerCase();
                        return text === cName || text === `label_${cName}` || text === `label_${cName.replace(' ', '_')}` || text.includes(cName);
                    });
                    if (colFound.length === 0) missingItems.push(`Column: '${col}' in Table: '${key}'`);
                });
            }
        });

        expect(missingItems, `Missing UI elements for ${kind}`).toEqual([]);
      }, { timeout: 3000 });
    });
  });
});
