import Image from 'next/image'

const LogoIcon = () => {
  return (
    <div className="mr-2">
      <Image
        className="hidden dark:block"
        src={'/static/images/logo.png'}
        alt="Logo"
        width={40}
        height={40}
      />
      <Image
        className="dark:hidden"
        src={'/static/image/logo.png'}
        alt="Logo"
        width={40}
        height={40}
      />
    </div>
  )
}

export default LogoIcon
