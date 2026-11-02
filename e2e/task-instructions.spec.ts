import type { Page } from '@playwright/test'
import { createChallengeWith, createTaskWith, expect, OSM_NODE_ID, test } from './helpers/editor'
import { startMapping } from './helpers/task'

const CHALLENGE_INSTRUCTION =
  'Visit **{{name}}** (ref {{ref}}){{nope}}. Task {{#mrTaskId}} is {{#osmType}} {{#osmId}}. ' +
  '[Look it up](https://example.com/search?q={{name}}&ref={{ref}})'

const instructions = (page: Page) => page.getByRole('tabpanel', { name: 'Instructions' })

test('challenge instructions fill in the task properties, blank unknown ones and encode them in links', async ({
  page,
  request,
  project,
}) => {
  const challenge = await createChallengeWith(request, project.id, {
    instruction: CHALLENGE_INSTRUCTION,
  })
  const task = await createTaskWith(request, challenge.id)

  await page.goto(`/tasks/${task.id}`)
  const panel = instructions(page)
  await expect(panel).toContainText(
    `Visit Spring & Well (ref 42). Task ${task.id} is node ${OSM_NODE_ID}. Look it up`,
    { timeout: 20_000 }
  )
  await expect(panel.getByText('Spring & Well', { exact: true })).toHaveJSProperty(
    'tagName',
    'STRONG'
  )
  await expect(panel).not.toContainText('{{')
  await expect(panel.getByRole('link', { name: 'Look it up' })).toHaveAttribute(
    'href',
    'https://example.com/search?q=Spring%20%26%20Well&ref=42'
  )
})

test("a task's own instruction is shown instead of the challenge's, with its properties filled in", async ({
  page,
  request,
  project,
}) => {
  const challenge = await createChallengeWith(request, project.id, {
    instruction: 'The challenge-wide instruction.',
  })
  const task = await createTaskWith(request, challenge.id, {
    instruction: 'Only for this task: check {{name}}.',
  })

  await page.goto(`/tasks/${task.id}`)
  await expect(instructions(page)).toContainText('Only for this task: check Spring & Well.', {
    timeout: 20_000,
  })
  await expect(instructions(page)).not.toContainText('The challenge-wide instruction.')
})

test('instructions stay filled in once the mapper starts working the task', async ({
  mapper,
  request,
  project,
}) => {
  const challenge = await createChallengeWith(request, project.id, {
    instruction: CHALLENGE_INSTRUCTION,
  })
  const task = await createTaskWith(request, challenge.id)

  await startMapping(mapper.page, task.id)
  await expect(instructions(mapper.page)).toContainText(
    `Visit Spring & Well (ref 42). Task ${task.id} is node ${OSM_NODE_ID}.`
  )
})
