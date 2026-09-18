export {};
const mode = new URLSearchParams(location.search).get('mode');
if (mode !== 'lab') {
   await import('./core/style/cockpit.css');
   if (mode === 'cockpit') (await import('./cockpit/app')).startCockpit();
   else {
      await import('./core/style/experience.css');
      await (await import('./display/app')).startDisplay();
   }
} else {
   await import('./core/style/reference.css');
   await import('./lab/play.js');
   const link = document.createElement('a');
   link.href = '/';
   link.textContent = 'Return to Purity';
   link.style.cssText = 'display:block;margin-top:24px';
   document.querySelector('.welcome-content')?.append(link);
}
