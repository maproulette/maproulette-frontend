import type { Meta, StoryObj } from '@storybook/react-vite'

import { Badge } from './Badge'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './Table'

const CHALLENGES = [
  { id: 1, name: 'Fix missing addresses', owner: 'alice', percentMapped: 82, status: 'Published' },
  { id: 2, name: 'Add sidewalks', owner: 'bob', percentMapped: 45, status: 'Published' },
  {
    id: 3,
    name: 'Verify building footprints',
    owner: 'carol',
    percentMapped: 100,
    status: 'Completed',
  },
  { id: 4, name: 'Tag road surfaces', owner: 'dave', percentMapped: 12, status: 'Published' },
  { id: 5, name: 'Review disabled challenge', owner: 'erin', percentMapped: 0, status: 'Disabled' },
] as const

const meta: Meta<typeof Table> = {
  component: Table,
  title: 'Layout/Table',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Table>

export const Default: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Author</TableHead>
          <TableHead className="text-center">Percent mapped</TableHead>
          <TableHead className="text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {CHALLENGES.map((challenge) => (
          <TableRow key={challenge.id}>
            <TableCell className="font-medium text-blue-600 dark:text-blue-400">
              {challenge.name}
            </TableCell>
            <TableCell className="text-zinc-600 dark:text-slate-400">{challenge.owner}</TableCell>
            <TableCell className="text-center text-zinc-600 dark:text-slate-400">
              {challenge.percentMapped}%
            </TableCell>
            <TableCell className="text-center">
              <Badge variant={challenge.status === 'Completed' ? 'success' : 'outline'}>
                {challenge.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

export const WithCaption: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of recent challenges.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Author</TableHead>
          <TableHead className="text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {CHALLENGES.slice(0, 3).map((challenge) => (
          <TableRow key={challenge.id}>
            <TableCell>{challenge.name}</TableCell>
            <TableCell className="text-zinc-600 dark:text-slate-400">{challenge.owner}</TableCell>
            <TableCell className="text-center">
              <Badge variant={challenge.status === 'Completed' ? 'success' : 'outline'}>
                {challenge.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}
