import { test, expect } from '@playwright/test'
import { CAKE_T, scrollTo } from './helpers'

// Chrome's fake microphone plays blow.wav instead of a real mic (0.8s silence, then loud white noise: a blow).
test.use({
  viewport: { width: 390, height: 844 },
  launchOptions: {
    args: [
      '--use-fake-ui-for-media-stream', // auto-accept the permission prompt
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${new URL('./fixtures/blow.wav', import.meta.url).pathname}`,
    ],
  },
})

test('a blow on the mic puts the candles out and shows 26', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(1200)
  await scrollTo(page, CAKE_T)
  await page.getByRole('button', { name: 'Blow with the microphone' }).click()
  await expect(page.getByText('listening… blow on your phone')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Candles out. Wish made' })).toBeVisible({ timeout: 6000 })
  await expect(page.locator('[data-age-in]')).toBeVisible()
  await expect(page.getByText('listening… blow on your phone')).toHaveCount(0) // mic released
})
