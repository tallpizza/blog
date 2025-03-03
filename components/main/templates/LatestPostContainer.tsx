import NavigationButton from '@/components/common/molecules/NavigationButton'
import { Authors, Blog } from 'contentlayer/generated'
import { CoreContent } from 'pliny/utils/contentlayer'
import { Fragment } from 'react'
import MainPostCard from '../organisms/MainPostCard'
const MAX_DISPLAY = 4
const LatestPostContainer = ({
  posts,
  author,
}: {
  posts: CoreContent<Blog>[]
  author: Authors
}) => {
  return (
    <Fragment>
      <div className="space-y-2 pt-4 pb-2 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          Latest Posts
        </h1>
      </div>

      <ul className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {!posts.length && 'No posts found.'}
        {posts.slice(0, MAX_DISPLAY).map((post, index) => {
          const { slug } = post
          const isLastElement = index === MAX_DISPLAY - 1
          return (
            <li
              key={slug}
              className={`${isLastElement ? 'hidden sm:block lg:block xl:hidden' : ''}`}
            >
              <MainPostCard post={post} author={author} />
            </li>
          )
        })}
      </ul>
      {posts.length > MAX_DISPLAY && (
        <div className="flex justify-end text-base leading-6 font-medium">
          <NavigationButton
            title="All Posts"
            href="/posts"
            color="primary"
            isArrow={true}
            buttonClassName="mt-4"
          />
        </div>
      )}
    </Fragment>
  )
}

export default LatestPostContainer
