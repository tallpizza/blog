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
    <div className={ctm('relative w-full overflow-hidden bg-clip-border', className)}>
      <Link
        className="relative block h-72 w-auto overflow-hidden rounded-xl bg-white bg-clip-border"
        href={`/posts/${slug}`}
        aria-label={`Read "${title}"`}
      >
        <Image
          className="absolute inset-0 h-full w-full object-cover"
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
