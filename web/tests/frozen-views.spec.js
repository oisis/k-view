import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your frozen view definitions
const resourcesPath = path.resolve(__dirname, './resources');
const resourceFiles = fs.readdirSync(resourcesPath).filter(f => f.endsWith('.yaml'));

const normalize = (s) => (s || '').toLowerCase().replace('label_', '').replace(/:/g, '').replace(/_/g, ' ').replace(/-/g, ' ').trim();

// Map UI names to YAML expectations if they differ
const ALIASES = {
    'age': 'created',
    'create': 'created',
    'phase': 'status',
    'memory': 'ram',
    'int endpoints': 'endpoints',
    'ext endpoints': 'endpoints',
    'system information': 'resource info',
    'allocation': 'resource info',
    'accepted names': 'resource info',
    'role references': 'resource info',
    'objects': 'persistent volumes'
};

test.describe('K-View Frozen Views Audit (1:1 Verification)', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    
    const username = process.env.KVIEW_USER;
    const password = process.env.KVIEW_PASS;

    if (username && password) {
        // Mode 1: Local Login (Username/Password)
        // If local login button is hidden, click it first
        const localLoginBtn = page.getByRole('button', { name: /Local user login/i });
        if (await localLoginBtn.isVisible()) await localLoginBtn.click();

        await page.fill('input[type="text"]', username);
        await page.fill('input[type="password"]', password);
        await page.click('button:has-text("Sign In")');
    } else {
        // Mode 2: Dev Login (Fallback)
        const devLoginBtn = page.getByRole('button', { name: /Dev Login/i });
        if (await devLoginBtn.isVisible()) {
            await devLoginBtn.click();
        }
    }
    
    await page.waitForURL('**/');
  });

  for (const file of resourceFiles) {
    const kind = path.basename(file, '.yaml');
    const config = yaml.load(fs.readFileSync(path.join(resourcesPath, file), 'utf8'));

    test(`audit ${kind} list view columns`, async ({ page }) => {
      // Navigate to the resource list (e.g. /Pods)
      // Note: Capitalization might matter based on your router, assuming plural matches YAML filename or folder
      const urlKind = kind.charAt(0).toUpperCase() + kind.slice(1);
      await page.goto(`/${urlKind}`);
      
      // Wait for table to load
      await page.waitForSelector('table');

      // Get all table headers
      const actualHeaders = await page.$$eval('th', ths => ths.map(th => th.textContent.trim()));
      
      // Filter out Actions column and empty headers
      const filteredActual = actualHeaders
        .filter(h => h && h !== 'Actions' && !h.includes('Visual Trace'))
        .map(h => {
            const n = normalize(h);
            return ALIASES[n] || n;
        });

      const expectedHeaders = (config['General overview'] || []).map(normalize);

      // Unique values sorted
      const uniqueActual = [...new Set(filteredActual)].sort();
      const uniqueExpected = [...new Set(expectedHeaders)].sort();

      expect(uniqueActual, `Column mismatch in ${kind} list. 
        Expected: ${uniqueExpected.join(', ')}
        Actual: ${uniqueActual.join(', ')}`).toEqual(uniqueExpected);
    });

    test(`audit ${kind} detail view elements`, async ({ page }) => {
      // Go to first item in the list
      const urlKind = kind.charAt(0).toUpperCase() + kind.slice(1);
      await page.goto(`/${urlKind}`);
      await page.waitForSelector('table tbody tr td a');
      
      // Click the first link (usually the name)
      await page.locator('table tbody tr td a').first().click();
      
      // Wait for detail view to load
      await page.waitForSelector('.bg-glass');

      // 1. Check Tabs
      if (config.detail_tabs) {
          const tabTexts = await page.$$eval('button', btns => btns.map(b => b.textContent.trim().toLowerCase()));
          const expectedTabs = config.detail_tabs.map(t => t.toLowerCase());
          for (const tab of expectedTabs) {
              expect(tabTexts, `Missing tab: ${tab} for ${kind}`).toContain(tab);
          }
      }

      // 2. Check Sections and Fields
      const allText = await page.innerText('body');
      const lowerAllText = allText.toLowerCase();

      for (const [section, fields] of Object.entries(config)) {
          if (['Section', 'General overview', 'detail_tabs'].includes(section)) continue;

          // Verify Section Title exists (or its alias)
          const normSection = normalize(section);
          const sectionAlias = Object.keys(ALIASES).find(key => ALIASES[key] === normSection);
          const sectionFound = lowerAllText.includes(normSection) || (sectionAlias && lowerAllText.includes(sectionAlias));
          
          expect(sectionFound, `Missing section: ${section} for ${kind}`).toBeTruthy();

          if (Array.isArray(fields)) {
              for (const field of fields) {
                  const normField = normalize(field);
                  const fieldAlias = Object.keys(ALIASES).find(key => ALIASES[key] === normField);
                  const fieldFound = lowerAllText.includes(normField) || (fieldAlias && lowerAllText.includes(fieldAlias));
                  
                  expect(fieldFound, `Missing element: ${field} in section ${section} for ${kind}`).toBeTruthy();
              }
          }
      }
    });
  }
});
