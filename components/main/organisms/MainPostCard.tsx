import { Authors, Blog } from 'contentlayer/generated'
import { CoreContent } from 'pliny/utils/contentlayer'

import { PostSummaryTextElement } from '@/components/common/atoms/PostTextElement'
import PostThumbnailWrapper from '@/components/common/molecules/PostThumbnailWrapper'
import NavigationButton from '../../common/molecules/NavigationButton'
import PostAuthorSection from '../../common/organisms/PostAuthorSection'
import Tag from '../../tags/Tag'

interface MainPostCardProps {
  post: CoreContent<Blog>
  author: Authors
}

const MainPostCard = ({ post, author }: MainPostCardProps) => {
  const { slug, date, title, summary, tags, images } = post
  return (
    <div className="container flex flex-col items-center justify-center rounded-xl bg-slate-200 p-4 shadow-md dark:bg-slate-700">
      <PostThumbnailWrapper
        title={title}
        slug={slug}
        image={Array.isArray(images) ? images[0] : '/static/images/banner.jpeg'}
        className="mb-4 h-72 rounded-xl bg-slate-100/60 shadow-md dark:bg-slate-600"
        imageObjectFit="contain"
      />

      <div className="mt-2 flex h-60 min-h-max w-full flex-col items-start justify-start md:h-72 lg:mt-0">
        <div className="flex-1">
          <NavigationButton
            href={`/posts/${slug}`}
            isArrow={false}
            color="slate"
            title={title}
            spanClassName="text-lg font-semibold text-gray-800 dark:text-white md:text-lg md:py-1 leading-4"
            buttonClassName="tracking-normal"
          />

          <PostSummaryTextElement summary={summary ?? ''} />
        </div>
        <div className="mt-8 flex flex-wrap">
          {tags.map((tag) => (
            <Tag className="my-1 mr-2" key={tag} text={tag} />
          ))}
        </div>
        {/* <NavigationButton
          title="Read more"
          href={`/posts/${slug}`}
          isArrow={true}
          color="primary"
          buttonClassName="mt-3"
        /> */}
        <PostAuthorSection author={author} date={date} />
      </div>
    </div>
  )
}

export default MainPostCard
