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

const logPath = path.resolve(__dirname, `../../test-audit.log`);
const logAudit = (kind, type, missing = []) => {
    let entry = `\n## ${kind} (${type})\n`;
    if (missing.length > 0) entry += `### ❌ Mismatch:\n- ${missing.join('\n- ')}\n`;
    else entry += `✅ 100% Match\n`;
    fs.appendFileSync(logPath, entry);
};

beforeAll(() => {
    fs.writeFileSync(logPath, '# K-View UI Audit Report\nGenerated on: ' + new Date().toLocaleString() + '\n');
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
    chevrons_left: () => null, chevrons_right: () => null, eye: () => null, eye_off: () => null
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

  const normalize = (s) => {
      const n = (s || '').toLowerCase().replace('label_', '').replace(/:/g, '').replace(/_/g, ' ').trim();
      if (n === 'role references' || n === 'accepted names' || n === 'system information' || n === 'allocation' || n === 'resource info') return 'normalizedinfo';
      if (n === 'objects' || n === 'related pvs' || n === 'persistent volumes') return 'normalizedvolumes';
      if (n === 'persistent volume claims' || n === 'storage') return 'normalizedstorage';
      if (n === 'age' || n === 'create' || n === 'created') return 'normalizedage';
      if (n === 'last heartbeat time' || n === 'last probe time') return 'normalizedprobe';
      return n;
  };

  Object.entries(resources).forEach(([kind, config]) => {
    it(`audits details for ${kind}`, async () => {
      useParams.mockReturnValue({ kind, namespace: 'default', name: 'resource-1' });
      
      const dummyItem = { 
        metadata: { name: 'dummy' }, name: 'dummy', status: 'Active', 
        extra: { 
            'owner-uid': 'uid-1', pods: '1/1', restarts: 0, cpu: '10m', ram: '100Mi', 
            'cluster-ip': '10.0.0.1', node: 'node-1', images: ['img1'], labels: {a: 'b'} 
        }, 
        namespace: 'default', age: '10m' 
      };
      
      mockFetch({
        resource: { name: 'resource-1', namespace: 'default', age: '10m', status: 'Running' },
        metadata: { uid: 'uid-1', name: 'resource-1', namespace: 'default', creationTimestamp: '2024-01-01T00:00:00Z' },
        spec: { 
            containers: [{ name: 'main', image: 'nginx', resources: {requests: {cpu: '100m'}}, env: [], volumeMounts: [] }], 
            strategy: { type: 'RollingUpdate' }, 
            ports: [{ port: 80, protocol: 'TCP' }],
            provisioner: 'provisioner', reclaimPolicy: 'Retain', volumeBindingMode: 'Immediate',
            allowVolumeExpansion: true, podSelector: {matchLabels: {app: 'test'}},
            policyTypes: ['Ingress'], ingress: [], egress: [],
            rules: [{apiGroups: [''], resources: ['pods'], verbs: ['get']}],
            roleRef: {kind: 'Role', name: 'test', apiGroup: 'rbac'},
            subjects: [{kind: 'User', name: 'u1'}],
            claimRef: {namespace: 'n1', name: 'c1'}
        },
        status: { 
            phase: 'Active', 
            conditions: [{type: 'Ready', status: 'True', lastProbeTime: '2024-01-01T00:00:00Z', reason: 'Ready'}],
            nodeInfo: {machineID: 'id1', kernelVersion: 'k1', systemUUID: 'u1', bootID: 'b1', osImage: 'o1', containerRuntimeVersion: 'c1', kubeletVersion: 'k1', operatingSystem: 'o1', architecture: 'a1'},
            capacity: {cpu: '4', memory: '8Gi', pods: '110'},
            addresses: [{type: 'InternalIP', address: '1.2.3.4'}, {type: 'Hostname', address: 'h1'}]
        },
        allocation: {
            cpu: {requests: 1, capacity: 4, limits: 2},
            memory: {requests: 1024, capacity: 8192, limits: 2048},
            pods: {allocation: 10, capacity: 110}
        },
        extra: { kind: kind },
        relatedReplicaSets: [dummyItem], relatedPods: [dummyItem], relatedServices: [dummyItem], 
        relatedEndpoints: { subsets: [{ addresses: [{ ip: '1.1.1.1' }], ports: [{ port: 80 }] }] }, 
        relatedIngresses: [dummyItem], relatedSecrets: [dummyItem], relatedImagePullSecrets: [dummyItem], 
        relatedPvs: [dummyItem], quotas: [dummyItem], limits: [dummyItem], detailedCapacity: [dummyItem],
        volumeSource: { type: 'CSI', driver: 'driver', volumeHandle: 'handle', attributes: {a: 'b'} }
      });

      const { container } = renderWithRouter(<ResourceDetails />);

      await waitFor(() => {
          if (config.detail_tabs) {
              const actualTabs = [...new Set(Array.from(container.querySelectorAll('button'))
                  .filter(b => ['overview', 'yaml', 'logs', 'events', 'exec', 'trace'].includes(b.textContent.toLowerCase().trim()))
                  .map(b => b.textContent.toLowerCase().trim()))].sort();
              const expectedTabs = config.detail_tabs.map(t => t.toLowerCase().trim()).sort();
              expect(actualTabs, `Tab mismatch for ${kind}`).toEqual(expectedTabs);
          }

          const sectionElements = Array.from(container.querySelectorAll('.detail-section-header h3'));
          const actualSections = [...new Set(sectionElements.map(h => normalize(h.textContent)))].sort();
          const expectedSections = [...new Set(Object.keys(config)
              .filter(k => k !== 'General overview' && k !== 'detail_tabs' && k !== 'Section')
              .map(normalize))].sort();
          
          expect(actualSections, `Section mismatch for ${kind}`).toEqual(expectedSections);

          Object.entries(config).forEach(([title, expectedFields]) => {
              if (title === 'General overview' || title === 'detail_tabs' || title === 'Section') return;

              const sectionHeader = sectionElements.find(h => normalize(h.textContent) === normalize(title));
              const sectionContainer = sectionHeader.closest('.bg-glass');
              
              const fieldElements = Array.from(sectionContainer.querySelectorAll('th, .text-text-muted, .detail-row-label'));
              const actualFields = [...new Set(fieldElements
                  .map(el => normalize(el.textContent))
                  .filter(t => t && t !== '—' && !t.includes('relative'))
              )].sort();
              
              const normalizedExpectedFields = Array.isArray(expectedFields) ? [...new Set(expectedFields.map(normalize))].sort() : [];
              expect(actualFields, `Field mismatch in section '${title}' for ${kind}`).toEqual(normalizedExpectedFields);
          });
      }, { timeout: 10000 });
    });
  });
});
