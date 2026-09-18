export {};
const mode = new URLSearchParams(location.search).get('mode');
if (mode === 'display' || mode === 'cockpit') {
   await import('./core/style/cockpit.css');
   if (mode === 'display') await (await import('./display/app')).startDisplay();
   else (await import('./cockpit/app')).startCockpit();
} else {
   await import('./core/style/reference.css');
   await import('./lab/play.js');
   const link = document.createElement('a');
   link.href = '/?mode=display';
   link.textContent = 'Open phone + display mode';
   link.style.cssText = 'display:block;margin-top:24px';
   document.querySelector('.welcome-content')?.append(link);
}
