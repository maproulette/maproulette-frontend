import { expect, test } from './helpers/misc'
import { completeViaApi as complete } from './helpers/task'

test('a mapper sees the points, tasks and achievements they earn on their dashboard', async ({
  taskSet,
  member,
  memberPage,
  memberRequest,
}) => {
  const stat = (label: string) =>
    memberPage
      .getByRole('term')
      .filter({ hasText: new RegExp(`^${label}$`) })
      .locator('+ dd')

  await memberPage.goto('/dashboard')
  await expect(memberPage.getByRole('heading', { name: member.name, level: 1 })).toBeVisible({
    timeout: 20_000,
  })
  await expect(stat('Points')).toHaveText('0')
  await expect(memberPage.getByRole('link', { name: 'OpenStreetMap profile' })).toHaveAttribute(
    'href',
    `https://www.openstreetmap.org/user/${member.name}`
  )

  await complete(memberRequest, taskSet[0].id, 1)
  await complete(memberRequest, taskSet[1].id, 1)
  await complete(memberRequest, taskSet[2].id, 5)

  await memberPage.reload()
  await expect(stat('Points')).toHaveText('13', { timeout: 20_000 })
  await expect(stat('Tasks completed')).toHaveText('3')

  await expect(async () => {
    await memberPage.reload()
    await expect(memberPage.getByRole('button', { name: 'First Fix', exact: true })).toBeVisible({
      timeout: 5_000,
    })
  }).toPass({ timeout: 30_000 })
  await expect(
    memberPage.getByRole('button', { name: 'Finished Together', exact: true })
  ).toBeVisible()
  await expect(memberPage.getByRole('button', { name: '100 Points (locked)' })).toBeVisible()
  await expect(memberPage.getByRole('button', { name: '500 Points (locked)' })).toBeVisible()
})
