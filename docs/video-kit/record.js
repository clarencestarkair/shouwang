/* 录制演示素材：node record.js <scene>；输出 /tmp/sw-video/clips/<scene>*.webm 与 marks JSON */
const { chromium } = require("playwright");
const fs = require("fs");
const BASE = "http://localhost:3311";
const OUT = "/tmp/sw-video/clips";
const scene = process.argv[2];

const CURSOR = `
(() => {
  const init = () => {
    if (document.getElementById("__cur")) return;
    const c = document.createElement("div"); c.id = "__cur";
    c.style.cssText = "position:fixed;z-index:99999;left:0;top:0;width:26px;height:26px;pointer-events:none;transform:translate(-4px,-3px);transition:transform .05s";
    c.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2l14 10-6.5 1.2L15 21l-3 1.3-3.4-7.7L4 19z" fill="#1f2a24" stroke="#fff" stroke-width="1.4"/></svg>';
    document.body.appendChild(c);
    addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", (e) => {
      const r = document.createElement("div");
      r.style.cssText = "position:fixed;z-index:99998;pointer-events:none;width:44px;height:44px;border-radius:50%;border:3px solid #b8352a;left:" + (e.clientX - 22) + "px;top:" + (e.clientY - 22) + "px;transition:transform .5s ease-out,opacity .5s ease-out";
      document.body.appendChild(r); requestAnimationFrame(() => { r.style.transform = "scale(1.8)"; r.style.opacity = "0"; }); setTimeout(() => r.remove(), 600);
    }, true);
  };
  if (document.readyState !== "loading") init(); else addEventListener("DOMContentLoaded", init);
})();`;

const smoothScroll = (page, y, ms = 1800) => page.evaluate(([y, ms]) => new Promise((res) => {
  const s = scrollY, t0 = performance.now();
  const step = (t) => { const k = Math.min(1, (t - t0) / ms); const e = 1 - Math.pow(1 - k, 3); scrollTo(0, s + (y - s) * e); k < 1 ? requestAnimationFrame(step) : res(); };
  requestAnimationFrame(step);
}), [y, ms]);
const toEl = (page, sel, ms = 1600) => page.evaluate(([sel, ms]) => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect().top + scrollY - 90 : 0; }, [sel, ms]).then((y) => smoothScroll(page, y, ms));
const elderDone = async (page) => {
  await page.getByText("为什么说它有问题").waitFor({ timeout: 300000 });
  await page.waitForFunction(() => !document.querySelector('[aria-label="停止"]'), null, { timeout: 300000 });
};
