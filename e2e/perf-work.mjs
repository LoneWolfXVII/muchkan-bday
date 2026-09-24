// usage: node e2e/perf-work.mjs (after npm run build): main-thread work while idling at the finale and scrolling, 4x CPU throttle
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '4179', '--strictPort'], { stdio: 'ignore' })
while (!(await fetch('http://localhost:4179').then((r) => r.ok).catch(() => false))) await new Promise((r) => setTimeout(r, 200))
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
const cdp = await page.context().newCDPSession(page)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
await cdp.send('Performance.enable')
await page.goto('http://localhost:4179')
await page.waitForTimeout(2500)
const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]))
const delta = (a, b) => ['TaskDuration', 'ScriptDuration', 'RecalcStyleDuration', 'LayoutDuration'].map((k) => `${k.replace('Duration', '')} ${((b[k] - a[k]) * 1000).toFixed(0)}ms`).join('  ')
let m0 = await metrics(); await page.waitForTimeout(3000); let m1 = await metrics()
console.log('idle 3s at hello     ', delta(m0, m1))
await page.mouse.move(195, 400)
m0 = await metrics()
for (let i = 0; i < 120; i++) { await page.mouse.wheel(0, 45); await page.waitForTimeout(16) }
await page.waitForTimeout(800); m1 = await metrics()
console.log('scroll to the end    ', delta(m0, m1))
m0 = await metrics(); await page.waitForTimeout(3000); m1 = await metrics()
console.log('idle 3s at finale    ', delta(m0, m1))
await browser.close(); server.kill()
