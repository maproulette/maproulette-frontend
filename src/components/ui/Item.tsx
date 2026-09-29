import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { Separator } from '@/components/ui/Separator'
import { cn } from '@/lib/utils'

export const ItemGroup = ({ className, ...props }: React.ComponentProps<'ul'>) => (
  <ul
    data-slot="item-group"
    className={cn('group/item-group flex flex-col', className)}
    {...props}
  />
)

export const ItemSeparator = ({ className, ...props }: React.ComponentProps<typeof Separator>) => (
  <Separator
    data-slot="item-separator"
    orientation="horizontal"
    className={cn('my-0', className)}
    {...props}
  />
)

const itemVariants = cva(
  'group/item flex items-center border border-zinc-200 border-transparent text-sm rounded-lg transition-colors [a]:hover:bg-zinc-100/50 [a]:transition-colors duration-100 flex-wrap outline-none focus-visible:border-zinc-950 focus-visible:ring-zinc-950/50 focus-visible:ring-[3px] dark:border-slate-800 dark:[a]:hover:bg-zinc-800/50 dark:focus-visible:border-zinc-300 dark:focus-visible:ring-zinc-300/50',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border-zinc-200 dark:border-slate-800',
        muted: 'bg-zinc-100/50 dark:bg-slate-800/50',
      },
      size: {
        default: 'p-4 gap-4',
        sm: 'py-3 px-4 gap-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export const Item = ({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'li'> & VariantProps<typeof itemVariants> & { asChild?: boolean }) => {
  // ItemGroup renders a <ul>, and every current usage nests Item directly
  // inside it — <li> keeps that valid instead of a <div> inside a <ul>.
  const Comp = asChild ? Slot : 'li'
  return (
    <Comp
      data-slot="item"
      data-variant={variant}
      data-size={size}
      className={cn(itemVariants({ variant, size, className }))}
      {...props}
    />
  )
}

const itemMediaVariants = cva(
  'flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none group-has-[[data-slot=item-description]]/item:translate-y-0.5',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: "size-8 border border-zinc-200 rounded-sm bg-zinc-100 [&_svg:not([class*='size-'])]:size-4 dark:border-slate-800 dark:bg-slate-800",
        image: 'size-10 rounded-sm overflow-hidden [&_img]:size-full [&_img]:object-cover',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export const ItemMedia = ({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof itemMediaVariants>) => (
  <div
    data-slot="item-media"
    data-variant={variant}
    className={cn(itemMediaVariants({ variant, className }))}
    {...props}
  />
)

export const ItemContent = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="item-content"
    className={cn('flex flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none', className)}
    {...props}
  />
)

export const ItemTitle = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="item-title"
    className={cn('flex w-fit items-center gap-2 font-medium text-sm leading-snug', className)}
    {...props}
  />
)

export const ItemDescription = ({ className, ...props }: React.ComponentProps<'p'>) => (
  <p
    data-slot="item-description"
    className={cn(
      // zinc-500 fails WCAG AA contrast against the zinc-100 canvas this is often shown on (~4.4:1); zinc-600 clears it.
      'line-clamp-2 text-balance font-normal text-sm text-zinc-600 leading-normal dark:text-zinc-400',
      '[&>a:hover]:text-zinc-900 dark:[&>a:hover]:text-zinc-50 [&>a]:underline [&>a]:underline-offset-4',
      className
    )}
    {...props}
  />
)

export const ItemActions = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div data-slot="item-actions" className={cn('flex items-center gap-2', className)} {...props} />
)

export const ItemHeader = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="item-header"
    className={cn('flex basis-full items-center justify-between gap-2', className)}
    {...props}
  />
)

export const ItemFooter = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    data-slot="item-footer"
    className={cn('flex basis-full items-center justify-between gap-2', className)}
    {...props}
  />
)
