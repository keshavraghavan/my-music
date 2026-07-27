import { expect, test, type Page } from '@playwright/test';

/**
 * End-to-end smoke test over the built static export.
 *
 * The unit suite covers individual workflows against the screen components;
 * this asserts that the real routes resolve, that the app hydrates, and that
 * it survives a full pass — including the things only a browser can answer:
 * deep links, the back button, and the layout at phone width.
 *
 * It runs with no secrets and no network, so it works on a fork. As the
 * roadmap phases land this grows into the two-user journey in
 * docs/ROADMAP.md — Part 6.
 */

/** Clicks through onboarding to the signed-in page. */
async function signIn(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: 'GET STARTED →' }).click();
  await expect(page).toHaveURL('/onboarding/1');
  await page.getByRole('button', { name: "LET'S GO →" }).click();
  await expect(page).toHaveURL('/onboarding/2');
  await page.getByRole('button', { name: 'CONTINUE →' }).click();
  await expect(page).toHaveURL('/onboarding/3');
  await page.getByRole('button', { name: 'CONTINUE →' }).click();
  await expect(page).toHaveURL('/onboarding/4');
  await page.getByRole('button', { name: 'CONTINUE →' }).click();
  await expect(page).toHaveURL('/onboarding/5');
  await page.getByRole('button', { name: 'ENTER YOUR PAGE →' }).click();
  await expect(page).toHaveURL('/home');
}

test('the landing page renders before any interaction', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'MyMusic.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'GET STARTED →' })).toBeVisible();
});

test('a new arrival can complete onboarding and reach their page', async ({ page }) => {
  await signIn(page);

  await expect(page).toHaveURL('/home');
  await expect(page.getByText('RUN ON THE JUNOTAPES LINE')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'MY TOP 10 — HAND-PICKED' })).toBeVisible();
});

test('each onboarding step is its own URL, and the back button works', async ({ page }) => {
  await page.goto('/onboarding/1');
  await page.getByRole('button', { name: "LET'S GO →" }).click();
  await expect(page).toHaveURL('/onboarding/2');

  await page.goBack();
  await expect(page).toHaveURL('/onboarding/1');
  await expect(page.getByText('STEP 1 / 5')).toBeVisible();
});

test('a taken handle blocks the profile step', async ({ page }) => {
  await page.goto('/onboarding/3');

  await page.getByLabel('HANDLE').fill('marisolv');
  await expect(page.getByText('@marisolv is already taken — try another.')).toBeVisible();

  await expect(page.getByRole('button', { name: 'CONTINUE →' })).toBeDisabled();
  await expect(page).toHaveURL('/onboarding/3');
});

test('every screen in the shell is reachable, and the URL follows', async ({ page }) => {
  await signIn(page);
  const nav = page.getByRole('navigation', { name: 'Main' });

  await nav.getByRole('link', { name: 'FRIENDS' }).click();
  await expect(page).toHaveURL('/friends');
  await expect(page.getByRole('heading', { name: 'SUGGESTED' })).toBeVisible();

  await nav.getByRole('link', { name: 'PLAYLIST' }).click();
  await expect(page).toHaveURL('/playlist');
  await expect(page.getByRole('heading', { name: 'Rooftop Party 2026' })).toBeVisible();

  await nav.getByRole('link', { name: /^NOTIFICATIONS/ }).click();
  await expect(page).toHaveURL('/notifications');
  await expect(page.getByRole('button', { name: 'MARK ALL READ' })).toBeVisible();

  await nav.getByRole('link', { name: 'SETTINGS' }).click();
  await expect(page).toHaveURL('/settings/account');
  await expect(page.getByRole('heading', { name: 'DANGER ZONE' })).toBeVisible();

  await nav.getByRole('link', { name: 'HOME' }).click();
  await expect(page).toHaveURL('/home');
});

test('a profile is a shareable URL that resolves on a cold load', async ({ page }) => {
  await page.goto('/theok_fm');

  await expect(page.getByRole('heading', { name: 'Theo K.', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'HIS WALL' })).toBeVisible();

  // A private profile is the same URL shape, locked.
  await page.goto('/sam_radio');
  await expect(page.getByRole('button', { name: 'REQUEST TO FOLLOW' })).toBeVisible();
});

test('settings tabs are deep-linkable', async ({ page }) => {
  await page.goto('/settings/privacy');
  await expect(page.getByRole('switch', { name: 'Private profile' })).toBeVisible();
});

test('the duplicate playlist add is warned and then resolvable', async ({ page }) => {
  await page.goto('/playlist');
  await page.getByRole('button', { name: '+ ADD TRACK' }).click();

  const dialog = page.getByRole('dialog', { name: /Add Track/ });
  await dialog.getByRole('button', { name: /Terracotta/ }).click();
  await expect(dialog.getByRole('button', { name: 'ADD ANYWAY' })).toBeVisible();

  await dialog.getByRole('button', { name: 'ADD ANYWAY' }).click();
  await dialog.getByRole('button', { name: 'ADD TO PLAYLIST →' }).click();
  await expect(page.getByText('Added Terracotta to Rooftop Party 2026.')).toBeVisible();
});

test('the compose dialog is operable and dismissable from the keyboard', async ({ page }) => {
  await page.goto('/playlist');
  await page.getByRole('button', { name: '+ ADD TRACK' }).click();

  const dialog = page.getByRole('dialog', { name: /Add Track/ });
  await expect(dialog).toBeVisible();
  // Focus moved into the dialog rather than being left on the page behind it.
  await expect(dialog.locator(':focus')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: '+ ADD TRACK' })).toBeFocused();
});

test('the page holds together at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/home');

  await expect(page.getByRole('heading', { name: 'Juno Reyes' })).toBeVisible();

  // Nothing overflows the viewport — the design's fixed 1200px/560px widths
  // and 40px gutters are all responsive now.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
