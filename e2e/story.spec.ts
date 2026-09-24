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
const END = 6.2 // src/scenes.ts T.end

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

// Final-review findings, iPhone only
test.describe('review fixes', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  const toFraction = (page: Page, f: number) =>
    page.evaluate((f) => window.scrollTo(0, f * (document.documentElement.scrollHeight - window.innerHeight)), f)

  test('balloon strings stay attached to their knots', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1200)
    await scrollTo(page, 1.2)
    const knots = await page.evaluate(() =>
      Array.from(document.querySelectorAll<SVGGElement>('[data-balloon] [data-body]')).map((body) => {
        const svg = body.ownerSVGElement!
        const m = svg.getCTM()!.inverse().multiply(body.getCTM()!)
        const p = new DOMPoint(30, 74).matrixTransform(m)
        return [p.x, p.y]
      }),
    )
    // the sway pivots at the knot, so the knot stays put whatever the rotation
    for (const [x, y] of knots) {
      expect(Math.abs(x - 30)).toBeLessThan(0.5)
      expect(Math.abs(y - 74)).toBeLessThan(0.5)
    }
  })

  test('tapping the cake before the candles are lit does nothing', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1200)
    await scrollTo(page, CAKE_T - 0.7) // cake visible, flames not yet risen
    await page.getByRole('button', { name: 'Blow out the candles' }).click({ force: true })
    await page.waitForTimeout(600)
    await scrollTo(page, CAKE_T)
    const cake = page.getByRole('button', { name: 'Blow out the candles' })
    await expect(cake).toBeVisible()
    const flames = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-flame]')).map((f) => (f as SVGGElement).getBoundingClientRect().height),
    )
    for (const h of flames) expect(h).toBeGreaterThan(4)
  })

  test('the ending is complete a little before the very bottom (iOS toolbar collapse)', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1200)
    await toFraction(page, 0.97)
    await page.waitForTimeout(1500)
    const state = await page.evaluate(() => {
      const head = document.querySelector<SVGGElement>('[data-part="head"]')!
      const m = head.transform.baseVal.consolidate()?.matrix
      return {
        replay: getComputedStyle(document.querySelector('[data-replay]')!).opacity,
        headSin: m ? m.b : 0,
        htmlBg: getComputedStyle(document.documentElement).backgroundColor,
      }
    })
    expect(state.replay).toBe('1')
    expect(Math.abs(state.headSin)).toBeLessThan(0.01)
    // rubber-band overscroll shows the html background: it must match the night scene
    expect(state.htmlBg).toBe('rgb(51, 37, 79)')
  })
})
