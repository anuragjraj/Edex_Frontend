/**
 * TalkingBuddy — a standing, life-like 3D human avatar that greets and talks.
 *
 * Tuned to a Ready-Player-Me style rig (full Oculus visemes + 8 body clips).
 *
 * REALISM SYSTEMS
 * ───────────────
 * 1. REAL LIP-SYNC.  Spoken text → phoneme→viseme timeline → matching mouth
 *    shapes. On Chrome/Edge the timeline re-anchors to live word-boundary
 *    events so the mouth stays locked to the audio. Optional perfect-sync path
 *    drives the jaw off real TTS waveform amplitude (see `synthesizeAudio`).
 *
 * 2. PROCEDURAL GESTURE LAYER (the important one).  The authored clips barely
 *    move the torso/head and leave the LEFT hand frozen, and they don't react
 *    to speech. So on TOP of the clip pose each frame we add:
 *      • torso / shoulder / neck sway + breathing (clips lack it)
 *      • living fingers on BOTH hands (the left one is static in the clip)
 *      • speech-driven "beat" accents — arms + wrists lift/flick on stressed
 *        syllables, alternating sides, so the hands move WITH the words.
 *    These are additive offsets applied after the mixer poses the skeleton,
 *    so the clip and the procedural layer cooperate instead of fighting.
 *
 * 3. PERSONA.  `audience="student"` → warm peer "buddy" (brighter, friendlier
 *    voice + casual tone). `audience="teacher"` → composed senior mentor
 *    (deeper, slower voice + professional tone). Affects BOTH the synthesized
 *    voice and the reply wording.
 *
 * REQUIRES:  npm install three @react-three/fiber @react-three/drei
 * USAGE:     {user && <TalkingBuddy user={user} audience="student" />}
 */

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useAnimations, Html, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

/* -----------------------------------------------------------------
   MODEL SETTINGS
   ----------------------------------------------------------------- */
const MODEL_URL = '/avatar.glb'
const TARGET_HEIGHT = 1.7
const MODEL_ROTATION_Y = 0       // set to Math.PI if the avatar faces AWAY

const DEFAULT_API =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:5000'

const SPEECH_MAX_CHARS = 240
const SPEECH_MAX_SENTENCES = 2

/* -----------------------------------------------------------------
   PERSONAS — voice + tone for each audience
   ----------------------------------------------------------------- */
const PERSONAS = {
  student: {
    pitch: 1.06, rate: 1.06,
    // bias TTS toward a brighter / younger-sounding male voice
    voiceMatch: /guy|mark|aaron|eric|ryan|james|google us english|liam/i,
    style:
      "\n\n[Speak like a friendly study buddy: warm, upbeat, casual peer tone. " +
      "Use simple everyday words and contractions, be encouraging, never lecture. " +
      "1-2 short sentences, under 35 words, no lists.]",
    label: 'Spark',
    sub: 'your study buddy',
    avatarEmoji: '🙂',
    kick:
      "Greet me by my first name in ONE short, warm, buddy-style sentence, then suggest " +
      "ONE fun thing to study next. Under 25 words, casual and friendly — like a quick hey.",
    quick: [
      { label: '📚 What now?', msg: "In one short, casual sentence, what should I study right now?" },
      { label: '🔥 Hype me up', msg: "Give me a quick, genuine one-line pep talk like a friend would." },
      { label: '🧠 Quiz me', msg: "Ask me ONE short, fun question to check my recent learning. Wait for my reply." },
    ],
  },
  teacher: {
    pitch: 0.88, rate: 0.98,
    // bias toward a deeper / more authoritative male voice
    voiceMatch: /daniel|david|rishi|brian|matthew|google uk english male|arthur|oliver/i,
    style:
      "\n\n[Speak like a respected senior mentor / lead educator: composed, " +
      "knowledgeable, professional and warm, but authoritative. Precise wording, " +
      "no slang or filler. 1-2 measured sentences, under 35 words, no lists.]",
    label: 'Mentor',
    sub: 'your teaching assistant',
    avatarEmoji: '🧑‍🏫',
    kick:
      "Greet me by my first name in ONE concise, professional, respectful sentence, then " +
      "note ONE specific thing worth focusing on next. Under 25 words — composed and warm.",
    quick: [
      { label: '📋 Focus today', msg: "In one concise sentence, what should I prioritise right now?" },
      { label: '🎯 Class idea', msg: "Suggest one effective teaching idea for my next session, in a single line." },
      { label: '📈 Quick check', msg: "Ask me ONE focused question to gauge where my class stands. Wait for my reply." },
    ],
  },
}

/* -----------------------------------------------------------------
   PHONEME → VISEME LIP-SYNC
   ----------------------------------------------------------------- */
const VISEME = {
  sil: { key: 'viseme_sil', jaw: 0.00 },
  PP:  { key: 'viseme_PP',  jaw: 0.00 },
  FF:  { key: 'viseme_FF',  jaw: 0.12 },
  TH:  { key: 'viseme_TH',  jaw: 0.14 },
  DD:  { key: 'viseme_DD',  jaw: 0.18 },
  kk:  { key: 'viseme_kk',  jaw: 0.20 },
  CH:  { key: 'viseme_CH',  jaw: 0.16 },
  SS:  { key: 'viseme_SS',  jaw: 0.12 },
  nn:  { key: 'viseme_nn',  jaw: 0.14 },
  RR:  { key: 'viseme_RR',  jaw: 0.18 },
  aa:  { key: 'viseme_aa',  jaw: 0.55 },
  E:   { key: 'viseme_E',   jaw: 0.32 },
  I:   { key: 'viseme_I',   jaw: 0.26 },
  O:   { key: 'viseme_O',   jaw: 0.42 },
  U:   { key: 'viseme_U',   jaw: 0.30 },
}
const ALL_VISEME_KEYS = Object.values(VISEME).map(v => v.key)
const VOWELS = new Set(['aa', 'E', 'I', 'O', 'U'])

function wordToVisemes(word) {
  const out = []
  const s = word.toLowerCase()
  for (let i = 0; i < s.length; i++) {
    const c = s[i], c2 = s.slice(i, i + 2)
    if (c2 === 'th') { out.push('TH'); i++; continue }
    if (c2 === 'ch' || c2 === 'sh') { out.push('CH'); i++; continue }
    if (c2 === 'ph') { out.push('FF'); i++; continue }
    if (c2 === 'ng') { out.push('nn'); i++; continue }
    if (c2 === 'qu') { out.push('kk'); out.push('U'); i++; continue }
    if (c2 === 'ck') { out.push('kk'); i++; continue }
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
    else if ('sz'.includes(c)) out.push('SS')
    else if (c === 'j') out.push('CH')
    else if (c === 'r') out.push('RR')
    else if (c === 'h') out.push('aa')
  }
  if (!out.length) out.push('aa')
  return out
}

function buildVisemeTimeline(text, rate = 1) {
  const seq = []
  const re = /[A-Za-zÀ-ÿ']+|[.,!?;:]+|\s+/g
  let m
  const base = 0.072 / rate
  const vowelMul = 1.7
  while ((m = re.exec(text)) !== null) {
    const tok = m[0]; const ci = m.index
    if (/^\s+$/.test(tok)) { seq.push({ code: 'sil', ci, dur: 0.05 / rate, stressed: false }); continue }
    if (/^[.,!?;:]+$/.test(tok)) { seq.push({ code: 'sil', ci, dur: 0.16 / rate, stressed: false }); continue }
    const vis = wordToVisemes(tok)
    // mark the first vowel of each word as "stressed" → drives a gesture beat
    let firstVowelMarked = false
    vis.forEach((code, k) => {
      const isV = VOWELS.has(code)
      const stressed = isV && !firstVowelMarked
      if (stressed) firstVowelMarked = true
      const dur = base * (isV ? vowelMul : 1)
      seq.push({ code, ci: ci + Math.min(k, tok.length - 1), dur, stressed })
    })
  }
  if (!seq.length) seq.push({ code: 'sil', ci: 0, dur: 0.2, stressed: false })
  return seq
}

/* -----------------------------------------------------------------
   helpers
   ----------------------------------------------------------------- */
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
function lerp(a, b, t) { return a + (b - a) * t }

// shared temporaries for additive bone math (avoid per-frame allocation)
const _e = new THREE.Euler()
const _q = new THREE.Quaternion()
function addRot(bone, x, y, z) {
  if (!bone) return
  _e.set(x, y, z, 'XYZ')
  _q.setFromEuler(_e)
  bone.quaternion.multiply(_q)
}

/* -----------------------------------------------------------------
   THE 3D AVATAR
   ----------------------------------------------------------------- */
function Avatar({ url, speechRef, gestureRef }) {
  const group = useRef()
  const { scene, animations } = useGLTF(url, true)

  // strip baked MOUTH morph tracks → mixer drives bones only; we own the face
  const boneClips = useMemo(() => animations.map(clip => {
    const c = clip.clone()
    c.tracks = c.tracks.filter(tr => !/\.morphTargetInfluences/.test(tr.name))
    return c
  }), [animations])

  const { actions } = useAnimations(boneClips, group)

  const clipMap = useMemo(() => {
    const names = Object.keys(actions)
    const find = (re, avoid) => names.find(n => re.test(n) && (!avoid || !avoid.test(n)))
    return {
      idle:  find(/idle|breath/i) || names[0],
      talk:  find(/talk.*(hands|body|lip)/i, /walk|fast|preview/i) || find(/talk/i, /walk|preview/i),
      wave:  find(/wave|greet/i),
      walk:  find(/walk.*in.*place|in_place/i) || find(/walk/i, /forward|rootmotion/i),
    }
  }, [actions])

  const meshesRef = useRef([])
  const dictRef = useRef([])
  const curRef = useRef({})
  const bonesRef = useRef({})
  const blinkRef = useRef({ t: 0, next: 1.6 + Math.random() * 3 })
  const saccadeRef = useRef({ t: 0, next: 2 + Math.random() * 4, x: 0, y: 0, tx: 0, ty: 0 })
  const visRef = useRef({ smile: 0.18, jaw: 0, brow: 0, browTarget: 0 })
  // gesture signal state
  const gestRef = useRef({ energy: 0, lead: 0, accL: 0, accR: 0, lastIdx: -1, headTilt: 0, headTiltT: 0, headTiltNext: 4 })

  const animRef = useRef({ current: null, mode: 'idle', nextSwap: 0, waving: false, walkUntil: 0 })

  /* setup: scale, recenter, collect morph meshes + bones */
  useEffect(() => {
    let box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3(); box.getSize(size)
    scene.scale.setScalar(TARGET_HEIGHT / (size.y || 1))
    box = new THREE.Box3().setFromObject(scene)
    const center = new THREE.Vector3(); box.getCenter(center)
    scene.position.x -= center.x
    scene.position.z -= center.z
    scene.position.y -= box.min.y

    const meshes = [], dicts = [], bones = {}
    scene.traverse(o => {
      if (o.isMesh && o.morphTargetDictionary) { meshes.push(o); dicts.push(o.morphTargetDictionary) }
      if (o.isMesh) { o.castShadow = true; o.frustumCulled = false }
      if (o.isBone) bones[o.name] = o
    })
    meshesRef.current = meshes
    dictRef.current = dicts
    bonesRef.current = bones
  }, [scene])

  useEffect(() => {
    const a = animRef.current
    const idle = actions[clipMap.idle]
    if (idle) { idle.reset().fadeIn(0.4).play(); a.current = idle; a.mode = 'idle' }
    return () => idle && idle.fadeOut(0.3)
  }, [actions, clipMap])

  const transition = useCallback((name, fade = 0.45, opts = {}) => {
    const a = animRef.current
    const next = actions[name]
    if (!next || next === a.current) return
    if (opts.once) { next.setLoop(THREE.LoopOnce, 1); next.clampWhenFinished = true }
    else { next.setLoop(THREE.LoopRepeat, Infinity); next.clampWhenFinished = false }
    next.reset(); next.setEffectiveWeight(1); next.fadeIn(fade).play()
    if (a.current && a.current !== next) a.current.fadeOut(fade)
    a.current = next
  }, [actions])

  const setMorph = useCallback((name, value) => {
    const meshes = meshesRef.current, dicts = dictRef.current
    for (let i = 0; i < meshes.length; i++) {
      const idx = dicts[i][name]
      if (idx !== undefined) meshes[i].morphTargetInfluences[idx] = value
    }
  }, [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const d = Math.min(1, delta * 14)
    const sp = speechRef.current
    const speaking = sp && sp.active
    const a = animRef.current
    const g = gestRef.current

    /* ===== BODY clip state machine (kept simple; procedural layer adds life) ===== */
    if (gestureRef.current === 'wave' && clipMap.wave && !a.waving) {
      gestureRef.current = null
      a.waving = true
      transition(clipMap.wave, 0.25, { once: true })
      const wa = actions[clipMap.wave]
      const onFin = () => {
        a.waving = false
        wa.getMixer().removeEventListener('finished', onFin)
        transition(speaking ? clipMap.talk || clipMap.idle : clipMap.idle, 0.4)
        a.mode = speaking ? 'talk' : 'idle'
      }
      wa.getMixer().addEventListener('finished', onFin)
    }
    if (!a.waving) {
      if (speaking) {
        if (a.mode !== 'talk' && a.mode !== 'walk') {
          transition(clipMap.talk || clipMap.idle, 0.45); a.mode = 'talk'; a.nextSwap = t + 5 + Math.random() * 4
        }
        // occasional short walk-in-place beat (weight shift); rare so it reads natural
        if (t > a.nextSwap) {
          if (clipMap.walk && Math.random() < 0.5 && a.mode === 'talk') {
            transition(clipMap.walk, 0.5); a.mode = 'walk'; a.walkUntil = t + 1.8 + Math.random() * 1.2
          }
          a.nextSwap = t + 6 + Math.random() * 5
        }
        if (a.mode === 'walk' && t > a.walkUntil) { transition(clipMap.talk || clipMap.idle, 0.5); a.mode = 'talk' }
      } else if (a.mode !== 'idle') {
        transition(clipMap.idle, 0.5); a.mode = 'idle'
      }
    }

    /* ===== FACE: visemes / blink / brows / smile ===== */
    const v = visRef.current
    let targetJaw = 0, activeVisemeKey = 'viseme_sil', beat = false
    if (speaking && sp.seq && sp.seq.length) {
      let idx = sp.syncIdx, acc = sp.syncTime
      while (idx < sp.seq.length - 1 && acc + sp.seq[idx].dur < t) { acc += sp.seq[idx].dur; idx++ }
      sp.idx = idx
      const cur = sp.seq[idx]
      const vinfo = VISEME[cur.code] || VISEME.sil
      activeVisemeKey = vinfo.key
      const amp = sp.amp ? sp.amp() : null
      targetJaw = amp != null ? Math.max(vinfo.jaw * 0.4, amp) : vinfo.jaw * (0.85 + Math.random() * 0.3)
      v.browTarget = VOWELS.has(cur.code) ? 0.22 : 0.05
      // detect a fresh stressed syllable → fire a gesture beat
      if (idx !== g.lastIdx) {
        if (cur.stressed) beat = true
        g.lastIdx = idx
      }
    } else {
      v.browTarget = 0
    }

    v.jaw = lerp(v.jaw, targetJaw, d * 1.6)
    for (const key of ALL_VISEME_KEYS) {
      const cur = curRef.current[key] || 0
      const tgt = key === activeVisemeKey ? 1 : 0
      const nv = lerp(cur, tgt, d * (key === activeVisemeKey ? 1.7 : 1.1))
      curRef.current[key] = nv
      setMorph(key, nv * Math.max(0.5, v.jaw * 1.4 + 0.2))
    }
    setMorph('jawOpen', v.jaw)
    setMorph('mouthOpen', v.jaw * 0.5)

    const smileTarget = speaking ? 0.30 : 0.20 + Math.sin(t * 0.3) * 0.03
    v.smile = lerp(v.smile, smileTarget, d * 0.5)
    setMorph('mouthSmile', v.smile); setMorph('mouthSmileLeft', v.smile); setMorph('mouthSmileRight', v.smile)

    v.brow = lerp(v.brow, v.browTarget, d * 0.8)
    setMorph('browInnerUp', v.brow); setMorph('browOuterUpLeft', v.brow * 0.7); setMorph('browOuterUpRight', v.brow * 0.7)

    const b = blinkRef.current
    b.t += delta
    if (b.t > b.next) { b.t = 0; b.next = 1.6 + Math.random() * 3.6 }
    const bv = b.t < 0.06 ? b.t / 0.06 : b.t < 0.14 ? 1 - (b.t - 0.06) / 0.08 : 0
    setMorph('eyeBlinkLeft', bv); setMorph('eyeBlinkRight', bv)

    const sc = saccadeRef.current
    sc.t += delta
    if (sc.t > sc.next) { sc.t = 0; sc.next = 1.5 + Math.random() * 3.5; sc.tx = (Math.random() - 0.5) * 0.5; sc.ty = (Math.random() - 0.5) * 0.3 }
    sc.x = lerp(sc.x, sc.tx, d * 0.4); sc.y = lerp(sc.y, sc.ty, d * 0.4)
    setMorph('eyesLookUp', Math.max(0, sc.y)); setMorph('eyesLookDown', Math.max(0, -sc.y))

    /* ===== PROCEDURAL GESTURE LAYER (additive, applied AFTER the mixer) =====
       Adds the motion the clips lack: torso/shoulder/neck sway, breathing,
       living fingers, and speech-synced arm/wrist beats on stressed syllables. */
    // energy envelope
    const ampNow = (speaking && sp.amp) ? sp.amp() : null
    const baseEnergy = speaking ? (ampNow != null ? Math.min(1, ampNow * 1.3 + 0.25) : 0.45) : 0
    g.energy = lerp(g.energy, baseEnergy, d * 0.5)
    if (beat) {
      g.lead = g.lead ? 0 : 1            // alternate the leading hand
      if (g.lead) g.accR = 1; else g.accL = 1
      g.energy = Math.min(1, g.energy + 0.5)
    }
    g.accL *= Math.max(0, 1 - delta * 4.5)  // beat accents decay quickly
    g.accR *= Math.max(0, 1 - delta * 4.5)

    const B = bonesRef.current
    const E = g.energy
    // slow organic oscillators
    const s1 = Math.sin(t * 0.9), s2 = Math.sin(t * 0.55 + 1.3), s3 = Math.sin(t * 1.7 + 0.6)
    const breath = Math.sin(t * 1.1) * 0.012      // chest breathing

    // torso sway (distributed up the spine) — bigger while talking
    const swayAmt = 0.015 + E * 0.03
    addRot(B.Spine,  breath + s2 * 0.006,           s1 * swayAmt * 0.4, s2 * swayAmt)
    addRot(B.Spine1, breath * 0.6 + E * 0.02,       s1 * swayAmt * 0.5, s2 * swayAmt * 0.8)
    addRot(B.Spine2, E * 0.025,                      s1 * swayAmt * 0.6, s3 * swayAmt * 0.6)

    // shoulders lift slightly with energy + their accent
    addRot(B.LeftShoulder,  -g.accL * 0.08, 0,  g.accL * 0.10 + E * 0.02)
    addRot(B.RightShoulder, -g.accR * 0.08, 0, -g.accR * 0.10 - E * 0.02)

    // arms: idle drift + a "beat" raise/open on the leading side
    addRot(B.LeftArm,   s2 * 0.03 - g.accL * 0.22, g.accL * 0.10,  g.accL * 0.14 + E * 0.03)
    addRot(B.RightArm,  s1 * 0.03 - g.accR * 0.22, -g.accR * 0.10, -g.accR * 0.14 - E * 0.03)
    // forearms gesticulate outward on the beat
    addRot(B.LeftForeArm,  -g.accL * 0.28, g.accL * 0.22, s3 * 0.03)
    addRot(B.RightForeArm, -g.accR * 0.28, -g.accR * 0.22, s2 * 0.03)
    // wrists flick
    addRot(B.LeftHand,  g.accL * 0.18, 0, g.accL * 0.20 + s1 * 0.02)
    addRot(B.RightHand, g.accR * 0.18, 0, -g.accR * 0.20 - s1 * 0.02)

    // LIVING FINGERS — the clip leaves the LEFT hand frozen, so give both life.
    // gentle resting curl that breathes, opening a touch on emphasis.
    const fingersL = ['LeftHandIndex', 'LeftHandMiddle', 'LeftHandRing', 'LeftHandPinky']
    const fingersR = ['RightHandIndex', 'RightHandMiddle', 'RightHandRing', 'RightHandPinky']
    const curlBase = 0.16 + Math.sin(t * 0.9) * 0.03
    const openL = g.accL * 0.18, openR = g.accR * 0.18
    fingersL.forEach((f, i) => {
      const c = curlBase - openL + i * 0.015
      addRot(B[f + '1'], 0, 0,  c)
      addRot(B[f + '2'], 0, 0,  c * 0.8)
      addRot(B[f + '3'], 0, 0,  c * 0.6)
    })
    fingersR.forEach((f, i) => {     // right hand already animates, so lighter touch
      const c = (curlBase - openR) * 0.5 + i * 0.01
      addRot(B[f + '1'], 0, 0, -c)
      addRot(B[f + '2'], 0, 0, -c * 0.8)
    })
    addRot(B.LeftHandThumb1, 0, -curlBase * 0.5, 0)
    addRot(B.RightHandThumb1, 0, curlBase * 0.3, 0)

    // head: counter-sway, small nods on emphasis, occasional curious tilt
    g.headTiltT += delta
    if (g.headTiltT > g.headTiltNext) { g.headTiltT = 0; g.headTiltNext = 4 + Math.random() * 6; g.headTilt = (Math.random() - 0.5) * 0.12 }
    addRot(B.Neck, -E * 0.03 - (g.accL + g.accR) * 0.04, -s1 * swayAmt * 0.3, g.headTilt * 0.4)
    addRot(B.Head, -E * 0.02 + s3 * 0.012, -s1 * swayAmt * 0.4 + sc.x * 0.12, g.headTilt * 0.6)
  })

  return (
    <group ref={group} rotation={[0, MODEL_ROTATION_Y, 0]}>
      <primitive object={scene} />
    </group>
  )
}

function Rig() {
  const { camera } = useThree()
  useFrame(() => camera.lookAt(0, 0.92, 0))
  return null
}
function Loader() {
  return (
    <Html center>
      <div style={{ width: 26, height: 26, border: '3px solid rgba(99,102,241,.3)', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'tbSpin .8s linear infinite' }} />
    </Html>
  )
}

const BREVITY = "\n\n[Reply in 1-2 short sentences, under 35 words. No lists.]"

export default function TalkingBuddy({
  user,
  audience,                  // 'student' | 'teacher' (auto-detected from user if omitted)
  apiUrl = DEFAULT_API,
  getAuthHeaders = defaultHeaders,
  modelUrl = MODEL_URL,
  accent = '#6366F1',
  accent2 = '#8B5CF6',
  synthesizeAudio = null,    // optional async (text) => Blob|ArrayBuffer|url  → perfect lip-sync
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

  const bottomRef = useRef(null)
  const msgsRef = useRef([])
  const greetedRef = useRef(false)
  const recogRef = useRef(null)
  const mutedRef = useRef(false)
  const bubbleTimer = useRef(null)

  const speechRef = useRef({ active: false, seq: null, idx: 0, syncIdx: 0, syncTime: 0, amp: null })
  const gestureRef = useRef(null)
  const audioCtxRef = useRef(null)

  useEffect(() => { injectStyles() }, [])
  useEffect(() => { msgsRef.current = messages }, [messages])
  useEffect(() => { mutedRef.current = muted }, [muted])
  useEffect(() => { if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, open, loading])
  useEffect(() => {
    const fn = () => setIsNarrow(window.innerWidth < 640)
    fn(); window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const pickVoice = useCallback(() => {
    const synth = window.speechSynthesis
    if (!synth) return null
    const voices = synth.getVoices() || []
    const FEMALE = /female|samantha|zira|aria|jenny|salli|joanna|kendra|tessa|veena|raveena/i
    return (
      voices.find(v => persona.voiceMatch.test(v.name)) ||                       // persona-preferred voice
      voices.find(v => /\bmale\b|david|daniel|alex|fred|rishi|guy/i.test(v.name)) ||
      voices.find(v => /google (uk|us) english/i.test(v.name) && !FEMALE.test(v.name)) ||
      voices.find(v => (v.lang || '').toLowerCase().startsWith('en') && !FEMALE.test(v.name)) ||
      voices.find(v => (v.lang || '').toLowerCase().startsWith('en')) ||
      null
    )
  }, [persona])

  const showBubble = useCallback((text) => {
    setBubble(text)
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current)
    bubbleTimer.current = setTimeout(() => setBubble(''), 9000)
  }, [])

  const startVisemes = useCallback((text, ampFn = null) => {
    speechRef.current = {
      active: true, seq: buildVisemeTimeline(text, persona.rate), idx: 0,
      syncIdx: 0, syncTime: performance.now() / 1000, amp: ampFn,
    }
  }, [persona.rate])
  const stopVisemes = useCallback(() => { const s = speechRef.current; s.active = false; s.amp = null }, [])
  const syncToBoundary = useCallback((charIndex) => {
    const s = speechRef.current
    if (!s.active || !s.seq) return
    let idx = s.seq.findIndex(v => v.ci >= charIndex)
    if (idx < 0) idx = s.seq.length - 1
    s.syncIdx = idx; s.syncTime = performance.now() / 1000
  }, [])

  const speakWithSynth = useCallback((text) => {
    try {
      const synth = window.speechSynthesis
      if (!synth) return
      synth.cancel()
      const say = () => {
        const u = new SpeechSynthesisUtterance(text)
        u.rate = persona.rate; u.pitch = persona.pitch
        const v = pickVoice(); if (v) u.voice = v
        u.onstart = () => startVisemes(text)
        u.onboundary = (e) => { if (typeof e.charIndex === 'number') syncToBoundary(e.charIndex) }
        u.onend = () => stopVisemes()
        u.onerror = () => stopVisemes()
        synth.speak(u)
      }
      if (!synth.getVoices().length) { synth.onvoiceschanged = () => { synth.onvoiceschanged = null; say() }; setTimeout(say, 250) }
      else say()
    } catch { stopVisemes() }
  }, [pickVoice, persona, startVisemes, stopVisemes, syncToBoundary])

  const speakWithAudio = useCallback(async (text, source) => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx()
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') await ctx.resume()
      let buf
      if (source instanceof Blob) buf = await source.arrayBuffer()
      else if (source instanceof ArrayBuffer) buf = source
      else if (typeof source === 'string') buf = await (await fetch(source)).arrayBuffer()
      const audioBuf = await ctx.decodeAudioData(buf)
      const src = ctx.createBufferSource(); src.buffer = audioBuf
      const analyser = ctx.createAnalyser(); analyser.fftSize = 512
      const data = new Uint8Array(analyser.frequencyBinCount)
      src.connect(analyser); analyser.connect(ctx.destination)
      const ampFn = () => {
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) { const x = (data[i] - 128) / 128; sum += x * x }
        return Math.min(1, Math.sqrt(sum / data.length) * 3.2)
      }
      startVisemes(text, ampFn)
      src.onended = () => stopVisemes()
      src.start()
    } catch { speakWithSynth(text) }
  }, [startVisemes, stopVisemes, speakWithSynth])

  const speak = useCallback(async (rawText) => {
    const text = shortenForSpeech(rawText)
    showBubble(text)
    if (mutedRef.current || !text) return
    if (synthesizeAudio) {
      try { const src = await synthesizeAudio(text); if (src) { await speakWithAudio(text, src); return } } catch {}
    }
    speakWithSynth(text)
  }, [showBubble, synthesizeAudio, speakWithAudio, speakWithSynth])

  const send = useCallback(async (textOverride, hidden = false) => {
    const text = (textOverride ?? input).trim()
    if (!text || loading) return
    if (!hidden) setMessages(m => [...m, { role: 'user', content: text }])
    setInput(''); setLoading(true)
    try {
      const r = await fetch(`${apiUrl}/api/buddy/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: text + persona.style + BREVITY, sessionMessages: msgsRef.current.slice(-8) }),
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
  }, [input, loading, apiUrl, getAuthHeaders, firstName, speak, persona])

  useEffect(() => {
    if (greetedRef.current) return
    greetedRef.current = true
    const t = setTimeout(() => { gestureRef.current = 'wave'; send(persona.kick, true) }, 1200)
    return () => clearTimeout(t)
  }, [send, persona])

  function toggleMute() {
    setMuted(m => {
      if (!m) { try { window.speechSynthesis?.cancel() } catch {}; stopVisemes() }
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
      recogRef.current = r; setListening(true); r.start()
    } catch { setListening(false) }
  }
  const micSupported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

  const renderMd = (s = '') =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
     .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')

  const FONT = "'Nunito', system-ui, sans-serif"
  const stageW = isNarrow ? 150 : 210
  const stageH = isNarrow ? 300 : 400

  return (
    <>
      <div style={{ position: 'fixed', right: isNarrow ? 4 : 18, bottom: 0, width: stageW, height: stageH, zIndex: 1000, pointerEvents: 'none' }}>
        {bubble && (
          <div style={{
            position: 'absolute', bottom: stageH - 18, left: '50%', transform: 'translateX(-50%)',
            width: isNarrow ? 200 : 250, maxWidth: '78vw', background: '#fff', color: '#1e293b', borderRadius: 14,
            padding: '10px 13px', fontSize: 13, lineHeight: 1.55, fontFamily: FONT,
            boxShadow: '0 12px 34px rgba(15,23,42,.22)', border: '1px solid rgba(15,23,42,.08)',
            animation: 'tbBub .25s ease-out', pointerEvents: 'auto',
          }}>
            {bubble}
            <span style={{ position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 14, height: 14, background: '#fff', borderRight: '1px solid rgba(15,23,42,.08)', borderBottom: '1px solid rgba(15,23,42,.08)' }} />
          </div>
        )}

        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0.95, 3.25], fov: 30 }}
          gl={{ alpha: true, antialias: true }} style={{ width: '100%', height: '100%', background: 'transparent' }}>
          <ambientLight intensity={0.85} />
          <hemisphereLight intensity={0.5} groundColor={'#b9b9c9'} />
          <directionalLight position={[2.5, 4, 3]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
          <directionalLight position={[-2.5, 2, 1.5]} intensity={0.5} />
          <Suspense fallback={<Loader />}>
            <Avatar url={modelUrl} speechRef={speechRef} gestureRef={gestureRef} />
            <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={3} blur={2.4} far={2} resolution={512} color="#1e293b" />
          </Suspense>
          <Rig />
        </Canvas>

        <button onClick={toggleMute} title={muted ? 'Unmute voice' : 'Mute voice'}
          style={{ position: 'absolute', top: 4, right: 0, width: 30, height: 30, borderRadius: 9, background: 'rgba(255,255,255,.92)', border: '1px solid rgba(15,23,42,.1)', cursor: 'pointer', fontSize: 13, pointerEvents: 'auto', boxShadow: '0 2px 8px rgba(15,23,42,.12)' }}>
          {muted ? '🔇' : '🔊'}
        </button>

        {!open && (
          <button onClick={() => setOpen(true)}
            style={{ position: 'absolute', bottom: isNarrow ? 26 : 34, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', padding: '8px 15px', borderRadius: 24, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${accent}, ${accent2})`, color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 12.5, boxShadow: `0 6px 18px ${accent}55`, animation: 'tbPulse 2.4s infinite' }}>
            💬 Chat with me
            <span style={{ position: 'absolute', top: -5, right: -5, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }} />
          </button>
        )}
      </div>

      {open && (
        <div style={{
          position: 'fixed', zIndex: 1001, display: 'flex', flexDirection: 'column',
          ...(isNarrow ? { left: 12, right: 12, bottom: stageH - 16, maxHeight: 'calc(100vh - 320px)' }
            : { right: stageW + 28, bottom: 24, width: 350, height: 'min(500px, calc(100vh - 120px))' }),
          borderRadius: 18, overflow: 'hidden', fontFamily: FONT, animation: 'tbPop .22s ease-out',
          background: 'var(--bg2, #ffffff)', border: '1px solid var(--border, rgba(15,23,42,.1))', boxShadow: '0 24px 70px rgba(15,23,42,.28)',
        }}>
          <div style={{ flexShrink: 0, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, background: `linear-gradient(135deg, ${accent}, ${accent2})` }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>{persona.avatarEmoji}</div>
            <div style={{ flex: 1, minWidth: 0, color: '#fff' }}>
              <div style={{ fontWeight: 800, fontSize: 15, fontFamily: "'Sora', sans-serif" }}>{persona.label}</div>
              <div style={{ fontSize: 11.5, opacity: .9 }}>{loading ? 'thinking…' : persona.sub}</div>
            </div>
            <button onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'} style={{ background: 'rgba(255,255,255,.22)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 14 }}>{muted ? '🔇' : '🔊'}</button>
            <button onClick={() => setOpen(false)} title="Close" style={{ background: 'rgba(255,255,255,.22)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: '#fff' }}>×</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg, #f4f4f0)' }}>
            {messages.length === 0 && !loading && (
              <div style={{ textAlign: 'center', color: 'var(--text, #64748b)', fontSize: 12.5, padding: '20px 8px' }}>Hi {firstName}! Ask me anything.</div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '9px 13px', fontSize: 13.5, lineHeight: 1.6,
                  borderRadius: m.role === 'user' ? '13px 4px 13px 13px' : '4px 13px 13px 13px',
                  background: m.role === 'user' ? `linear-gradient(135deg, ${accent}, ${accent2})` : 'var(--bg2, #fff)',
                  color: m.role === 'user' ? '#fff' : 'var(--text-h, #1e293b)',
                  border: m.role === 'assistant' ? '1px solid var(--border, rgba(15,23,42,.1))' : 'none',
                }} dangerouslySetInnerHTML={{ __html: renderMd(m.content) }} />
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
              {persona.quick.map(q => (
                <button key={q.label} onClick={() => send(q.msg)} disabled={loading}
                  style={{ fontSize: 11.5, padding: '5px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: FONT, fontWeight: 700, border: `1px solid ${accent}44`, background: `${accent}12`, color: accent }}>
                  {q.label}
                </button>
              ))}
            </div>
          )}

          <div style={{ flexShrink: 0, padding: 10, borderTop: '1px solid var(--border, rgba(15,23,42,.1))', display: 'flex', gap: 7, background: 'var(--bg2, #fff)' }}>
            {micSupported && (
              <button onClick={toggleMic} title="Speak"
                style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid var(--border, rgba(15,23,42,.1))', background: listening ? `${accent}22` : 'transparent', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>
                {listening ? '🔴' : '🎤'}
              </button>
            )}
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask me anything…" disabled={loading}
              style={{ flex: 1, padding: '9px 13px', borderRadius: 10, border: '1px solid var(--border, rgba(15,23,42,.1))', background: 'var(--code-bg, rgba(15,23,42,.035))', color: 'var(--text-h, #1e293b)', fontSize: 13.5, fontFamily: FONT, outline: 'none' }} />
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

useGLTF.preload(MODEL_URL)