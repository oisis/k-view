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
    settings: { resourceRefreshInterval: 0 }
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
      
      // Provide AT LEAST ONE ITEM in related arrays to trigger conditional section rendering
      const dummyItem = { metadata: { name: 'dummy' }, name: 'dummy', status: 'Active' };
      
      mockFetch({
        resource: { name: 'resource-1', namespace: 'default', status: { phase: 'Running' } },
        metadata: { uid: 'uid-1', creationTimestamp: '2024-01-01T00:00:00Z' },
        spec: { 
            containers: [{ name: 'main' }], 
            template: { spec: { containers: [{ name: 'main' }] } },
            strategy: { type: 'RollingUpdate' },
            rules: [{ verbs: ['get'], resources: ['pods'] }],
            provisioner: 'k-view',
            group: 'example.com',
            names: { kind: 'Example', plural: 'examples' }
        },
        status: { phase: 'Running', conditions: [] },
        allocation: { cpu: { requests: '1' }, memory: { requests: '1Gi' }, pods: { allocation: 1 } },
        extra: { kind, group: 'example.com', version: 'v1', names: { plural: 'examples' } },
        // Fill arrays to ensure "Related" sections are rendered
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
        // 1. Check title
        expect(screen.getByText(/resource-1/i)).toBeInTheDocument();

        // 2. Check Tabs
        config.detail_tabs.forEach(tab => {
          const expected = tab.toLowerCase();
          const found = screen.queryByText((content) => {
             const text = content.toLowerCase();
             return text === expected || text === `tab_${expected}`;
          });
          if (!found) console.error(`Missing Tab: ${tab} for ${kind}`);
          expect(found).not.toBeNull();
        });

        // 3. Check Sections
        config.detail_sections.forEach(section => {
          const expected = section.toLowerCase();
          const found = screen.queryAllByText((content) => {
             const text = content.toLowerCase();
             // Match exact, with label_ prefix, or containing the text (for headers)
             return text === expected || 
                    text === `label_${expected}` || 
                    text === expected.replace(/ /g, '_') ||
                    text === `label_${expected.replace(/ /g, '_')}`;
          });
          if (found.length === 0) {
             console.error(`Missing Section: "${section}" for ${kind}. Search term: "${expected}"`);
          }
          expect(found.length).toBeGreaterThan(0);
        });
      }, { timeout: 3000 });
    });
  });
});
