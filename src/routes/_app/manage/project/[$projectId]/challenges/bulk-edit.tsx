import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ManageChallengesBulkEdit } from '@/components/Pages/ManagementPages/ManageChallengesBulkEdit'

const bulkEditSearchSchema = z.object({
  challengeIds: z.array(z.number().int().positive()).catch([]),
})

export const Route = createFileRoute('/_app/manage/project/$projectId/challenges/bulk-edit')({
  staticData: { pageTitle: 'Bulk Edit Challenges' },
  validateSearch: bulkEditSearchSchema,
  component: ManageChallengesBulkEdit,
})
