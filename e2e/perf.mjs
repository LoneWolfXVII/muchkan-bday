// usage: node e2e/perf.mjs  (after npm run build) — frame-time stats while wheel-scrolling, per variant
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '4175', '--strictPort'], { stdio: 'ignore' })
while (!(await fetch('http://localhost:4175').then((r) => r.ok).catch(() => false))) await new Promise((r) => setTimeout(r, 200))
const browser = await chromium.launch()

async function run(name, { css = '', reduce = false, throttle = 4 } = {}) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, reducedMotion: reduce ? 'reduce' : 'no-preference' })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle })
  await page.goto('http://localhost:4175')
  if (css) await page.addStyleTag({ content: css })
  await page.waitForTimeout(2500)
  await page.evaluate(() => {
    window.__d = []; let last = performance.now()
    const f = (t) => { window.__d.push(t - last); last = t; if (window.__d.length < 100000) requestAnimationFrame(f) }
    requestAnimationFrame(f)
  })
  await page.mouse.move(195, 400)
  for (let i = 0; i < 150; i++) { await page.mouse.wheel(0, 40); await page.waitForTimeout(16) }
  await page.waitForTimeout(500)
  const d = await page.evaluate(() => window.__d.slice(5))
  d.sort((a, b) => a - b)
  const p = (q) => d[Math.floor(d.length * q)].toFixed(1)
  console.log(name.padEnd(22), 'frames', d.length, 'p50', p(0.5), 'p95', p(0.95), 'max', d[d.length - 1].toFixed(0), '>33ms', d.filter((x) => x > 33).length)
  await page.close()
}

await run('full')
await run('no grain', { css: 'body::after{display:none!important}' })
await run('no star glow', { css: '[data-star]{box-shadow:none!important}' })
await run('no grain+glow', { css: 'body::after{display:none!important}[data-star]{box-shadow:none!important}' })
await run('reduced (no lenis)', { reduce: true })
await browser.close(); server.kill()
