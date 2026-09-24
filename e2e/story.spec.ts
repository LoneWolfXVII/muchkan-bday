import { test, expect, type Page } from '@playwright/test'

// Scene start times from src/scenes.ts T (end = 6), sampled a little inside each scene.
const SCENES = [
  { name: '0-hello', t: 0, text: 'hey Muchkan' },
  { name: '1-balloons', t: 1.2, text: 'look up' },
  { name: '2-pops', t: 2.9, text: 'day' },
  { name: '3-petals', t: 3.7, text: 'bloom' },
  { name: '4-cake', t: 4.9, text: 'make a wish' },
  { name: '5-finale', t: 6, heading: 'Happy Birthday, Muskan' },
]
const CAKE_T = 4.9
const END = 6

const VIEWPORTS = [
  { name: 'iphone', width: 390, height: 844 },
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'ultrawide', width: 2560, height: 1080 },
]

async function scrollTo(page: Page, t: number) {
  await page.evaluate((p) => {
    window.scrollTo(0, p * (document.documentElement.scrollHeight - window.innerHeight))
  }, t / END)
  await page.waitForTimeout(800) // lenis + scrub settle
}

for (const vp of VIEWPORTS) {
  for (const reduced of [false, true]) {
    if (reduced && vp.name !== 'iphone') continue
    const label = `${vp.name}${reduced ? '-reduced' : ''}`

    test(`story at ${label}`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
      page.on('pageerror', (e) => errors.push(e.message))

      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
      await page.goto('/')
      await expect(page).toHaveTitle('Happy Birthday, Muskan')

      // Review Focus 5: hidden buttons are not tab stops at the start
      await page.keyboard.press('Tab')
      // nothing focusable at the start leaves focus on <body>; only a focused button counts
      const focusedLabel = await page.evaluate(() => {
        const el = document.activeElement
        return el instanceof HTMLButtonElement ? (el.getAttribute('aria-label') ?? el.textContent ?? '') : ''
      })
      expect(focusedLabel).not.toMatch(/Blow out the candles|Play again/)

      // Review Focus 1: scroll during the intro, then back to the top
      await page.waitForTimeout(300)
      await scrollTo(page, 1.2)
      await scrollTo(page, 0)
      await expect(page.getByText('hey Muchkan', { exact: true })).toBeVisible()
      await page.waitForTimeout(1200)

      for (const s of SCENES) {
        await scrollTo(page, s.t)
        if (s.text) await expect(page.getByText(s.text, { exact: true })).toBeVisible()
        if (s.heading) await expect(page.getByRole('heading', { level: 1, name: s.heading })).toBeVisible()
        await page.screenshot({ path: `e2e/shots/${label}/${s.name}.png` })
        // Review Focus 4: nothing widens the page
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      }

      expect(await page.evaluate(() => document.querySelector('meta[name="theme-color"]')?.getAttribute('content'))).toBe('#33254F')
      const replay = page.getByRole('button', { name: 'Play again' })
      await expect(replay).toBeVisible()
      const replayBox = (await replay.boundingBox())!
      expect(Math.min(replayBox.width, replayBox.height)).toBeGreaterThanOrEqual(44)

      // cake: hit target, tap, double tap, and survives a re-scroll (Review Focus 2 and 3)
      await scrollTo(page, CAKE_T)
      const cake = page.getByRole('button', { name: 'Blow out the candles' })
      await expect(cake).toBeVisible()
      const box = (await cake.boundingBox())!
      expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44)
      await cake.dblclick()
      const blownCake = page.getByRole('button', { name: 'Candles out. Wish made' })
      await expect(blownCake).toBeVisible()
      await page.waitForTimeout(600)
      await page.screenshot({ path: `e2e/shots/${label}/4b-blown.png` })
      await scrollTo(page, 3.7)
      await scrollTo(page, CAKE_T)
      await expect(blownCake).toBeVisible()

      // replay
      await scrollTo(page, END)
      await replay.click()
      await page.waitForTimeout(2200)
      expect(await page.evaluate(() => window.scrollY)).toBeLessThan(5)

      expect(errors).toEqual([])
    })
  }
}
