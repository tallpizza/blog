import { ctm } from 'app/utils/style'
import { slug } from 'github-slugger'
import Link from 'next/link'
interface Props {
  text: string
  count?: number
  className?: string
}

const Tag = ({ text, count, className }: Props) => {
  return (
    <Link href={`/tags/${slug(text)}`} className={ctm('text-sm font-medium uppercase', className)}>
      <div className="group relative inline-block py-1 text-xs">
        <div className="text-primary-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 absolute inset-0 flex">
          <svg height="100%" viewBox="0 0 50 100">
            <path
              d="M49.9,0a17.1,17.1,0,0,0-12,5L5,37.9A17,17,0,0,0,5,62L37.9,94.9a17.1,17.1,0,0,0,12,5ZM25.4,59.4a9.5,9.5,0,1,1,9.5-9.5A9.5,9.5,0,0,1,25.4,59.4Z"
              fill="currentColor"
            />
          </svg>
          <div className="bg-primary-500 group-hover:bg-primary-600 dark:group-hover:bg-primary-400 -ml-px h-full flex-grow rounded-md rounded-l-none"></div>
        </div>
        <span className="relative pr-px font-semibold text-white uppercase">
          <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
          {text.split(' ').join('-')}
          <span>&nbsp;</span>
          {count && `[ ${count} ]`}
          <span>&nbsp;</span>
        </span>
      </div>
    </Link>
  )
}

export default Tag
