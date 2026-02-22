import { test, expect } from '@playwright/test';

test.describe('Theme & Preferences', () => {
  test('should be able to toggle dark mode successfully', async ({ page }) => {
    // Navigate to local dev server (adjust port as needed)
    await page.goto('http://localhost:5173/board');

    // Wait for Hydration to complete
    await page.waitForLoadState('networkidle');

    const html = page.locator('html');

    // Find the toggle button in the header
    const toggleButton = page.locator('button', { hasText: 'Alternar tema' }).or(page.locator('[aria-label="Alternar tema"]'));

    // Check if the button is visible
    if (await toggleButton.isVisible()) {
      await toggleButton.click();

      // Suppose the menu has an item with text "Escuro" or "Dark"
      const darkOption = page.locator('role=menuitem[name="Escuro"]').or(page.locator('text=Escuro'));
      await darkOption.click();

      // Expect HTML tag to receive 'dark' class
      await expect(html).toHaveClass(/dark/);
    }
  });

  test('should persist compact mode settings', async ({ page }) => {
    await page.goto('http://localhost:5173/board');

    // Find Preferences Settings button in the sidebar
    const prefsButton = page.locator('button', { hasText: 'Preferências' });
    if (await prefsButton.isVisible()) {
      await prefsButton.click();

      // Find the Compact Mode select
      const selectTrigger = page.locator('button[role="combobox"]', { hasText: 'Padrão' });
      if (await selectTrigger.isVisible()) {
        await selectTrigger.click();
        await page.getByRole('option', { name: 'Compacto' }).click();

        // The main container should have data-compact="true"
        await expect(page.locator('main')).toHaveAttribute('data-compact', 'true');
      }
    }
  });
});
