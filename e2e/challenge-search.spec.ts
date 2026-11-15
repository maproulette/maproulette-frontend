import { expect, test } from './fixtures'

test('a user can find a challenge by name or ID using the header search bar', async ({
  page,
  challenge,
}) => {
  await page.goto('/')

  const searchInput = page.getByRole('combobox', { name: /search challenges and projects/i })
  await searchInput.click()
  await searchInput.fill(String(challenge.id))
  await expect(page.getByRole('option', { name: challenge.name })).toBeVisible({
    timeout: 15_000,
  })

  await searchInput.fill(challenge.name)
  await expect(page.getByRole('option', { name: challenge.name })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByRole('option').first()).toHaveAttribute('aria-selected', 'true')
  await searchInput.press('Enter')

  await expect(page).toHaveURL(new RegExp(`/challenge/${challenge.id}`), { timeout: 20_000 })
  await expect(page.getByRole('heading', { name: challenge.name })).toBeVisible({ timeout: 20_000 })
})
