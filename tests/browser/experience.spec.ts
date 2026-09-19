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

test('game menus preserve a desktop round and controls collapse in place', async ({ page }) => {
   // Includes a round, multiple panel journeys, viewport changes and screenshots.
   test.setTimeout(180000);
   const errors: string[] = [];
   page.on('pageerror', (error) => errors.push(error.message));
   await page.goto('/');
   await expect(page.locator('.title-screen')).toBeVisible();
   await page.screenshot({ path: 'test-results/purity-title.png' });
   await page.getByRole('link', { name: 'Enter the course' }).click();
   await expect(page.getByRole('link', { name: 'Choose UCG-50 Original' })).toBeVisible();
   await page.getByRole('link', { name: 'Choose Purity', exact: true }).click();
   await expect(page.locator('.game-lobby')).toBeVisible();
   await page.getByRole('navigation', { name: 'Game menu' }).getByText('Connect a phone').click();
   await page.getByRole('button', { name: 'Close pairing', exact: true }).click();
   await expect(page.locator('.game-lobby')).toBeVisible();
   await page.screenshot({ path: 'test-results/purity-home.png' });
   await page.getByRole('navigation', { name: 'Game menu' }).getByText('The course').click();
   await expect(page.locator('[data-page=course]')).toBeVisible();
   await page.screenshot({ path: 'test-results/purity-course-selection.png' });
   await page.getByRole('link', { name: 'Play this course' }).click();
   const controls = page.locator('#desktopControls');
   await expect(controls).toBeVisible();
   await expect(controls).toHaveAttribute('data-theme', 'dark');
   await page.evaluate(() => document.fonts.ready);
   expect(await page.evaluate(() => document.fonts.check('500 16px Onest'))).toBe(true);
   await controls.locator('#chooseClub').click();
   await controls.locator('#club').selectOption('6I');
   await controls.locator('#backToShot').click();
   await controls.locator('#effort').fill('72');
   await expect(controls.locator('#effortValue')).toHaveText('72%');
   await page.screenshot({ path: 'test-results/purity-desktop-controls.png' });
   await controls.locator('#controllerBack').click();
   await expect(controls).toBeHidden();
   await page.locator('#revealTools').click();
   await page.locator('#rotateLeft').click();
   await expect(page.locator('#course')).not.toHaveAttribute('data-camera-angle', '0.0000');
   await page.locator('#northView').click();
   await expect(page.locator('#course')).toHaveAttribute('data-camera-angle', '0.0000');
   await page.getByRole('link', { name: 'Back to home', exact: true }).click();
   await page.getByRole('navigation', { name: 'Game menu' }).getByText('How to play').click();
   await expect(page.locator('.guide-cards')).toBeVisible();
   await page.setViewportSize({ width: 1000, height: 550 });
   const guide = page.locator('[data-page=guide] .panel-scroll');
   await expect(guide).toBeVisible();
   expect(await guide.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
   await guide.evaluate((el) => {
      el.scrollTop = 200;
   });
   expect(await guide.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
   expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(
      true,
   );
   await page.screenshot({ path: 'test-results/purity-guide-panel.png' });
   await page.setViewportSize({ width: 1440, height: 1000 });
   await page.goBack();
   await expect(page.locator('.game-lobby')).toBeVisible();
   await page.locator('.game-actions [data-open-controls]').click();
   await expect(controls.locator('#effort')).toHaveValue('72');
   await expect(controls.locator('#club')).toHaveValue('6I');
   await controls.locator('#play').click();
   await expect(controls.locator('#play')).toHaveText('Show result');
   await expect(controls.locator('#play')).toHaveText('Next shot', { timeout: 20000 });
   await expect(controls).toBeHidden();
   await expect(page.locator('#displayTools')).toBeHidden();
   await page.locator('#revealTools').click();
   await page.locator('#toggleControls').click();
   await controls.locator('#play').click();
   await expect(controls.locator('#shot')).toHaveText('2');
   await controls.locator('#controllerBack').click();
   await expect(controls).toBeHidden();
   await page.locator('#revealTools').click();
   await page.locator('#toggleControls').click();
   await expect(controls.locator('#shot')).toHaveText('2');
   await controls.locator('#openSettings').click();
   await controls.locator('#theme').selectOption('light');
   await expect(controls).toHaveAttribute('data-theme', 'light');
   await controls.locator('#closeSettings').click();
   await page.locator('#revealTools').click();
   await page.locator('#pairButton').click();
   await expect(page.locator('#pairing')).toBeVisible();
   await page.getByRole('button', { name: 'Close pairing', exact: true }).click();
   await expect(controls.locator('#shot')).toHaveText('2');
   expect(errors).toEqual([]);
});

test('small-screen home and local controls remain usable without the relay', async ({ page }) => {
   await page.setViewportSize({ width: 390, height: 844 });
   await page.route('**/api/session', (route) => route.abort());
   await page.goto('/');
   await page.getByRole('link', { name: 'Enter the course' }).click();
   await expect(page.getByRole('link', { name: 'Choose UCG-50 Original' })).toBeVisible();
   await page.getByRole('link', { name: 'Choose Purity', exact: true }).click();
   await expect(page.locator('.game-lobby')).toBeVisible();
   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
   expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(
      true,
   );
   await page.locator('.game-actions [data-open-controls]').click();
   const controls = page.locator('#desktopControls');
   await expect(controls.locator('#controls')).toBeEnabled();
   await controls.locator('[data-panel="bag"]').click();
   await expect(controls.locator('#club')).toBeVisible();
   await controls.locator('#controllerBack').click();
   await expect(controls.locator('#touchpad')).toBeVisible();
   await controls.locator('#controllerBack').click();
   await expect(controls).toBeHidden();
   await page.locator('#revealTools').click();
   await page.locator('#pairButton').click();
   await expect(page.locator('#pairStatus')).toContainText('You can still play on this screen');
   await page.locator('#playHere').click();
   await expect(controls).toBeVisible();
});
