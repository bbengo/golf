/** Visible native radio choices backed by the existing validated select value. */
export function exposeChoices(select: HTMLSelectElement) {
   const row = select.parentElement!;
   if (row.tagName === 'LABEL') {
      const replacement = document.createElement('div');
      replacement.className = row.className;
      replacement.append(...Array.from(row.childNodes));
      row.replaceWith(replacement);
   }
   const group = document.createElement('fieldset');
   group.className = 'choice-control';
   const legend = document.createElement('legend');
   const name = select.getAttribute('aria-label') || select.id;
   legend.textContent = name;
   legend.className = 'visually-hidden';
   group.append(legend);
   for (const option of select.options) {
      const label = document.createElement('label'),
         input = document.createElement('input'),
         text = document.createElement('span');
      input.type = 'radio';
      input.name = `choice-${select.id || select.dataset.presentation}`;
      input.value = option.value;
      text.textContent = option.text;
      input.onchange = () => {
         if (input.checked) {
            select.value = input.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
         }
      };
      label.append(input, text);
      group.append(label);
   }
   select.hidden = true;
   select.setAttribute('aria-hidden', 'true');
   select.after(group);
   const sync = () => {
      for (const radio of group.querySelectorAll<HTMLInputElement>('input'))
         radio.checked = radio.value === select.value;
   };
   select.addEventListener('change', sync);
   sync();
   return sync;
}
