const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const [src, out] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto("file://" + path.resolve(src), { waitUntil: "load" });
  await p.waitForTimeout(500);
  await p.pdf({
    path: out, format: "A4", printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate: '<div style="width:100%;font-size:8px;color:#8a8f88;padding:0 17mm;display:flex;justify-content:space-between;font-family:PingFang SC"><span>守望 · 银发反诈守护 Agent · 技术文档</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
    margin: { top: "18mm", bottom: "18mm", left: "17mm", right: "17mm" },
  });
  await b.close();
})();
