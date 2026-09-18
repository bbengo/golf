const paths: Record<string, string> = {
   back: 'M14 5l-7 7 7 7',
   settings: 'M4 7h16M4 17h16M8 4v6m8 4v6',
   shot: 'M12 3v4m0 10v4M3 12h4m10 0h4M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0',
   bag: 'M6 10h12l-1 11H7L6 10Zm3 0V3l-3-1m7 8V2l3 1m-1 7V5l3 1',
   flag: 'M5 21V3m0 0c5-3 9 3 14 0v10c-5 3-9-3-14 0',
   club: 'M7 3l8 15m0 0 5-2c2 4-1 6-4 5l-3-1 2-2',
};
export const icon = (name: string) =>
   `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.shot}"/></svg>`;
