import { test, expect } from '@playwright/test';

test('test navigation on Enter', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Wait for the input to appear
    const input = page.locator('input[placeholder="e.g. Choose a laptop under budget..."]');
    await input.waitFor();

    // Type something and press Enter
    await input.fill('Gaming Laptop');
    await input.press('Enter');

    // Wait for it to navigate to options page
    await page.waitForURL('**/options', { timeout: 10000 });
    const url = page.url();
    console.log("Navigated to:", url);
});
