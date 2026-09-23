import type { Meta, StoryObj } from '@storybook/react-vite'
import { User } from 'lucide-react'

import { Button } from './Button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from './Item'

const VARIANTS = ['default', 'outline', 'muted'] as const
const SIZES = ['default', 'sm'] as const
const MEDIA_VARIANTS = ['default', 'icon', 'image'] as const

const meta: Meta<typeof Item> = {
  component: Item,
  title: 'Layout/Item',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Item>

export const Default: Story = {
  render: () => (
    <ItemGroup className="w-96">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <User />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Jane Doe</ItemTitle>
          <ItemDescription>Mapper since 2021</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="outline">
            View
          </Button>
        </ItemActions>
      </Item>
    </ItemGroup>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <ItemGroup className="gap-2">
      {VARIANTS.map((variant) => (
        <Item key={variant} variant={variant}>
          <ItemContent>
            <ItemTitle>{variant}</ItemTitle>
            <ItemDescription>Item with variant "{variant}".</ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <ItemGroup className="gap-2">
      {SIZES.map((size) => (
        <Item key={size} variant="outline" size={size}>
          <ItemContent>
            <ItemTitle>{size}</ItemTitle>
            <ItemDescription>Item with size "{size}".</ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  ),
}

export const MediaVariants: Story = {
  render: () => (
    <ItemGroup className="gap-2">
      {MEDIA_VARIANTS.map((variant) => (
        <Item key={variant} variant="outline">
          <ItemMedia variant={variant}>
            <User />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{variant}</ItemTitle>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  ),
}
