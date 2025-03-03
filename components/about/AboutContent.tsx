'use client'
import { useState } from 'react'

export default function AboutContent() {
  const [isKorean, setIsKorean] = useState<boolean>(true)
  const handleLanguageChange = (e) => {
    const selectedLanguage = e.target.value
    setIsKorean(selectedLanguage === 'ko')
  }
  return (
    <div>
      <div className="flex items-center justify-end">
        <select
          className="block w-auto rounded-lg border border-gray-300 bg-gray-50 p-2 pr-8 text-center text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
          id="language"
          onChange={handleLanguageChange}
          defaultValue={'ko'} // 현재 선택된 언어를 표시
        >
          <option selected value="ko">
            🇰🇷&nbsp;한국어
          </option>
          <option value="en">🇺🇸&nbsp;English</option>
        </select>
      </div>
      <div className="p-4">{isKorean ? <KoreanContent /> : <EnglishContent />}</div>
    </div>
  )
}

const KoreanContent = () => {
  return (
    <div>
      안녕하세요. 2년 차 Full Stack Developer 이민기입니다.
      <br />
      주로 React와 TypeScript를 이용하여 Front-end 개발을 하고 있습니다.
      <br />
      Back-end 개발은 Node.js와 Express, Nest.js를 이용하여 개발하고 있습니다.
      <br />
      DB는 MongoDB를 사용하고 있습니다.
      <br />
      BlockChain에 관심이 많으며, 특히 Cosmos Network에 관심이 있습니다.
      <br />
      다른 개발자들을 이해할 수 있는 다양한 경험과 전반적인 개발 과정을 배우고 있습니다.
      <br />
      지속 가능한 코드에 관심이 많으며, 지속 가능한 코드를 작성하기 위해 노력하고 있습니다.
      <br />
      커뮤니케이션에 있어 단어 선택에 중요성을 두고 있습니다.
      <br />
      문제를 해결하기 위해 근본적인 문제점을 생각한 후 해결을 위해 공부하는 것에 즐거움을 느낍니다.
      <br />더 나은 방법을 찾기 위해 주변 사람들과 대화를 자주 나누며, 여러 가지 방법을 고민하는
      것을 좋아합니다.
    </div>
  )
}
const EnglishContent = () => {
  return (
    <div>
      Hello, I'm Min Gi Lee and I'm a Full Stack Developer for 2 years.
      <br />
      I am mainly developing Front-end using React and TypeScript.
      <br />
      I am developing back-end using Node.js, Express, Nest.js, and db mainly uses mongodb
      <br />
      I'm very interested in BlockChain, especially Cosmos Network.
      <br />
      I am gaining various experiences to understand other developers and the overall development
      process.
      <br />
      I'm very interested in sustainable code, and I'm trying to write sustainable code.
      <br />
      I place importance on word selection in communication.
      <br />
      I have fun studying for a solution after thinking about the fundamental problem to solve the
      problem.
      <br />I often talk to people around me to find a better way, and I like to think about
      different ways.
    </div>
  )
}
