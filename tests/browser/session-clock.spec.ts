import { expect, test } from '@playwright/test';

test('paired shot resolves while the course renderer is suspended', async ({ browser }) => {
   test.setTimeout(120000);
   const display = await browser.newContext();
   const controller = await browser.newContext({ viewport: { width: 390, height: 844 } });
   try {
      const screen = await display.newPage(),
         phone = await controller.newPage();
      await screen.addInitScript(() => {
         // The real fallback dialog owns the screen without an expensive WebGL build.
         const context = HTMLCanvasElement.prototype.getContext;
         HTMLCanvasElement.prototype.getContext = function (
            this: HTMLCanvasElement,
            kind: string,
            ...args: unknown[]
         ) {
            if (kind === 'webgl') return null;
            return context.apply(this, [kind, ...args] as Parameters<typeof context>);
         } as typeof context;
         const clear = CanvasRenderingContext2D.prototype.clearRect;
         CanvasRenderingContext2D.prototype.clearRect = function (...args) {
            if (this.canvas.id === 'course')
               this.canvas.dataset.drawCount = String(
                  Number(this.canvas.dataset.drawCount || 0) + 1,
               );
            return clear.apply(this, args);
         };
      });
      await screen.goto('/?mode=display');
      await expect(screen.locator('#cockpitLink')).toHaveAttribute('href', /token=/);
      const url = new URL((await screen.locator('#cockpitLink').getAttribute('href'))!);
      url.hostname = '127.0.0.1';
      await phone.goto(url.href);
      await expect(phone.locator('#controls')).toBeEnabled();
      await phone.locator('#chooseClub').click();
      await phone.locator('[data-caddy="6I"]').click();
      await phone.locator('#backToShot').click();
      await phone.locator('#effort').fill('85');
      await screen.keyboard.press('Escape');
      await screen.locator('#openGameOptions').click();
      await screen.locator('[data-option-tab=world]').click();
      await screen.locator('#openLandscapePreview').click();
      const dialog = screen.locator('#landscapePreview'),
         course = screen.locator('#course');
      await expect(dialog).toBeVisible();
      const count = await course.getAttribute('data-draw-count');
      await phone.locator('#play').click();
      await expect(phone.locator('#play')).toHaveText('Show result');
      await expect(phone.locator('#play')).toHaveText('Next shot', { timeout: 30000 });
      await expect(phone.locator('#result')).toContainText('carry');
      await expect(course).toHaveAttribute('data-draw-count', count!);
      await dialog.getByRole('button', { name: 'Return to game options' }).click();
      await expect
         .poll(async () => Number(await course.getAttribute('data-draw-count')))
         .toBeGreaterThan(Number(count));
      await expect(phone.locator('#mulligan')).toBeEnabled();
   } finally {
      await display.close();
      await controller.close();
   }
});
