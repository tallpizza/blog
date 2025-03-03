'use client'
import { useEffect, useRef } from 'react'
import Typed from 'typed.js'

function createTypedInstance(el: HTMLElement) {
  return new Typed(el, {
    stringsElement: '#bios',
    typeSpeed: 40,
    backSpeed: 10,
    loop: true,
    backDelay: 1000,
  })
}

export function TypedIntroduceWrapper() {
  const typedRef = useRef(null)

  useEffect(() => {
    const options = {
      strings: [
        'Hello, Here is my personal blog! &#x1F4DD;',
        "I'm interested in making functional objects that enhance daily life. &#x1F527;	&#x2728;",
        'Professional builder with occasional usefulness. &#x1F525;',
      ],
      typeSpeed: 50,
      backSpeed: 30,
      backDelay: 1000,
      loop: true,
    }

    const typed = new Typed(typedRef.current, options)

    return () => {
      typed.destroy()
    }
  }, [])

  return (
    <div className="min-h-42 py-4">
      <span
        className="emoji text-xl leading-7 text-gray-500 dark:text-gray-300"
        ref={typedRef}
      ></span>
    </div>
  )
}
