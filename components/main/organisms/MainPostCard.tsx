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
    <div className="container flex flex-col items-center justify-center p-4 shadow-md rounded-xl bg-slate-200 dark:bg-slate-700">
      <PostThumbnailWrapper
        title={title}
        slug={slug}
        image={Array.isArray(images) ? images[0] : '/static/images/banner.jpeg'}
        className="mb-4 bg-white shadow-md rounded-xl h-72"
        imageObjectFit="contain"
      />

      <div className="flex flex-col items-start justify-start w-full mt-2 lg:mt-0 h-60 md:h-72 min-h-max">
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
        <div className="flex flex-wrap mt-8">
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
