import { useState, useEffect, useRef } from 'react'
import { GhostBtn, PrimaryBtn } from '../../components/ui/Button'
import { ErrMsg, Spinner } from '../../components/ui/Feedback'
import { BSSelect } from '../../components/ui/Input'
import { Card, Field, PageHeader } from '../../components/ui/Layout'
import { API_URL } from '../../config/config'
import { CLASSES, SUBJECTS, getChapters } from '../../constants/subjects'
import { ModuleView } from './ModuleView'
import { StatusDot } from './StatusDot'
import { api } from '../../lib/apiClient'

// ══════════════════════════════════════════════════════════════
//  CHAPTER COURSES
// ══════════════════════════════════════════════════════════════
export function ChapterCourses({ user, prefill, onClearPrefill }) {
  const [subj,     setSubj]    = useState('Mathematics')
  const [cls,      setCls]     = useState(user?.class_level || 'Class 10')
  const [chapter,  setChapter] = useState('')
  const [phase,    setPhase]   = useState('select')
  const [courseKey,setCourseKey] = useState('')
  const [modules,  setModules] = useState([])
  const [activeModuleId, setActiveModuleId] = useState(null)
  const [moduleData, setModuleData] = useState(null)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [statusMsg, setStatusMsg] = useState('')
  const [err, setErr] = useState('')
  const [completedIds, setCompletedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('bs_completed_modules') || '[]')) }
    catch { return new Set() }
  })

  const chs       = getChapters(subj, cls)
  const sseRef    = useRef(null)
  const autoGenRef = useRef(false)

  // ── Prefill from history ──────────────────────────────────
  useEffect(() => {
    if (!prefill?.chapter) return
    if (prefill.subject) setSubj(prefill.subject)
    setChapter(prefill.chapter)
    autoGenRef.current = true
    onClearPrefill?.()
  }, [])

  useEffect(() => {
    if (!autoGenRef.current || !chapter) return
    autoGenRef.current = false
    generateCourse()
  }, [chapter, subj])

  useEffect(() => () => sseRef.current?.close(), [])

  // ── When subject/class changes, reset chapter selection ──
  const handleSubjChange = v => { setSubj(v); setChapter('') }
  const handleClsChange  = v => { setCls(v);  setChapter('') }

  function markComplete(id) {
    setCompletedIds(prev => {
      const next = new Set([...prev, `${courseKey}-${id}`])
      localStorage.setItem('bs_completed_modules', JSON.stringify([...next]))
      return next
    })
  }
  const isComplete = id => completedIds.has(`${courseKey}-${id}`)

  // ── Generate ──────────────────────────────────────────────
  async function generateCourse() {
    if (!chapter) return
    setErr(''); setPhase('generating'); setModules([]); setProgress({ done: 0, total: 0 })
    setStatusMsg(`Designing modules for "${chapter}"…`)
    try {
      const { courseKey: key, existing } = await api.post('/api/chapter-courses/generate', {
        subject: subj, cls, chapter,
      })
      setCourseKey(key)
      if (existing) {
        const cached = await api.get(`/api/chapter-courses/list/${key}`)
        if (cached?.modules) {
          setModules(cached.modules)
          setProgress({ done: cached.modules.filter(m => m.status === 'done').length, total: cached.modules.length })
          setPhase('course'); return
        }
      }
      connectSSE(key)
    } catch (e) { setErr(e.message); setPhase('select') }
  }

  function connectSSE(key) {
    const token = localStorage.getItem('bs_token')
    const es    = new EventSource(`${API_URL}/api/chapter-courses/stream/${key}?token=${token}`)
    sseRef.current = es
    es.onmessage = e => { try { handleSSEMessage(JSON.parse(e.data)) } catch {} }
    es.onerror   = () => {
      es.close()
      api.get(`/api/chapter-courses/list/${key}`).then(cached => {
        if (cached?.modules) { setModules(cached.modules); setPhase('course') }
      }).catch(() => {})
    }
  }

  function handleSSEMessage(msg) {
    switch (msg.type) {
      case 'status':           setStatusMsg(msg.message); break
      case 'modules_listed':   setModules(msg.modules || []); setProgress({ done: 0, total: msg.modules?.length || 0 }); setStatusMsg('Searching YouTube & generating content…'); break
      case 'module_building':  setModules(p => p.map(m => m.id === msg.moduleId ? { ...m, status: 'building' } : m)); setStatusMsg(`Building: "${msg.title}"…`); break
      case 'module_done':      setModules(p => p.map(m => m.id === msg.moduleId ? { ...m, status: 'done', videoId: msg.videoId, transcriptStatus: msg.transcriptStatus } : m)); setProgress(p => ({ ...p, done: p.done + 1 })); break
      case 'module_error':     setModules(p => p.map(m => m.id === msg.moduleId ? { ...m, status: 'error' } : m)); break
      case 'generation_complete': if (msg.modules) setModules(msg.modules); setPhase('course'); sseRef.current?.close(); break
      case 'already_done':     if (msg.data?.modules) setModules(msg.data.modules); setPhase('course'); sseRef.current?.close(); break
      case 'error':            setErr(msg.message || 'Generation failed'); setPhase('select'); sseRef.current?.close(); break
    }
  }

  async function openModule(mod) {
    if (mod.status !== 'done') return
    setActiveModuleId(mod.id); setModuleData(null)
    const modKey = buildModKey(subj, cls, chapter, mod.id)
    try { setModuleData(await api.get(`/api/chapter-courses/module/${modKey}`)) }
    catch (e) { setErr('Could not load module: ' + e.message) }
  }

  function buildModKey(subject, c, ch, moduleId) {
    const safe = s => s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 16)
    return `bscm-mod-${safe(subject)}-${safe(c)}-${safe(ch)}-${moduleId}`
  }

  // ── PHASE: generating ─────────────────────────────────────
  if (phase === 'generating') {
    return (
      <div style={{ padding: 24, fontFamily: "'Nunito', sans-serif", maxWidth: 800, margin: '0 auto' }}>
        <GhostBtn small onClick={() => { sseRef.current?.close(); setPhase('select') }} style={{ marginBottom: 20 }}>← Back</GhostBtn>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, color: 'var(--text-h)', margin: '0 0 4px' }}>📚 Building Your Course</h2>
          <p style={{ color: 'var(--text)', margin: 0, fontSize: 13 }}>{chapter} · {subj} · {cls}</p>
        </div>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-h)' }}>{statusMsg}</span>
            {progress.total > 0 && <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 800 }}>{progress.done}/{progress.total}</span>}
          </div>
          {progress.total > 0 && (
            <div style={{ background: 'var(--border)', borderRadius: 999, height: 8 }}>
              <div style={{ background: 'linear-gradient(90deg,#6366F1,#8B5CF6)', width: `${Math.round((progress.done / progress.total) * 100)}%`, height: '100%', borderRadius: 999, transition: 'width .5s ease' }} />
            </div>
          )}
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
          {modules.map(mod => (
            <div key={mod.id} style={{ background: 'var(--bg2)', border: `1px solid ${mod.status === 'done' ? '#6366F1' : mod.status === 'building' ? '#F59E0B' : mod.status === 'error' ? '#EF4444' : 'var(--border)'}`, borderRadius: 12, padding: '12px 14px', transition: 'border-color .3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>{mod.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-h)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</div>
                </div>
                <StatusDot status={mod.status} />
              </div>
              {mod.status === 'building' && <div style={{ fontSize: 11, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 4 }}><Spinner size={10} /> Searching…</div>}
              {mod.status === 'done' && mod.videoId && <div style={{ fontSize: 10.5, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>▶ {mod.videoTitle?.slice(0, 35) || 'Video found'}</div>}
            </div>
          ))}
        </div>
        <ErrMsg msg={err} />
      </div>
    )
  }

  // ── PHASE: course (sidebar + module view) ─────────────────
  if (phase === 'course') {
    const doneCount = modules.filter(m => m.status === 'done').length
    const compCount = modules.filter(m => isComplete(m.id)).length
    const pct       = doneCount > 0 ? Math.round((compCount / doneCount) * 100) : 0
    const activeMod = modules.find(m => m.id === activeModuleId)
    return (
      <div style={{ display: 'flex', height: 'calc(100vh - 120px)', fontFamily: "'Nunito', sans-serif", overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 272, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'rgba(5,5,14,.85)', overflow: 'hidden' }}>
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <GhostBtn small onClick={() => setPhase('select')} style={{ marginBottom: 10 }}>← Change Chapter</GhostBtn>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 4 }}>Course Content</div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 13.5, color: 'var(--text-h)', lineHeight: 1.3, marginBottom: 2 }}>{chapter}</div>
            <div style={{ fontSize: 11, color: 'var(--text)', marginBottom: 8 }}>{subj} · {cls} · {doneCount} modules</div>
            <div style={{ background: 'var(--border)', borderRadius: 999, height: 3 }}>
              <div style={{ background: 'linear-gradient(90deg,var(--accent),#8B5CF6)', width: `${pct}%`, height: '100%', borderRadius: 999, transition: 'width .5s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 10, color: 'var(--text)' }}>{pct}% complete</span>
              <span style={{ fontSize: 10, color: 'var(--text)' }}>{compCount}/{doneCount} done</span>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {modules.map((mod, idx) => {
              const done     = mod.status === 'done'
              const comp     = isComplete(mod.id)
              const building = mod.status === 'building'
              const isActive = activeModuleId === mod.id
              return (
                <div key={mod.id} onClick={() => done && openModule(mod)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 10px', borderRadius: 10, cursor: done ? 'pointer' : 'default', border: `1px solid ${isActive ? 'var(--accent-border)' : 'transparent'}`, background: isActive ? 'var(--accent-bg)' : 'transparent', opacity: !done && !building ? .5 : 1, marginBottom: 2, transition: 'all .15s' }}
                  onMouseEnter={e => { if (done && !isActive) e.currentTarget.style.background = 'rgba(255,255,255,.04)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginTop: 1, background: comp ? 'rgba(34,197,94,.2)' : isActive ? 'rgba(99,102,241,.2)' : building ? 'rgba(245,158,11,.15)' : 'rgba(255,255,255,.06)', color: comp ? '#34d399' : isActive ? 'var(--accent)' : building ? '#fbbf24' : '#374151' }}>
                    {comp ? '✓' : building ? <Spinner size={9} /> : idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: isActive ? 'var(--text-h)' : '#94a3b8', fontWeight: isActive ? 600 : 400, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {mod.emoji && <span style={{ marginRight: 4 }}>{mod.emoji}</span>}{mod.title || '…'}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                      {done && mod.videoId       && <span style={{ fontSize: 9.5, background: 'rgba(34,197,94,.1)', color: '#34d399', borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>▶ Video</span>}
                      {done && mod.transcriptStatus === 'success' && <span style={{ fontSize: 9.5, background: 'rgba(6,182,212,.1)', color: '#22d3ee', borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>✓ Transcript</span>}
                      {comp  && <span style={{ fontSize: 9.5, background: 'rgba(245,158,11,.1)', color: '#fbbf24', borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>🏆 Done</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {/* Module content area */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeMod ? (
            <ModuleView
              mod={activeMod}
              moduleData={moduleData}
              subject={subj}
              cls={cls}
              chapter={chapter}
              courseKey={courseKey}
              isComplete={isComplete(activeModuleId)}
              onComplete={() => markComplete(activeModuleId)}
              onPrev={() => { const idx = modules.findIndex(m => m.id === activeModuleId); if (idx > 0) openModule(modules[idx - 1]) }}
              onNext={() => { const idx = modules.findIndex(m => m.id === activeModuleId); const next = modules.slice(idx + 1).find(m => m.status === 'done'); if (next) openModule(next) }}
              hasPrev={modules.findIndex(m => m.id === activeModuleId) > 0}
              hasNext={modules.slice(modules.findIndex(m => m.id === activeModuleId) + 1).some(m => m.status === 'done')}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 52 }}>📚</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--text-h)' }}>Select a module to start</div>
              <p style={{ fontSize: 13, color: 'var(--text)', maxWidth: 300, lineHeight: 1.7, margin: 0 }}>Click any module from the list on the left.</p>
              <ErrMsg msg={err} />
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── PHASE: select — clean dropdown UI like NotesMaker ─────
  return (
    <div style={{ padding: 24, width: '100%', boxSizing: 'border-box', fontFamily: "'Nunito', sans-serif" }}>
      <PageHeader icon="📚" title="Chapter Courses" subtitle="AI selects the best YouTube videos per topic & generates notes + quiz from transcripts" color="#8B5CF6" />

      <Card style={{ marginBottom: 18 }}>
        {/* Row 1: Subject + Class */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 4 }}>
          <Field label="Subject">
            <BSSelect value={subj} onChange={handleSubjChange} options={SUBJECTS} />
          </Field>
          <Field label="Class">
            <BSSelect value={cls} onChange={handleClsChange} options={CLASSES} />
          </Field>
        </div>

        {/* Row 2: Chapter dropdown */}
        <Field label="Chapter">
          <BSSelect
            value={chapter}
            onChange={setChapter}
            options={[{ value: '', label: '── Select a Chapter ──' }, ...chs.map(c => ({ value: c, label: c }))]}
          />
        </Field>

        {/* Generate button — appears once a chapter is chosen */}
        {chapter && (
          <div style={{ marginTop: 16, padding: '16px 18px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--text-h)', fontSize: 14, marginBottom: 3 }}>{chapter}</div>
                <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
                  AI builds 8–12 focused modules · Best YouTube video per sub-topic · Notes + Quiz from transcript
                </div>
              </div>
              <PrimaryBtn onClick={generateCourse} color="#8B5CF6">🚀 Build Course</PrimaryBtn>
            </div>
          </div>
        )}
      </Card>

      {/* Feature highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
        {[
          ['🎬', 'Best Video Selected',  'YouTube searched per sub-topic — best video with transcript chosen'],
          ['📄', 'Transcript-Based',     'Notes & quiz generated from actual video content, not guesswork'],
          ['🎯', 'Per-Module Quiz',      '8 MCQs per module based on what the video teaches'],
          ['💬', 'Deep Q&A',             '6 practice questions per module from Hard to Easy'],
        ].map(([e, t, d]) => (
          <div key={t} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 15px' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{e}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-h)', marginBottom: 4 }}>{t}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.5 }}>{d}</div>
          </div>
        ))}
      </div>
      <ErrMsg msg={err} />
    </div>
  )
}
