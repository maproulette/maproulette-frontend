import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'
import { api } from '@/api'
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
  const { data: selectedProject } = api.project.getProject(hasProject ? projectId : undefined)
  const label = selectedProject
    ? `${selectedProject.id} - ${selectedProject.displayName || selectedProject.name}`
    : hasProject
      ? t('common.projectWithId', { id: projectId }, 'Project #{id}')
      : t('common.selectAProject', undefined, 'Select a project')

  return (
    <Button
      type="button"
      variant="outline"
      className={cn('w-full justify-between font-normal', className)}
      {...props}
    >
      <span className={cn('truncate', hasProject ? '' : 'text-zinc-500 dark:text-zinc-400')}>
        {label}
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
    </Button>
  )
}
