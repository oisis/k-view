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

// Generate timestamped filename
const now = new Date();
const timestamp = now.toISOString().replace(/T/, '-').replace(/:/g, '-').slice(2, 16);
const logPath = path.resolve(__dirname, `../../test-${timestamp}.log`);

// Utility to log to Markdown
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
  useResourceData: () => ({ items: [], loading: false, error: null, sortConfig: { key: 'name', direction: 'asc' }, setSortConfig: vi.fn(), refresh: vi.fn() })
}));

const renderWithRouter = (ui) => {
  return render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{ui}</MemoryRouter>);
};

describe('ResourceList "Frozen" View Tests - Human YAML', () => {
  Object.entries(resources).forEach(([kind, config]) => {
    it(`audits columns for ${kind}`, async () => {
      renderWithRouter(<ResourceList kind={kind} />);
      
      const headers = screen.queryAllByRole('columnheader');
      const actualHeaders = headers.map(h => h.textContent.trim());
      const expectedHeaders = config['General overview'] || [];

      const missing = expectedHeaders.filter(exp => {
          const e = exp.toLowerCase();
          return !actualHeaders.some(act => {
              const a = act.toLowerCase();
              return a === e || a === `label_${e.replace(/\s+/g, '_')}` || a.includes(e);
          });
      });

      logAudit(kind, 'List View', missing);
      expect(missing, `Columns missing in ${kind} list`).toEqual([]);
    });
  });
});
