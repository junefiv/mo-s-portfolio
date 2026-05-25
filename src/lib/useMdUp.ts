import {useEffect, useState} from 'react'

/** `@theme` md — 48rem / 768px */
export const MD_MIN_WIDTH = '(min-width: 48rem)'

export function useMdUp() {
  const [mdUp, setMdUp] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(MD_MIN_WIDTH)
    const on = () => setMdUp(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return mdUp
}
