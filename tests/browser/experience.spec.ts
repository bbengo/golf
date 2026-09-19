import { expect, test } from '@playwright/test';

test('experience selection gives the original a direct entrance and return path', async ({
   page,
}) => {
   await page.goto('/');
   await page.getByRole('link', { name: 'Enter the course' }).click();
   await expect(page.getByRole('heading', { name: 'Choose your experience.' })).toBeVisible();
   await page.screenshot({ path: 'test-results/purity-editions.png' });
   await page.getByRole('link', { name: 'Choose UCG-50 Original' }).click();
   await expect(page.locator('#welcomeScreen')).toBeVisible();
   await page.getByRole('link', { name: 'Choose experience: Purity / UCG-50 Original' }).click();
   await expect(page.locator('.edition-screen')).toBeVisible();
   await page.setViewportSize({ width: 390, height: 844 });
   await expect(page.getByRole('link', { name: 'Choose Purity', exact: true })).toBeInViewport();
   await expect(page.getByRole('link', { name: 'Choose UCG-50 Original' })).toBeInViewport();
   expect(
      await page.evaluate(
         () =>
            document.documentElement.scrollWidth <= innerWidth &&
            document.documentElement.scrollHeight <= innerHeight,
      ),
   ).toBe(true);
   await page.screenshot({ path: 'test-results/purity-editions-mobile.png' });
   await page.keyboard.press('Escape');
   await expect(page.locator('.title-screen')).toBeVisible();
});

test('desktop controls, mouse aiming and player-selected interface modes', async ({ page }) => {
   test.setTimeout(180000);
   const errors: string[] = [];
   page.on('pageerror', (error) => errors.push(error.message));
   await page.goto('/#play');
   await expect(page.locator('#desktopPlay')).toBeVisible();
   await expect(page.locator('#desktopControls .cockpit-shell')).toHaveCount(0);
   await page.locator('#openCaddy').click();
   await expect(page.locator('#desktopCaddy')).toBeVisible();
   await page.screenshot({ path: 'test-results/desktop-caddy.png' });
   await page.locator('[data-caddy="6I"]').click();
   await expect(page.locator('#desktopCaddy')).not.toBeVisible();
   await expect(page.locator('#selectedClubName')).toHaveText('6 iron');
   await expect(page.locator('#selectedClubArt svg')).toHaveCount(1);
   await page.locator('#openCaddy').click();
   await expect(page.locator('[data-caddy="6I"]')).toHaveAttribute('aria-pressed', 'true');
   await page.keyboard.press('Escape');
   await expect(page.locator('#desktopCaddy')).not.toBeVisible();
   await expect(page.locator('#openCaddy')).toBeFocused();
   await page.locator('#desktopEffort').fill('72');
   await expect(page.locator('#desktopEffortValue')).toHaveText('72%');
   const distance = await page.locator('#desktopDistance').textContent();
   await page.locator('#course').click({ position: { x: 720, y: 350 } });
   await expect(page.locator('#desktopDistance')).not.toHaveText(distance!);
   const aimed = await page.locator('#desktopDistance').textContent();
   await page.mouse.move(780, 400);
   await page.mouse.down();
   await page.mouse.move(830, 420, { steps: 5 });
   await page.mouse.up();
   await expect(page.locator('#desktopDistance')).toHaveText(aimed!);
   await page.locator('#course').dblclick({ position: { x: 780, y: 350 } });
   await expect(page.locator('#course')).toHaveAttribute('data-camera-zoom', '1.000');
   await expect(page.locator('#desktopDistance')).toHaveText(aimed!);
   await page.locator('#course').press('[');
   await expect(page.locator('#course')).not.toHaveAttribute('data-camera-angle', '0.0000');
   await page.locator('#desktopNorth').click();
   await expect(page.locator('#course')).toHaveAttribute('data-camera-angle', '0.0000');
   await page.locator('#desktopTune').click();
   await page.locator('#desktopShape').fill('20');
   await expect(page.locator('#desktopShapeValue')).toHaveText('20% draw');
   await page.locator('#desktopTune').click();
   await page.screenshot({ path: 'test-results/desktop-hud.png' });
   await page.locator('#desktopPlay').click();
   await expect(page.locator('#desktopPlay')).toHaveText('Show result');
   await expect(page.locator('#desktopClub')).toBeDisabled();
   await page.locator('#desktopPlay').click();
   await expect(page.locator('#desktopResult')).toContainText('carry');
   await page.locator('#desktopMulligan').click();
   await expect(page.locator('#desktopPlay')).toHaveText('Play shot');
   await page.locator('#revealTools').click();
   await expect(page.locator('#displayTools')).toBeVisible();
   await page.screenshot({ path: 'test-results/game-menu.png' });
   await page.locator('#openGameOptions').click();
   await page.screenshot({ path: 'test-results/game-options.png' });
   await page.locator('[name=displayMode][value=minimal]').check();
   await page.locator('#closeGameOptions').click();
   await expect(page.locator('.course-info')).toBeVisible();
   await expect(page.locator('.shot-dock')).toBeHidden();
   await page.locator('#revealTools').click();
   await page.locator('#openGameOptions').click();
   await page.locator('[name=displayMode][value=clear]').check();
   await page.locator('#closeGameOptions').click();
   await expect(page.locator('#desktopControls')).toBeHidden();
   await expect(page.locator('#revealTools')).toBeHidden();
   await page.locator('#course').click({ position: { x: 500, y: 300 } });
   await expect(page.locator('#displayTools')).toBeVisible();
   await page.locator('#openGameOptions').click();
   await page.locator('[name=displayMode][value=desktop]').check();
   await page.locator('#followBall').uncheck();
   await page.locator('#optionsPair').click();
   await expect(page.locator('#pairing')).toBeVisible();
   await page.locator('#closePairing').click();
   await expect(page.locator('#desktopClub')).toHaveValue('6I');
   await page.locator('#revealTools').click();
   await page.getByRole('link', { name: 'Return to main menu' }).click();
   await expect(page.locator('.game-lobby')).toBeVisible();
   await page.locator('.game-actions [data-open-controls]').click();
   await expect(page.locator('#desktopClub')).toHaveValue('6I');
   await expect(page.locator('#desktopEffort')).toHaveValue('72');
   await page.locator('#revealTools').click();
   await page.locator('#openGameOptions').click();
   await page.locator('[data-option-tab=course]').click();
   await page.locator('#optionTee').selectOption('red');
   await page.locator('#desktopSetup button[type=submit]').click();
   await expect(page.locator('#optionsNotice')).toHaveText('New practice ready.');
   await page.locator('[data-option-tab=experience]').click();
   await page.locator('[name=displayMode][value=minimal]').check();
   await page.locator('#closeGameOptions').click();
   await page.reload();
   await expect(page.locator('body')).toHaveAttribute('data-display-mode', 'minimal');
   await expect(page.locator('body')).toHaveAttribute('data-follow-ball', 'false');
   expect(errors).toEqual([]);
});

test('short-screen options scroll internally and local play works without relay', async ({
   page,
}) => {
   await page.setViewportSize({ width: 390, height: 844 });
   await page.route('**/api/session', (route) => route.abort());
   await page.goto('/#play');
   await expect(page.locator('#desktopPlay')).toBeVisible();
   expect(
      await page.evaluate(
         () =>
            document.documentElement.scrollWidth <= innerWidth &&
            document.documentElement.scrollHeight <= innerHeight,
      ),
   ).toBe(true);
   await page.locator('#revealTools').click();
   await page.locator('#openGameOptions').click();
   await page.setViewportSize({ width: 700, height: 480 });
   const scroller = page.locator('.options-scroll');
   expect(await scroller.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
   await page.locator('#optionsPair').click();
   await expect(page.locator('#pairStatus')).toContainText('You can still play on this screen');
   await page.locator('#playHere').click();
   await expect(page.locator('#desktopPlay')).toBeVisible();
});
