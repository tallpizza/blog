import Tag from '@/components/tags/Tag'
import { Authors, Blog } from 'contentlayer/generated'
import { CoreContent } from 'pliny/utils/contentlayer'
import { PostSummaryTextElement } from '../../common/atoms/PostTextElement'
import NavigationButton from '../../common/molecules/NavigationButton'
import PostThumbnailWrapper from '../../common/molecules/PostThumbnailWrapper'
import PostAuthorSection from '../../common/organisms/PostAuthorSection'

export default function PostContainer({
  post,
  author,
}: {
  post: Blog | CoreContent<Blog>
  author: Authors
}) {
  const { slug, date, title, summary, tags, images } = post

  return (
    <div className="container">
      <div className="lg:-mx-6 lg:flex lg:items-center">
        <PostThumbnailWrapper
          title={title}
          slug={slug}
          image={Array.isArray(images) ? images[0] : '/static/images/banner.jpeg'}
          className="h-72 rounded-xl border-[0.5px] border-gray-300/40 lg:mx-6 lg:w-1/2"
          imageObjectFit="contain"
        />

        <div className="mt-2 flex min-h-full flex-col items-start justify-start py-1 lg:mt-0 lg:h-72 lg:w-1/2">
          <div className="flex-1">
            <NavigationButton
              href={`/posts/${slug}`}
              isArrow={false}
              color="slate"
              title={title}
              spanClassName="block text-xl font-semibold text-gray-800 dark:text-white md:text-2xl"
              buttonClassName="tracking-normal"
            />

            <PostSummaryTextElement summary={summary ?? ''} />
            <div className="mt-3">
              <NavigationButton
                color="primary"
                href={`/posts/${slug}`}
                title={'Read more'}
                isArrow={true}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap">
            {tags.map((tag) => (
              <Tag className="my-1 mr-2" key={tag} text={tag} />
            ))}
          </div>
          <PostAuthorSection author={author} date={date} />
        </div>
      </div>
    </div>
  )
}
