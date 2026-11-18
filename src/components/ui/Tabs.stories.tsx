import type { Meta, StoryObj } from '@storybook/react-vite'

import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs'

const meta: Meta<typeof Tabs> = {
  component: Tabs,
  title: 'Layout/Tabs',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="general" className="w-96">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="api">API</TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <p className="text-fg-muted text-sm">
          General account settings, such as display name and default locale.
        </p>
      </TabsContent>
      <TabsContent value="notifications">
        <p className="text-fg-muted text-sm">
          Choose which emails and in-app notifications you receive.
        </p>
      </TabsContent>
      <TabsContent value="api">
        <p className="text-fg-muted text-sm">Manage your API key for programmatic access.</p>
      </TabsContent>
    </Tabs>
  ),
}
