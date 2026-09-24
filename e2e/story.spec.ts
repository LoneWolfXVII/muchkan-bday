import { test, expect, type Page } from '@playwright/test'
import { BALLOONS_T, CAKE_T, END, FLOWER_T, HELLO_T, PETALS_T, VIEWPORTS, scrollTo } from './helpers'

/** Width of the plumeria in her hair (0 until it is placed). */
const flowerInHair = (page: Page) =>
  page.evaluate(() => document.querySelector('[data-part="plumeria"]')!.getBoundingClientRect().width)

for (const vp of VIEWPORTS) {
  for (const reduced of [false, true]) {
    if (reduced && vp.name !== 'iphone') continue
    const label = `${vp.name}${reduced ? '-reduced' : ''}`

    test(`story at ${label}`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
      page.on('pageerror', (e) => errors.push(e.message))
      const shot = (name: string) => page.screenshot({ path: `e2e/shots/${label}/${name}.png` })
      const noOverflow = async () =>
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

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
      expect(focusedLabel).not.toMatch(/Pop the|Wear the flower|Blow out the candles|Play again/)

      // Review Focus 1: scroll during the intro, then back to the top
      await page.waitForTimeout(300)
      await scrollTo(page, BALLOONS_T)
      await scrollTo(page, HELLO_T)
      await expect(page.getByText('hey Muchkan', { exact: true })).toBeVisible()
      expect(await flowerInHair(page)).toBe(0) // she starts without the flower
      await page.waitForTimeout(1200)
      await shot('0-hello')
      await noOverflow()

      // balloons: she pops all three, each reveals a word
      await scrollTo(page, BALLOONS_T)
      await expect(page.getByText('pop the balloons', { exact: false })).toBeVisible()
      await shot('1-balloons')
      for (const name of ['lilac', 'yellow', 'pink']) {
        const b = page.getByRole('button', { name: `Pop the ${name} balloon` })
        const box = (await b.boundingBox())!
        expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44)
        await b.click()
        await page.waitForTimeout(250)
      }
      await page.waitForTimeout(600)
      await expect(page.getByText('day', { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: /Pop the/ })).toHaveCount(3) // still in the DOM…
      expect(await page.locator('[data-pop-balloon]:not([disabled])').count()).toBe(0) // …but no longer tappable
      await shot('1b-popped')
      await noOverflow()

      // flower: tap it and it goes into her hair
      await scrollTo(page, FLOWER_T)
      await expect(page.getByText('a flower for you', { exact: false })).toBeVisible()
      await shot('2-flower')
      await page.getByRole('button', { name: 'Wear the flower' }).click()
      await page.waitForTimeout(1400)
      await expect(page.getByText('there. perfect.', { exact: true })).toBeVisible()
      expect(await flowerInHair(page)).toBeGreaterThan(10)
      await shot('2b-flower-on')
      await noOverflow()

      await scrollTo(page, PETALS_T)
      await expect(page.getByText('bloom', { exact: true })).toBeVisible()
      await shot('3-petals')
      await noOverflow()

      // cake: hit target, double tap, 26, and it survives a re-scroll (Review Focus 2 and 3)
      await scrollTo(page, CAKE_T)
      await expect(page.getByText('make a wish', { exact: false })).toBeVisible()
      await shot('4-cake')
      const cake = page.getByRole('button', { name: 'Blow out the candles' })
      const box = (await cake.boundingBox())!
      expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44)
      await cake.dblclick()
      const blownCake = page.getByRole('button', { name: 'Candles out. Wish made' })
      await expect(blownCake).toBeVisible()
      await page.waitForTimeout(900)
      await expect(page.locator('[data-age-in]')).toBeVisible()
      // the 26 and its caption sit clear above the flower in her hair
      const [ageBottom, flowerTop] = await page.evaluate(() => [
        document.querySelector('[data-age-in]')!.getBoundingClientRect().bottom,
        document.querySelector('[data-part="plumeria"]')!.getBoundingClientRect().top,
      ])
      expect(ageBottom).toBeLessThanOrEqual(flowerTop)
      await shot('4b-26')
      await scrollTo(page, PETALS_T)
      await scrollTo(page, CAKE_T)
      await expect(blownCake).toBeVisible()
      await noOverflow()

      await scrollTo(page, END)
      await expect(page.getByRole('heading', { level: 1, name: 'Happy Birthday, Muskan' })).toBeVisible()
      await page.waitForTimeout(1500) // let the time-based wave finish
      await shot('5-finale')
      await noOverflow()
      expect(await page.evaluate(() => document.querySelector('meta[name="theme-color"]')?.getAttribute('content'))).toBe('#33254F')
      const replay = page.getByRole('button', { name: 'Play again' })
      await expect(replay).toBeVisible()
      const replayBox = (await replay.boundingBox())!
      expect(Math.min(replayBox.width, replayBox.height)).toBeGreaterThanOrEqual(44)

      // replay resets everything she tapped
      await replay.click()
      await page.waitForTimeout(2200)
      expect(await page.evaluate(() => window.scrollY)).toBeLessThan(5)
      expect(await flowerInHair(page)).toBe(0)
      await scrollTo(page, BALLOONS_T)
      await expect(page.getByRole('button', { name: 'Pop the lilac balloon' })).toBeEnabled()
      await scrollTo(page, CAKE_T)
      await expect(page.getByRole('button', { name: 'Blow out the candles' })).toBeVisible()

      expect(errors).toEqual([])
    })
  }
}

test('scrolling past without tapping pops the balloons and places the flower', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.waitForTimeout(1200)
  await scrollTo(page, BALLOONS_T)
  await scrollTo(page, 2.3) // past the auto-pop point, into the flower scene
  await page.waitForTimeout(600)
  await scrollTo(page, 1.6)
  await expect(page.getByText('day', { exact: true })).toBeVisible()
  expect(await flowerInHair(page)).toBe(0)
  await scrollTo(page, PETALS_T) // past the auto-flower point
  await page.waitForTimeout(900)
  expect(await flowerInHair(page)).toBeGreaterThan(10)
})

// Final-review findings, iPhone only
test.describe('review fixes', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  const toFraction = (page: Page, f: number) =>
    page.evaluate((f) => window.scrollTo(0, f * (document.documentElement.scrollHeight - window.innerHeight)), f)

  test('blinking keeps the eyes in place', async ({ page }) => {
    await page.goto('/')
    // sample the closed-eye arcs every frame across at least one idle blink (first at 1.6s, then every ~3.4s)
    const ys = await page.evaluate(
      () =>
        new Promise<number[]>((resolve) => {
          const eyes = document.querySelector('[data-part="eyesClosed"]')!
          const out: number[] = []
          const t0 = performance.now()
          const tick = () => {
            const b = eyes.getBoundingClientRect()
            out.push(b.y + b.height / 2)
            if (performance.now() - t0 < 6000) requestAnimationFrame(tick)
            else resolve(out.slice(90)) // skip the intro bounce
          }
          tick()
        }),
    )
    // a blink squashes the arcs about their own centre, so the centre barely moves
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(6)
  })

  test('balloon strings stay attached to their knots', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1200)
    await scrollTo(page, 1.2)
    const knots = await page.evaluate(() =>
      Array.from(document.querySelectorAll<SVGGElement>('[data-pop-balloon] [data-body]')).map((body) => {
        const sway = body.parentElement as unknown as SVGGElement
        const m = sway.getCTM()!.inverse().multiply(body.getCTM()!)
        const p = new DOMPoint(30, 74).matrixTransform(m)
        return [p.x, p.y]
      }),
    )
    // the body pivots at its knot, so the knot stays on the string whatever the pop or sway
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
    await page.waitForTimeout(2500) // the finale wave is time-based (~1.65s)
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

test('popping all 26 balloons in the finale starts the story again', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await page.waitForTimeout(1200)
  await scrollTo(page, END)
  await page.waitForTimeout(1500)
  await expect(page.getByText('pop all 26')).toBeVisible()
  const balloons = page.getByRole('button', { name: /Pop balloon \d+ of 26/ })
  await expect(balloons).toHaveCount(26)
  for (let i = 0; i < 26; i++) {
    const b = balloons.nth(i)
    const box = (await b.boundingBox())!
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44)
    await b.click() // fails if anything (her, the title, the button) covers a balloon
    // her face reacts on the first pop (later ones only now and then, at random)
    if (i === 0) await expect(page.locator('[data-part="mouthLaugh"]')).toBeVisible({ timeout: 1000 })
    if (i === 0) await expect(page.getByText('25 left')).toBeVisible()
    if (i < 1) await page.screenshot({ path: `e2e/shots/react-${i}.png`, clip: { x: 95, y: 250, width: 200, height: 220 } })
  }
  await expect(page.getByText('all 26. happy birthday!')).toBeVisible()
  await page.waitForTimeout(4200) // confetti, then the whoosh
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(5)
  await expect(page.getByText('hey Muchkan', { exact: true })).toBeVisible()
  await expect(page.getByText('pop all 26')).toBeHidden()
  expect(errors).toEqual([])
})

test('mic permission denied falls back to tapping the cake', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denied', 'NotAllowedError'))
  })
  await page.goto('/')
  await page.waitForTimeout(1200)
  await scrollTo(page, CAKE_T)
  await page.getByRole('button', { name: 'Blow with the microphone' }).click()
  await expect(page.getByText('tap the cake', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Blow with the microphone' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Blow out the candles' }).click()
  await expect(page.getByRole('button', { name: 'Candles out. Wish made' })).toBeVisible()
})
