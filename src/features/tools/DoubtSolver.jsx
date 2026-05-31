import { useState, useEffect, useRef } from 'react'
import { PrimaryBtn } from '../../components/ui/Button'
import { ErrMsg } from '../../components/ui/Feedback'
import { BSSelect } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/Layout'
import { CLASSES, SUBJECTS, getChapters } from '../../constants/subjects'
import { api } from '../../lib/apiClient'
import { saveSessionContent } from '../../lib/sessions'
import { T } from '../../theme/tokens'

// ══════════════════════════════════════════════════════════════
//  DOUBT SOLVER
// ══════════════════════════════════════════════════════════════
export function DoubtSolver({ user, prefill, onClearPrefill }) {
  const [subject,  setSubject]  = useState('Mathematics')
  const [cls,      setCls]      = useState('Class 10')
  const [chapter,  setChapter]  = useState('')
  const [messages, setMessages] = useState([{ role: 'assistant', content: "👋 Hi! Ask me any doubt — I'll give you a **clear, step-by-step explanation** tailored to your CBSE syllabus. 🎯" }])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [err,      setErr]      = useState('')
  const bottomRef = useRef(null)

  const chapters = getChapters(subject, cls)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (!prefill) return
    if (prefill.subject) setSubject(prefill.subject)
    if (prefill.chapter) setChapter(prefill.chapter)
    onClearPrefill?.()
  }, [])

  const chapterContext = chapter ? ` specifically the chapter "${chapter}"` : ''
  const SYSTEM = `You are an expert CBSE teacher specializing in ${subject}${chapterContext} for ${cls}. Help students understand concepts clearly with step-by-step explanations. Use simple language and relatable examples. Use **bold** for key terms. Be encouraging and thorough. If the question is about a different chapter, still answer helpfully but note the actual chapter it belongs to.`

  async function send() {
    if (!input.trim()) return
    const userMsg = { role: 'user', content: input.trim() }
    setMessages(m => [...m, userMsg]); setInput(''); setErr(''); setLoading(true)
    try {
      const r = await api.post('/api/ai/doubt', { messages: [...messages, userMsg], system: SYSTEM, subject })
      const newMessages = [...messages, userMsg, { role: 'assistant', content: r.content }]
      setMessages(newMessages)
      saveSessionContent({ tool:'doubt', subject, chapter, classLevel:cls, content:newMessages })
    } catch (e) {
      if (e.status === 402) setErr('Free trial ended. Please subscribe.')
      else setErr(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: 24, width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <PageHeader icon="🤔" title="AI Doubt Solver" subtitle="Ask anything — get clear, step-by-step CBSE explanations" color="#6366F1" />

      {/* Compact context bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 140px' }}>
          <BSSelect value={subject} onChange={v => { setSubject(v); setChapter('') }} options={SUBJECTS} />
        </div>
        <div style={{ flex: '1 1 120px' }}>
          <BSSelect value={cls} onChange={v => { setCls(v); setChapter('') }} options={CLASSES} />
        </div>
        <div style={{ flex: '2 1 200px' }}>
          <BSSelect
            value={chapter}
            onChange={setChapter}
            options={[{ value: '', label: '── All chapters ──' }, ...chapters.map(c => ({ value: c, label: c }))]}
          />
        </div>
      </div>

      {chapter && (
        <div style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 8, padding: '6px 12px', marginBottom: 10, fontWeight: 700 }}>
          📌 Context: {subject} › {cls} › {chapter}
        </div>
      )}

      {/* Chat window */}
      <div style={{ ...T.card, flex: 1, overflowY: 'auto', marginBottom: 14, minHeight: 200, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: 10 }}>
            {m.role === 'assistant' && <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, marginTop: 2 }}>🧠</div>}
            <div style={{ maxWidth: '78%', padding: '11px 15px', borderRadius: m.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px', fontSize: 14, lineHeight: 1.75, background: m.role === 'user' ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'var(--code-bg)', color: m.role === 'user' ? '#fff' : 'var(--text-h)', border: m.role === 'assistant' ? '1px solid var(--border)' : 'none' }}
              dangerouslySetInnerHTML={{ __html: m.role === 'assistant' ? m.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') : m.content }} />
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🧠</div>
            <div style={{ background: 'var(--code-bg)', padding: '12px 16px', borderRadius: '4px 14px 14px 14px', border: '1px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 1, 2].map(j => <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: `dotBounce 1s ${j * .2}s infinite ease-in-out` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ErrMsg msg={err} />
      <div style={{ display: 'flex', gap: 10 }}>
        <input style={{ ...T.input, flex: 1 }} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder={`Ask a ${subject}${chapter ? ` › ${chapter}` : ''} question… (Enter to send)`} disabled={loading} />
        <PrimaryBtn onClick={send} disabled={loading || !input.trim()}>Send →</PrimaryBtn>
      </div>
    </div>
  )
}
