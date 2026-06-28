/**
 * TalkingBuddy - a 3D human avatar that talks.  (Sketchfab-friendly version)
 *
 * Works with ANY rigged humanoid model (.glb OR .gltf), self-hosted in /public.
 *  - AUTO-SCALES + RE-CENTERS the model so it's framed correctly no matter
 *    what size/position the Sketchfab author exported it at.
 *  - Plays the model's built-in idle animation if it has one.
 *  - Lip-syncs via face morph targets if present; else nods the head while
 *    speaking so it still feels alive.
 *  - Speaks replies aloud (SpeechSynthesis) + optional mic input.
 *  - Proactive coaching on open. Uses your existing POST /api/buddy/chat.
 *
 * REQUIRES:  npm install three @react-three/fiber @react-three/drei
 * USAGE:     {user && <TalkingBuddy user={user} />}
 */

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useAnimations, Html } from '@react-three/drei'
import * as THREE from 'three'

/* -----------------------------------------------------------------
   MODEL SETTINGS - the only things you normally touch.
   Put your downloaded file in /public, then point to it:
     - single file:  '/avatar.glb'
     - gltf folder:  '/avatar/scene.gltf'
   ----------------------------------------------------------------- */
const MODEL_URL = '/avatar.glb'
const TARGET_HEIGHT = 1.7        // the model is auto-scaled to ~1.7m tall
const MODEL_ROTATION_Y = 0       // set to 3.14159 if the avatar faces AWAY from you

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

function cleanForSpeech(t = '') {
  return t
    .replace(/[#*_`>]/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/[\u{1F000}-\u{1FFFF}\u2190-\u27BF\u2B00-\u2BFF\uFE00-\uFE0F]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById('tb3d-styles')) return
  const s = document.createElement('style')
  s.id = 'tb3d-styles'
  s.textContent = `
    @keyframes tbFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
    @keyframes tbPop   { from{opacity:0;transform:scale(.85) translateY(12px)} to{opacity:1;transform:none} }
    @keyframes tbRing  { 0%{transform:scale(1);opacity:.55} 100%{transform:scale(1.7);opacity:0} }
    @keyframes tbDot   { 0%,100%{opacity:.25;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
    @keyframes tbSpin  { to{transform:rotate(360deg)} }
  `
  document.head.appendChild(s)
}

/* -- The 3D avatar -------------------------------------------------- */
function Avatar({ url, talkingRef }) {
  const group = useRef()
  const { scene, animations } = useGLTF(url, true) // true = enable Draco decoder
  const { actions, names } = useAnimations(animations, group)

  const meshesRef = useRef([])
  const bonesRef = useRef({})
  const baseRef = useRef({})
  const jawRef = useRef(0)
  const blinkRef = useRef({ t: 0, next: 2 + Math.random() * 3 })
  const hasMorphsRef = useRef(false)
  const hasAnimRef = useRef(false)

  // Play a built-in idle animation if one exists
  useEffect(() => {
    hasAnimRef.current = names.length > 0
    if (!names.length) return
    const idle = names.find(n => /idle|breath|stand|pose/i.test(n)) || names[0]
    const a = actions[idle]
    if (a) a.reset().fadeIn(0.4).play()
    return () => a && a.fadeOut(0.3)
  }, [actions, names])

  // Auto-scale + re-center, then find morph meshes & bones
  useEffect(() => {
    // 1) normalize size to ~TARGET_HEIGHT
    let box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3(); box.getSize(size)
    const h = size.y || 1
    scene.scale.setScalar(TARGET_HEIGHT / h)
    // 2) recenter on X/Z and drop feet to y=0
    box = new THREE.Box3().setFromObject(scene)
    const center = new THREE.Vector3(); box.getCenter(center)
    scene.position.x -= center.x
    scene.position.z -= center.z
    scene.position.y -= box.min.y

    // 3) catalogue morph meshes + spine/head bones
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

function Rig() {
  const { camera } = useThree()
  useFrame(() => camera.lookAt(0, 1.5, 0)) // aim at the face/neck
  return null
}

function Loader() {
  return (
    <Html center>
      <div style={{ width: 30, height: 30, border: '3px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'tbSpin .8s linear infinite' }} />
    </Html>
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
  modelUrl = MODEL_URL,
  accent = '#6366F1',
  accent2 = '#8B5CF6',
}) {
  const firstName = user?.name?.split(' ')[0] || 'there'

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [muted, setMuted] = useState(false)
  const [listening, setListening] = useState(false)

  const bottomRef = useRef(null)
  const msgsRef = useRef([])
  const kickedRef = useRef(false)
  const recogRef = useRef(null)
  const mutedRef = useRef(false)
  const talkingRef = useRef(false)

  useEffect(() => { injectStyles() }, [])
  useEffect(() => { msgsRef.current = messages }, [messages])
  useEffect(() => { mutedRef.current = muted }, [muted])
  useEffect(() => { if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, open, loading])

  const speak = useCallback((text) => {
    if (mutedRef.current || !text) return
    try {
      const synth = window.speechSynthesis
      if (!synth) return
      synth.cancel()
      const u = new SpeechSynthesisUtterance(cleanForSpeech(text).slice(0, 600))
      u.rate = 1.02; u.pitch = 1.05
      const voices = synth.getVoices() || []
      const pick =
        voices.find(v => /samantha|jenny|aria|zira|google us english|female/i.test(v.name)) ||
        voices.find(v => (v.lang || '').toLowerCase().startsWith('en'))
      if (pick) u.voice = pick
      u.onstart = () => { talkingRef.current = true }
      u.onend = () => { talkingRef.current = false }
      u.onerror = () => { talkingRef.current = false }
      synth.speak(u)
    } catch {}
  }, [])

  const send = useCallback(async (textOverride, hidden = false) => {
    const text = (textOverride ?? input).trim()
    if (!text || loading) return
    if (!hidden) setMessages(m => [...m, { role: 'user', content: text }])
    setInput(''); setLoading(true)
    try {
      const r = await fetch(`${apiUrl}/api/buddy/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: text, sessionMessages: msgsRef.current.slice(-8) }),
      })
      const data = await r.json().catch(() => ({}))
      const reply = data.content || `I'm right here, ${firstName}! Want me to suggest what to revise today?`
      setMessages(m => [...m, { role: 'assistant', content: reply }])
      speak(reply)
    } catch {
      const fb = `Hey ${firstName}! I had trouble connecting just now - try again in a sec.`
      setMessages(m => [...m, { role: 'assistant', content: fb }])
      speak(fb)
    }
    setLoading(false)
  }, [input, loading, apiUrl, getAuthHeaders, firstName, speak])

  useEffect(() => {
    if (!open || kickedRef.current) return
    kickedRef.current = true
    send(KICKOFF, true)
  }, [open, send])

  useEffect(() => {
    if (open) return
    try { window.speechSynthesis?.cancel() } catch {}
    talkingRef.current = false
    try { recogRef.current?.stop() } catch {}
  }, [open])

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

  return (
    <>
      <div
        onClick={() => setOpen(o => !o)}
        title="Your AI study buddy"
        style={{
          position: 'fixed', bottom: 24, right: 24, width: 60, height: 60, borderRadius: '50%',
          background: `linear-gradient(135deg, ${accent}, ${accent2})`,
          boxShadow: `0 8px 26px ${accent}66`, cursor: 'pointer', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          animation: open ? 'none' : 'tbFloat 3.2s ease-in-out infinite',
        }}
      >
        {!open && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${accent}`, animation: 'tbRing 2.2s ease-out infinite' }} />}
        <span style={{ color: '#fff' }}>{open ? '×' : '🧑‍🏫'}</span>
        {!open && <span style={{ position: 'absolute', bottom: 4, right: 4, width: 12, height: 12, borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }} />}
      </div>

      {open && (
        <div style={{
          position: 'fixed', bottom: 96, right: 24, width: 'min(360px, calc(100vw - 32px))',
          height: 'min(560px, calc(100vh - 130px))', borderRadius: 20, overflow: 'hidden',
          background: 'var(--bg2, #ffffff)', border: '1px solid var(--border, rgba(15,23,42,.1))',
          boxShadow: '0 24px 70px rgba(15,23,42,.28)', zIndex: 999, display: 'flex',
          flexDirection: 'column', fontFamily: FONT, animation: 'tbPop .22s ease-out',
        }}>
          <div style={{ position: 'relative', height: 215, flexShrink: 0, background: `linear-gradient(160deg, ${accent}, ${accent2})` }}>
            <Canvas camera={{ position: [0, 1.55, 1.05], fov: 28 }} gl={{ alpha: true, antialias: true }} style={{ width: '100%', height: '100%' }}>
              <ambientLight intensity={0.9} />
              <directionalLight position={[2, 4, 3]} intensity={1.3} />
              <directionalLight position={[-2, 2, 2]} intensity={0.5} />
              <Suspense fallback={<Loader />}>
                <Avatar url={modelUrl} talkingRef={talkingRef} />
              </Suspense>
              <Rig />
            </Canvas>

            <div style={{ position: 'absolute', left: 14, bottom: 12, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,.4)' }}>
              <div style={{ fontWeight: 800, fontSize: 15, fontFamily: "'Sora', sans-serif" }}>Spark</div>
              <div style={{ fontSize: 11.5, opacity: .9 }}>{loading ? 'thinking...' : 'your study buddy'}</div>
            </div>
            <button onClick={toggleMute} title={muted ? 'Unmute voice' : 'Mute voice'}
              style={{ position: 'absolute', top: 10, right: 48, background: 'rgba(255,255,255,.25)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 14 }}>
              {muted ? '🔇' : '🔊'}
            </button>
            <button onClick={() => setOpen(false)} title="Close"
              style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,.25)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: '#fff' }}>×</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg, #f4f4f0)' }}>
            {messages.length === 0 && !loading && (
              <div style={{ textAlign: 'center', color: 'var(--text, #64748b)', fontSize: 12.5, padding: '20px 8px' }}>Hi {firstName}! Give me a second...</div>
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
              placeholder="Ask me anything..."
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