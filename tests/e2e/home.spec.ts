import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the blog title in navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header h1')).toContainText('Guido Miranda');
  });

  test('should display the welcome heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main h1')).toContainText('Welcome to My Blog');
  });

  test('should display navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Blog' })).toBeVisible();
  });

  test('should display recent posts section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Recent Posts')).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Guido Miranda/);
  });
});
