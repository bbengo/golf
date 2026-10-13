/** Validated display preferences; no writes to shot state or physics. */
export const PRESENTATION_CHOICES = {
   renderQuality: ['balanced', 'economy', 'crisp'],
   cameraFeel: ['balanced', 'responsive', 'cinematic'],
   ballColour: ['ivory', 'yellow'],
   ballVisibility: ['standard', 'enhanced'],
   shotTrace: ['off', 'last'],
   impactCue: ['subtle', 'off'],
} as const;
export type Presentation = {
   [K in keyof typeof PRESENTATION_CHOICES]: (typeof PRESENTATION_CHOICES)[K][number];
};
export const DEFAULT_PRESENTATION: Presentation = {
   renderQuality: 'balanced',
   cameraFeel: 'balanced',
   ballColour: 'ivory',
   ballVisibility: 'standard',
   shotTrace: 'off',
   impactCue: 'subtle',
};
export function presentationChoice<K extends keyof Presentation>(
   key: K,
   value: unknown,
): Presentation[K] {
   return (PRESENTATION_CHOICES[key] as readonly unknown[]).includes(value)
      ? (value as Presentation[K])
      : DEFAULT_PRESENTATION[key];
}
export function readPresentation(dataset: DOMStringMap): Presentation {
   return Object.fromEntries(
      Object.keys(DEFAULT_PRESENTATION).map((key) => [
         key,
         presentationChoice(key as keyof Presentation, dataset[key]),
      ]),
   ) as Presentation;
}
