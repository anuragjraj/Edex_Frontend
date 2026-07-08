/**
 * TalkingBuddy — compact FAB version
 *
 * The avatar is now a small (52 px) circular button in the bottom-right corner,
 * identical footprint to a standard chat-FAB.  All speech-synthesis, viseme
 * lip-sync, chat-panel, bubble, mic, and API logic is kept exactly as before.
 *
 * Public API: <TalkingBuddy user={user} />
 * Same optional props: audience, apiUrl, getAuthHeaders, accent, accent2,
 * synthesizeAudio.  Old 3D-only props (modelUrl, restMode) are accepted and
 * silently ignored so call-sites don't need touching.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

/* ─────────────────────────────────────────────────────────────────
   SETTINGS
   ───────────────────────────────────────────────────────────────── */
const DEFAULT_API =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:5000'

/* ─────────────────────────────────────────────────────────────────
   PERSONAS
   ───────────────────────────────────────────────────────────────── */
const PERSONAS = {
  student: {
    pitch: 1.06, rate: 1.0,
    style:
      '\n\n[Speak like a warm, friendly female study buddy: kind, upbeat, ' +
      'encouraging, simple everyday words and contractions, never lecture. ' +
      'Sound genuinely happy to be helping.]',
    label: 'Spark', sub: 'your study buddy', emoji: '🧠',
    kick:
      'Start our chat now: greet me warmly by my first name, a quick ' +
      "'how's your day', then recap what I was last studying from my data " +
      'and ask if I want to continue it or switch topics. Keep it short and friendly.',
    quick: [
      { label: '📚 What now?',  msg: 'What should I study right now? Keep it short and casual.' },
      { label: '🔥 Hype me',   msg: 'Give me a quick, genuine pep talk like a friend would.' },
      { label: '🧠 Quiz me',   msg: 'Ask me ONE short, fun question to check my recent learning. Wait for my reply.' },
    ],
  },
  teacher: {
    pitch: 1.0, rate: 0.98,
    style:
      '\n\n[Speak like a warm, encouraging female mentor: clear, kind, ' +
      'supportive and tidy in how you explain things, with a friendly tone.]',
    label: 'Mentor', sub: 'your teaching assistant', emoji: '👩‍🏫',
    kick:
      'Start our chat now: greet me by my first name, a brief friendly check-in, ' +
      'then recap what I was last working on from my data and ask whether I want ' +
      'to continue it or focus elsewhere. Concise and warm.',
    quick: [
      { label: '📋 Focus today', msg: 'What should I prioritise right now? One concise line.' },
      { label: '🎯 Class idea',  msg: 'Suggest one effective teaching idea for my next session.' },
      { label: '📈 Quick check', msg: 'Ask me ONE focused question to gauge where my class stands. Wait for my reply.' },
    ],
  },
}

/* ─────────────────────────────────────────────────────────────────
   VISEME / LIP-SYNC (used for speech timing only — no visible mesh)
   ───────────────────────────────────────────────────────────────── */
const VISEME = {
  sil:{jaw:0}, PP:{jaw:0}, FF:{jaw:.12}, TH:{jaw:.14}, DD:{jaw:.20}, kk:{jaw:.22},
  CH:{jaw:.18}, SS:{jaw:.12}, nn:{jaw:.14}, RR:{jaw:.18}, aa:{jaw:.62}, E:{jaw:.36},
  I:{jaw:.28}, O:{jaw:.5}, U:{jaw:.34},
}
const VOWELS = new Set(['aa','E','I','O','U'])

function wordToVisemes(word) {
  const out = [], s = word.toLowerCase()
  for (let i = 0; i < s.length; i++) {
    const c = s[i], c2 = s.slice(i, i + 2)
    if (c2==='th'){out.push('TH');i++;continue}
    if (c2==='ch'||c2==='sh'){out.push('CH');i++;continue}
    if (c2==='ph'){out.push('FF');i++;continue}
    if (c2==='ng'){out.push('nn');i++;continue}
    if (c2==='qu'){out.push('kk');out.push('U');i++;continue}
    if (c2==='ck'){out.push('kk');i++;continue}
    if ('aàá'.includes(c)) out.push('aa')
    else if ('eéè'.includes(c)) out.push('E')
    else if ('iíy'.includes(c)) out.push('I')
    else if ('oó'.includes(c)) out.push('O')
    else if ('uúw'.includes(c)) out.push('U')
    else if ('mbp'.includes(c)) out.push('PP')
    else if ('fv'.includes(c)) out.push('FF')
    else if ('dt'.includes(c)) out.push('DD')
    else if ('nl'.includes(c)) out.push('nn')
    else if ('kgcqx'.includes(c)) out.push('kk')
    else if (c==='j') out.push('CH')
    else if (c==='r') out.push('RR')
    else if (c==='h') out.push('aa')
  }
  if (!out.length) out.push('aa')
  return out
}

function buildVisemeTimeline(text, rate = 1) {
  const seq = [], re = /[A-Za-zÀ-ÿ']+|[.,!?;:]+|\s+/g
  let m; const base = 0.072 / rate, vowelMul = 1.7
  while ((m = re.exec(text)) !== null) {
    const tok = m[0], ci = m.index
    if (/^\s+$/.test(tok)) { seq.push({ code:'sil', ci, dur:0.05/rate, stressed:false }); continue }
    if (/^[.,!?;:]+$/.test(tok)) { seq.push({ code:'sil', ci, dur:0.16/rate, stressed:false }); continue }
    let firstVowel = false
    wordToVisemes(tok).forEach((code, k) => {
      const isV = VOWELS.has(code), stressed = isV && !firstVowel
      if (stressed) firstVowel = true
      seq.push({ code, ci: ci + Math.min(k, tok.length - 1), dur: base * (isV ? vowelMul : 1), stressed })
    })
  }
  if (!seq.length) seq.push({ code:'sil', ci:0, dur:0.2, stressed:false })
  return seq
}

/* ─────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────── */
function defaultHeaders() {
  const h = { 'Content-Type': 'application/json' }
  try {
    const t = localStorage.getItem('bs_token'), s = localStorage.getItem('bs_session')
    if (t) h.Authorization = `Bearer ${t}`
    if (s) h['x-session-token'] = s
  } catch {}
  return h
}
function cleanForSpeech(t = '') {
  return t.replace(/[#*_`>]/g,'').replace(/\[[^\]]*\]\([^)]*\)/g,'')
    .replace(/[\u{1F000}-\u{1FFFF}\u2190-\u27BF\u2B00-\u2BFF\uFE00-\uFE0F]/gu,'')
    .replace(/\s{2,}/g,' ').trim()
}
function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById('tb-fab-styles')) return
  const s = document.createElement('style'); s.id = 'tb-fab-styles'
  s.textContent = `
    @keyframes tbFabPop { from{opacity:0;transform:scale(.8) translateY(14px)} to{opacity:1;transform:none} }
    @keyframes tbBubPop  { from{opacity:0;transform:translateY(8px) scale(.95)} to{opacity:1;transform:none} }
    @keyframes tbDot     { 0%,100%{opacity:.25;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
    @keyframes tbRing    { 0%,100%{box-shadow:0 0 0 0 rgba(124,91,214,.55)} 70%{box-shadow:0 0 0 14px rgba(124,91,214,0)} }
    @keyframes tbRingSpk { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.55)} 70%{box-shadow:0 0 0 14px rgba(34,197,94,0)} }
    @keyframes tbWave    { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(2.1)} }
  `
  document.head.appendChild(s)
}

const BREVITY = '\n\n[Keep it short and warm — usually 2-4 sentences. Conversational, no bullet lists.]'

/* ─────────────────────────────────────────────────────────────────
   SPEAKING INDICATOR  (3 animated bars shown inside the FAB)
   ───────────────────────────────────────────────────────────────── */
function SpeakingBars() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:2, height:16 }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{
          width: 3, height: 6, borderRadius: 2, background: '#fff',
          animation: `tbWave .7s ${i * 0.12}s infinite ease-in-out`,
          transformOrigin: 'center bottom',
        }}/>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────────── */
export default function TalkingBuddy({
  user,
  audience,
  apiUrl = DEFAULT_API,
  getAuthHeaders = defaultHeaders,
  accent  = '#7c5bd6',
  accent2 = '#a855f7',
  synthesizeAudio = null,
  // ignored legacy 3D props — accepted so call-sites don't break
  modelUrl, restMode,
}) {
  const firstName = user?.name?.split(' ')[0] || 'there'
  const resolvedAudience = useMemo(() => {
    if (audience === 'teacher' || audience === 'student') return audience
    const r = (user?.audience || user?.role || user?.type || '').toString().toLowerCase()
    return /teach|faculty|staff|mentor|prof|instructor|educator/.test(r) ? 'teacher' : 'student'
  }, [audience, user])
  const persona = PERSONAS[resolvedAudience]

  const [open,      setOpen]      = useState(false)
  const [messages,  setMessages]  = useState([])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [muted,     setMuted]     = useState(false)
  const [listening, setListening] = useState(false)
  const [bubble,    setBubble]    = useState('')
  const [speaking,  setSpeaking]  = useState(false)  // drives FAB ring animation

  const bottomRef    = useRef(null)
  const msgsRef      = useRef([])
  const greetedRef   = useRef(false)
  const recogRef     = useRef(null)
  const mutedRef     = useRef(false)
  const bubbleTimer  = useRef(null)
  const speechRef    = useRef({ active:false, seq:null, syncIdx:0, syncTime:0, amp:null })
  const audioCtxRef  = useRef(null)

  useEffect(() => { injectStyles() }, [])
  useEffect(() => { msgsRef.current = messages }, [messages])
  useEffect(() => { mutedRef.current = muted },   [muted])
  useEffect(() => { if (open) bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, open, loading])

  /* ── Voice picker: favour female EN voices ── */
  const pickVoice = useCallback(() => {
    const synth = window.speechSynthesis; if (!synth) return null
    const voices = synth.getVoices() || []; if (!voices.length) return null
    const FEMALE = /female|woman|samantha|victoria|karen|moira|tessa|fiona|serena|allison|ava|susan|zira|aria|jenny|libby|sonia|michelle|catherine|neerja|heera|swara|google uk english female|google us english/i
    const MALE   = /\bmale\b|david|mark|george|guy|daniel|fred|alex|james|ryan|eric|aaron|brian|rishi|prabhat|hemant/i
    const score = v => {
      const n = v.name || '', l = (v.lang || '').toLowerCase()
      let s = 0
      if (/online \(natural\)|neural|natural/i.test(n)) s += 120
      if (/enhanced|premium|siri/i.test(n))             s += 60
      if (/google/i.test(n))                            s += 45
      if (v.localService === false)                     s += 25
      if (FEMALE.test(n)) s += 80
      if (MALE.test(n))   s -= 120
      if      (l.startsWith('en-us')) s += 30
      else if (l.startsWith('en-gb')) s += 20
      else if (l.startsWith('en-in')) s += 16
      else if (l.startsWith('en'))    s += 10
      return s
    }
    let best = null, bestS = -Infinity
    for (const v of voices) {
      if (!(v.lang || '').toLowerCase().startsWith('en')) continue
      const s = score(v); if (s > bestS) { bestS = s; best = v }
    }
    return best
  }, [])

  /* ── Bubble helper ── */
  const showBubble = useCallback((text) => {
    setBubble(text)
    clearTimeout(bubbleTimer.current)
    bubbleTimer.current = setTimeout(() => setBubble(''), Math.max(9000, text.split(/\s+/).length * 380))
  }, [])

  /* ── Viseme helpers ── */
  const startVisemes = useCallback((text, ampFn = null) => {
    speechRef.current = { active:true, seq: buildVisemeTimeline(text, persona.rate), syncIdx:0, syncTime: performance.now()/1000, amp: ampFn }
    setSpeaking(true)
  }, [persona.rate])
  const stopVisemes = useCallback(() => {
    const s = speechRef.current; s.active = false; s.amp = null
    setSpeaking(false)
  }, [])
  const syncToBoundary = useCallback((ci) => {
    const s = speechRef.current; if (!s.active || !s.seq) return
    let idx = s.seq.findIndex(v => v.ci >= ci); if (idx < 0) idx = s.seq.length - 1
    s.syncIdx = idx; s.syncTime = performance.now()/1000
  }, [])

  /* ── Speech synthesis ── */
  const speakWithSynth = useCallback((text) => {
    try {
      const synth = window.speechSynthesis; if (!synth) return; synth.cancel()
      const say = () => {
        const u = new SpeechSynthesisUtterance(text)
        u.lang = 'en-US'; u.rate = persona.rate; u.pitch = persona.pitch
        const v = pickVoice(); if (v) u.voice = v
        u.onstart    = () => startVisemes(text)
        u.onboundary = e => { if (typeof e.charIndex === 'number') syncToBoundary(e.charIndex) }
        u.onend = () => stopVisemes(); u.onerror = () => stopVisemes()
        synth.speak(u)
      }
      if (!synth.getVoices().length) {
        synth.onvoiceschanged = () => { synth.onvoiceschanged = null; say() }; setTimeout(say, 250)
      } else say()
    } catch { stopVisemes() }
  }, [pickVoice, persona, startVisemes, stopVisemes, syncToBoundary])

  const speakWithAudio = useCallback(async (text, source) => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx()
      const ctx = audioCtxRef.current; if (ctx.state === 'suspended') await ctx.resume()
      let buf
      if (source instanceof Blob)         buf = await source.arrayBuffer()
      else if (source instanceof ArrayBuffer) buf = source
      else if (typeof source === 'string') buf = await (await fetch(source)).arrayBuffer()
      const audioBuf = await ctx.decodeAudioData(buf)
      const src = ctx.createBufferSource(); src.buffer = audioBuf
      const analyser = ctx.createAnalyser(); analyser.fftSize = 512
      const data = new Uint8Array(analyser.frequencyBinCount)
      src.connect(analyser); analyser.connect(ctx.destination)
      const ampFn = () => {
        analyser.getByteTimeDomainData(data); let s = 0
        for (let i = 0; i < data.length; i++) { const x = (data[i]-128)/128; s += x*x }
        return Math.min(1, Math.sqrt(s/data.length) * 3.2)
      }
      startVisemes(text, ampFn); src.onended = () => stopVisemes(); src.start()
    } catch { speakWithSynth(text) }
  }, [startVisemes, stopVisemes, speakWithSynth])

  const speak = useCallback(async (rawText) => {
    const text = cleanForSpeech(rawText)
    showBubble(text)
    if (mutedRef.current || !text) return
    if (synthesizeAudio) {
      try { const src = await synthesizeAudio(text); if (src) { await speakWithAudio(text, src); return } } catch {}
    }
    speakWithSynth(text)
  }, [showBubble, synthesizeAudio, speakWithAudio, speakWithSynth])

  /* ── Send message ── */
  const send = useCallback(async (textOverride, hidden = false) => {
    const text = (textOverride ?? input).trim()
    if (!text || loading) return
    if (!hidden) setMessages(m => [...m, { role:'user', content:text }])
    setInput(''); setLoading(true)
    try {
      const r = await fetch(`${apiUrl}/api/buddy/chat`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ message: text + persona.style + BREVITY, sessionMessages: msgsRef.current.slice(-8) }),
      })
      const data = await r.json().catch(() => ({}))
      const reply = data.content || `I'm right here, ${firstName}! Want a quick study tip?`
      setMessages(m => [...m, { role:'assistant', content:reply }]); speak(reply)
    } catch {
      const fb = `Hey ${firstName}! I couldn't connect — try again in a sec.`
      setMessages(m => [...m, { role:'assistant', content:fb }]); speak(fb)
    }
    setLoading(false)
  }, [input, loading, apiUrl, getAuthHeaders, firstName, speak, persona])

  /* ── Auto-greet on mount ── */
  useEffect(() => {
    if (greetedRef.current) return; greetedRef.current = true
    const t = setTimeout(() => send(persona.kick, true), 1400)
    return () => clearTimeout(t)
  }, [send, persona])

  /* ── Mute toggle ── */
  function toggleMute() {
    setMuted(m => {
      if (!m) { try { window.speechSynthesis?.cancel() } catch {}; stopVisemes() }
      return !m
    })
  }

  /* ── Mic toggle ── */
  function toggleMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return
    if (listening) { try { recogRef.current?.stop() } catch {}; return }
    try {
      const r = new SR(); r.lang='en-US'; r.interimResults=false; r.maxAlternatives=1
      r.onresult = e => setInput(prev => (prev ? prev+' ' : '') + e.results[0][0].transcript)
      r.onend = () => setListening(false); r.onerror = () => setListening(false)
      recogRef.current = r; setListening(true); r.start()
    } catch { setListening(false) }
  }

  const micSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  const renderMd = (s = '') =>
    s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
     .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')

  const FONT = "'Nunito', system-ui, sans-serif"
  const fabSize = 52   // px — same as the existing AI buddy FAB

  /* ── FAB ring animation: idle = accent ring, speaking = green ring ── */
  const fabRingStyle = speaking
    ? { animation: 'tbRingSpk 1.4s infinite' }
    : { animation: 'tbRing 2.8s infinite' }

  return (
    <>
      {/* ── Floating Action Button (the only always-visible element) ── */}
      <div style={{
        position: 'fixed',
        /* 88 px = 64 px mobile bottom-nav + 24 px padding.
           On desktop this just means the button sits comfortably
           above the doubt-solver send row. */
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)',
        right: 24, zIndex: 1000,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
        pointerEvents: 'none',
      }}>

        {/* Speech bubble — appears above FAB, tap anywhere to dismiss */}
        {bubble && !open && (
          <div onClick={() => setBubble('')}
            style={{
              pointerEvents: 'auto', maxWidth: 240, background: '#fff',
              color: '#1e293b', borderRadius: 14, padding: '10px 14px',
              fontSize: 13, lineHeight: 1.55, fontFamily: FONT,
              boxShadow: '0 8px 28px rgba(70,40,120,.22)',
              border: '1px solid rgba(15,23,42,.09)',
              animation: 'tbBubPop .22s ease-out', cursor: 'pointer',
              position: 'relative',
            }}>
            {bubble}
            {/* tail */}
            <span style={{
              position: 'absolute', bottom: -7, right: 20,
              transform: 'rotate(45deg)', width: 14, height: 14,
              background: '#fff',
              borderRight: '1px solid rgba(15,23,42,.09)',
              borderBottom: '1px solid rgba(15,23,42,.09)',
            }}/>
          </div>
        )}

        {/* The FAB button itself */}
        <button
          onClick={() => setOpen(o => !o)}
          title={open ? 'Close Spark' : `Chat with ${persona.label}`}
          style={{
            pointerEvents: 'auto',
            width: fabSize, height: fabSize, borderRadius: '50%', border: 'none',
            background: `linear-gradient(135deg, ${accent}, ${accent2})`,
            color: '#fff', cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: speaking ? 0 : 24,   // hide emoji while bars show
            boxShadow: `0 6px 22px ${accent}60`,
            ...fabRingStyle,
            transition: 'transform .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {speaking ? <SpeakingBars /> : (open ? '✕' : persona.emoji)}

          {/* green "active" dot */}
          {!open && (
            <span style={{
              position: 'absolute', top: 2, right: 2,
              width: 11, height: 11, borderRadius: '50%',
              background: speaking ? '#22c55e' : '#a3e635',
              border: '2px solid #fff',
            }}/>
          )}
        </button>
      </div>

      {/* ── Chat panel ── */}
      {open && (
        <div style={{
          position: 'fixed', zIndex: 1001, right: 24,
          // aligns with the raised FAB: 88 px base + FAB height + 10 px gap
          bottom: `calc(env(safe-area-inset-bottom, 0px) + ${88 + fabSize + 10}px)`,
          width: 'min(350px, calc(100vw - 24px))',
          height: 'min(490px, calc(100vh - 120px))',
          borderRadius: 18, overflow: 'hidden',
          fontFamily: FONT, animation: 'tbFabPop .22s ease-out',
          background: 'var(--bg2, #ffffff)',
          border: '1px solid var(--border, rgba(15,23,42,.10))',
          boxShadow: '0 24px 70px rgba(70,40,120,.28)',
          display: 'flex', flexDirection: 'column',
        }}>

          {/* Header */}
          <div style={{
            flexShrink: 0, padding: '11px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            background: `linear-gradient(135deg, ${accent}, ${accent2})`,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(255,255,255,.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
            }}>
              {speaking ? <SpeakingBars /> : persona.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0, color: '#fff' }}>
              <div style={{ fontWeight: 800, fontSize: 14, fontFamily:"'Sora', sans-serif" }}>{persona.label}</div>
              <div style={{ fontSize: 11, opacity: .85 }}>
                {loading ? 'thinking…' : speaking ? 'speaking…' : persona.sub}
              </div>
            </div>
            <button onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}
              style={{ background:'rgba(255,255,255,.22)', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:14, color:'#fff' }}>
              {muted ? '🔇' : '🔊'}
            </button>
            <button onClick={() => setOpen(false)} title="Close"
              style={{ background:'rgba(255,255,255,.22)', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:17, color:'#fff', lineHeight:1 }}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px 12px',
            display: 'flex', flexDirection: 'column', gap: 10,
            background: 'var(--bg, #f4f4f0)',
          }}>
            {messages.length === 0 && !loading && (
              <div style={{ textAlign:'center', color:'var(--text, #64748b)', fontSize:12.5, padding:'20px 8px' }}>
                Hi {firstName}! Ask me anything ✨
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth:'84%', padding:'9px 13px', fontSize:13.5, lineHeight:1.65,
                  borderRadius: m.role==='user' ? '13px 4px 13px 13px' : '4px 13px 13px 13px',
                  background: m.role==='user' ? `linear-gradient(135deg,${accent},${accent2})` : 'var(--bg2,#fff)',
                  color: m.role==='user' ? '#fff' : 'var(--text-h,#1e293b)',
                  border: m.role==='assistant' ? '1px solid var(--border,rgba(15,23,42,.1))' : 'none',
                }}
                  dangerouslySetInnerHTML={{ __html: renderMd(m.content) }}
                />
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display:'flex', gap:5, padding:'9px 13px', background:'var(--bg2,#fff)', borderRadius:'4px 13px 13px 13px', width:'fit-content', border:'1px solid var(--border,rgba(15,23,42,.1))' }}>
                {[0,1,2].map(j => (
                  <span key={j} style={{ width:6, height:6, borderRadius:'50%', background:accent, display:'block', animation:`tbDot 1s ${j*0.2}s infinite` }}/>
                ))}
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick replies (before user has sent anything) */}
          {messages.filter(m => m.role==='user').length === 0 && !loading && (
            <div style={{ display:'flex', gap:6, padding:'0 12px 8px', flexWrap:'wrap', background:'var(--bg,#f4f4f0)' }}>
              {persona.quick.map(q => (
                <button key={q.label} onClick={() => send(q.msg)} disabled={loading}
                  style={{ fontSize:11.5, padding:'5px 10px', borderRadius:20, cursor:'pointer', fontFamily:FONT, fontWeight:700, border:`1px solid ${accent}44`, background:`${accent}12`, color:accent }}>
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div style={{
            flexShrink:0, padding:'10px 10px',
            borderTop:'1px solid var(--border,rgba(15,23,42,.1))',
            display:'flex', gap:7, alignItems:'center',
            background:'var(--bg2,#fff)',
          }}>
            {micSupported && (
              <button onClick={toggleMic} title={listening ? 'Stop listening' : 'Speak'}
                style={{ width:36, height:36, borderRadius:10, border:'1px solid var(--border,rgba(15,23,42,.1))', background: listening ? `${accent}22` : 'transparent', cursor:'pointer', fontSize:16, flexShrink:0 }}>
                {listening ? '🔴' : '🎤'}
              </button>
            )}
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
              placeholder="Ask me anything…" disabled={loading}
              style={{ flex:1, padding:'9px 12px', borderRadius:10, border:'1px solid var(--border,rgba(15,23,42,.1))', background:'var(--code-bg,rgba(15,23,42,.035))', color:'var(--text-h,#1e293b)', fontSize:14, fontFamily:FONT, outline:'none' }}
            />
            <button
              onClick={() => send()} disabled={loading || !input.trim()}
              style={{ width:38, height:36, borderRadius:10, border:'none', background:`linear-gradient(135deg,${accent},${accent2})`, color:'#fff', fontSize:16, cursor: input.trim() ? 'pointer' : 'not-allowed', opacity: input.trim() ? 1 : .55, flexShrink:0 }}>
              →
            </button>
          </div>

        </div>
      )}
    </>
  )
}