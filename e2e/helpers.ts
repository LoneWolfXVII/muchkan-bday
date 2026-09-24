import type { Page } from '@playwright/test'

// Scene times from src/scenes.ts T (end = 6.2), sampled a little inside each scene.
export const HELLO_T = 0
export const BALLOONS_T = 1.2
export const FLOWER_T = 2.5
export const PETALS_T = 3.5
export const CAKE_T = 4.9
export const END = 6.2 // src/scenes.ts T.end

export const VIEWPORTS = [
  { name: 'iphone', width: 390, height: 844 },
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'ultrawide', width: 2560, height: 1080 },
]

/** The story scrolls inside [data-scroller] (the document itself never scrolls). */
export async function scrollTo(page: Page, t: number) {
  await page.evaluate((p) => {
    const s = document.querySelector('[data-scroller]') ?? document.documentElement
    s.scrollTo(0, p * (s.scrollHeight - s.clientHeight))
  }, t / END)
  await page.waitForTimeout(900) // lenis + scrub (0.6s catch-up) settle
}
