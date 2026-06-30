/**
 * TalkingBuddy — 2D illustrated study buddy (drop-in replacement for the 3D one).
 *
 * WHAT CHANGED vs the 3D version
 * ──────────────────────────────
 *  • No three.js / @react-three/fiber / @react-three/drei, and NO /avatar.glb.
 *    The avatar is a self-contained inline SVG (the friendly "Simple 2D Avatar"
 *    woman: lavender backdrop, brown hair, cream sweater).
 *  • FEMALE VOICE: the voice picker now scores female voices first, and the
 *    persona pitch/rate are tuned for a warm, natural woman.
 *  • WARMTH while speaking: her mouth lip-syncs to the words, her smile deepens,
 *    her cheeks glow, and a soft halo gently pulses — so it reads as a warm,
 *    friendly person talking to you rather than a flat mouth flap.
 *
 * Same public API as before — just `<TalkingBuddy user={user} />` works.
 * Extra props (audience, apiUrl, getAuthHeaders, accent, accent2,
 * synthesizeAudio) are still honoured; old 3D-only props (modelUrl, restMode)
 * are accepted and ignored so you don't have to touch the call site.
 *
 * REQUIRES: just React. (You can `npm uninstall three @react-three/fiber
 * @react-three/drei` if nothing else uses them, and delete public/avatar.glb.)
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

/* -----------------------------------------------------------------
   SETTINGS
   ----------------------------------------------------------------- */
const DEFAULT_API =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:5000'

/* -----------------------------------------------------------------
   PERSONAS — warm female voice per audience.
   PITCH is the main lever on the Web Speech API: ~1.0–1.1 keeps a natural
   adult-woman timbre (we pick a female voice below, pitch just fine-tunes it).
   ----------------------------------------------------------------- */
const PERSONAS = {
  student: {
    pitch: 1.06, rate: 1.0,
    style:
      "\n\n[Speak like a warm, friendly female study buddy: kind, upbeat, " +
      "encouraging, simple everyday words and contractions, never lecture. " +
      "Sound genuinely happy to be helping.]",
    label: 'Spark', sub: 'your study buddy', avatarEmoji: '😊',
    kick: "Start our chat now: greet me warmly by my first name, a quick 'how's your day', then recap what I was last studying from my data and ask if I want to continue it or switch topics. Keep it short and friendly.",
    quick: [
      { label: '📚 What now?', msg: "What should I study right now? Keep it short and casual." },
      { label: '🔥 Hype me up', msg: "Give me a quick, genuine pep talk like a friend would." },
      { label: '🧠 Quiz me', msg: "Ask me ONE short, fun question to check my recent learning. Wait for my reply." },
    ],
  },
  teacher: {
    pitch: 1.0, rate: 0.98,
    style:
      "\n\n[Speak like a warm, encouraging female mentor: clear, kind, " +
      "supportive and tidy in how you explain things, with a friendly tone.]",
    label: 'Mentor', sub: 'your teaching assistant', avatarEmoji: '👩‍🏫',
    kick: "Start our chat now: greet me by my first name, a brief friendly check-in, then recap what I was last working on from my data and ask whether I want to continue it or focus elsewhere. Concise and warm.",
    quick: [
      { label: '📋 Focus today', msg: "What should I prioritise right now? One concise line." },
      { label: '🎯 Class idea', msg: "Suggest one effective teaching idea for my next session." },
      { label: '📈 Quick check', msg: "Ask me ONE focused question to gauge where my class stands. Wait for my reply." },
    ],
  },
}

/* -----------------------------------------------------------------
   PHONEME → VISEME (used only to time the jaw/mouth opening)
   ----------------------------------------------------------------- */
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

/* -----------------------------------------------------------------
   helpers
   ----------------------------------------------------------------- */
function defaultHeaders() {
  const h = { 'Content-Type': 'application/json' }
  try {
    const t = localStorage.getItem('bs_token'); const s = localStorage.getItem('bs_session')
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
  if (typeof document === 'undefined' || document.getElementById('tb2d-styles')) return
  const s = document.createElement('style'); s.id = 'tb2d-styles'
  s.textContent = `
    @keyframes tbPop{from{opacity:0;transform:scale(.85) translateY(12px)}to{opacity:1;transform:none}}
    @keyframes tbBub{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:none}}
    @keyframes tbDot{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
    @keyframes tbPulse{0%,100%{box-shadow:0 0 0 0 rgba(124,91,214,.45)}70%{box-shadow:0 0 0 12px rgba(124,91,214,0)}}
  `
  document.head.appendChild(s)
}
function lerp(a, b, t) { return a + (b - a) * t }

/* -----------------------------------------------------------------
   THE 2D AVATAR  (inline SVG, lip-synced + smiling)
   ----------------------------------------------------------------- */
function Avatar2D({ speechRef }) {
  const wrapRef       = useRef(null)
  const mouthRef      = useRef(null)
  const eyesOpenRef   = useRef(null)
  const eyesClosedRef = useRef(null)
  const cheekLRef     = useRef(null)
  const cheekRRef     = useRef(null)
  const glowRef       = useRef(null)

  useEffect(() => {
    let raf, mounted = true
    const SVGNS = 'http://www.w3.org/2000/svg'
    const MX = 180, MY = 234
    let curOpen = 0, curSmile = 0.55, curCheek = 0.32, breath = 0
    let blinkT = 0, blinkNext = 2 + Math.random() * 3
    const reduce = typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const el = (tag, attrs) => {
      const n = document.createElementNS(SVGNS, tag)
      for (const k in attrs) n.setAttribute(k, attrs[k])
      return n
    }

    // open: 0..1 mouth opening   smile: 0..1 how upturned/warm the mouth is
    const drawMouth = (open, smile) => {
      const g = mouthRef.current; if (!g) return
      while (g.firstChild) g.removeChild(g.firstChild)
      open = Math.max(0, Math.min(1, open))

      if (open < 0.07) {
        // closed: a warm smile line — deeper curve when smile is higher
        const dip = 9 + smile * 16
        g.appendChild(el('path', {
          d: `M${MX - 30} ${MY - 4} q30 ${dip} 60 0`,
          stroke: '#c2607a', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round',
        }))
        // soft warm lower-lip shadow
        g.appendChild(el('path', {
          d: `M${MX - 22} ${MY + 2 + smile * 4} q22 ${6} 44 0`,
          stroke: '#e9a7a7', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', opacity: 0.5,
        }))
        return
      }

      // open + talking (happy open smile: corners up, upper teeth showing)
      const w = 48 - 8 * open, h = 8 + 30 * open, rx = w / 2, ry = h / 2
      g.appendChild(el('ellipse', { cx: MX, cy: MY, rx, ry, fill: '#86384f' }))
      if (h > 13) { // upper teeth
        g.appendChild(el('path', {
          d: `M${MX - rx + 3} ${MY - ry + 2} q${rx - 3} -5 ${(rx - 3) * 2} 0 l0 ${Math.min(7, h * 0.3)} q${-(rx - 3)} 4 ${-(rx - 3) * 2} 0 Z`,
          fill: '#fff7f2',
        }))
      }
      if (h > 20) { // tongue
        g.appendChild(el('ellipse', { cx: MX, cy: MY + ry * 0.42, rx: rx * 0.55, ry: ry * 0.3, fill: '#e58a8a' }))
      }
      g.appendChild(el('ellipse', { cx: MX, cy: MY, rx, ry, fill: 'none', stroke: '#c2607a', 'stroke-width': 4 }))
      // lifted corners → reads as a smile even while open
      const lift = 7 + smile * 5
      g.appendChild(el('path', { d: `M${MX - rx + 1} ${MY + 1} q-6 ${-lift} -13 ${-lift - 2}`, stroke: '#c2607a', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }))
      g.appendChild(el('path', { d: `M${MX + rx - 1} ${MY + 1} q6 ${-lift} 13 ${-lift - 2}`, stroke: '#c2607a', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }))
    }

    const doBlink = () => {
      const o = eyesOpenRef.current, c = eyesClosedRef.current
      if (!o || !c) return
      o.style.display = 'none'; c.style.display = ''
      setTimeout(() => { if (o) o.style.display = ''; if (c) c.style.display = 'none' }, 120)
    }

    const tick = () => {
      if (!mounted) return
      const t = performance.now() / 1000
      const sp = speechRef.current
      const speaking = !!(sp && sp.active)

      // jaw / mouth opening from the live viseme timeline (or audio amplitude)
      let jaw = 0
      if (speaking && sp.seq && sp.seq.length) {
        let idx = sp.syncIdx, acc = sp.syncTime
        while (idx < sp.seq.length - 1 && acc + sp.seq[idx].dur < t) { acc += sp.seq[idx].dur; idx++ }
        const cur = sp.seq[idx], vinfo = VISEME[cur.code] || VISEME.sil
        const amp = sp.amp ? sp.amp() : null
        jaw = amp != null ? Math.max(vinfo.jaw * 0.4, amp) : vinfo.jaw * (0.8 + Math.random() * 0.35)
      }
      curOpen += (jaw - curOpen) * 0.4

      // warmth: deeper smile + brighter cheeks + halo while speaking
      const smileTarget = speaking ? 0.9 : 0.55 + Math.sin(t * 0.5) * 0.08
      curSmile += (smileTarget - curSmile) * 0.07
      const cheekTarget = speaking ? 0.62 : 0.34
      curCheek += (cheekTarget - curCheek) * 0.05

      drawMouth(curOpen, curSmile)
      if (cheekLRef.current) cheekLRef.current.setAttribute('opacity', curCheek.toFixed(3))
      if (cheekRRef.current) cheekRRef.current.setAttribute('opacity', curCheek.toFixed(3))
      if (glowRef.current) {
        const gop = 0.18 + (speaking ? 0.28 : 0.08) * (0.6 + 0.4 * Math.sin(t * 2))
        glowRef.current.setAttribute('opacity', gop.toFixed(3))
      }

      if (!reduce && wrapRef.current) {
        breath += 0.02
        wrapRef.current.setAttribute('transform', `translate(0 ${(Math.sin(breath) * 2).toFixed(2)})`)
      }

      // blinking
      if (!reduce) {
        blinkT += 1 / 60
        if (blinkT > blinkNext) { blinkT = 0; blinkNext = 2 + Math.random() * 3.5; doBlink() }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { mounted = false; cancelAnimationFrame(raf) }
  }, [speechRef])

  return (
    <svg viewBox="0 0 360 360" width="100%" height="100%" role="img" aria-label="Friendly study buddy" style={{ display: 'block' }}>
      <defs>
        <radialGradient id="tbBg" cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#ede4fb" />
          <stop offset="60%" stopColor="#d9c9f0" />
          <stop offset="100%" stopColor="#c2abe6" />
        </radialGradient>
        <radialGradient id="tbHalo" cx="50%" cy="42%" r="50%">
          <stop offset="0%" stopColor="#fff6da" />
          <stop offset="100%" stopColor="#fff6da" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="360" height="360" rx="26" fill="url(#tbBg)" />
      <ellipse ref={glowRef} cx="180" cy="150" rx="150" ry="150" fill="url(#tbHalo)" opacity="0.2" />

      <g ref={wrapRef}>
        {/* hair behind */}
        <path d="M82 150 C82 70 124 40 180 40 C236 40 278 70 278 150
                 C290 210 286 286 270 330 L250 330
                 C262 270 250 224 244 210
                 C246 250 240 300 234 332 L126 332
                 C120 300 114 250 116 210
                 C110 224 98 270 110 330 L90 330
                 C74 286 70 210 82 150 Z" fill="#3a2a2f" />
        <path d="M150 60 C120 78 104 120 102 168 C112 150 126 138 140 132
                 C150 100 168 78 180 70 C160 60 152 58 150 60 Z" fill="#52383f" opacity=".55" />

        {/* neck */}
        <path d="M156 250 h48 v40 q-24 14 -48 0 Z" fill="#eec3a6" />
        <path d="M156 250 h48 v30 q-24 10 -48 0 Z" fill="#f7d8c1" />

        {/* sweater */}
        <path d="M96 360 C96 312 132 286 180 286 C228 286 264 312 264 360 Z" fill="#f2ede1" />
        <path d="M180 286 C168 300 150 306 138 300 C150 320 168 326 180 326
                 C192 326 210 320 222 300 C210 306 192 300 180 286 Z" fill="#e1d9c6" />

        {/* face */}
        <path d="M180 78 C232 78 262 122 262 186 C262 252 226 296 180 296 C134 296 98 252 98 186 C98 122 128 78 180 78 Z" fill="#f7d8c1" />
        <path d="M262 186 C262 252 226 296 180 296 C214 286 236 244 236 190 C236 140 220 104 188 86 C232 92 262 130 262 186 Z" fill="#eec3a6" opacity=".5" />

        {/* ears */}
        <circle cx="100" cy="190" r="13" fill="#f7d8c1" />
        <circle cx="260" cy="190" r="13" fill="#f7d8c1" />

        {/* cheeks (glow with warmth) */}
        <ellipse ref={cheekLRef} cx="138" cy="212" rx="18" ry="12" fill="#f0a39b" opacity="0.34" />
        <ellipse ref={cheekRRef} cx="222" cy="212" rx="18" ry="12" fill="#f0a39b" opacity="0.34" />

        {/* eyebrows */}
        <path d="M124 158 q22 -12 44 -2" stroke="#3a2a2f" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M192 156 q22 -10 44 2" stroke="#3a2a2f" strokeWidth="5" fill="none" strokeLinecap="round" />

        {/* eyes (open) */}
        <g ref={eyesOpenRef}>
          <ellipse cx="146" cy="184" rx="20" ry="23" fill="#fffdf9" />
          <ellipse cx="214" cy="184" rx="20" ry="23" fill="#fffdf9" />
          <circle cx="148" cy="186" r="15" fill="#5b3a2e" />
          <circle cx="212" cy="186" r="15" fill="#5b3a2e" />
          <circle cx="148" cy="186" r="7" fill="#2a1a14" />
          <circle cx="212" cy="186" r="7" fill="#2a1a14" />
          <circle cx="153" cy="180" r="4.5" fill="#fff" />
          <circle cx="217" cy="180" r="4.5" fill="#fff" />
          <path d="M126 174 q20 -12 40 -2" stroke="#2e2024" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M194 172 q20 -10 40 2" stroke="#2e2024" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </g>
        {/* eyes (closed) */}
        <g ref={eyesClosedRef} style={{ display: 'none' }}>
          <path d="M128 186 q18 12 38 0" stroke="#2e2024" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M194 186 q18 12 38 0" stroke="#2e2024" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>

        {/* nose */}
        <path d="M178 198 q6 14 -4 20" stroke="#eec3a6" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* mouth (drawn each frame) */}
        <g ref={mouthRef} />

        {/* hair front / bangs */}
        <path d="M98 168 C92 110 128 64 180 64 C232 64 268 110 262 168
                 C250 138 232 124 220 132 C214 110 198 100 180 100
                 C162 100 146 110 140 132 C128 124 110 138 98 168 Z" fill="#3a2a2f" />
        <path d="M180 64 C150 64 128 86 120 120 C140 104 160 100 180 100
                 C200 100 220 104 240 120 C232 86 210 64 180 64 Z" fill="#52383f" opacity=".5" />
      </g>
    </svg>
  )
}

const BREVITY = "\n\n[Keep it short and warm — usually 2-4 sentences. Conversational, no bullet lists.]"

export default function TalkingBuddy({
  user,
  audience,
  apiUrl = DEFAULT_API,
  getAuthHeaders = defaultHeaders,
  accent = '#7c5bd6',
  accent2 = '#a855f7',
  synthesizeAudio = null,
  // accepted & ignored (old 3D props) so the call site needn't change:
  modelUrl, restMode,
}) {
  const firstName = user?.name?.split(' ')[0] || 'there'
  const resolvedAudience = useMemo(() => {
    if (audience === 'teacher' || audience === 'student') return audience
    const r = (user?.audience || user?.role || user?.type || '').toString().toLowerCase()
    return /teach|faculty|staff|mentor|prof|instructor|educator/.test(r) ? 'teacher' : 'student'
  }, [audience, user])
  const persona = PERSONAS[resolvedAudience]

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [muted, setMuted] = useState(false)
  const [listening, setListening] = useState(false)
  const [bubble, setBubble] = useState('')
  const [isNarrow, setIsNarrow] = useState(false)

  const bottomRef = useRef(null); const msgsRef = useRef([]); const greetedRef = useRef(false)
  const recogRef = useRef(null); const mutedRef = useRef(false); const bubbleTimer = useRef(null)
  const speechRef = useRef({ active:false, seq:null, idx:0, syncIdx:0, syncTime:0, amp:null })
  const audioCtxRef = useRef(null)

  useEffect(() => { injectStyles() }, [])
  useEffect(() => { msgsRef.current = messages }, [messages])
  useEffect(() => { mutedRef.current = muted }, [muted])
  useEffect(() => { if (open) bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, open, loading])
  useEffect(() => { const fn = () => setIsNarrow(window.innerWidth < 640); fn(); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn) }, [])

  // Pick the clearest, most natural FEMALE English voice available.
  const pickVoice = useCallback(() => {
    const synth = window.speechSynthesis; if (!synth) return null
    const voices = synth.getVoices() || []
    if (!voices.length) return null
    const FEMALE = /female|woman|samantha|victoria|karen|moira|tessa|fiona|serena|allison|ava|susan|zira|aria|jenny|libby|sonia|michelle|catherine|neerja|heera|swara|google uk english female|google us english/i
    const MALE   = /\bmale\b|david|mark|george|guy|daniel|fred|alex|james|ryan|eric|aaron|brian|rishi|prabhat|hemant/i
    const score = v => {
      const n = v.name || '', l = (v.lang || '').toLowerCase()
      let s = 0
      if (/online \(natural\)|neural|natural/i.test(n)) s += 120
      if (/enhanced|premium|siri/i.test(n))             s += 60
      if (/google/i.test(n))                            s += 45
      if (v.localService === false)                     s += 25
      if (FEMALE.test(n)) s += 80      // strongly prefer female timbres
      if (MALE.test(n))   s -= 120     // reject male voices
      if      (l.startsWith('en-us')) s += 30
      else if (l.startsWith('en-gb')) s += 20
      else if (l.startsWith('en-in')) s += 16
      else if (l.startsWith('en'))    s += 10
      return s
    }
    let best = null, bestS = -Infinity
    for (const v of voices) {
      if (!(v.lang || '').toLowerCase().startsWith('en')) continue
      const s = score(v)
      if (s > bestS) { bestS = s; best = v }
    }
    return best
  }, [])

  const showBubble = useCallback((text) => {
    setBubble(text)
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current)
    const ms = Math.max(9000, text.split(/\s+/).length * 380)
    bubbleTimer.current = setTimeout(() => setBubble(''), ms)
  }, [])

  const startVisemes = useCallback((text, ampFn = null) => {
    speechRef.current = { active:true, seq: buildVisemeTimeline(text, persona.rate), idx:0, syncIdx:0, syncTime: performance.now()/1000, amp: ampFn }
  }, [persona.rate])
  const stopVisemes = useCallback(() => { const s = speechRef.current; s.active = false; s.amp = null }, [])
  const syncToBoundary = useCallback((ci) => {
    const s = speechRef.current; if (!s.active || !s.seq) return
    let idx = s.seq.findIndex(v => v.ci >= ci); if (idx < 0) idx = s.seq.length - 1
    s.syncIdx = idx; s.syncTime = performance.now()/1000
  }, [])

  const speakWithSynth = useCallback((text) => {
    try {
      const synth = window.speechSynthesis; if (!synth) return
      synth.cancel()
      const say = () => {
        const u = new SpeechSynthesisUtterance(text)
        u.lang = 'en-US'
        u.rate = persona.rate; u.pitch = persona.pitch
        const v = pickVoice(); if (v) u.voice = v
        u.onstart = () => startVisemes(text)
        u.onboundary = (e) => { if (typeof e.charIndex === 'number') syncToBoundary(e.charIndex) }
        u.onend = () => stopVisemes(); u.onerror = () => stopVisemes()
        synth.speak(u)
      }
      if (!synth.getVoices().length) { synth.onvoiceschanged = () => { synth.onvoiceschanged = null; say() }; setTimeout(say, 250) } else say()
    } catch { stopVisemes() }
  }, [pickVoice, persona, startVisemes, stopVisemes, syncToBoundary])

  const speakWithAudio = useCallback(async (text, source) => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx()
      const ctx = audioCtxRef.current; if (ctx.state === 'suspended') await ctx.resume()
      let buf
      if (source instanceof Blob) buf = await source.arrayBuffer()
      else if (source instanceof ArrayBuffer) buf = source
      else if (typeof source === 'string') buf = await (await fetch(source)).arrayBuffer()
      const audioBuf = await ctx.decodeAudioData(buf)
      const src = ctx.createBufferSource(); src.buffer = audioBuf
      const analyser = ctx.createAnalyser(); analyser.fftSize = 512
      const data = new Uint8Array(analyser.frequencyBinCount)
      src.connect(analyser); analyser.connect(ctx.destination)
      const ampFn = () => { analyser.getByteTimeDomainData(data); let s=0; for (let i=0;i<data.length;i++){const x=(data[i]-128)/128; s+=x*x} return Math.min(1, Math.sqrt(s/data.length)*3.2) }
      startVisemes(text, ampFn); src.onended = () => stopVisemes(); src.start()
    } catch { speakWithSynth(text) }
  }, [startVisemes, stopVisemes, speakWithSynth])

  const speak = useCallback(async (rawText) => {
    const text = cleanForSpeech(rawText)
    showBubble(text)
    if (mutedRef.current || !text) return
    if (synthesizeAudio) { try { const src = await synthesizeAudio(text); if (src) { await speakWithAudio(text, src); return } } catch {} }
    speakWithSynth(text)
  }, [showBubble, synthesizeAudio, speakWithAudio, speakWithSynth])

  const send = useCallback(async (textOverride, hidden = false) => {
    const text = (textOverride ?? input).trim()
    if (!text || loading) return
    if (!hidden) setMessages(m => [...m, { role:'user', content:text }])
    setInput(''); setLoading(true)
    try {
      const r = await fetch(`${apiUrl}/api/buddy/chat`, {
        method:'POST', headers:getAuthHeaders(),
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

  useEffect(() => {
    if (greetedRef.current) return
    greetedRef.current = true
    const t = setTimeout(() => { send(persona.kick, true) }, 1200)
    return () => clearTimeout(t)
  }, [send, persona])

  function toggleMute() { setMuted(m => { if (!m) { try { window.speechSynthesis?.cancel() } catch {}; stopVisemes() } return !m }) }
  function toggleMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return
    if (listening) { try { recogRef.current?.stop() } catch {}; return }
    try {
      const r = new SR(); r.lang='en-US'; r.interimResults=false; r.maxAlternatives=1
      r.onresult = e => { setInput(prev => (prev ? prev+' ' : '') + e.results[0][0].transcript) }
      r.onend = () => setListening(false); r.onerror = () => setListening(false)
      recogRef.current = r; setListening(true); r.start()
    } catch { setListening(false) }
  }
  const micSupported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
  const renderMd = (s='') => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')

  const FONT = "'Nunito', system-ui, sans-serif"
  const stageW = isNarrow ? 148 : 188
  const stageH = stageW            // square portrait

  return (
    <>
      <div style={{ position:'fixed', right:isNarrow?8:18, bottom:18, width:stageW, zIndex:1000, pointerEvents:'none' }}>
        {bubble && (
          <div style={{ position:'absolute', bottom:stageH + 44, left:'50%', transform:'translateX(-50%)', width:isNarrow?210:250, maxWidth:'78vw', background:'#fff', color:'#1e293b', borderRadius:14, padding:'10px 13px', fontSize:13, lineHeight:1.55, fontFamily:FONT, boxShadow:'0 12px 34px rgba(70,40,120,.22)', border:'1px solid rgba(15,23,42,.08)', animation:'tbBub .25s ease-out', pointerEvents:'auto' }}>
            {bubble}
            <span style={{ position:'absolute', bottom:-7, left:'50%', transform:'translateX(-50%) rotate(45deg)', width:14, height:14, background:'#fff', borderRight:'1px solid rgba(15,23,42,.08)', borderBottom:'1px solid rgba(15,23,42,.08)' }} />
          </div>
        )}

        {/* avatar portrait card */}
        <div style={{ position:'relative', width:stageW, height:stageH, borderRadius:24, overflow:'hidden', boxShadow:'0 16px 44px -18px rgba(70,40,120,.55), inset 0 0 0 1px rgba(255,255,255,.4)', pointerEvents:'auto' }}>
          <Avatar2D speechRef={speechRef} />
          <button onClick={toggleMute} title={muted?'Unmute voice':'Mute voice'} style={{ position:'absolute', top:8, right:8, width:30, height:30, borderRadius:9, background:'rgba(255,255,255,.92)', border:'1px solid rgba(15,23,42,.1)', cursor:'pointer', fontSize:13, boxShadow:'0 2px 8px rgba(70,40,120,.18)' }}>{muted?'🔇':'🔊'}</button>
        </div>

        {!open && (
          <button onClick={() => setOpen(true)} style={{ position:'relative', marginTop:10, left:'50%', transform:'translateX(-50%)', pointerEvents:'auto', display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap', padding:'8px 15px', borderRadius:24, border:'none', cursor:'pointer', background:`linear-gradient(135deg, ${accent}, ${accent2})`, color:'#fff', fontFamily:FONT, fontWeight:800, fontSize:12.5, boxShadow:`0 6px 18px ${accent}55`, animation:'tbPulse 2.4s infinite' }}>
            💬 Chat with me
            <span style={{ position:'absolute', top:-5, right:-5, width:11, height:11, borderRadius:'50%', background:'#22c55e', border:'2px solid #fff' }} />
          </button>
        )}
      </div>

      {open && (
        <div style={{ position:'fixed', zIndex:1001, display:'flex', flexDirection:'column', ...(isNarrow ? { left:12, right:12, bottom:stageH+70, maxHeight:'calc(100vh - 320px)' } : { right:stageW+28, bottom:24, width:350, height:'min(500px, calc(100vh - 120px))' }), borderRadius:18, overflow:'hidden', fontFamily:FONT, animation:'tbPop .22s ease-out', background:'var(--bg2, #ffffff)', border:'1px solid var(--border, rgba(15,23,42,.1))', boxShadow:'0 24px 70px rgba(70,40,120,.28)' }}>
          <div style={{ flexShrink:0, padding:'12px 14px', display:'flex', alignItems:'center', gap:10, background:`linear-gradient(135deg, ${accent}, ${accent2})` }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,.22)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>{persona.avatarEmoji}</div>
            <div style={{ flex:1, minWidth:0, color:'#fff' }}>
              <div style={{ fontWeight:800, fontSize:15, fontFamily:"'Sora', sans-serif" }}>{persona.label}</div>
              <div style={{ fontSize:11.5, opacity:.9 }}>{loading ? 'thinking…' : persona.sub}</div>
            </div>
            <button onClick={toggleMute} title={muted?'Unmute':'Mute'} style={{ background:'rgba(255,255,255,.22)', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:14 }}>{muted?'🔇':'🔊'}</button>
            <button onClick={() => setOpen(false)} title="Close" style={{ background:'rgba(255,255,255,.22)', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:16, color:'#fff' }}>×</button>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:14, display:'flex', flexDirection:'column', gap:10, background:'var(--bg, #f4f4f0)' }}>
            {messages.length === 0 && !loading && <div style={{ textAlign:'center', color:'var(--text, #64748b)', fontSize:12.5, padding:'20px 8px' }}>Hi {firstName}! Ask me anything.</div>}
            {messages.map((m, i) => (
              <div key={i} style={{ display:'flex', justifyContent: m.role==='user'?'flex-end':'flex-start' }}>
                <div style={{ maxWidth:'85%', padding:'9px 13px', fontSize:13.5, lineHeight:1.6, borderRadius: m.role==='user'?'13px 4px 13px 13px':'4px 13px 13px 13px', background: m.role==='user'?`linear-gradient(135deg, ${accent}, ${accent2})`:'var(--bg2, #fff)', color: m.role==='user'?'#fff':'var(--text-h, #1e293b)', border: m.role==='assistant'?'1px solid var(--border, rgba(15,23,42,.1))':'none' }} dangerouslySetInnerHTML={{ __html: renderMd(m.content) }} />
              </div>
            ))}
            {loading && <div style={{ display:'flex', gap:5, padding:'9px 13px', background:'var(--bg2, #fff)', borderRadius:'4px 13px 13px 13px', width:'fit-content', border:'1px solid var(--border, rgba(15,23,42,.1))' }}>{[0,1,2].map(j => <span key={j} style={{ width:6, height:6, borderRadius:'50%', background:accent, animation:`tbDot 1s ${j*0.2}s infinite` }} />)}</div>}
            <div ref={bottomRef} />
          </div>
          {messages.filter(m => m.role==='user').length === 0 && !loading && (
            <div style={{ display:'flex', gap:6, padding:'0 12px 8px', flexWrap:'wrap' }}>
              {persona.quick.map(q => <button key={q.label} onClick={() => send(q.msg)} disabled={loading} style={{ fontSize:11.5, padding:'5px 10px', borderRadius:20, cursor:'pointer', fontFamily:FONT, fontWeight:700, border:`1px solid ${accent}44`, background:`${accent}12`, color:accent }}>{q.label}</button>)}
            </div>
          )}
          <div style={{ flexShrink:0, padding:10, borderTop:'1px solid var(--border, rgba(15,23,42,.1))', display:'flex', gap:7, background:'var(--bg2, #fff)' }}>
            {micSupported && <button onClick={toggleMic} title="Speak" style={{ width:38, height:38, borderRadius:10, border:'1px solid var(--border, rgba(15,23,42,.1))', background: listening?`${accent}22`:'transparent', cursor:'pointer', fontSize:16, flexShrink:0 }}>{listening?'🔴':'🎤'}</button>}
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && send()} placeholder="Ask me anything…" disabled={loading} style={{ flex:1, padding:'9px 13px', borderRadius:10, border:'1px solid var(--border, rgba(15,23,42,.1))', background:'var(--code-bg, rgba(15,23,42,.035))', color:'var(--text-h, #1e293b)', fontSize:13.5, fontFamily:FONT, outline:'none' }} />
            <button onClick={() => send()} disabled={loading || !input.trim()} style={{ width:40, height:38, borderRadius:10, border:'none', background:`linear-gradient(135deg, ${accent}, ${accent2})`, color:'#fff', fontSize:16, cursor: input.trim()?'pointer':'not-allowed', opacity: input.trim()?1:0.6, flexShrink:0 }}>→</button>
          </div>
        </div>
      )}
    </>
  )
}