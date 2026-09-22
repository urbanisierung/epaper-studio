# E-Paper Studio

A desktop app for the Waveshare PhotoPainter 7.3" e-paper display. Design a
daily calendar with birthdays and holidays, convert photos, and write both
straight to the SD card.

Nothing else to install: no Node, no Python, no ImageMagick. It is one app.

## What it does

- **A page per day.** Today's date, the birthdays and trips coming up, and the
  current month with today marked.
- **Six page designs.** The original — date tile, event list, chore rota,
  month grid — plus the five panel designs: Masthead, Ledger, Tiles, Poster
  and Agenda. Each switches to a birthday state when a birthday falls on the
  page's own day: the name and the new age become the largest things on the
  page and the accent turns into a solid fill. The five are drawn for a
  portrait 480 × 800 panel and show the date, the events and the month; chores
  stay on the original design.
- **Birthdays and holidays** are edited in the app — not in source code — and
  travel together with the chores: one JSON or CSV file holds all three, so a
  backup or a hand-over is a single file. Any one list can still be exported on
  its own for a spreadsheet. The `.ics` export carries the dates only —
  iCalendar can repeat an event but has no way to say whose turn it is.
- **A chore rota.** Recurring jobs with a rotation — bins out every other
  Tuesday, Anna then Ben then Cem — printed on the day they are due with the
  name of whoever's turn it is. One anchor date sets both the rhythm and the
  turn order, so nothing has to be kept in step by hand.
- **Photos** are resized to the panel and dithered to its seven colours, with
  a preview of the result before anything is written.
- **One Generate button** writes `pic/*.bmp` and `fileList.txt` to the SD card
  in the layout the display expects, and clears the previous run out of the way.
- **Twelve looks.** The interface is built from [cascivo](https://cascivo.com),
  so every first-party theme is one menu away — it ships on `brutalist` and
  will follow the OS light/dark preference if you ask it to.
- **In English or German.** The app itself is translated, and the language of
  the printed pages is set separately — so the pages can be German while the
  app is read in English, or the other way round. Weekday names, month names
  and the countdown text come from the language you pick for the pages, out of
  a longer list.

## Running it

From this directory:

```bash
pnpm install     # once, from the repository root
pnpm app:dev     # develop: Vite plus the Tauri window
pnpm app:build   # package a .dmg / .msi / .AppImage
```

The Rust image pipeline can be tested on its own, without a webview toolchain:

```bash
pnpm test       # cargo test, no webview toolchain needed
```

On Linux, `pnpm app:dev` needs the usual Tauri system libraries
(`libwebkit2gtk-4.1-dev`, `librsvg2-dev`, `patchelf`). macOS and Windows need
nothing beyond Rust and Node. See
<https://tauri.app/start/prerequisites/>.

## Releases

`.github/workflows/build-app.yaml` builds the app on GitHub for
macOS (one universal binary for Apple Silicon and Intel), Windows x86_64 and
Linux x86_64.

It runs on every pull request that touches this app and keeps the installers
as run artifacts. To cut a release, push a tag — the tag is the version:

```bash
git tag v0.1.0
git push origin v0.1.0
```

The workflow builds at the tagged version and attaches the `.dmg`, `.msi`,
`.exe`, `.AppImage`, `.deb` and `.rpm` to a draft GitHub release for you to
publish. It then writes that version into `src-tauri/tauri.conf.json` on the
default branch, so the manifest follows the release rather than having to be
bumped ahead of it.

The bundles are unsigned, so macOS and Windows warn the first time someone
runs them. Add the signing secrets from
<https://tauri.app/distribute/sign/> to the workflow to change that.

## Using it

The app's own language (English or German) and the light or dark theme are in
the top bar, next to **Import**, **Export**, **Open** and **Save**.

**Import** and **Export** cover every list at once, so they sit in the top bar
rather than on the individual tabs. **Import** reads birthdays, holidays and
chores out of a single file — JSON, CSV or ICS — and asks whether to add them
to what is already there or replace it; only the lists the file actually
carries are touched, so importing a file of birthdays will not empty your
holidays. **Export** writes all three together, or any one list on its own for
a spreadsheet. (**Open** and **Save** are for the whole project file, including
its settings and photos.)

1. **Setup** — pick portrait or landscape, the first day and how many days to
   cover, the page design, and the language the pages are printed in.
2. **Birthdays**, **Holidays** and **Chores** — type them in, or bring them in
   with **Import** in the top bar. A chore takes a name, how often it comes
   round (daily, weekly, fortnightly or monthly), the first day it is due, and
   the people who take turns in order — the first person listed takes that
   first turn. Leave the people empty for a job nobody is assigned. **Chores
   per page** on the Setup tab caps how many a page lists, and zero leaves them
   off entirely. A trip lasting several days takes one page, not one per day.
3. **Photos** — optional. Add pictures and check how they dither.
4. **Export** — plug in the SD card, choose it, press Generate.
5. **Display** — how to get the card back into the display, and how to change
   how often it turns the page.

The project is saved automatically. **Save** writes a copy you can back up or
give to someone else; **Open** loads one back.

## How it is put together

The interface is [cascivo](https://cascivo.com) — components, tokens and
themes from `@cascivo/react`, `@cascivo/themes` and `@cascivo/icons`, used
from the prebuilt package rather than copied in. There is no Tailwind and no
second set of design tokens: this app writes CSS only for the handful of
things the system has no opinion about (the panel-sized canvas, the seven
palette swatches, the list rows), in its own `cascivo.epaper` cascade layer so
the layer order stays the documented one.

```
src/                     React UI, and the drawing code (the webview's canvas)
  lib/i18n/              the app's own English and German catalogues
  lib/render/            layout, locale strings, page rendering, schedule, rota
  lib/render/templates/  the five panel designs and the month grid they share
  lib/io/                project file, CSV, ICS, calls into Rust
  components/ui/         the two compositions over cascivo this app repeats
src-tauri/
  src/commands.rs        the commands the UI calls
  crates/epaper-core/    BMP writer, 7-colour dithering, photo fitting
```

The webview draws the pages — it has the canvas and the fonts — and Rust
writes them, because it has the filesystem and the image codecs. A page
crosses that boundary once, as a base64 PNG. Photos never cross it: the UI
sends a path and Rust does the rest.

`epaper-core` has no Tauri dependency, so it builds and tests anywhere.

## Output on the card

```
<sd card>/
  fileList.txt      pic/20260716.bmp, one line per picture, in display order
  pic/
    20260716.bmp    24-bit BMP, the panel's resolution
    ...
```

Pictures must live in `pic` — the display ignores any other subfolder — and
the display is documented to handle 100 of them. The app warns past that.

## Translating it

`src/lib/i18n/en.ts` holds every string the app shows and is the source of
truth for the key set; `de.ts` is typed against it, so a string added in
English without a German translation fails the build rather than showing up
untranslated. A third language is a third file of the same shape plus an entry
in `LANGUAGES`.

Plurals are `key_one` / `key_other` picked by `Intl.PluralRules`, and `{name}`
placeholders are filled from the object passed to `t`.

## Fonts

Inter is bundled and used by default, so a page rendered on Windows, macOS and
Linux comes out identical. Other families are offered but depend on what the
machine has installed. That is the font of the **pages**; the app's own type
comes from the cascivo theme.

## Who made it

Built by [u11g.com](https://u11g.com), which the app links to from the bottom
of its sidebar.
