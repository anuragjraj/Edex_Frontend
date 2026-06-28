/**
 * TalkingBuddy - a standing 3D human avatar that greets and talks.
 *
 *  WHAT CHANGED (per request):
 *   1. The avatar now STANDS fully visible on the page (bottom-right),
 *      framed head-to-feet on a transparent background — not boxed inside
 *      a chat header anymore.
 *   2. A small "Chat" button sits near the avatar's LEGS. Tap it to open chat.
 *   3. Replies are kept SHORT (1-2 sentences) and only the first ~4-5 seconds
 *      worth of text is spoken, so the user never waits long.
 *   4. The voice is now MALE.
 *
 * Works with ANY rigged humanoid model (.glb OR .gltf), self-hosted in /public.
 *  - AUTO-SCALES + RE-CENTERS the model so it's framed correctly.
 *  - Plays the model's built-in idle animation if it has one.
 *  - Lip-syncs via face morph targets if present; else nods while speaking.
 *
 * REQUIRES:  npm install three @react-three/fiber @react-three/drei
 * USAGE:     {user && <TalkingBuddy user={user} />}
 */

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useAnimations, Html } from '@react-three/drei'
import * as THREE from 'three'

/* -----------------------------------------------------------------
   MODEL SETTINGS
   ----------------------------------------------------------------- */
const MODEL_URL = '/avatar.glb'
const TARGET_HEIGHT = 1.7        // model is auto-scaled to ~1.7m tall
const MODEL_ROTATION_Y = 0       // set to 3.14159 if the avatar faces AWAY

const DEFAULT_API =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:5000'

/* Keep spoken replies to ~4-5 seconds: 1-2 short sentences. */
const SPEECH_MAX_CHARS = 220
const SPEECH_MAX_SENTENCES = 2

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

function cleanForSpeech(t = '') {
  return t
    .replace(/[#*_`>]/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/[\u{1F000}-\u{1FFFF}\u2190-\u27BF\u2B00-\u2BFF\uFE00-\uFE0F]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/* Trim any reply down to the first 1-2 sentences so it speaks in ~4-5s. */
function shortenForSpeech(text = '') {
  const clean = cleanForSpeech(text)
  const parts = clean.match(/[^.!?]+[.!?]?/g) || [clean]
  let out = parts.slice(0, SPEECH_MAX_SENTENCES).join(' ').trim()
  if (out.length > SPEECH_MAX_CHARS) out = out.slice(0, SPEECH_MAX_CHARS).trim() + '…'
  return out
}

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById('tb3d-styles')) return
  const s = document.createElement('style')
  s.id = 'tb3d-styles'
  s.textContent = `
    @keyframes tbPop   { from{opacity:0;transform:scale(.85) translateY(12px)} to{opacity:1;transform:none} }
    @keyframes tbBub   { from{opacity:0;transform:translateY(8px) scale(.96)} to{opacity:1;transform:none} }
    @keyframes tbDot   { 0%,100%{opacity:.25;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
    @keyframes tbSpin  { to{transform:rotate(360deg)} }
    @keyframes tbPulse { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.45)} 70%{box-shadow:0 0 0 12px rgba(99,102,241,0)} }
  `
  document.head.appendChild(s)
}

/* -- The 3D avatar -------------------------------------------------- */
function Avatar({ url, talkingRef }) {
  const group = useRef()
  const { scene, animations } = useGLTF(url, true)
  const { actions, names } = useAnimations(animations, group)

  const meshesRef = useRef([])
  const bonesRef = useRef({})
  const baseRef = useRef({})
  const jawRef = useRef(0)
  const blinkRef = useRef({ t: 0, next: 2 + Math.random() * 3 })
  const hasMorphsRef = useRef(false)
  const hasAnimRef = useRef(false)

  useEffect(() => {
    hasAnimRef.current = names.length > 0
    if (!names.length) return
    const idle = names.find(n => /idle|breath|stand|pose/i.test(n)) || names[0]
    const a = actions[idle]
    if (a) a.reset().fadeIn(0.4).play()
    return () => a && a.fadeOut(0.3)
  }, [actions, names])

  useEffect(() => {
    // normalize size to ~TARGET_HEIGHT
    let box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3(); box.getSize(size)
    const h = size.y || 1
    scene.scale.setScalar(TARGET_HEIGHT / h)
    // recenter on X/Z and drop feet to y=0
    box = new THREE.Box3().setFromObject(scene)
    const center = new THREE.Vector3(); box.getCenter(center)
    scene.position.x -= center.x
    scene.position.z -= center.z
    scene.position.y -= box.min.y

    const meshes = []
    const bones = {}
    scene.traverse(o => {
      if (o.isMesh && o.morphTargetDictionary) meshes.push(o)
      if (o.isBone) {
        const n = o.name.toLowerCase()
        if (!bones.spine && (n === 'spine' || n.endsWith(':spine') || n.includes('spine2'))) bones.spine = o
        if (!bones.head && n.includes('head')) bones.head = o
      }
    })
    meshesRef.current = meshes
    hasMorphsRef.current = meshes.length > 0
    bonesRef.current = bones
    baseRef.current = {
      spineX: bones.spine ? bones.spine.rotation.x : 0,
      headX: bones.head ? bones.head.rotation.x : 0,
    }
  }, [scene])

  function setMorph(nameList, value) {
    for (const mesh of meshesRef.current) {
      for (const name of nameList) {
        const idx = mesh.morphTargetDictionary[name]
        if (idx !== undefined) mesh.morphTargetInfluences[idx] = value
      }
    }
  }

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const d = Math.min(1, delta * 16)
    const talking = talkingRef.current
    const { spine, head } = bonesRef.current

    if (hasMorphsRef.current) {
      const target = talking ? (Math.sin(t * 11) * 0.5 + 0.5) * (0.22 + Math.random() * 0.12) : 0
      jawRef.current += (target - jawRef.current) * d
      setMorph(['jawOpen', 'mouthOpen', 'viseme_aa'], jawRef.current)
      const b = blinkRef.current
      b.t += delta
      if (b.t > b.next) { b.t = 0; b.next = 2 + Math.random() * 3.5 }
      const bv = b.t < 0.1 ? b.t / 0.1 : b.t < 0.2 ? 1 - (b.t - 0.1) / 0.1 : 0
      setMorph(['eyeBlinkLeft', 'eyeBlinkRight'], bv)
    } else if (head) {
      head.rotation.x = baseRef.current.headX + (talking ? Math.sin(t * 9) * 0.05 : Math.sin(t * 0.8) * 0.015)
    }

    if (!hasAnimRef.current) {
      if (spine) spine.rotation.x = baseRef.current.spineX + Math.sin(t * 1.4) * 0.02
      scene.rotation.y = Math.sin(t * 0.4) * 0.04
    }
  })

  return (
    <group ref={group} rotation={[0, MODEL_ROTATION_Y, 0]}>
      <primitive object={scene} />
    </group>
  )
}

/* Frame the WHOLE standing body (not just the face). */
function Rig() {
  const { camera } = useThree()
  useFrame(() => camera.lookAt(0, 0.95, 0))
  return null
}

function Loader() {
  return (
    <Html center>
      <div style={{ width: 26, height: 26, border: '3px solid rgba(99,102,241,.3)', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'tbSpin .8s linear infinite' }} />
    </Html>
  )
}

const KICKOFF =
  "Greet me by my first name in ONE short, warm sentence, then suggest ONE specific thing " +
  "to study next. Keep it under 25 words total — friendly and natural, like a quick hello."

/* Hidden directive appended to every message we send, so replies stay short. */
const BREVITY =
  "\n\n[Reply in 1-2 short sentences, under 35 words, warm and friendly. No lists.]"

const QUICK = [
  { label: '📚 Study today?', msg: "In one short sentence, what should I study right now?" },
  { label: '🔥 Motivate me', msg: "Give me a quick, genuine one-line pep talk based on my streak." },
  { label: '🧠 Quiz me', msg: "Ask me ONE short question to check my recent learning. Wait for my reply." },
]

export default function TalkingBuddy({
  user,
  apiUrl = DEFAULT_API,
  getAuthHeaders = defaultHeaders,
  modelUrl = MODEL_URL,
  accent = '#6366F1',
  accent2 = '#8B5CF6',
}) {
  const firstName = user?.name?.split(' ')[0] || 'there'

  const [open, setOpen] = useState(false)      // chat panel open?
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [muted, setMuted] = useState(false)
  const [listening, setListening] = useState(false)
  const [bubble, setBubble] = useState('')      // floating speech bubble text
  const [isNarrow, setIsNarrow] = useState(false)

  const bottomRef = useRef(null)
  const msgsRef = useRef([])
  const greetedRef = useRef(false)
  const recogRef = useRef(null)
  const mutedRef = useRef(false)
  const talkingRef = useRef(false)
  const bubbleTimer = useRef(null)

  useEffect(() => { injectStyles() }, [])
  useEffect(() => { msgsRef.current = messages }, [messages])
  useEffect(() => { mutedRef.current = muted }, [muted])
  useEffect(() => { if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, open, loading])

  useEffect(() => {
    const fn = () => setIsNarrow(window.innerWidth < 640)
    fn(); window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  /* Pick a MALE English voice if available. */
  const pickVoice = useCallback(() => {
    const synth = window.speechSynthesis
    if (!synth) return null
    const voices = synth.getVoices() || []
    const FEMALE = /female|samantha|zira|aria|jenny|salli|joanna|kendra|tessa|veena|raveena/i
    return (
      voices.find(v => /david|daniel|alex|fred|rishi|guy|brian|matthew|google uk english male|microsoft.*\bmale\b|\bmale\b/i.test(v.name)) ||
      voices.find(v => /google (uk|us) english/i.test(v.name) && !FEMALE.test(v.name)) ||
      voices.find(v => (v.lang || '').toLowerCase().startsWith('en') && !FEMALE.test(v.name)) ||
      voices.find(v => (v.lang || '').toLowerCase().startsWith('en')) ||
      null
    )
  }, [])

  const showBubble = useCallback((text) => {
    setBubble(text)
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current)
    // keep it readable for a bit, then fade (unless chat is open)
    bubbleTimer.current = setTimeout(() => setBubble(''), 9000)
  }, [])

  const speak = useCallback((rawText) => {
    const text = shortenForSpeech(rawText)
    showBubble(text)
    if (mutedRef.current || !text) return
    try {
      const synth = window.speechSynthesis
      if (!synth) return
      synth.cancel()
      const say = () => {
        const u = new SpeechSynthesisUtterance(text)
        u.rate = 1.04; u.pitch = 0.92        // slightly lower pitch = more male
        const v = pickVoice()
        if (v) u.voice = v
        u.onstart = () => { talkingRef.current = true }
        u.onend = () => { talkingRef.current = false }
        u.onerror = () => { talkingRef.current = false }
        synth.speak(u)
      }
      // voices can load late on first run
      if (!synth.getVoices().length) {
        synth.onvoiceschanged = () => { synth.onvoiceschanged = null; say() }
        setTimeout(say, 250)
      } else say()
    } catch {}
  }, [pickVoice, showBubble])

  const send = useCallback(async (textOverride, hidden = false) => {
    const text = (textOverride ?? input).trim()
    if (!text || loading) return
    if (!hidden) setMessages(m => [...m, { role: 'user', content: text }])
    setInput(''); setLoading(true)
    try {
      const r = await fetch(`${apiUrl}/api/buddy/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: text + BREVITY, sessionMessages: msgsRef.current.slice(-8) }),
      })
      const data = await r.json().catch(() => ({}))
      const reply = data.content || `I'm right here, ${firstName}! Want a quick study tip?`
      setMessages(m => [...m, { role: 'assistant', content: reply }])
      speak(reply)
    } catch {
      const fb = `Hey ${firstName}! I couldn't connect — try again in a sec.`
      setMessages(m => [...m, { role: 'assistant', content: fb }])
      speak(fb)
    }
    setLoading(false)
  }, [input, loading, apiUrl, getAuthHeaders, firstName, speak])

  /* Greet on first load — the standing avatar speaks proactively. */
  useEffect(() => {
    if (greetedRef.current) return
    greetedRef.current = true
    const t = setTimeout(() => send(KICKOFF, true), 1200)
    return () => clearTimeout(t)
  }, [send])

  function toggleMute() {
    setMuted(m => {
      if (!m) { try { window.speechSynthesis?.cancel() } catch {}; talkingRef.current = false }
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
      r.onresult = e => { setInput(prev => (prev ? prev + ' ' : '') + e.results[0][0].transcript) }
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

  /* Avatar stage size */
  const stageW = isNarrow ? 120 : 158
  const stageH = isNarrow ? 240 : 310

  return (
    <>
      {/* ───────── STANDING AVATAR (always visible, transparent bg) ───────── */}
      <div
        style={{
          position: 'fixed', right: isNarrow ? 8 : 18, bottom: 0,
          width: stageW, height: stageH, zIndex: 1000, pointerEvents: 'none',
        }}
      >
        {/* speech bubble above the avatar's head */}
        {bubble && (
          <div
            style={{
              position: 'absolute', bottom: stageH - 24, left: '50%',
              transform: 'translateX(-50%)', width: isNarrow ? 200 : 250, maxWidth: '78vw',
              background: '#fff', color: '#1e293b', borderRadius: 14,
              padding: '10px 13px', fontSize: 13, lineHeight: 1.55, fontFamily: FONT,
              boxShadow: '0 12px 34px rgba(15,23,42,.22)', border: '1px solid rgba(15,23,42,.08)',
              animation: 'tbBub .25s ease-out', pointerEvents: 'auto',
            }}
          >
            {bubble}
            <span style={{ position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 14, height: 14, background: '#fff', borderRight: '1px solid rgba(15,23,42,.08)', borderBottom: '1px solid rgba(15,23,42,.08)' }} />
          </div>
        )}

        {/* the 3D person */}
        <Canvas
          camera={{ position: [0, 0.95, 3.35], fov: 30 }}
          gl={{ alpha: true, antialias: true }}
          style={{ width: '100%', height: '100%', background: 'transparent' }}
        >
          <ambientLight intensity={0.95} />
          <directionalLight position={[2, 4, 3]} intensity={1.3} />
          <directionalLight position={[-2, 2, 2]} intensity={0.5} />
          <Suspense fallback={<Loader />}>
            <Avatar url={modelUrl} talkingRef={talkingRef} />
          </Suspense>
          <Rig />
        </Canvas>

        {/* mute toggle (tiny, top-right of the stage) */}
        <button
          onClick={toggleMute}
          title={muted ? 'Unmute voice' : 'Mute voice'}
          style={{
            position: 'absolute', top: 4, right: 0, width: 30, height: 30, borderRadius: 9,
            background: 'rgba(255,255,255,.92)', border: '1px solid rgba(15,23,42,.1)',
            cursor: 'pointer', fontSize: 13, pointerEvents: 'auto',
            boxShadow: '0 2px 8px rgba(15,23,42,.12)',
          }}
        >
          {muted ? '🔇' : '🔊'}
        </button>

        {/* ── CHAT BUTTON near the LEGS ── */}
        {!open && (
          <button
            onClick={() => setOpen(true)}
            style={{
              position: 'absolute', bottom: isNarrow ? 28 : 36, left: '50%',
              transform: 'translateX(-50%)', pointerEvents: 'auto',
              display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              padding: '8px 15px', borderRadius: 24, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${accent}, ${accent2})`, color: '#fff',
              fontFamily: FONT, fontWeight: 800, fontSize: 12.5,
              boxShadow: `0 6px 18px ${accent}55`, animation: 'tbPulse 2.4s infinite',
            }}
          >
            💬 Chat with me
            <span style={{ position: 'absolute', top: -5, right: -5, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }} />
          </button>
        )}
      </div>

      {/* ───────── CHAT PANEL ───────── */}
      {open && (
        <div
          style={{
            position: 'fixed', zIndex: 1001, display: 'flex', flexDirection: 'column',
            ...(isNarrow
              ? { left: 12, right: 12, bottom: stageH - 16, maxHeight: 'calc(100vh - 280px)' }
              : { right: stageW + 28, bottom: 24, width: 350, height: 'min(500px, calc(100vh - 120px))' }),
            borderRadius: 18, overflow: 'hidden', fontFamily: FONT, animation: 'tbPop .22s ease-out',
            background: 'var(--bg2, #ffffff)', border: '1px solid var(--border, rgba(15,23,42,.1))',
            boxShadow: '0 24px 70px rgba(15,23,42,.28)',
          }}
        >
          {/* header */}
          <div style={{ flexShrink: 0, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, background: `linear-gradient(135deg, ${accent}, ${accent2})` }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🧑‍🏫</div>
            <div style={{ flex: 1, minWidth: 0, color: '#fff' }}>
              <div style={{ fontWeight: 800, fontSize: 15, fontFamily: "'Sora', sans-serif" }}>Spark</div>
              <div style={{ fontSize: 11.5, opacity: .9 }}>{loading ? 'thinking…' : 'your study buddy'}</div>
            </div>
            <button onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'} style={{ background: 'rgba(255,255,255,.22)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 14 }}>{muted ? '🔇' : '🔊'}</button>
            <button onClick={() => setOpen(false)} title="Close" style={{ background: 'rgba(255,255,255,.22)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: '#fff' }}>×</button>
          </div>

          {/* messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg, #f4f4f0)' }}>
            {messages.length === 0 && !loading && (
              <div style={{ textAlign: 'center', color: 'var(--text, #64748b)', fontSize: 12.5, padding: '20px 8px' }}>Hi {firstName}! Ask me anything.</div>
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

          {/* quick prompts (only before the user types) */}
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

          {/* input */}
          <div style={{ flexShrink: 0, padding: 10, borderTop: '1px solid var(--border, rgba(15,23,42,.1))', display: 'flex', gap: 7, background: 'var(--bg2, #fff)' }}>
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