import { ctm } from 'app/utils/style'
import Link from 'next/link'
import Image from '../atoms/Image'

interface PostThumbnailWrapper {
  slug: string
  title: string
  image: string
  className?: string
  imageObjectFit: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
}

const PostThumbnailWrapper = ({
  slug,
  title,
  image,
  className,
  imageObjectFit,
}: PostThumbnailWrapper) => {
  return (
    <div className={ctm('relative overflow-hidden bg-clip-border w-full ', className)}>
      <Link
        className="relative block w-auto overflow-hidden bg-white bg-clip-border rounded-xl h-72"
        href={`/posts/${slug}`}
        aria-label={`Read "${title}"`}
      >
        <Image
          className="absolute inset-0 object-cover w-full h-full"
          sizes="auto"
          src={image}
          alt={slug}
          fill
          style={{ objectFit: imageObjectFit }}
        />
      </Link>
    </div>
  )
}

export default PostThumbnailWrapper
