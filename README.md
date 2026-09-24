# E-Paper Studio

Your calendar and your photos, on a
[Waveshare PhotoPainter 7.3"](https://www.waveshare.com/product/photopainter.htm)
e-paper display.

The PhotoPainter is a battery-powered picture frame that reads bitmaps off an
SD card and turns the page every few hours. **E-Paper Studio** is a desktop app
that fills that card: a page for every day, carrying the date, the birthdays
and trips coming up, whose turn it is at the chores, and the current month with
today circled — plus any photos you want between them.

Nothing else has to be installed alongside it. No Node, no Python, no
ImageMagick: the image pipeline is built in.

## Download

Installers for macOS (one universal build for Apple Silicon and Intel), Windows
x86_64 and Linux x86_64 are attached to every
[release](https://github.com/urbanisierung/epaper-studio/releases/latest).

They are not code-signed yet, so macOS and Windows warn the first time one is
opened. Building from source avoids the warning.

The app draws its window with the system's own web engine, so it needs a recent
one: **macOS 12 Monterey or later with Safari 17.4+**, or on Windows the
**Microsoft Edge WebView2 Runtime 114+** (it updates itself unless updates are
blocked). On anything older the app says so instead of starting.

## What is in here

| Path | What it is |
| --- | --- |
| [`apps/studio`](./apps/studio) | The desktop app: a Tauri 2 shell, a React UI, and `epaper-core`, the Rust image pipeline. Its [README](./apps/studio/README.md) is the one to read. |
| [`apps/landing`](./apps/landing) | The landing page — an Astro site, deployed to Cloudflare Pages. |

Both are built from the same design system,
[cascivo](https://cascivo.com), so the site and the app look like one thing.

## Working on it

```bash
pnpm install          # once, from here

pnpm studio           # the desktop app: Vite plus the Tauri window
pnpm landing          # the landing page on a dev server

pnpm build            # build everything
pnpm test             # the Rust image pipeline's tests
pnpm check-types      # tsc / astro check, per app
pnpm lint             # Biome: lint and formatting
pnpm format           # Biome: apply the safe fixes
```

The desktop app needs a Rust toolchain, and on Linux the usual Tauri system
libraries (`libwebkit2gtk-4.1-dev`, `librsvg2-dev`, `patchelf`) — see
<https://tauri.app/start/prerequisites/>. The landing page needs neither.

### How it is put together

- **pnpm workspaces** and **Turborepo** for the two apps. Nothing is imported
  across them by a relative path; there is nothing shared to import yet.
- **Biome** is the only linter and formatter. There is no ESLint and no
  Prettier alongside it.
- **TypeScript** is strict everywhere.
- The desktop app is **React 19** under **Tauri 2**; the landing page is
  **Astro** with React islands. cascivo is a React design system, and Preact
  under Astro is
  [documented as broken](https://cascivo.com/docs/using-with-astro) — so the
  site uses React islands, and only the FAQ accordion hydrates.

## Continuous integration

| Workflow | What it does |
| --- | --- |
| [`checks.yaml`](./.github/workflows/checks.yaml) | Biome and the type-checkers, on every pull request. |
| [`build-app.yaml`](./.github/workflows/build-app.yaml) | Tests and lints `epaper-core`, then builds the desktop app for all three platforms. On a `v*` tag it attaches the installers to a draft release and writes the tagged version back into `tauri.conf.json`. |
| [`deploy-landing.yaml`](./.github/workflows/deploy-landing.yaml) | Builds the landing page on every pull request, and publishes it to Cloudflare Pages from `main`. |

The deploy needs two repository secrets — `CF_ACCOUNT_ID` and `CF_API_TOKEN`
(a token with the *Cloudflare Pages: Edit* permission) — and a Pages project
named `u11g-epaper-studio` that already exists. Nothing else in CI needs a
secret.

### Cutting a release

The tag is the version. Push one:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The workflow builds all three platforms at the tagged version and attaches the
installers to a draft release for you to publish. It then commits that version
into `apps/studio/src-tauri/tauri.conf.json` on `main`, so the manifest the app
ships always matches the release it came from — there is nothing to bump by
hand beforehand.

## Your data

The app talks to no server. The project file — settings, birthdays, holidays,
chores, the list of photos — is saved on your own machine, and the only thing
that leaves it is what you write to the SD card yourself. Nothing in this
repository ships anybody's dates.

## Licence

MIT. See [LICENSE](./LICENSE).

Built by [u11g.com](https://u11g.com).
