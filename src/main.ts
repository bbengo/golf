export {};
const mode = new URLSearchParams(location.search).get('mode');
function ready() {
   document.getElementById('bootScreen')?.remove();
   document.body.removeAttribute('data-booting');
}
if (mode !== 'lab') {
   await import('./core/style/cockpit.css');
   if (mode === 'cockpit') {
      const app = await import('./cockpit/app');
      ready();
      app.startCockpit();
   } else {
      await import('./core/style/experience.css');
      const app = await import('./display/app');
      ready();
      await app.startDisplay();
   }
} else {
   document.title = 'UCG-50';
   await import('./core/style/reference.css');
   ready();
   await import('./lab/play.js');
   const link = document.createElement('a');
   link.href = '/#editions';
   link.textContent = 'Choose experience: Purity / UCG-50 Original';
   link.style.cssText = 'display:block;margin-top:24px';
   document.querySelector('.welcome-content')?.append(link);
}
