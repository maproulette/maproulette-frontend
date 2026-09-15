import { expect, TAG_FIX_ELEMENT_ID, test } from './fixtures'

// Tag-fix (cooperative) challenges: ones that ship a proposed set of tag
// changes with each task, for the mapper to apply in the editor.
//
// Applying the fix is not driven here. That happens inside an embedded iD,
// against real OpenStreetMap data the test stack has no access to. What the
// challenge and its tasks say they propose, before any editor is involved, is
// what these cover.

test('a tag-fix challenge is labelled as one on its challenge page', async ({
  page,
  cooperativeChallenge,
}) => {
  await page.goto(`/challenge/${cooperativeChallenge.id}`)

  await expect(page.getByRole('heading', { name: cooperativeChallenge.name })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText('Tag Fix', { exact: true })).toBeVisible({ timeout: 15_000 })
})

test('an ordinary challenge is not labelled as a tag fix', async ({ page, challenge }) => {
  await page.goto(`/challenge/${challenge.id}`)

  await expect(page.getByRole('heading', { name: challenge.name })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Tag Fix', { exact: true })).toBeHidden()
})

test('a tag-fix task shows the tag changes the challenge proposes', async ({
  page,
  tagFixTask,
}) => {
  await page.goto(`/tasks/${tagFixTask.id}`)

  // The suggestion stands in for the mapper's own edits until they have made
  // any, so it is what the task tab leads with.
  await expect(page.getByText('Suggested tag changes')).toBeVisible({ timeout: 30_000 })

  // The proposal names the element it applies to, and the tag it would set.
  await expect(page.getByText(TAG_FIX_ELEMENT_ID)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('diet:vegetarian')).toBeVisible()
  await expect(page.getByText('yes', { exact: true })).toBeVisible()

  // Against a stack that can reach OpenStreetMap this would be a before/after
  // diff instead, and an element that already carries the tag would be
  // reported as needing nothing. tagDiff.test.ts covers both of those; here
  // the element's tags are unknown, so the proposal is stated as-is.
})

test('an ordinary task shows no suggested changes', async ({ page, task }) => {
  await page.goto(`/tasks/${task.id}`)

  await expect(page.getByRole('button', { name: 'Map this task' })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Suggested tag changes')).toBeHidden()
})
