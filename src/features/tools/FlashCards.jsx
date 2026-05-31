import { useState, useEffect } from 'react'
import { XPBadge } from '../../components/ui/Badge'
import { GhostBtn, PrimaryBtn } from '../../components/ui/Button'
import { ErrMsg, Spinner } from '../../components/ui/Feedback'
import { BSInput, BSSelect } from '../../components/ui/Input'
import { Card, Field, PageHeader } from '../../components/ui/Layout'
import { CLASSES, SUBJECTS, getChapters } from '../../constants/subjects'
import { api } from '../../lib/apiClient'
import { saveSessionContent } from '../../lib/sessions'

// ══════════════════════════════════════════════════════════════
//  FLASHCARDS
// ══════════════════════════════════════════════════════════════
export function FlashCards({ user, prefill, onClearPrefill }) {
  const [subject,     setSubject]     = useState('Mathematics')
  const [cls,         setCls]         = useState('Class 10')
  const [chapter,     setChapter]     = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [cards,       setCards]       = useState([])
  const [current,     setCurrent]     = useState(0)
  const [flipped,     setFlipped]     = useState({})
  const [mode,        setMode]        = useState('grid')
  const [loading,     setLoading]     = useState(false)
  const [err,         setErr]         = useState('')

  const chapters = getChapters(subject, cls)
  const topic    = chapter || customTopic

  useEffect(() => {
    if (!prefill) return
    if (prefill.subject) setSubject(prefill.subject)
    if (prefill.chapter) setChapter(prefill.chapter)
    onClearPrefill?.()
  }, [])

  async function generate() {
    if (!topic.trim()) return alert('Please select or enter a chapter/topic')
    const PROMPT = `Create 8 high-quality flashcards for "${topic}" in ${subject} ${cls} CBSE. Cover the most important terms, formulas, and concepts.
Return ONLY valid JSON:
{"cards":[{"front":"Key term or concept","back":"Clear, concise definition or explanation (1-2 sentences max)"}]}`
    setErr(''); setLoading(true); setCurrent(0); setFlipped({})
    try {
      const r = await api.post('/api/ai/flashcards', { messages: [{ role: 'user', content: PROMPT }], subject, chapter: topic })
      const raw = typeof r.content === 'string' ? r.content : r.content[0]?.text || ''
      const parsed = JSON.parse(raw.replace(/```[\w]*\n?/gi, '').trim())
      if (!parsed.cards?.length) throw new Error('No cards in response')
      setCards(parsed.cards)
    saveSessionContent({ tool:'flashcards', subject, chapter:topic, classLevel:cls, content:parsed.cards })
    } catch (e) {
      if (e.status === 402) setErr('Free trial ended. Please subscribe.')
      else setErr('Failed to generate flashcards. Try again.')
    }
    setLoading(false)
  }

  const card = cards[current]

  return (
    <div style={{ padding: 24, width: '100%', boxSizing: 'border-box', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <PageHeader icon="🃏" title="Flashcards" subtitle="Grid mode & Study mode for fast revision" color="#EF4444" />

      <Card style={{ marginBottom: 18 }}>
        {/* Subject + Class */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 4 }}>
          <Field label="Subject">
            <BSSelect value={subject} onChange={v => { setSubject(v); setChapter('') }} options={SUBJECTS} />
          </Field>
          <Field label="Class">
            <BSSelect value={cls} onChange={v => { setCls(v); setChapter('') }} options={CLASSES} />
          </Field>
        </div>

        {/* Chapter dropdown */}
        <Field label="Chapter">
          <BSSelect
            value={chapter}
            onChange={setChapter}
            options={[{ value: '', label: '── Select a Chapter ──' }, ...chapters.map(c => ({ value: c, label: c }))]}
          />
        </Field>

        {!chapter && (
          <Field label="Or enter a custom topic">
            <BSInput value={customTopic} onChange={setCustomTopic} placeholder="e.g. Chemical Bonding, Trigonometry" />
          </Field>
        )}

        <ErrMsg msg={err} />
        <PrimaryBtn onClick={generate} disabled={loading || !topic.trim()} color="#EF4444">
          {loading ? <><Spinner /> Creating cards…</> : '🃏 Generate Flashcards'}
        </PrimaryBtn>
      </Card>

      {cards.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--text-h)', margin: 0 }}>{topic} — {cards.length} Cards</h3>
            <div style={{ display: 'flex', gap: 7 }}>
              {[['grid', '⊞ Grid'], ['study', '▶ Study']].map(([m, l]) => (
                <button key={m} onClick={() => setMode(m)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", background: mode === m ? '#EF4444' : 'var(--social-bg)', color: mode === m ? '#fff' : 'var(--text-h)', transition: 'all .15s' }}>{l}</button>
              ))}
            </div>
          </div>

          {mode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 14 }}>
              {cards.map((c, i) => (
                <div key={i} onClick={() => setFlipped(f => ({ ...f, [i]: !f[i] }))} style={{ height: 130, borderRadius: 14, cursor: 'pointer', perspective: 1000 }}>
                  <div style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transition: 'transform .5s', transform: flipped[i] ? 'rotateY(180deg)' : 'none' }}>
                    <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', background: 'linear-gradient(135deg,#EF4444,#F97316)', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 14, textAlign: 'center' }}>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,.7)', fontWeight: 800, marginBottom: 7, letterSpacing: 1 }}>TAP TO REVEAL</span>
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: 13.5, lineHeight: 1.4 }}>{c.front}</span>
                    </div>
                    <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'var(--bg2)', borderRadius: 14, border: '2px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, textAlign: 'center' }}>
                      <span style={{ color: 'var(--text-h)', fontWeight: 700, fontSize: 13, lineHeight: 1.5 }}>{c.back}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
              <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 8, fontWeight: 700 }}>Card {current + 1} of {cards.length}</div>
              <div style={{ background: 'var(--border)', borderRadius: 999, height: 5, margin: '0 auto 18px', maxWidth: 240 }}>
                <div style={{ background: '#EF4444', width: `${((current + 1) / cards.length) * 100}%`, height: '100%', borderRadius: 999 }} />
              </div>
              <div onClick={() => setFlipped(f => ({ ...f, [current]: !f[current] }))} style={{ height: 180, background: flipped[current] ? 'var(--code-bg)' : 'linear-gradient(135deg,#EF4444,#F97316)', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: flipped[current] ? '2px solid #EF4444' : 'none', marginBottom: 18, padding: 24 }}>
                <span style={{ fontSize: 10, color: flipped[current] ? 'var(--text)' : 'rgba(255,255,255,.7)', fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>{flipped[current] ? 'ANSWER' : 'TERM — TAP TO FLIP'}</span>
                <span style={{ color: flipped[current] ? 'var(--text-h)' : '#fff', fontWeight: 800, fontSize: 16, lineHeight: 1.5 }}>{flipped[current] ? card.back : card.front}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <GhostBtn disabled={current === 0} onClick={() => { setCurrent(c => c - 1); setFlipped({}) }}>← Prev</GhostBtn>
                <PrimaryBtn color="#EF4444" onClick={() => setFlipped(f => ({ ...f, [current]: !f[current] }))}>Flip</PrimaryBtn>
                <GhostBtn disabled={current === cards.length - 1} onClick={() => { setCurrent(c => c + 1); setFlipped({}) }}>Next →</GhostBtn>
              </div>
            </Card>
          )}
          <GhostBtn small onClick={() => setCards([])} style={{ marginTop: 14 }}>↺ New Flashcards</GhostBtn>
        </>
      )}
      <XPBadge amount={15} label="per set" />
    </div>
  )
}
