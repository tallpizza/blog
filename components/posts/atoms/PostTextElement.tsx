export const PostTitleTextElement = ({ title }: { title: string }) => {
  return (
    <p className="block text-2xl font-semibold text-gray-800 md:text-3xl dark:text-white">
      {title}
    </p>
  )
}
