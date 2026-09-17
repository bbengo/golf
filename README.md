# Golf / Purity cockpit study

The UCG-50 R06 desktop lab, extracted into a Vite application. New code uses
TypeScript; the existing simulation and UI remain JavaScript ES modules during
the gradual migration. `UCG50_R06_Play.html` is the unchanged reference.

```sh
npm install
npx playwright install chromium  # once, for browser checks
npm run dev
npm run typecheck
npm test
npm run test:e2e
npm run build
```

The default application is currently the combined desktop lab. Phone pairing,
the display-only surface, and revised physics are planned work, not implemented.
Development and runtime stay local. All assets are served from this project.

See [architecture](docs/architecture.md) for ownership and migration boundaries,
and the [physics roadmap](docs/physics-roadmap.md) for the later research track.

The extraction comparison tests execute the original simulation separately and
compare complete seeded shot records. They verify preserved behavior, not
physical accuracy. Browser tests cover the opening-to-play journey and a shot.
The baseline build still reports a large JavaScript chunk because sampled terrain
data is embedded in the course module; separating that data is follow-up work.

The one-time `scripts/extract-reference.mjs` records how the baseline was migrated.
It refuses to overwrite the extracted application; do not rerun it as a build step.
