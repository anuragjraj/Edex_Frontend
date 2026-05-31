import { useEffect } from 'react'

// ══════════════════════════════════════════════════════════════
//  HOOKS
// ══════════════════════════════════════════════════════════════

export function useAutoSave(tool, subject, cls, chapter, content) {
  useEffect(() => {
    if (!content || !chapter) return
    const key = `bs_saved_${tool}_${subject}_${cls}_${chapter}`.replace(/\s+/g, '_').toLowerCase()
    try { localStorage.setItem(key, content) } catch {}
  }, [content, tool, subject, cls, chapter])
}
