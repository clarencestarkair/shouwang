const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto("file:///tmp/sw-video/slides.html"); await p.waitForTimeout(600);
  for (const id of ["s01", "s02", "s08m", "s09", "s10", "s10b", "s11", "s12"]) await p.locator("#" + id).screenshot({ path: `/tmp/sw-video/slides/${id}.png` });
  await b.close();
})();
