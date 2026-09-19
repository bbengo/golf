import { CLUBS, type Intent } from '../core/contracts/cockpit';

export const clubNames: Record<Intent['club'], string> = {
   D: 'Driver',
   '3W': '3 wood',
   '4I': '4 iron',
   '6I': '6 iron',
   '8I': '8 iron',
   PW: 'Pitching wedge',
   SW: 'Sand wedge',
   CHIP: 'Chip',
   PUTT: 'Putter',
};
const purposes = [
   'Tee distance',
   'Long approach',
   'Low approach',
   'Versatile approach',
   'Higher approach',
   'Short approach',
   'Sand & loft',
   'Greenside technique',
   'On the green',
];

/** Original SVG silhouettes; equipment families, not licensed club models. */
export function clubArt(club: Intent['club']) {
   const wood = club === 'D' || club === '3W';
   const head = wood
      ? 'M34 65c-7-5-16-2-16 5s13 12 22 6l3-7Z'
      : club === 'PUTT'
        ? 'M19 68h25v8H19Z'
        : 'M35 63 18 72q-3 6 4 7l20-6-2-8Z';
   return `<svg class="caddy-art" viewBox="0 0 64 90" aria-hidden="true"><path d="M19 9 37 68" fill="none" stroke="currentColor" stroke-width="2"/><path d="m19 9 5 17" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="${head}" fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width="1.5"/><path d="m24 73 12-4" stroke="currentColor" stroke-opacity=".6"/></svg>`;
}
export function caddyMarkup() {
   return `<div class="caddy-grid" role="group" aria-label="Choose a club">${CLUBS.map((c, i) => `<button type="button" data-caddy="${c}" aria-pressed="false">${clubArt(c)}<span><strong>${clubNames[c]}</strong><small>${purposes[i]}</small></span><span class="caddy-check" aria-hidden="true">✓</span></button>`).join('')}</div>`;
}
export function mountCaddy(root: HTMLElement, select: HTMLSelectElement, chosen?: () => void) {
   const buttons = root.querySelectorAll<HTMLButtonElement>('[data-caddy]');
   for (const button of buttons)
      button.onclick = () => {
         if (select.disabled) return;
         select.value = button.dataset.caddy!;
         select.dispatchEvent(new Event('input', { bubbles: true }));
         chosen?.();
      };
   return () => {
      for (const button of buttons) {
         button.disabled = select.disabled;
         button.setAttribute('aria-pressed', String(button.dataset.caddy === select.value));
      }
   };
}
