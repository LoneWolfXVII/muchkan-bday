import { test, expect } from '@playwright/test'
import { CAKE_T, scrollTo } from './helpers'

// Chrome's fake microphone plays talk.wav instead of a real mic (a quiet steady tone, about talking level).
test.use({
  viewport: { width: 390, height: 844 },
  launchOptions: {
    args: [
      '--use-fake-ui-for-media-stream', // auto-accept the permission prompt
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${new URL('./fixtures/talk.wav', import.meta.url).pathname}`,
    ],
  },
})

test('talking near the mic does not blow the candles out', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(1200)
  await scrollTo(page, CAKE_T)
  await page.getByRole('button', { name: 'Blow with the microphone' }).click()
  await expect(page.getByText('listening… blow on your phone')).toBeVisible()
  await page.waitForTimeout(3500)
  await expect(page.getByRole('button', { name: 'Blow out the candles' })).toBeVisible()
})
