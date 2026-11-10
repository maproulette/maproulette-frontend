import { BACKEND_URL, createChallenge, createTask } from './fixtures'
import { expect, test } from './helpers/editor'

const NODE_ID = '123456789'

test('element and viewport short-codes in a challenge description link to OpenStreetMap', async ({
  page,
  request,
  project,
}) => {
  const challenge = await createChallenge(request, project.id, {
    description: `Check [n${NODE_ID}] near [v 17/40.76/-111.89] before mapping.`,
  })
  await createTask(request, challenge.id)

  await page.goto(`/challenge/${challenge.id}`)

  const element = page.getByRole('link', { name: `node ${NODE_ID}` }).first()
  await expect(element).toBeVisible({ timeout: 20_000 })
  await expect(element).toHaveAttribute('href', new RegExp(`/node/${NODE_ID}$`))
  await expect(page.getByRole('link', { name: '40.76, -111.89' }).first()).toHaveAttribute(
    'href',
    /#map=17\/40\.76\/-111\.89$/
  )
})

test('a short-code in a task comment loads the element into JOSM when JOSM is the default editor', async ({
  mapper,
  josmCommands: commands,
  request,
  project,
}) => {
  const challenge = await createChallenge(request, project.id)
  const task = await createTask(request, challenge.id)
  const updated = await mapper.request.put(`${BACKEND_URL}/api/v2/user/${mapper.user.id}`, {
    headers: { 'Content-Type': 'application/json' },
    data: { defaultEditor: 1 },
  })
  expect(updated.ok()).toBe(true)

  const { page } = mapper
  let popups = 0
  page.on('popup', () => {
    popups += 1
  })
  await page.goto(`/tasks/${task.id}`)
  await expect(page.getByText(`Task #${task.id}`).first()).toBeVisible({ timeout: 20_000 })

  await page.getByRole('tab', { name: /Comments \(0\)/ }).click()
  await page.getByPlaceholder('Add a comment...').fill(`See [n${NODE_ID}]`)
  await page.getByRole('button', { name: 'Send comment' }).click()
  await expect(page.getByText('Comment added')).toBeVisible({ timeout: 15_000 })

  await page
    .getByRole('link', { name: `node ${NODE_ID}` })
    .first()
    .click()

  await expect
    .poll(() => commands.map((url) => url.pathname + url.search).join(' '), { timeout: 10_000 })
    .toContain(`/load_object?objects=n${NODE_ID}`)
  expect(popups).toBe(0)
})
