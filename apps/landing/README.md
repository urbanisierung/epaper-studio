# Landing page

The site for E-Paper Studio: what it does, how it works, where to download it.
An Astro build, deployed to Cloudflare Pages by
[`.github/workflows/deploy-landing.yaml`](../../.github/workflows/deploy-landing.yaml).

```bash
pnpm dev            # dev server
pnpm build          # static build into dist/
pnpm preview        # serve what was built
pnpm check-types    # astro check
```

## Notes

The page is one route, built from [cascivo](https://cascivo.com) components.
Everything is server-rendered to static HTML; only the FAQ accordion hydrates
(`client:visible`), because it is the only thing that has to open.

Two pieces of wiring are easy to get wrong and hard to diagnose, so both carry
a comment where they live:

- `astro.config.mjs` sets `vite.resolve.noExternal` for `@cascivo/*`. Without
  it the islands render with the right class names and no CSS at all.
- `src/layouts/Layout.astro` emits the cascade-layer order inline, ahead of
  Astro's stylesheet link. Astro puts per-component CSS first in the bundle, so
  an order statement inside the bundle arrives after `cascivo.component` has
  already taken the first slot — which would make the components the *lowest*
  layer instead of the fourth.

The project's links, name and description all live in `src/lib/site.ts`.
