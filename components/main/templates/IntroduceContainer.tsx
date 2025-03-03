import GreetingTextWrapper from '../molecules/GreetingTextWrapper'
import IntroduceTextWrapper from '../molecules/IntroduceTextWrapper'
import { TypedIntroduceWrapper } from '../organisms/TypedIntroduceWrapper'

const INTERESTED_TECH_TAGS = ['cosmos-network', 'Cryptography']

const IntroduceContainer = () => {
  return (
    <div className="flex h-auto w-auto items-center justify-between p-0 md:p-4">
      <div className="flex h-auto flex-1 flex-col items-start justify-start">
        <GreetingTextWrapper />
        <IntroduceTextWrapper />
        <TypedIntroduceWrapper />

        <div className="p-2">{/* <MyInformation /> */}</div>
      </div>
    </div>
  )
}

export default IntroduceContainer
