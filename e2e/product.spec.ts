import { test, expect, type Page } from '@playwright/test';

const screenshot = async (page: Page, name: string) => {
  if (process.env.E2E_SCREENSHOTS === "1") await page.screenshot({ path: `docs/screenshots/${name}.png`, animations: "disabled" });
};

test('admin adds a book and a reader talks to it', async ({ page }) => {
  const title = `The Lantern Garden ${Date.now()}`;
  await page.goto('/login');
  await screenshot(page, 'login');
  await page.getByLabel('Email').fill('admin@bestin.local');
  await page.getByLabel('Password').fill('admin12345');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('The library')).toBeVisible();
  await page.goto('/admin');
  await screenshot(page, 'admin-dashboard');
  await page.goto('/admin/books/new');
  await screenshot(page, 'admin-upload');
  await page.locator('input[type=file]').first().setInputFiles({ name: 'lantern.txt', mimeType: 'text/plain', buffer: Buffer.from('The Lantern Garden\n\nMira tended a quiet garden filled with lanterns. Every evening she lit the lanterns to guide lost travelers home. Her kindness made the village a welcoming place for everyone. The garden taught people that a small light can help a neighbor find their way.') });
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Author').fill('Bestin Test');
  await page.getByRole('button', { name: 'Upload book' }).click();
  await expect(page).toHaveURL(/\/admin\/books$/);
  const book = page.locator('.admin-book').filter({ hasText: title });
  await expect(book.getByText('ready', { exact: true })).toBeVisible({ timeout: 180_000 });
  await screenshot(page, 'admin-books');
  const publish = book.getByRole('button', { name: 'Publish', exact: true });
  if (await publish.isVisible()) await publish.click();
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.goto('/register');
  await page.getByLabel('Name').fill('Browser Reader');
  await page.getByLabel('Email').fill(`reader${Date.now()}@example.com`);
  await page.getByLabel('Password').fill('reader12345');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await screenshot(page, 'library');
  await page.getByRole('heading', { name: title }).click();
  await page.getByLabel('Your question').fill('Why did Mira light the lanterns?');
  await page.getByLabel('Send question').click();
  await expect(page.locator('.message.assistant .citations summary').first()).toBeVisible({ timeout: 180_000 });
  await expect(page.locator('.avatar-speaking')).toBeVisible({ timeout: 30_000 });
  await screenshot(page, 'chat-speaking');
  await page.getByLabel('Quick settings').click();
  await page.getByLabel('Character').selectOption('rafi');
  await page.getByLabel('Scene').selectOption('garden');
  await page.reload();
  await expect(page.locator('.scene-garden')).toBeVisible();
  await expect(page.getByRole('img', { name: /Rafi/ })).toBeVisible();
});

test('avatar lab renders all visemes, characters, and scenes', async ({ page }) => {
  await page.goto('/avatar-lab');
  for (const character of ['sage', 'rafi', 'owl']) {
    await page.getByLabel('Character').selectOption(character);
    for (const shape of ['A','B','C','D','E','F','G','H','X']) {
      await page.getByLabel('Viseme').selectOption(shape);
      await expect(page.locator(`.avatar [data-viseme="${shape}"]`)).toHaveAttribute('opacity', '1');
    }
    await screenshot(page, `avatar-${character}`);
  }
  await page.getByLabel('Character').selectOption('sage');
  for (const scene of ['library', 'night', 'garden', 'studio', 'rain']) {
    await page.getByLabel('Scene').selectOption(scene);
    await screenshot(page, `scene-${scene}`);
  }
});
