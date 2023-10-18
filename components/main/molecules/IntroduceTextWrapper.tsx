import Tag from '@/components/tags/Tag'
import { RoughNotation } from 'react-rough-notation'

const INTERESTED_TECH_TAGS = ['Practical', 'Efficiency']

const IntroduceTextWrapper = () => {
  return (
    <div className="">
      <div className="flex pl-2 mb-2 text-lg text-transparent bg-gradient-to-r from-slate-500 to-slate-800 bg-clip-text dark:from-gray-200 dark:to-slate-300">
        <div className="pr-1">Interested Tech&nbsp;</div>
        <RoughNotation type="box" show color="#1d4ed8">
          Tags
        </RoughNotation>
      </div>
      <div className="flex flex-col w-full h-auto xl:flex-row gap">
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
