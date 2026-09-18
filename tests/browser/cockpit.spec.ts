import { expect, test } from '@playwright/test';

test('QR pairing, live controls, shot, phone reconnect, and display isolation', async ({
   browser,
}) => {
   test.setTimeout(90000);
   const displayContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
   const phoneContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
   });
   const screen = await displayContext.newPage(),
      phone = await phoneContext.newPage();
   const errors: string[] = [],
      images: string[] = [],
      phoneAssets: string[] = [];
   for (const page of [screen, phone]) page.on('pageerror', (e) => errors.push(e.message));
   screen.on('request', (r) => {
      if (r.resourceType() === 'image' && !r.url().startsWith('data:')) images.push(r.url());
   });
   phone.on('request', (r) => phoneAssets.push(r.url()));
   await screen.goto('http://127.0.0.1:5181/?mode=display');
   await expect(screen.locator('#qr')).toBeVisible();
   await expect(screen.locator('#cockpitLink')).toHaveAttribute('href', /token=/);
   const url = new URL((await screen.locator('#cockpitLink').getAttribute('href'))!);
   url.hostname = '127.0.0.1';
   await phone.goto(url.href);
   await expect(phone.locator('#controls')).toBeEnabled();
   await expect(screen.locator('#pairing')).toBeHidden();
   await expect(phone.locator('canvas')).toHaveCount(0);
   await expect(screen.locator('aside, input, #shotPanel')).toHaveCount(0);
   const course = screen.locator('#course');
   expect(await course.boundingBox()).toEqual({ x: 0, y: 0, width: 1440, height: 900 });
   expect(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
   );
   const distanceBeforeCamera = await phone.locator('#distance').textContent();
   await screen.mouse.move(800, 450);
   await screen.mouse.wheel(0, -300);
   await expect
      .poll(async () => Number(await course.getAttribute('data-camera-zoom')))
      .toBeGreaterThan(1.5);
   const cameraX = await course.getAttribute('data-camera-x');
   await screen.mouse.down();
   await screen.mouse.move(950, 500, { steps: 8 });
   await screen.mouse.up();
   await expect(course).not.toHaveAttribute('data-camera-x', cameraX!);
   await expect(phone.locator('#distance')).toHaveText(distanceBeforeCamera!);
   await phone.locator('[data-view="hole"]').click();
   await expect(course).toHaveAttribute('data-camera-zoom', '1.000');
   await phone.locator('#club').selectOption('6I');
   await phone.locator('#effort').fill('85');
   await expect(phone.locator('#effortValue')).toHaveText('85%');
   const before = await phone.locator('#distance').textContent();
   await phone.locator('[aria-label="Move up"]').click();
   await expect(phone.locator('#distance')).not.toHaveText(before!);
   await screen.screenshot({ path: 'test-results/procedural-course.png' });
   await phone.screenshot({ path: 'test-results/cockpit-phone.png', fullPage: true });
   await phone.reload();
   await expect(phone.locator('#controls')).toBeEnabled();
   await expect(phone.locator('#club')).toHaveValue('6I');
   await expect(phone.locator('#effort')).toHaveValue('85');
   await phone.locator('#play').click();
   await expect(phone.locator('#play')).toHaveText('Show result');
   await expect(course).toHaveAttribute('data-camera-mode', 'follow');
   await screen.mouse.move(850, 450);
   await screen.mouse.wheel(0, -120);
   await expect(course).toHaveAttribute('data-camera-mode', 'manual');
   await expect(phone.locator('#result')).toContainText('carry');
   await expect(phone.locator('#play')).toHaveText('Next shot', { timeout: 20000 });
   await expect(phone.locator('.aim-card')).toBeHidden();
   await expect(phone.locator('#mulligan')).toBeEnabled();
   await phone.locator('#mulligan').click();
   await expect(phone.locator('#play')).toHaveText('Play this shot');
   await expect(course).toHaveAttribute('data-camera-zoom', '3.000');
   await screen.emulateMedia({ reducedMotion: 'reduce' });
   await phone.locator('[data-view="hole"]').click();
   await expect(course).toHaveAttribute('data-camera-zoom', '1.000');
   await phone.locator('#play').click();
   await expect(phone.locator('#play')).toHaveText('Show result');
   await expect(course).toHaveAttribute('data-camera-mode', 'framed');
   await expect(course).toHaveAttribute('data-camera-zoom', '1.000');
   await expect(phone.locator('#play')).toHaveText('Next shot', { timeout: 20000 });
   expect(images).toEqual([]);
   await phone.getByRole('button', { name: 'Course settings', exact: true }).click();
   await expect(phone.getByRole('dialog')).toBeVisible();
   await phone.locator('#renderer').selectOption('photo');
   await expect
      .poll(() => images.filter((url) => url.includes('/assets/reference/')).length)
      .toBeGreaterThan(0);
   await phone.locator('#renderer').selectOption('procedural');
   await phone.close();
   await expect(screen.locator('#course')).toBeVisible();
   await expect(screen.locator('#pairing')).toBeHidden();
   expect(phoneAssets.some((url) => /\/assets\/(shot|photo-renderer|play)-/.test(url))).toBe(false);
   expect(errors).toEqual([]);
   await phoneContext.close();
   await displayContext.close();
});
