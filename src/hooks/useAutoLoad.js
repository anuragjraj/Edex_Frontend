import { useState, useEffect } from 'react'

/** Load previously saved content on mount — returns string or null */
export function useAutoLoad(tool, subject, cls, chapter) {
  const [loaded, setLoaded] = useState(null)
  useEffect(() => {
    if (!chapter) return
    const key = `bs_saved_${tool}_${subject}_${cls}_${chapter}`.replace(/\s+/g, '_').toLowerCase()
    try {
      const v = localStorage.getItem(key)
      if (v) setLoaded(v)
    } catch {}
  }, [tool, subject, cls, chapter])
  return loaded
}
