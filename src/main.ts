export {};
const mode = new URLSearchParams(location.search).get('mode');
const boot = document.getElementById('bootScreen')!;
const message = document.getElementById('bootMessage')!;
// Preserve loading while each application replaces body contents.
document.documentElement.append(boot);
function prepare(text: string) {
   message.textContent = text;
   document.body.removeAttribute('data-booting');
}
async function ready() {
   await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
   boot.classList.add('leaving');
   if (matchMedia('(prefers-reduced-motion: reduce)').matches) boot.remove();
   else {
      boot.addEventListener('transitionend', () => boot.remove(), { once: true });
      setTimeout(() => boot.remove(), 450);
   }
}
try {
   if (mode !== 'lab') {
      await import('./core/style/cockpit.css');
      if (mode === 'cockpit') {
         const app = await import('./cockpit/app');
         prepare('Opening your controller');
         app.startCockpit();
         void ready();
      } else {
         await import('./core/style/experience.css');
         const app = await import('./display/app');
         prepare('Preparing Creek & Shoulder');
         await app.startDisplay(() => void ready());
      }
   } else {
      document.title = 'UCG-50';
      await import('./core/style/reference.css');
      prepare('Opening UCG-50 Original');
      await import('./lab/play.js');
      const link = document.createElement('a');
      link.href = '/#editions';
      link.textContent = 'Choose experience: Purity / UCG-50 Original';
      link.style.cssText = 'display:block;margin-top:24px';
      document.querySelector('.welcome-content')?.append(link);
      void ready();
   }
} catch (error) {
   console.error('Purity could not start', error);
   message.textContent = 'Unable to open the experience. Please try again.';
   boot.querySelector<HTMLElement>('.boot-indicator')!.hidden = true;
   boot.querySelector<HTMLElement>('#bootRetry')!.hidden = false;
}
