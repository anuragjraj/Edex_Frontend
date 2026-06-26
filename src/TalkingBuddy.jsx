/**
 * TalkingBuddy — an animated, *talking* AI study buddy for BrainSpark AI.
 *
 * - Animated SVG avatar that blinks, idles, shows expressions, and moves its
 *   mouth while speaking (real voice via the browser SpeechSynthesis API).
 * - Optional voice INPUT (mic) where supported.
 * - On open, it proactively greets the user by name, reads their activity/XP/
 *   streak (your backend already injects this in getBuddyContext), tells them
 *   what to study next + how, and asks a question about their progress.
 * - Talks to your existing POST /api/buddy/chat endpoint. No new backend needed.
 *
 * USAGE (anywhere inside <App>, for ALL users):
 *     import TalkingBuddy from './TalkingBuddy'
 *     ...
 *     {user && <TalkingBuddy user={user} />}
 *
 * Optional props:
 *     apiUrl          override API base (defaults to VITE_API_URL)
 *     getAuthHeaders  () => headers   (defaults to reading bs_token/bs_session)
 *     accent          gradient start colour (default #6366F1)
 *     accent2         gradient end   colour (default #8B5CF6)
 */

import { useState, useEffect, useRef, useCallback } from 'react'

const DEFAULT_API =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:5000'

function defaultHeaders() {
  const h = { 'Content-Type': 'application/json' }
  try {
    const t = localStorage.getItem('bs_token')
    const s = localStorage.getItem('bs_session')
    if (t) h.Authorization = `Bearer ${t}`
    if (s) h['x-session-token'] = s
  } catch {}
  return h
}

// Strip markdown / emoji so the voice reads cleanly
function cleanForSpeech(t = '') {
  return t
    .replace(/[#*_`>]/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/[\u{1F000}-\u{1FFFF}\u2190-\u27BF\u2B00-\u2BFF\uFE00-\uFE0F]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Inject the small keyframes this component needs (once)
function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById('tb-styles')) return
  const s = document.createElement('style')
  s.id = 'tb-styles'
  s.textContent = `
    @keyframes tbFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
    @keyframes tbPop     { from{opacity:0;transform:scale(.85) translateY(12px)} to{opacity:1;transform:none} }
    @keyframes tbRing    { 0%{transform:scale(1);opacity:.55} 100%{transform:scale(1.7);opacity:0} }
    @keyframes tbDot     { 0%,100%{opacity:.25;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
  `
  document.head.appendChild(s)
}

// ── The animated face ───────────────────────────────────────────
function BuddyFace({ size = 64, accent = '#6366F1', accent2 = '#8B5CF6', mood = 'idle', talking = false, blink = false, mouthOpen = false }) {
  const eyeRy = blink ? 1.2 : 9
  const happy = mood === 'happy'
  const thinking = mood === 'thinking'
  const browDy = happy ? -3 : thinking ? -1 : 0
  const gid = 'tbg-' + Math.round(size)

  let mouth
  if (talking) {
    mouth = <ellipse cx="50" cy="69" rx={mouthOpen ? 9 : 5} ry={mouthOpen ? 7 : 2} fill="#3a2a5e" />
  } else if (happy) {
    mouth = <path d="M37 64 Q50 80 63 64" fill="none" stroke="#3a2a5e" strokeWidth="3.5" strokeLinecap="round" />
  } else {
    mouth = <path d="M41 67 Q50 74 59 67" fill="none" stroke="#3a2a5e" strokeWidth="3" strokeLinecap="round" />
  }

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor={accent2} />
        </linearGradient>
      </defs>

      {/* headphone band + ear cups (study-buddy vibe) */}
      <path d="M18 50 A32 32 0 0 1 82 50" fill="none" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" />
      <rect x="12" y="44" width="13" height="22" rx="6" fill="#94a3b8" />
      <rect x="75" y="44" width="13" height="22" rx="6" fill="#94a3b8" />

      {/* face */}
      <circle cx="50" cy="52" r="34" fill={`url(#${gid})`} />

      {/* cheeks when happy */}
      {happy && <>
        <circle cx="33" cy="60" r="5" fill="#fb7185" opacity=".5" />
        <circle cx="67" cy="60" r="5" fill="#fb7185" opacity=".5" />
      </>}

      {/* eyebrows */}
      <line x1="28" y1={36 + browDy} x2="42" y2={37 + browDy} stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity=".85" />
      <line x1="58" y1={37 + browDy} x2="72" y2={36 + browDy} stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity=".85" />

      {/* eyes */}
      <ellipse cx="36" cy="46" rx="7" ry={eyeRy} fill="#fff" />
      <ellipse cx="64" cy="46" rx="7" ry={eyeRy} fill="#fff" />
      {!blink && <>
        <circle cx={thinking ? 38 : 36} cy={thinking ? 44 : 47} r="3.2" fill="#1e1b4b" />
        <circle cx={thinking ? 66 : 64} cy={thinking ? 44 : 47} r="3.2" fill="#1e1b4b" />
      </>}

      {mouth}
    </svg>
  )
}

const KICKOFF =
  "Greet me by my first name in a warm, upbeat way. Look at my recent activity, " +
  "current streak and XP, then tell me ONE specific topic to study next and ONE " +
  "practical tip on how to study it well. Finish by asking me a short question about " +
  "how my learning is going. Keep it under 5 sentences and sound like a caring friend."

const QUICK = [
  { label: '📚 What should I study today?', msg: "Based on my recent activity and weak spots, what exactly should I study today and in what order?" },
  { label: '🧠 Quiz me on my progress', msg: "Ask me one quick question to check how well I understand what I studied recently. Wait for my answer before telling me if I'm right." },
  { label: '🔥 Keep me motivated', msg: "I'm feeling a bit unmotivated. Give me a short, genuine pep talk that references my streak and progress." },
]

export default function TalkingBuddy({
  user,
  apiUrl = DEFAULT_API,
  getAuthHeaders = defaultHeaders,
  accent = '#6366F1',
  accent2 = '#8B5CF6',
}) {
  const firstName = user?.name?.split(' ')[0] || 'there'

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [muted, setMuted] = useState(false)
  const [talking, setTalking] = useState(false)
  const [blink, setBlink] = useState(false)
  const [mouthOpen, setMouthOpen] = useState(false)
  const [mood, setMood] = useState('idle')
  const [listening, setListening] = useState(false)

  const bottomRef = useRef(null)
  const msgsRef = useRef([])
  const kickedRef = useRef(false)
  const recogRef = useRef(null)
  const mutedRef = useRef(false)

  useEffect(() => { injectStyles() }, [])
  useEffect(() => { msgsRef.current = messages }, [messages])
  useEffect(() => { mutedRef.current = muted }, [muted])
  useEffect(() => { if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, open, loading])

  // idle blinking
  useEffect(() => {
    let timer
    const loop = () => {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
      timer = setTimeout(loop, 2800 + Math.random() * 2200)
    }
    timer = setTimeout(loop, 2000)
    return () => clearTimeout(timer)
  }, [])

  // mouth flap while speaking
  useEffect(() => {
    if (!talking) { setMouthOpen(false); return }
    const id = setInterval(() => setMouthOpen(o => !o), 100 + Math.random() * 70)
    return () => clearInterval(id)
  }, [talking])

  const speak = useCallback((text) => {
    if (mutedRef.current || !text) return
    try {
      const synth = window.speechSynthesis
      if (!synth) return
      synth.cancel()
      const u = new SpeechSynthesisUtterance(cleanForSpeech(text).slice(0, 600))
      u.rate = 1.02; u.pitch = 1.07
      const voices = synth.getVoices() || []
      const pick =
        voices.find(v => /samantha|jenny|aria|zira|google us english|female/i.test(v.name)) ||
        voices.find(v => (v.lang || '').toLowerCase().startsWith('en'))
      if (pick) u.voice = pick
      u.onstart = () => setTalking(true)
      u.onend = () => { setTalking(false); setMood('idle') }
      u.onerror = () => setTalking(false)
      synth.speak(u)
    } catch {}
  }, [])

  const send = useCallback(async (textOverride, hidden = false) => {
    const text = (textOverride ?? input).trim()
    if (!text || loading) return
    if (!hidden) setMessages(m => [...m, { role: 'user', content: text }])
    setInput(''); setLoading(true); setMood('thinking')
    try {
      const r = await fetch(`${apiUrl}/api/buddy/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: text, sessionMessages: msgsRef.current.slice(-8) }),
      })
      const data = await r.json().catch(() => ({}))
      const reply = data.content || `I'm right here, ${firstName}! Want me to suggest what to revise today?`
      setMessages(m => [...m, { role: 'assistant', content: reply }])
      setMood('happy')
      speak(reply)
    } catch {
      const fb = `Hey ${firstName}! I had trouble connecting just now — try again in a sec. 🔄`
      setMessages(m => [...m, { role: 'assistant', content: fb }])
      speak(fb)
    }
    setLoading(false)
  }, [input, loading, apiUrl, getAuthHeaders, firstName, speak])

  // proactive opening when first opened
  useEffect(() => {
    if (!open || kickedRef.current) return
    kickedRef.current = true
    send(KICKOFF, true)
  }, [open, send])

  // stop voice + mic when closing
  useEffect(() => {
    if (open) return
    try { window.speechSynthesis?.cancel() } catch {}
    setTalking(false)
    try { recogRef.current?.stop() } catch {}
  }, [open])

  function toggleMute() {
    setMuted(m => {
      if (!m) { try { window.speechSynthesis?.cancel() } catch {}; setTalking(false) }
      return !m
    })
  }

  function toggleMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    if (listening) { try { recogRef.current?.stop() } catch {}; return }
    try {
      const r = new SR()
      r.lang = 'en-IN'; r.interimResults = false; r.maxAlternatives = 1
      r.onresult = e => {
        const t = e.results[0][0].transcript
        setInput(prev => (prev ? prev + ' ' : '') + t)
      }
      r.onend = () => setListening(false)
      r.onerror = () => setListening(false)
      recogRef.current = r
      setListening(true)
      r.start()
    } catch { setListening(false) }
  }

  const micSupported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

  const renderMd = (s = '') =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
     .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
     .replace(/\n/g, '<br/>')

  const FONT = "'Nunito', system-ui, sans-serif"

  return (
    <>
      {/* Floating launcher */}
      <div
        onClick={() => setOpen(o => !o)}
        title="Your AI study buddy"
        style={{
          position: 'fixed', bottom: 24, right: 24, width: 60, height: 60, borderRadius: '50%',
          background: `linear-gradient(135deg, ${accent}, ${accent2})`,
          boxShadow: `0 8px 26px ${accent}66`, cursor: 'pointer', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: open ? 'none' : 'tbFloat 3.2s ease-in-out infinite',
        }}
      >
        {!open && (
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${accent}`, animation: 'tbRing 2.2s ease-out infinite' }} />
        )}
        {open
          ? <span style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>×</span>
          : <BuddyFace size={46} accent={accent} accent2={accent2} mood="happy" />}
        {!open && (
          <span style={{ position: 'absolute', bottom: 4, right: 4, width: 12, height: 12, borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }} />
        )}
      </div>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 96, right: 24, width: 'min(360px, calc(100vw - 32px))',
          height: 'min(540px, calc(100vh - 130px))', borderRadius: 20, overflow: 'hidden',
          background: 'var(--bg2, #ffffff)', border: '1px solid var(--border, rgba(15,23,42,.1))',
          boxShadow: '0 24px 70px rgba(15,23,42,.28)', zIndex: 999, display: 'flex',
          flexDirection: 'column', fontFamily: FONT, animation: 'tbPop .22s ease-out',
        }}>
          {/* Header with live avatar */}
          <div style={{ padding: '14px 16px', background: `linear-gradient(135deg, ${accent}, ${accent2})`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 52, height: 52, flexShrink: 0 }}>
              <BuddyFace size={52} accent="#ffffff" accent2="#e9d5ff" mood={loading ? 'thinking' : mood} talking={talking} blink={blink} mouthOpen={mouthOpen} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: "'Sora', sans-serif" }}>Spark</div>
              <div style={{ color: 'rgba(255,255,255,.85)', fontSize: 11.5 }}>
                {loading ? 'thinking…' : talking ? 'speaking…' : `your study buddy`}
              </div>
            </div>
            <button onClick={toggleMute} title={muted ? 'Unmute voice' : 'Mute voice'}
              style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 14, color: '#fff' }}>
              {muted ? '🔇' : '🔊'}
            </button>
            <button onClick={() => setOpen(false)} title="Close"
              style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: '#fff' }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg, #f4f4f0)' }}>
            {messages.length === 0 && !loading && (
              <div style={{ textAlign: 'center', color: 'var(--text, #64748b)', fontSize: 12.5, padding: '20px 8px' }}>
                Hi {firstName}! Give me a second…
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div
                  style={{
                    maxWidth: '85%', padding: '9px 13px', fontSize: 13.5, lineHeight: 1.6,
                    borderRadius: m.role === 'user' ? '13px 4px 13px 13px' : '4px 13px 13px 13px',
                    background: m.role === 'user' ? `linear-gradient(135deg, ${accent}, ${accent2})` : 'var(--bg2, #fff)',
                    color: m.role === 'user' ? '#fff' : 'var(--text-h, #1e293b)',
                    border: m.role === 'assistant' ? '1px solid var(--border, rgba(15,23,42,.1))' : 'none',
                  }}
                  dangerouslySetInnerHTML={{ __html: renderMd(m.content) }}
                />
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 5, padding: '9px 13px', background: 'var(--bg2, #fff)', borderRadius: '4px 13px 13px 13px', width: 'fit-content', border: '1px solid var(--border, rgba(15,23,42,.1))' }}>
                {[0, 1, 2].map(j => <span key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: accent, animation: `tbDot 1s ${j * 0.2}s infinite` }} />)}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick action chips (only before the first user message) */}
          {messages.filter(m => m.role === 'user').length === 0 && !loading && (
            <div style={{ display: 'flex', gap: 6, padding: '0 12px 8px', flexWrap: 'wrap' }}>
              {QUICK.map(q => (
                <button key={q.label} onClick={() => send(q.msg)} disabled={loading}
                  style={{ fontSize: 11.5, padding: '5px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: FONT, fontWeight: 700, border: `1px solid ${accent}44`, background: `${accent}12`, color: accent }}>
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: 10, borderTop: '1px solid var(--border, rgba(15,23,42,.1))', display: 'flex', gap: 7, background: 'var(--bg2, #fff)' }}>
            {micSupported && (
              <button onClick={toggleMic} title="Speak"
                style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid var(--border, rgba(15,23,42,.1))', background: listening ? `${accent}22` : 'transparent', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>
                {listening ? '🔴' : '🎤'}
              </button>
            )}
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask me anything…"
              disabled={loading}
              style={{ flex: 1, padding: '9px 13px', borderRadius: 10, border: '1px solid var(--border, rgba(15,23,42,.1))', background: 'var(--code-bg, rgba(15,23,42,.035))', color: 'var(--text-h, #1e293b)', fontSize: 13.5, fontFamily: FONT, outline: 'none' }}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              style={{ width: 40, height: 38, borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${accent}, ${accent2})`, color: '#fff', fontSize: 16, cursor: input.trim() ? 'pointer' : 'not-allowed', opacity: input.trim() ? 1 : 0.6, flexShrink: 0 }}>
              →
            </button>
          </div>
        </div>
      )}
    </>
  )
}