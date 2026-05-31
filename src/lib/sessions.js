import { api } from './apiClient'

// ══════════════════════════════════════════════════════════════
//  SESSION STORAGE  (saves generated content for history replay)
// ══════════════════════════════════════════════════════════════
export const SESSION_PREFIX = 'bs_sess_'

export const MAX_SESSIONS   = 200

export function saveSessionContent({ tool, subject='', chapter='', chapters=[], classLevel='', content, extra={} }) {
  try {
    const id  = `${tool}-${subject}-${chapter||(chapters||[]).join(',')}-${Date.now()}`
    const key = SESSION_PREFIX + id
    localStorage.setItem(key, JSON.stringify({
      id, tool, subject, chapter, chapters, classLevel, content, extra,
      savedAt: new Date().toISOString(),
    }))
    // Prune oldest beyond MAX_SESSIONS
    const allKeys = Object.keys(localStorage).filter(k=>k.startsWith(SESSION_PREFIX)).sort()
    if (allKeys.length > MAX_SESSIONS)
      allKeys.slice(0, allKeys.length - MAX_SESSIONS).forEach(k=>localStorage.removeItem(k))
    return id
  } catch(e) { console.warn('[saveSessionContent]', e.message); return null }
}

export function listAllSessions() {
  try {
    return Object.keys(localStorage)
      .filter(k=>k.startsWith(SESSION_PREFIX))
      .map(k=>{ try{ return JSON.parse(localStorage.getItem(k)) }catch{ return null } })
      .filter(Boolean)
      .sort((a,b)=>new Date(b.savedAt)-new Date(a.savedAt))
  } catch { return [] }
}

export function findSessionForActivity(item) {
  const sessions = listAllSessions()
  return sessions.find(s =>
    s.tool    === item.tool    &&
    s.subject === item.subject &&
    (s.chapter === item.chapter ||
     (item.chapters||[]).some(c => s.chapter===c || (s.chapters||[]).includes(c))) &&
    Math.abs(new Date(s.savedAt) - new Date(item.created_at)) < 2 * 60 * 60 * 1000 // within 2 hours
  ) || null
}

// Loads the most recent saved item for a tool matching subject + chapter/chapters
export async function loadSavedContent(tool, subject, chapter, chapters) {
  const endpoints = {
    notes:      { list: '/api/user/notes',      detail: id => `/api/user/notes/${id}`,      matchFn: (n) => n.subject === subject && n.chapter === chapter },
    paper:      { list: '/api/user/papers',     detail: id => `/api/user/papers`,           matchFn: (n) => n.subject === subject && (n.chapters||[]).some(c => (chapters||[]).includes(c) || c === chapter) },
    cheatsheet: { list: '/api/user/cheatsheets',detail: id => `/api/user/cheatsheets`,      matchFn: (n) => n.subject === subject && (n.chapters||[]).some(c => (chapters||[]).includes(c) || c === chapter) },
    lessonplan: { list: '/api/user/lessonplans', detail: id => `/api/user/lessonplans`,     matchFn: (n) => n.subject === subject && (n.topic === chapter) },
  }
  const cfg = endpoints[tool]
  if (!cfg) return null
  try {
    const list  = await api.get(cfg.list)
    const match = list.find(cfg.matchFn)
    if (!match) return null
    // notes have a real detail endpoint; others store content in list already
    if (tool === 'notes') {
      const full = await api.get(`/api/user/notes/${match.id}`)
      return full.content
    }
    return match.content || null
  } catch { return null }
}
