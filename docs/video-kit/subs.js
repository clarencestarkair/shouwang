const { chromium } = require("playwright");
const items = require("/tmp/sw-video/subs.json");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 170 } });
  for (const it of items) {
    await p.setContent(`<html><body style="margin:0;background:transparent;display:flex;align-items:center;justify-content:center;height:170px">
      <span style="font:600 46px 'PingFang SC';color:#fff;background:rgba(24,32,28,.78);padding:14px 34px;border-radius:14px;letter-spacing:1px">${it.text}</span></body></html>`);
    await p.screenshot({ path: it.png, omitBackground: true });
  }
  await b.close();
})();
