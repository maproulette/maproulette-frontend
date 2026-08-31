interface PageHeaderProps {
  title: string | React.ReactNode
  description?: string
}

export const PageHeader = ({ title, description }: PageHeaderProps) => {
  return (
    <div>
      <h1 className="mb-2 font-bold text-base text-zinc-900 dark:text-white">{title}</h1>
      {description && <p className="text-zinc-600 dark:text-slate-400">{description}</p>}
    </div>
  )
}
