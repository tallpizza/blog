import Link from 'next/link'
import InformationCheckIcon from '../atoms/InformationCheckIcon'
import { MainInformationText } from '../atoms/MainTextElement'

export default function MyInformation() {
  return (
    <div className="flex h-max flex-col">
      <Link href="/" className="font-display max-w-sm p-4 text-xl leading-tight font-semibold">
        <MainInformationText>
          <InformationCheckIcon /> Read My Writing 📝
        </MainInformationText>
      </Link>
      <Link href="/" className="font-display max-w-sm p-4 text-xl leading-tight font-semibold">
        <MainInformationText>
          <InformationCheckIcon />
          Who am I? 🧐
        </MainInformationText>
      </Link>
      <Link href="/" className="font-display max-w-sm p-4 text-xl leading-tight font-semibold">
        <MainInformationText className="link link-underline link-underline-black p-1">
          <InformationCheckIcon />
          Is My Resume 👤
        </MainInformationText>
      </Link>
    </div>
  )
}
