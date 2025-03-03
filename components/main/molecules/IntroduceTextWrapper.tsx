import Tag from '@/components/tags/Tag'
import { RoughNotation } from 'react-rough-notation'

const INTERESTED_TECH_TAGS = ['Practical', 'Efficiency']

const IntroduceTextWrapper = () => {
  return (
    <div className="">
      <div className="mb-2 flex bg-gradient-to-r from-slate-500 to-slate-800 bg-clip-text pl-2 text-lg text-transparent dark:from-gray-200 dark:to-slate-300">
        <div className="pr-1">Interested Tech&nbsp;</div>
        <RoughNotation type="box" show color="#1d4ed8">
          Tags
        </RoughNotation>
      </div>
      <div className="gap flex h-auto w-full flex-col xl:flex-row">
        {INTERESTED_TECH_TAGS.map((tag, index) => {
          return (
            <div key={index} className="p-1">
              <Tag text={tag} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default IntroduceTextWrapper
