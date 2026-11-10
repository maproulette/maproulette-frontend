import type { Page } from '@playwright/test'
import { challengeExists, expect, readChallenge, test } from './helpers/challenge'

async function openRowMenu(page: Page, projectId: number, challengeName: string) {
  await page.goto(`/manage/project/${projectId}`)
  await expect(page.getByText(challengeName)).toBeVisible({ timeout: 20_000 })
  await page.getByRole('radio', { name: 'List view' }).click()
  const row = page.getByRole('row', { name: challengeName })
  await expect(row).toBeVisible({ timeout: 15_000 })
  await row.getByRole('button', { name: 'Open menu' }).click()
  return row
}

test('the enabled, paused and featured switches save straight away and survive a reload', async ({
  page,
  request,
  challenge,
}) => {
  await page.goto(`/manage/challenge/${challenge.id}`)
  const enabled = page.getByRole('switch', { name: 'Enabled' })
  const paused = page.getByRole('switch', { name: 'Paused' })
  const featured = page.getByRole('switch', { name: 'Featured' })
  const featuredBadge = page.getByRole('listitem').getByText('Featured', { exact: true })
  await expect(enabled).toBeChecked({ timeout: 15_000 })
  await expect(paused).not.toBeChecked()
  await expect(featured).not.toBeChecked()
  await expect(featuredBadge).toHaveCount(0)
  await expect(page.getByTitle('Discoverable', { exact: true })).toBeVisible()

  await enabled.click()
  await expect.poll(async () => (await readChallenge(request, challenge.id)).enabled).toBe(false)
  await paused.click()
  await expect.poll(async () => (await readChallenge(request, challenge.id)).paused).toBe(true)
  await featured.click()
  await expect.poll(async () => (await readChallenge(request, challenge.id)).featured).toBe(true)

  await page.reload()
  await expect(enabled).not.toBeChecked({ timeout: 15_000 })
  await expect(paused).toBeChecked()
  await expect(featured).toBeChecked()
  await expect(featuredBadge).toBeVisible()
  await expect(page.getByTitle('Not discoverable', { exact: true })).toBeVisible()

  await enabled.click()
  await paused.click()
  await featured.click()
  await expect
    .poll(async () => {
      const stored = await readChallenge(request, challenge.id)
      return [stored.enabled, stored.paused, stored.featured]
    })
    .toEqual([true, false, false])
})

test('archiving from the project page sets the archived flag and unarchiving clears it', async ({
  page,
  request,
  project,
  challenge,
}) => {
  await openRowMenu(page, project.id, challenge.name)
  await page.getByRole('menuitem', { name: 'Archive challenge' }).click()
  await expect.poll(async () => (await readChallenge(request, challenge.id)).isArchived).toBe(true)

  const row = page.getByRole('row', { name: challenge.name })
  await row.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('menuitem', { name: 'Unarchive challenge' }).click()
  await expect.poll(async () => (await readChallenge(request, challenge.id)).isArchived).toBe(false)
})

test('disabling from the project page marks the challenge not discoverable and enabling restores it', async ({
  page,
  request,
  project,
  challenge,
}) => {
  await openRowMenu(page, project.id, challenge.name)
  await page.getByRole('menuitem', { name: 'Disable challenge' }).click()
  await expect.poll(async () => (await readChallenge(request, challenge.id)).enabled).toBe(false)

  const row = page.getByRole('row', { name: challenge.name })
  await expect(row.getByTitle('Not discoverable', { exact: true })).toBeVisible()
  await row.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('menuitem', { name: 'Enable challenge' }).click()
  await expect.poll(async () => (await readChallenge(request, challenge.id)).enabled).toBe(true)
  await expect(row.getByTitle('Discoverable', { exact: true })).toBeVisible()
})

test('deleting from the project page asks first, and only removes the challenge once confirmed', async ({
  page,
  request,
  project,
  challenge,
}) => {
  await openRowMenu(page, project.id, challenge.name)
  await page.getByRole('menuitem', { name: 'Delete challenge' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('Delete challenge?')
  await expect(dialog).toContainText('This will delete this challenge and all its tasks.')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toHaveCount(0)
  expect(await challengeExists(request, challenge.id)).toBe(true)

  const row = page.getByRole('row', { name: challenge.name })
  await row.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('menuitem', { name: 'Delete challenge' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()

  await expect.poll(() => challengeExists(request, challenge.id), { timeout: 20_000 }).toBe(false)
  await expect(page.getByRole('row', { name: challenge.name })).toHaveCount(0, {
    timeout: 15_000,
  })
})

test('moving a challenge to another project takes its tasks with it', async ({
  page,
  request,
  project,
  otherProject,
  challenge,
  task: _task,
}) => {
  await openRowMenu(page, project.id, challenge.name)
  await page.getByRole('menuitem', { name: 'Move challenge' }).click()

  const dialog = page.getByRole('dialog', { name: 'Move Challenge' })
  await expect(dialog).toContainText(`Choose a project to move "${challenge.name}" to.`)
  await dialog.getByPlaceholder('Search projects...').fill(otherProject.name)
  await dialog.getByRole('button', { name: otherProject.name, exact: true }).click()

  await expect
    .poll(async () => (await readChallenge(request, challenge.id)).parent)
    .toBe(otherProject.id)

  await page.goto(`/manage/project/${otherProject.id}`)
  await expect(page.getByText(challenge.name)).toBeVisible({ timeout: 20_000 })
  await page.getByRole('radio', { name: 'List view' }).click()
  const row = page.getByRole('row', { name: challenge.name })
  await expect(row.getByRole('cell').nth(4)).toHaveText(String(challenge.id))
  await expect(row.getByRole('cell').nth(6)).toHaveText('1')
})
