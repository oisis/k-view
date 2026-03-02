import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResourceDetails from '../src/components/ResourceDetails';
import { MemoryRouter, useParams } from 'react-router-dom';
import frozenViews from './frozen-views.json';

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

describe('ResourceDetails "Frozen" View Tests - Dynamic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  Object.entries(frozenViews.resources).forEach(([kind, config]) => {
    it(`renders correct tabs and sections for ${kind}`, async () => {
      useParams.mockReturnValue({ kind, namespace: 'default', name: 'resource-1' });
      
      const dummyItem = { metadata: { name: 'dummy' }, name: 'dummy', status: 'Active' };
      
      mockFetch({
        resource: { name: 'resource-1', namespace: 'default', age: '10m', status: 'Running' },
        metadata: { uid: 'uid-1', name: 'resource-1', namespace: 'default', creationTimestamp: '2024-01-01T00:00:00Z' },
        spec: { 
            containers: [{ name: 'main' }], 
            template: { spec: { containers: [{ name: 'main' }] } },
            strategy: { type: 'RollingUpdate' },
            rules: [{ verbs: ['get'], resources: ['pods'] }],
            provisioner: 'k-view',
            group: 'example.com',
            names: { kind: 'Example', plural: 'examples' },
            nodeName: 'node-1'
        },
        status: { phase: 'Running', conditions: [], numberReady: 1, desiredNumberScheduled: 1 },
        allocation: { cpu: { requests: '1' }, memory: { requests: '1Gi' }, pods: { allocation: 1 } },
        extra: { kind: kind.toUpperCase(), group: 'example.com', version: 'v1', names: { plural: 'examples' } },
        relatedReplicaSets: [dummyItem], 
        relatedPods: [dummyItem], 
        relatedServices: [dummyItem], 
        relatedJobs: [dummyItem],
        relatedEndpoints: [dummyItem], 
        relatedIngresses: [dummyItem], 
        relatedCrdObjects: [dummyItem],
        relatedSecrets: [dummyItem], 
        relatedImagePullSecrets: [dummyItem], 
        relatedPvs: [dummyItem],
        quotas: [dummyItem],
        limits: [dummyItem]
      });

      renderWithRouter(<ResourceDetails />);

      await waitFor(() => {
        // 1. Check title (use getAll to avoid ambiguity)
        expect(screen.getAllByText(/resource-1/i).length).toBeGreaterThan(0);

        // 2. Check Tabs
        config.detail_tabs.forEach(tab => {
          const expected = tab.toLowerCase();
          const found = screen.queryByText((content) => {
             const text = content.toLowerCase();
             return text === expected || text === `tab_${expected}`;
          });
          expect(found).not.toBeNull();
        });

        // 3. Check Overview Sections (H3 headers)
        config.detail_sections.forEach(section => {
          const expected = section.toLowerCase();
          const found = screen.queryAllByText((content) => {
             const text = content.toLowerCase();
             return text === expected || text === `label_${expected}` || text.includes(expected);
          });
          expect(found.length).toBeGreaterThan(0);
        });

        // 4. Check Metadata Fields (Labels in the grid)
        if (config.metadata_fields) {
          config.metadata_fields.forEach(field => {
            const expected = field.toLowerCase();
            const found = screen.queryAllByText((content) => {
               const text = content.toLowerCase();
               // We match exactly what's in the grid labels
               return text === expected || text === `label_${expected}` || text === field;
            });
            expect(found.length).toBeGreaterThan(0);
          });
        }
      }, { timeout: 3000 });
    });
  });
});
