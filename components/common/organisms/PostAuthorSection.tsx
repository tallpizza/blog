import { Authors } from 'contentlayer/generated'
import PostAuthorContainer from '../molecules/PostAuthorContainer'
import PostDateContainer from '../molecules/PostDateContainer'

interface PostAuthorSectionProps {
  author: Authors
  date: string
}

const PostAuthorSection = ({ author, date }: PostAuthorSectionProps) => {
  return (
    <div className="my-2 mt-4 flex w-full items-center justify-between">
      <PostAuthorContainer author={author} />

      <PostDateContainer date={date} />
    </div>
  )
}

export default PostAuthorSection
