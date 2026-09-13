# DealBench HQ server icon

Four options. Each ships as `.svg` (source of truth, scales to anything) and `.png` (512x512, what Discord wants).

See `_preview.png` for all four circle-cropped at the sizes Discord actually renders: 160px server header and 48px sidebar.

| File | Concept | Palette |
| --- | --- | --- |
| `a-benchmark` | three bars with a benchmark line, one bar clearing it | charcoal `#111310`, lime `#C6F24E`, white |
| `b-pricetag` | tag with a check cut through it | cream `#F4EFE6`, ink navy `#16233A` |
| `c-bench` | bench line with an arrow rising off it | plum `#331B3D`, white |
| `d-monogram` | geometric DB monogram | forest `#123524`, off-white `#F2EFE6` |

## To use

Discord: Server Settings → Overview → click the icon → upload the `.png`.

## To recolor

Open the `.svg` in any text editor and swap the hex values. The shapes are plain geometry, no gradients or effects, so recoloring is find-and-replace.

## Notes

- `c-bench` reads as a generic upload icon at small sizes. Known flaw, use with that in mind.
- `b-pricetag` reads closer to a verification badge than a price tag. Fine mark, different meaning than intended.
- `a-benchmark` and `d-monogram` hold up best at 48px.
