import ReactMarkdown from 'react-markdown'
import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { markdownRemarkPlugins } from '@/lib/markdown'

export const ChallengeDescription = () => {
  const { challenge } = useBrowsedChallengeContext()
  const { description, blurb } = challenge
  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="markdown-content break-words text-sm text-zinc-700 leading-relaxed dark:text-slate-300 [&_blockquote]:my-4 [&_blockquote]:border-zinc-300 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:dark:border-slate-600 [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:dark:bg-slate-800 [&_em]:italic [&_h1]:mt-8 [&_h1]:mb-5 [&_h1]:font-bold [&_h1]:text-2xl [&_h1]:text-zinc-900 [&_h1]:tracking-tight [&_h1]:dark:text-white [&_h2]:mt-7 [&_h2]:mb-4 [&_h2]:font-bold [&_h2]:text-xl [&_h2]:text-zinc-900 [&_h2]:tracking-tight [&_h2]:dark:text-white [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:font-semibold [&_h3]:text-lg [&_h3]:text-zinc-900 [&_h3]:dark:text-white [&_h4]:mt-5 [&_h4]:mb-2 [&_h4]:font-semibold [&_h4]:text-base [&_h4]:text-zinc-900 [&_h4]:dark:text-white [&_hr]:my-8 [&_hr]:border-zinc-300 [&_hr]:dark:border-slate-600 [&_li]:my-2 [&_ol]:my-4 [&_ol]:ml-6 [&_ol]:list-decimal [&_p]:my-4 [&_p]:text-zinc-700 [&_p]:dark:text-slate-300 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-100 [&_pre]:p-4 [&_pre]:dark:bg-slate-800 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold [&_strong]:text-zinc-900 [&_strong]:dark:text-white [&_ul]:my-4 [&_ul]:ml-6 [&_ul]:list-disc">
        {description && (
          <ReactMarkdown
            remarkPlugins={markdownRemarkPlugins}
            components={{
              a: ({ ...props }) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                />
              ),
            }}
          >
            {description}
          </ReactMarkdown>
        )}
        {blurb && (
          <div className="mt-4 break-words rounded-lg bg-zinc-50/50 p-4 text-sm text-zinc-600 italic dark:bg-slate-800/30 dark:text-slate-400">
            {blurb}
          </div>
        )}
      </div>
    </div>
  )
}
