import { Bell, Database, Globe, Mail, Palette, Save, Settings, Shield } from 'lucide-react'
import { useId } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { DisabledTooltip } from '@/components/ui/DisabledTooltip'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Switch } from '@/components/ui/Switch'
import { Textarea } from '@/components/ui/Textarea'
import { useIntl } from '@/i18n'

export const SuperAdminSettings = () => {
  const { t } = useIntl()
  const comingSoonMsg = t({ id: 'superAdminSettings.comingSoon', defaultMessage: 'Platform settings management is not available yet' }
  )
  const siteNameId = useId()
  const siteDescriptionId = useId()
  const siteUrlId = useId()
  const maintenanceId = useId()
  const smtpHostId = useId()
  const smtpPortId = useId()
  const fromEmailId = useId()
  const emailEnabledId = useId()
  const requireVerificationId = useId()
  const twoFactorId = useId()
  const sessionTimeoutId = useId()
  const passwordPolicyId = useId()
  const dbHostId = useId()
  const dbPortId = useId()
  const autoBackupId = useId()
  const notifyNewUserId = useId()
  const notifyNewProjectId = useId()
  const notifyErrorsId = useId()
  const darkModeId = useId()
  const primaryColorId = useId()
  const logoUrlId = useId()

  return (
    <div className="mx-auto px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <Settings className="h-8 w-8 text-zinc-600 dark:text-zinc-400" />
          <h1 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
            {t({ id: 'superAdminSettings.title', defaultMessage: 'Platform Settings' })}
          </h1>
          <Badge variant="secondary">
            {t({ id: 'superAdminSettings.comingSoonBadge', defaultMessage: 'Coming Soon' })}
          </Badge>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          {t({ id: 'superAdminSettings.subtitle', defaultMessage: 'Configure platform-wide settings and preferences' }
          )}
        </p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <CardTitle>
                {t({ id: 'superAdminSettings.general.title', defaultMessage: 'General Settings' })}
              </CardTitle>
            </div>
            <CardDescription>
              {t({ id: 'superAdminSettings.general.description', defaultMessage: 'Basic platform configuration' }
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor={siteNameId}>
                {t({ id: 'superAdminSettings.general.siteName', defaultMessage: 'Site Name' })}
              </Label>
              <Input disabled id={siteNameId} defaultValue="MapRoulette" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={siteDescriptionId}>
                {t({ id: 'superAdminSettings.general.siteDescription', defaultMessage: 'Site Description' })}
              </Label>
              <Textarea
                disabled
                id={siteDescriptionId}
                defaultValue="A platform for collaborative mapping and data validation"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={siteUrlId}>
                {t({ id: 'superAdminSettings.general.siteUrl', defaultMessage: 'Site URL' })}
              </Label>
              <Input disabled id={siteUrlId} defaultValue="https://maproulette.org" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={maintenanceId}>
                  {t({ id: 'superAdminSettings.general.maintenanceMode', defaultMessage: 'Maintenance Mode' })}
                </Label>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t({ id: 'superAdminSettings.general.maintenanceModeDescription', defaultMessage: 'Enable maintenance mode to prevent user access' }
                  )}
                </p>
              </div>
              <Switch disabled id={maintenanceId} />
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <CardTitle>
                {t({ id: 'superAdminSettings.email.title', defaultMessage: 'Email Settings' })}
              </CardTitle>
            </div>
            <CardDescription>
              {t({ id: 'superAdminSettings.email.description', defaultMessage: 'Configure email notifications and SMTP' }
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor={smtpHostId}>
                {t({ id: 'superAdminSettings.email.smtpHost', defaultMessage: 'SMTP Host' })}
              </Label>
              <Input disabled id={smtpHostId} defaultValue="smtp.example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={smtpPortId}>
                {t({ id: 'superAdminSettings.email.smtpPort', defaultMessage: 'SMTP Port' })}
              </Label>
              <Input disabled id={smtpPortId} type="number" defaultValue="587" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={fromEmailId}>
                {t({ id: 'superAdminSettings.email.fromEmail', defaultMessage: 'From Email Address' })}
              </Label>
              <Input
                disabled
                id={fromEmailId}
                type="email"
                defaultValue="noreply@maproulette.org"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={emailEnabledId}>
                  {t({ id: 'superAdminSettings.email.enableNotifications', defaultMessage: 'Enable Email Notifications' }
                  )}
                </Label>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t({ id: 'superAdminSettings.email.enableNotificationsDescription', defaultMessage: 'Send email notifications to users' }
                  )}
                </p>
              </div>
              <Switch disabled id={emailEnabledId} defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <CardTitle>
                {t({ id: 'superAdminSettings.security.title', defaultMessage: 'Security Settings' })}
              </CardTitle>
            </div>
            <CardDescription>
              {t({ id: 'superAdminSettings.security.description', defaultMessage: 'Configure security and authentication' }
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={requireVerificationId}>
                  {t({ id: 'superAdminSettings.security.requireVerification', defaultMessage: 'Require Email Verification' }
                  )}
                </Label>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t({ id: 'superAdminSettings.security.requireVerificationDescription', defaultMessage: 'Users must verify their email before accessing the platform' }
                  )}
                </p>
              </div>
              <Switch disabled id={requireVerificationId} defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={twoFactorId}>
                  {t({ id: 'superAdminSettings.security.twoFactor', defaultMessage: 'Enable Two-Factor Authentication' }
                  )}
                </Label>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t({ id: 'superAdminSettings.security.twoFactorDescription', defaultMessage: 'Allow users to enable 2FA for their accounts' }
                  )}
                </p>
              </div>
              <Switch disabled id={twoFactorId} defaultChecked />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={sessionTimeoutId}>
                {t({ id: 'superAdminSettings.security.sessionTimeout', defaultMessage: 'Session Timeout (minutes)' }
                )}
              </Label>
              <Input disabled id={sessionTimeoutId} type="number" defaultValue="60" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={passwordPolicyId}>
                  {t({ id: 'superAdminSettings.security.passwordPolicy', defaultMessage: 'Strict Password Policy' }
                  )}
                </Label>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t({ id: 'superAdminSettings.security.passwordPolicyDescription', defaultMessage: 'Require strong passwords (min 12 chars, special chars)' }
                  )}
                </p>
              </div>
              <Switch disabled id={passwordPolicyId} defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <CardTitle>
                {t({ id: 'superAdminSettings.database.title', defaultMessage: 'Database Settings' })}
              </CardTitle>
            </div>
            <CardDescription>
              {t({ id: 'superAdminSettings.database.description', defaultMessage: 'Database configuration and maintenance' }
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor={dbHostId}>
                {t({ id: 'superAdminSettings.database.host', defaultMessage: 'Database Host' })}
              </Label>
              <Input disabled id={dbHostId} defaultValue="localhost" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={dbPortId}>
                {t({ id: 'superAdminSettings.database.port', defaultMessage: 'Database Port' })}
              </Label>
              <Input disabled id={dbPortId} type="number" defaultValue="5432" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={autoBackupId}>
                  {t({ id: 'superAdminSettings.database.autoBackup', defaultMessage: 'Automatic Backups' })}
                </Label>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t({ id: 'superAdminSettings.database.autoBackupDescription', defaultMessage: 'Enable daily automatic database backups' }
                  )}
                </p>
              </div>
              <Switch disabled id={autoBackupId} defaultChecked />
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                {t({ id: 'superAdminSettings.database.runMaintenance', defaultMessage: 'Run Maintenance' })}
              </Button>
              <Button variant="outline">
                {t({ id: 'superAdminSettings.database.createBackup', defaultMessage: 'Create Backup' })}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <CardTitle>
                {t({ id: 'superAdminSettings.notifications.title', defaultMessage: 'Notification Settings' })}
              </CardTitle>
            </div>
            <CardDescription>
              {t({ id: 'superAdminSettings.notifications.description', defaultMessage: 'Configure platform notification preferences' }
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={notifyNewUserId}>
                  {t({ id: 'superAdminSettings.notifications.newUser', defaultMessage: 'New User Notifications' }
                  )}
                </Label>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t({ id: 'superAdminSettings.notifications.newUserDescription', defaultMessage: 'Notify admins when new users sign up' }
                  )}
                </p>
              </div>
              <Switch disabled id={notifyNewUserId} defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={notifyNewProjectId}>
                  {t({ id: 'superAdminSettings.notifications.newProject', defaultMessage: 'New Project Notifications' }
                  )}
                </Label>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t({ id: 'superAdminSettings.notifications.newProjectDescription', defaultMessage: 'Notify admins when new projects are created' }
                  )}
                </p>
              </div>
              <Switch disabled id={notifyNewProjectId} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={notifyErrorsId}>
                  {t({ id: 'superAdminSettings.notifications.errors', defaultMessage: 'Error Notifications' })}
                </Label>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t({ id: 'superAdminSettings.notifications.errorsDescription', defaultMessage: 'Notify admins when system errors occur' }
                  )}
                </p>
              </div>
              <Switch disabled id={notifyErrorsId} defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              <CardTitle>
                {t({ id: 'superAdminSettings.appearance.title', defaultMessage: 'Appearance Settings' })}
              </CardTitle>
            </div>
            <CardDescription>
              {t({ id: 'superAdminSettings.appearance.description', defaultMessage: 'Customize the platform appearance' }
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={darkModeId}>
                  {t({ id: 'superAdminSettings.appearance.darkMode', defaultMessage: 'Default to Dark Mode' })}
                </Label>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {t({ id: 'superAdminSettings.appearance.darkModeDescription', defaultMessage: 'Set dark mode as the default theme for new users' }
                  )}
                </p>
              </div>
              <Switch disabled id={darkModeId} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={primaryColorId}>
                {t({ id: 'superAdminSettings.appearance.primaryColor', defaultMessage: 'Primary Brand Color' })}
              </Label>
              <div className="flex gap-2">
                <Input
                  disabled
                  id={primaryColorId}
                  type="color"
                  defaultValue="#3b82f6"
                  className="w-20"
                />
                <Input disabled defaultValue="#3b82f6" className="flex-1" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={logoUrlId}>
                {t({ id: 'superAdminSettings.appearance.logoUrl', defaultMessage: 'Logo URL' })}
              </Label>
              <Input disabled id={logoUrlId} defaultValue="/logo.svg" />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <DisabledTooltip show message={comingSoonMsg}>
            <Button size="lg" disabled>
              <Save className="mr-2 h-5 w-5" />
              {t({ id: 'superAdminSettings.saveButton', defaultMessage: 'Save All Settings' })}
            </Button>
          </DisabledTooltip>
        </div>
      </div>
    </div>
  )
}
