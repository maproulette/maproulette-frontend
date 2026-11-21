import { useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'
import { projectOptions } from '@/api/project'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

type ProjectPickerButtonProps = Omit<ComponentProps<typeof Button>, 'children'> & {
  projectId?: number
}

export const ProjectPickerButton = ({
  projectId,
  className,
  ...props
}: ProjectPickerButtonProps) => {
  const { t } = useIntl()
  const hasProject = projectId != null && projectId > 0
  const { data: selectedProject } = useQuery(projectOptions(hasProject ? projectId : undefined))
  const label = selectedProject
    ? `${selectedProject.id} - ${selectedProject.displayName || selectedProject.name}`
    : hasProject
      ? t({ id: 'common.projectWithId', defaultMessage: 'Project #{id}' }, { id: projectId })
      : t({ id: 'common.selectAProject', defaultMessage: 'Select a project' })

  return (
    <Button
      type="button"
      variant="outline"
      className={cn('w-full justify-between font-normal', className)}
      {...props}
    >
      <span className={cn('truncate', hasProject ? '' : 'text-fg-muted')}>{label}</span>
      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
    </Button>
  )
}
