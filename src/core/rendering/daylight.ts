/** Artistic sun positions in world coordinates (east, north); not a geographic clock. */
export const DAYLIGHT = {
   morning: { x: 1, y: 0.35, length: 1.7, warmth: '#f8cc8320' },
   day: { x: -0.45, y: 0.8, length: 0.8, warmth: '#f8d3940b' },
   evening: { x: -1, y: 0.25, length: 2, warmth: '#efae6828' },
} as const;
export type Daylight = keyof typeof DAYLIGHT;
export const daylightChoice = (value: string | undefined | null): Daylight =>
   value === 'morning' || value === 'evening' ? value : 'day';
