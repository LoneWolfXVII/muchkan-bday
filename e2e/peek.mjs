// usage: node e2e/peek.mjs [--reduce] step...
//   step = <t>            scroll to timeline second t (0..6)
//        | click:<name>   click the button with that accessible name
//        | shot:<file>    screenshot to e2e/shots/<file>.png
//        | eval:<js>      print the value of a page expression
// run `npm run build` first; run from the project root.
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const reduce = args.includes('--reduce')
const server = spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore' })
while (!(await fetch('http://localhost:4173').then((r) => r.ok).catch(() => false))) {
  await new Promise((r) => setTimeout(r, 200))
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: reduce ? 'reduce' : 'no-preference' })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(e.message))
await page.goto('http://localhost:4173')
await page.waitForTimeout(1800)

for (const step of args.filter((a) => a !== '--reduce')) {
  if (step.startsWith('eval:')) console.log(step.slice(5), '=>', await page.evaluate(step.slice(5)))
  else if (step.startsWith('click:')) await page.getByRole('button', { name: step.slice(6) }).click()
  else if (step.startsWith('shot:')) await page.screenshot({ path: `e2e/shots/${step.slice(5)}.png` })
  else await page.evaluate((t) => window.scrollTo(0, (t / 6) * (document.documentElement.scrollHeight - innerHeight)), Number(step))
  await page.waitForTimeout(800)
}

console.log({
  errors,
  scrollY: await page.evaluate(() => window.scrollY),
  theme: await page.evaluate(() => document.querySelector('meta[name="theme-color"]')?.getAttribute('content')),
  cake: await page.evaluate(() => document.querySelector('[data-cake]')?.getAttribute('aria-label') ?? null),
})
await browser.close()
server.kill()
