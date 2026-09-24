import { test, expect } from '@playwright/test'
import { CAKE_T, scrollTo } from './helpers'

// Chrome's fake microphone plays weak.wav instead of a real mic (0.8s silence, then a soft breath: noise at ~0.045 RMS, under the blow threshold).
test.use({
  viewport: { width: 390, height: 844 },
  launchOptions: {
    args: [
      '--use-fake-ui-for-media-stream', // auto-accept the permission prompt
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${new URL('./fixtures/weak.wav', import.meta.url).pathname}`,
    ],
  },
})

test('a soft blow gets a "blow harder!" nudge but does not put the candles out', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(1200)
  await scrollTo(page, CAKE_T)
  await page.getByRole('button', { name: 'Blow with the microphone' }).click()
  await expect(page.getByText('blow harder!')).toBeVisible({ timeout: 5000 })
  await expect(page.getByRole('button', { name: 'Blow out the candles' })).toBeVisible()
})
