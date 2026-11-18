# K3C.3 comparison screenshots

Captured in Chromium/Playwright from v0.17.44/build 1574. These are browser
emulations, not photographs or physical Android tests. No system bars are drawn.

The portrait/landscape pair uses the same Pixel 8 Pro user-agent, DPR 2.625 and
local opening frame: 384×855 CSS pixels in portrait and 855×384 in landscape.

- [Portrait comparison](portrait.png): original portrait presentation.
- [Landscape, default panels](landscape.png): Players and Last turn open.
- [Landscape, all panels open](landscape-all-expanded.png): normal aiming.
- [Landscape, all panels open, spin](phone-expanded-spin.png): same table size;
  the five original presets occupy the compact header.
- [740×360, all panels open, spin](short-phone-expanded-spin.png): DPR 1.
- [960×540, all panels closed, spin](wide-phone-collapsed-spin.png): DPR 1;
  collapsing the information rail lets the table grow into recovered width.
- [Desktop landscape](desktop.png): preserved manual layout arrangement.

[Raw rendered dimensions](table-dimensions.json) and the
[QA report](../../K3C.3-QA.md) record the comparison method, results and limits.
