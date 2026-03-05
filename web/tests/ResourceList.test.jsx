import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import ResourceList from '../src/components/ResourceList';
import { MemoryRouter } from 'react-router-dom';
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

vi.mock('../src/SettingsContext', () => ({
  useSettings: () => ({ settings: { itemsPerPage: 10, resourceRefreshInterval: 5, defaultNamespace: 'default' } }),
  useTranslation: () => ({ t: (key) => key })
}));

vi.mock('../src/ThemeContext', () => ({
  useTheme: () => ({ icons: { 
    chevron_down: () => null, chevron_up: () => null, search: () => null, refresh: () => null, 
    plus: () => null, chevrons_left: () => null, chevron_left: () => null, 
    chevron_right: () => null, chevrons_right: () => null, sort: () => null 
  } })
}));

vi.mock('../src/hooks/useResourceData', () => ({
  useResourceData: () => ({ 
    items: [{
        name: 'dummy', namespace: 'default', status: 'Running', age: '10m',
        extra: {
            labels: {a: 'b'}, annotations: {c: 'd'}, images: ['img'],
            pods: '1/1', node: 'node-1', restarts: 0, cpu: '10m', memory: '100Mi',
            'cluster-ip': '1.1.1.1', endpoints: '1.1.1.1:80', 'int-endpoints': '1.1.1.1', 'ext-endpoints': '1.1.1.1',
            provisioner: 'p1', parameters: {p: 'v'},
            group: 'g1', 'full-name': 'fn1', namespaced: true,
            schedule: '* * * * *', suspend: false, 'last-schedule': '1m', active: 0,
            type: 'Opaque', count: 1, reason: 'r', message: 'm', source: 's', objects: 'o',
            'first-seen': '1m', 'last-seen': '1m', reference: 'ref', targets: '1/1', min: 1, max: 2, replicas: 1,
            capacity: '10Gi', 'access-modes': 'RWO', 'reclaim-policy': 'Retain', claim: 'c1', 'storage-class': 'sc1',
            volume: 'v1', current: 1, desired: 1, ready: '1/1', controller: 'c1', address: '1.1.1.1', hosts: 'h1'
        }
    }], 
    loading: false, error: null, sortConfig: { key: 'name', direction: 'asc' }, setSortConfig: vi.fn(), refresh: vi.fn() 
  })
}));

const renderWithRouter = (ui) => {
  return render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{ui}</MemoryRouter>);
};

describe('ResourceList "Frozen" View Tests - Human YAML', () => {
  const normalize = (s) => {
      const n = (s || '').toLowerCase().replace('label_', '').replace(/_/g, ' ').replace(/-/g, ' ').trim();
      if (n === 'age' || n === 'create' || n === 'created') return 'normalizedage';
      if (n === 'memory' || n === 'ram' || n === 'ram(usage)' || n === 'ram capacity' || n === 'ram limits' || n === 'ram requests') return 'normalizedram';
      if (n === 'cpu' || n === 'cpu(usage)' || n === 'cpu capacity (cores)' || n === 'cpu limits (cores)' || n === 'cpu requests (cores)') return 'normalizedcpu';
      if (n === 'int endpoints' || n === 'ext endpoints' || n === 'endpoints') return 'normalizedendpoints';
      if (n === 'phase' || n === 'status' || n === 'ready') return 'normalizedstatus';
      return n;
  };

  Object.entries(resources).forEach(([kind, config]) => {
    it(`audits columns for ${kind}`, async () => {
      renderWithRouter(<ResourceList kind={kind} />);
      
      const headers = screen.queryAllByRole('columnheader');
      const actualHeaders = headers
          .map(h => h.textContent.trim())
          .filter(h => h && h !== 'Actions' && h !== '');
      
      const expectedHeaders = config['General overview'] || [];

      const normalizedActual = [...new Set(actualHeaders.map(normalize))].sort();
      const normalizedExpected = [...new Set(expectedHeaders.map(normalize))].sort();

      const missing = normalizedExpected.filter(e => !normalizedActual.includes(e));
      const extra = normalizedActual.filter(a => !normalizedExpected.includes(a));

      logAudit(kind, 'List View', [...missing.map(m => `Missing: ${m}`), ...extra.map(x => `Extra: ${x}`)]);
      
      expect(normalizedActual, `Mismatch in ${kind}.
        Missing: ${missing.join(', ')}
        Extra: ${extra.join(', ')}`).toEqual(normalizedExpected);
    });
  });
});
