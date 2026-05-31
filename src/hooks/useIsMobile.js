import { useState, useEffect } from 'react'

export function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 769)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 769)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}
