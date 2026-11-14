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

async function newRecPage(browser, name, w, h, fontLevel = 3) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, recordVideo: { dir: OUT, size: { width: w, height: h } } });
  await ctx.addInitScript(CURSOR);
  await ctx.addInitScript((lv) => {
    try { localStorage.setItem("shouwang-settings", JSON.stringify({ state: { elderName: "妈妈", familyPhone: "", autoSpeak: false, fontLevel: lv }, version: 0 })); } catch {}
  }, fontLevel);
  const page = await ctx.newPage();
  const t0 = Date.now();
  const marks = { name, start: 0, waits: [], end: 0 };
  const now = () => (Date.now() - t0) / 1000;
  return {
    page, ctx, marks, now,
    async click(locator) {
      const box = await locator.boundingBox();
      if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 22 });
      await page.waitForTimeout(250);
      await locator.click();
    },
    async wait(fn) { const a = now(); await fn(); marks.waits.push([a, now()]); },
    async finish() { marks.end = now(); const v = page.video(); await ctx.close(); fs.renameSync(await v.path(), `${OUT}/${name}.webm`); fs.writeFileSync(`${OUT}/${name}.json`, JSON.stringify(marks)); },
  };
}

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

(async () => {
  const b = await chromium.launch();
  if (scene === "s03") {
    const r = await newRecPage(b, "s03", 1920, 1080);
    await r.page.goto(BASE + "/", { waitUntil: "load" }); await r.page.waitForTimeout(800); r.marks.start = r.now();
    await r.page.waitForTimeout(4000);
    for (let i = 0; i < 5; i++) {
      await r.page.evaluate((i) => { const el = document.querySelectorAll("ol li[data-i]")[i]; const y = el.getBoundingClientRect().top + scrollY - innerHeight / 2 + el.offsetHeight / 2; window.__y = y; }, i);
      const y = await r.page.evaluate(() => window.__y);
      await smoothScroll(r.page, y, 1400); await r.page.waitForTimeout(2200);
    }
    await toEl(r.page, "section:nth-of-type(3)", 1600); await r.page.waitForTimeout(3500);
    await r.finish();
  }
  if (scene === "s04") {
    const r = await newRecPage(b, "s04", 1920, 1080);
    await r.page.goto(BASE + "/elder", { waitUntil: "load" }); await r.page.waitForTimeout(800); r.marks.start = r.now();
    await r.page.waitForTimeout(2500);
    await r.click(r.page.getByRole("button", { name: /刚才有个男的/ }));
    await r.wait(async () => {
      await r.page.getByText("为什么说它有问题").waitFor({ timeout: 300000 });
      await r.page.waitForFunction(() => !document.querySelector('[aria-label="停止"]'), null, { timeout: 300000 });
    });
    await toEl(r.page, 'article[aria-label="风险判断结果"]'); await r.page.waitForTimeout(6000);
    await toEl(r.page, 'section[aria-label="骗局进行到哪一步"]'); await r.page.waitForTimeout(5000);
    await toEl(r.page, 'section[aria-label="证据标注"]'); await r.page.waitForTimeout(6000);
    await r.finish();
  }
  if (scene === "s06") {
    // AI 指挥台：注入短信
    const r = await newRecPage(b, "s06", 1920, 1080);
    const p = r.page;
    await p.goto(BASE + "/console", { waitUntil: "load" }); await p.waitForTimeout(800); r.marks.start = r.now();
    await p.waitForTimeout(2000);
    await r.click(p.getByRole("button", { name: /藏话/ }));
    await r.wait(() => p.waitForFunction(() => document.body.innerText.includes("已完成"), null, { timeout: 300000 }));
    await p.waitForTimeout(1500);
    await toEl(p, 'section[aria-label="AI 指挥台"]', 1600); await p.waitForTimeout(4500);
    await smoothScroll(p, await p.evaluate(() => scrollY + 520), 1800); await p.waitForTimeout(4500);
    await smoothScroll(p, await p.evaluate(() => scrollY + 520), 1800); await p.waitForTimeout(5000);
    await r.finish();
  }
  if (scene === "s05c") {
    const r = await newRecPage(b, "s05c", 1920, 1080);
    const p = r.page;
    await p.goto(BASE + "/family", { waitUntil: "load" });
    await p.waitForFunction(() => /AI 生成|模板生成/.test(document.body.innerText), null, { timeout: 120000 }).catch(() => {});
    await p.waitForTimeout(800); r.marks.start = r.now();
    await p.waitForTimeout(3500);
    await r.click(p.getByRole("tab", { name: "妈妈" })); await p.waitForTimeout(3000);
    await smoothScroll(p, 520, 2200); await p.waitForTimeout(4000);
    await smoothScroll(p, 1050, 2200); await p.waitForTimeout(4000);
    await smoothScroll(p, 99999, 2200); await p.waitForTimeout(5000);
    await r.finish();
  }
  if (scene === "s05") {
    await fetch(BASE + "/api/alerts", { method: "DELETE" });
    const fam = await newRecPage(b, "s05-family", 960, 1080);
    const eld = await newRecPage(b, "s05-elder", 960, 1080, 2);
    await fam.page.goto(BASE + "/family", { waitUntil: "load" });
    await eld.page.goto(BASE + "/elder", { waitUntil: "load" });
    await eld.page.waitForTimeout(1000);
    eld.marks.start = eld.now(); fam.marks.start = fam.now();
    await eld.page.waitForTimeout(2500);
    await eld.click(eld.page.getByRole("button", { name: /福利传单/ }));
    const a = eld.now(), af = fam.now();
    await elderDone(eld.page);
    eld.marks.waits.push([a, eld.now()]); fam.marks.waits.push([af, fam.now()]);
    await eld.page.waitForTimeout(500);
    await toEl(eld.page, 'article[aria-label="风险判断结果"]'); await eld.page.waitForTimeout(3000);
    await fam.page.mouse.move(700, 900, { steps: 15 });
    await smoothScroll(fam.page, 520, 2000); await eld.page.waitForTimeout(5000);
    await Promise.all([eld.finish(), fam.finish()]);
  }
  if (scene === "s07") {
    const r = await newRecPage(b, "s07", 1920, 1080);
    const p = r.page;
    await p.goto(BASE + "/drill", { waitUntil: "load" }); await p.waitForTimeout(800); r.marks.start = r.now();
    await p.waitForTimeout(2000);
    await r.click(p.getByRole("button", { name: /冒充公安称涉嫌洗钱/ }));
    await p.waitForTimeout(1000);
    await r.click(p.getByRole("button", { name: "接听" }));
    const bubbles = "div.justify-start p, div.justify-start > div";
    // 等待新的骗子消息出现且流式输出结束（文字长度连续两次不变、输入指示消失）
    const waitNew = async (prev) => {
      let last = -1;
      for (;;) {
        const n = await p.locator(bubbles).count();
        const typing = await p.getByLabel("对方正在输入").count();
        if (n > prev && !typing) {
          const len = await p.locator(bubbles).last().innerText().then((t) => t.length).catch(() => 0);
          if (len === last) return n;
          last = len;
        }
        await p.waitForTimeout(900);
      }
    };
    let n = 0;
    await r.wait(async () => { n = await waitNew(0); });
    await p.waitForTimeout(3500);
    for (const reply of ["你们真的是警察吗？我要先问问我儿子", "我不转，我要挂了去派出所问"]) {
      if (await p.getByPlaceholder("演练已结束").count()) break;
      const input = p.getByPlaceholder(/像平时一样回答他/);
      await r.click(input); await input.pressSequentially(reply, { delay: 90 }); await p.keyboard.press("Enter");
      await r.wait(async () => { n = await waitNew(n); });
      await p.waitForTimeout(3500);
    }
    await r.click(p.getByRole("button", { name: /看看我表现得怎么样|结束演练/ }));
    await r.wait(() => p.getByText("防骗得分").waitFor({ timeout: 240000 }));
    await p.waitForTimeout(6000);
    await r.finish();
  }
  if (scene === "s08") {
    const r = await newRecPage(b, "s08", 1920, 1080);
    const p = r.page;
    await p.goto(BASE + "/cases", { waitUntil: "load" }); await p.waitForTimeout(800); r.marks.start = r.now();
    await p.waitForTimeout(1500);
    const input = p.getByPlaceholder(/用自己的话描述/);
    await r.click(input); await input.pressSequentially("有人打电话说我孙子出事了要赔钱", { delay: 110 });
    await r.wait(() => p.waitForFunction(() => document.body.innerText.includes("混合检索") && !document.querySelector("label .animate-spin"), null, { timeout: 60000 }));
    await p.waitForTimeout(4000);
    await smoothScroll(p, 380, 1800); await p.waitForTimeout(3500);
    await r.finish();
  }
  if (scene === "s08b") {
    const r = await newRecPage(b, "s08b", 1920, 1080, 1);
    const p = r.page;
    await p.goto(BASE + "/elder", { waitUntil: "load" }); await p.waitForTimeout(800); r.marks.start = r.now();
    await p.waitForTimeout(2000);
    await r.click(p.getByRole("button", { name: "设置" })); await p.waitForTimeout(2500);
    for (const lv of ["大", "特大"]) { await r.click(p.getByRole("button", { name: lv, exact: true })); await p.waitForTimeout(2600); }
    await r.click(p.getByRole("button", { name: "完成", exact: true })); await p.waitForTimeout(2500);
    await r.finish();
  }
  await b.close();
})();
