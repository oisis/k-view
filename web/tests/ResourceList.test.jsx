import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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

vi.mock('../src/SettingsContext', () => ({
  useSettings: () => ({
    settings: { itemsPerPage: 10, resourceRefreshInterval: 5, defaultNamespace: 'default' }
  }),
  useTranslation: () => ({
    t: (key) => key
  })
}));

vi.mock('../src/ThemeContext', () => ({
  useTheme: () => ({
    icons: {
      chevron_down: () => null,
      chevron_up: () => null,
      search: () => null,
      refresh: () => null,
      plus: () => null,
      chevrons_left: () => null,
      chevron_left: () => null,
      chevron_right: () => null,
      chevrons_right: () => null,
      sort: () => null,
    }
  })
}));

vi.mock('../src/hooks/useResourceData', () => ({
  useResourceData: () => ({
    items: [],
    loading: false,
    error: null,
    sortConfig: { key: 'name', direction: 'asc' },
    setSortConfig: vi.fn(),
    refresh: vi.fn()
  })
}));

const renderWithRouter = (ui) => {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {ui}
    </MemoryRouter>
  );
};

describe('ResourceList "Frozen" View Tests - Human YAML', () => {
  Object.entries(resources).forEach(([kind, config]) => {
    it(`renders correct columns for ${kind}`, async () => {
      renderWithRouter(<ResourceList kind={kind} />);
      
      const headers = screen.getAllByRole('columnheader');
      const headerTexts = headers.map(h => h.textContent.trim().toLowerCase());

      const columns = config['General overview'] || [];
      columns.forEach(columnName => {
        const expected = columnName.toLowerCase();
        const found = headerTexts.some(text => 
            text === expected || 
            text === expected.replace(/\s+/g, '_') ||
            text === `label_${expected}` ||
            text === `label_${expected.replace(/\s+/g, '_')}` ||
            text.includes(expected)
        );

        expect(found, `Column '${columnName}' not found in ${kind} list`).toBe(true);
      });
    });
  });
});
