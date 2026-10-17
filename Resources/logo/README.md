# Logo source

`live-oak-sun-final-source.png` — 3600x2417, transparent. The master the site asset
is derived from.

The shipped asset is `src/assets/logo/logo.png` (1200x798): the master trimmed of its
219px/148px transparent margin, then resized. Regenerate with:

    magick Resources/logo/live-oak-sun-final-source.png -trim +repage \
      -resize 1200x -strip -define png:compression-level=9 src/assets/logo/logo.png

If the dimensions change, update the `width`/`height` on the `<Image>` in
`src/components/Header.astro` to match the new ratio — Astro generates the bitmap at
exactly those numbers, so a stale pair distorts it.

Derived files, all regenerated from the same asset:
- `public/favicon.png` (512x512, paper background)
- `public/apple-touch-icon.png` (180x180, paper background — iOS does not honour alpha)
- `public/og-default.jpg` (1200x630, job photo over a paper band holding the lockup)

The mark is still raster. A vector redraw is the open item in the README's launch list.
