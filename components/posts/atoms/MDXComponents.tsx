import type { MDXComponents } from 'mdx/types'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import Pre from 'pliny/ui/Pre'
import TOCInline from 'pliny/ui/TOCInline'
import Image from '../../common/atoms/Image'
import CustomLink from '../../common/atoms/Link'

export const components: MDXComponents = {
  Image,
  TOCInline,
  a: CustomLink,
  pre: Pre,
  BlogNewsletterForm,
  table: (props) => (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-md dark:border-gray-700">
      <table
        {...props}
        className="!my-0 min-w-full table-auto divide-x divide-gray-200 dark:divide-gray-700"
      />
    </div>
  ),
  th: (props) => (
    <th
      className="border-r border-b border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-semibold whitespace-nowrap text-gray-900 last:border-r-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      {...props}
    />
  ),
  td: (props) => (
    <td
      className="border-r border-b border-gray-100 px-4 py-2.5 text-sm text-gray-600 last:border-r-0 dark:border-gray-700/50 dark:text-gray-300"
      {...props}
    />
  ),
  tr: (props) => (
    <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50" {...props} />
  ),
}
