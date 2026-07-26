import { expect, test, type Page } from '@playwright/test';

/**
 * End-to-end smoke test over the built static export.
 *
 * The unit suite covers individual workflows in isolation; this asserts the
 * whole thing actually boots, hydrates, and survives a full pass through the
 * app. It runs with no secrets and no network, so it works on a fork.
 *
 * As the roadmap phases land this grows into the two-user journey described in
 * docs/ROADMAP.md — Part 6.
 */

/** Clicks through onboarding to the signed-in page. */
async function signIn(page: Page) {
  await page.getByText('GET STARTED →').click();
  await page.getByText("LET'S GO →").click();
  await page.getByText('CONTINUE →').click();
  await page.getByText('CONTINUE →').click();
  await page.getByText('CONTINUE →').click();
  await page.getByText('ENTER YOUR PAGE →').click();
}

test('the landing page renders before any interaction', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('MyMusic.').first()).toBeVisible();
  await expect(page.getByText('GET STARTED →')).toBeVisible();
});

test('a new arrival can complete onboarding and reach their page', async ({ page }) => {
  await page.goto('/');
  await signIn(page);

  await expect(page.getByText('RUN ON THE JUNOTAPES LINE')).toBeVisible();
  await expect(page.getByText('MY TOP 10 — HAND-PICKED')).toBeVisible();
});

test('a taken handle blocks the profile step', async ({ page }) => {
  await page.goto('/');
  await page.getByText('GET STARTED →').click();
  await page.getByText("LET'S GO →").click();
  await page.getByText('CONTINUE →').click();

  await expect(page.getByText('STEP 3 / 5')).toBeVisible();

  const handle = page.locator('input').nth(1);
  await handle.fill('marisolv');
  await expect(page.getByText('@marisolv is already taken — try another.')).toBeVisible();

  await page.getByText('CONTINUE →').click();
  await expect(page.getByText('STEP 3 / 5')).toBeVisible();
});

test('every screen in the shell is reachable', async ({ page }) => {
  await page.goto('/');
  await signIn(page);

  const nav = page
    .locator('div')
    .filter({ hasText: /^MyMusic\.$/ })
    .first()
    .locator('..');

  await nav.getByText('FRIENDS', { exact: true }).click();
  await expect(page.getByText('SUGGESTED')).toBeVisible();

  await nav.getByText('PLAYLIST', { exact: true }).click();
  await expect(page.getByText('Rooftop Party 2026')).toBeVisible();

  await nav.getByText('NOTIFICATIONS').click();
  await expect(page.getByText('MARK ALL READ')).toBeVisible();

  await nav.getByText('SETTINGS', { exact: true }).click();
  await expect(page.getByText('DANGER ZONE')).toBeVisible();

  await nav.getByText('HOME', { exact: true }).click();
  await expect(page.getByText('RUN ON THE JUNOTAPES LINE')).toBeVisible();
});

test('the duplicate playlist add is warned and then resolvable', async ({ page }) => {
  await page.goto('/');
  await signIn(page);

  const nav = page
    .locator('div')
    .filter({ hasText: /^MyMusic\.$/ })
    .first()
    .locator('..');
  await nav.getByText('PLAYLIST', { exact: true }).click();
  await page.getByText('+ ADD TRACK').click();

  // "Terracotta" appears both in the playlist and in the modal's results. The
  // modal renders after the page content, so the last match is the modal's.
  // Phase 2 gives the modal a real role="dialog" and this becomes a proper
  // getByRole scope.
  await page.getByText('Terracotta').last().click();
  await expect(page.getByText('ADD ANYWAY')).toBeVisible();

  await page.getByText('ADD ANYWAY').click();
  await page.getByText('ADD TO PLAYLIST →').click();
  await expect(page.getByText('Added Terracotta to Rooftop Party 2026.')).toBeVisible();
});
