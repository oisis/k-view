import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResourceList from '../src/components/ResourceList';
import { MemoryRouter } from 'react-router-dom';
import frozenViews from './frozen-views.json';

// Mocking dependencies
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
  // Use MemoryRouter with future flags to silence warnings
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {ui}
    </MemoryRouter>
  );
};

describe('ResourceList "Frozen" View Tests - Dynamic', () => {
  Object.entries(frozenViews.resources).forEach(([kind, config]) => {
    it(`renders correct columns for ${kind}`, async () => {
      renderWithRouter(<ResourceList kind={kind} />);
      
      const headers = screen.getAllByRole('columnheader');
      const headerTexts = headers.map(h => h.textContent.trim().toLowerCase());

      config.general_overview.forEach(columnName => {
        const expected = columnName.toLowerCase();
        const found = headerTexts.some(text => 
            text === expected || 
            text === expected.replace(/ /g, '_') ||
            text === `label_${expected}` ||
            text === `label_${expected.replace(/ /g, '_')}` ||
            text.includes(expected)
        );

        expect(found).toBe(true);
      });
    });
  });
});
