import { UserLock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/Empty'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'

export const SignIn = ({ className, ...props }: React.ComponentProps<typeof Empty>) => {
  const { login } = useAuthContext()
  const { t } = useIntl()
  return (
    <Empty className={cn('min-h-svh', className)} {...props}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UserLock />
        </EmptyMedia>
        <EmptyTitle>
          {t({ id: 'shared.signIn.title', defaultMessage: 'Please sign in' })}
        </EmptyTitle>
        <EmptyDescription>
          {t({
            id: 'shared.signIn.description',
            defaultMessage: 'You need to be signed in to manage your account.',
          })}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="lg" onClick={login}>
          {t({ id: 'common.signIn', defaultMessage: 'Sign in' })}
        </Button>
      </EmptyContent>
    </Empty>
  )
}
