export const PostSummaryTextElement = ({ summary }: { summary: string }) => {
  return (
    <p className="prose mt-3 line-clamp-2 max-w-none text-base text-slate-800 lg:line-clamp-none dark:text-slate-300">
      {summary}
    </p>
  )
}
