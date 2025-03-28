import { Authors } from 'contentlayer/generated'
import Link from 'next/link'
import Image from '../atoms/Image'

const PostAuthorContainer = ({ author }: { author: Authors }) => {
  return (
    <div className="flex items-center">
      <div className="relative h-10 w-10 rounded-full bg-slate-300 dark:bg-slate-600">
        <Image
          className="static h-10 w-10 rounded-full"
          sizes="auto"
          src={author.avatar as string}
          alt={author.name}
          fill
          style={{ objectFit: 'cover' }}
        />
      </div>
      <dl className="ml-2 text-sm leading-5 font-medium whitespace-nowrap">
        <dt className="sr-only">Name</dt>
        <dd className="text-gray-900 dark:text-gray-100">{author.name}</dd>
        <dt className="sr-only">Github</dt>
        <dd>
          {author.github && (
            <Link
              href={author.github as string}
              className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            >
              {author?.github?.replace('https://github.com/', '@')}
            </Link>
          )}
        </dd>
      </dl>
    </div>
  )
}

export default PostAuthorContainer
