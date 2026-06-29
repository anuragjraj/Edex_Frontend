/**
 * TalkingBuddy — a standing/seated, life-like 3D human avatar that greets and talks.
 *
 * MOTION MODEL (rewritten for stability)
 * ──────────────────────────────────────
 * The animation clips don't keyframe the shoulders or legs at all, and reuse one
 * canned arm loop. Nudging those bones additively made them DRIFT (accumulate),
 * which looked disoriented. So now:
 *
 *   • The whole UPPER-LIMB + FINGER chain and the LEGS are OWNED procedurally:
 *     every frame we reset each bone to its captured rest pose, then pose it.
 *     This is deterministic — it can never accumulate or fight the clip.
 *   • The mixer still drives the spine / neck / head / hips for breathing + presence
 *     (those ARE keyframed, so a small additive sway there is safe).
 *
 * BEHAVIOUR
 *   • Movement ONLY while speaking: speech-synced arm/wrist "beats" on stressed
 *     syllables (alternating sides), a soft body sway, and a 1–2 cm lateral shift.
 *   • At rest (student is studying): he SITS on a stool and goes calm/still, then
 *     stands up to talk and sits back down when finished. Set restMode="stand"
 *     to keep him standing calmly instead.
 *   • Speaks the FULL reply (no truncation), lip-synced to the words.
 *   • Persona: audience="student" (warm buddy voice/tone) | "teacher" (senior mentor).
 *
 * REQUIRES:  npm install three @react-three/fiber @react-three/drei
 * USAGE:     {user && <TalkingBuddy user={user} audience="student" restMode="sit" />}
 */

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useAnimations, Html, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

/* -----------------------------------------------------------------
   SETTINGS
   ----------------------------------------------------------------- */
const MODEL_URL = '/avatar.glb'
const TARGET_HEIGHT = 1.7
const MODEL_ROTATION_Y = 0          // set to Math.PI if the avatar faces AWAY

const LATERAL = 0.02                // max sideways shift while speaking (~2 cm)

// --- seated pose (tune these if the legs bend the wrong way) ---
const SIT_DROP = 0.45               // how far the hips drop when seated (metres)
const SIT_HIP  = -1.5               // thigh flexion (flip sign if knees point up)
const SIT_KNEE =  1.5               // knee flexion  (flip sign if shins kick forward)
const STOOL_SEAT_Y = 0.47           // stool seat height (≈ seated hip height)

const DEFAULT_API =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:5000'

/* -----------------------------------------------------------------
   PERSONAS — voice + tone per audience
   ----------------------------------------------------------------- */
const PERSONAS = {
  student: {
    pitch: 0.94, rate: 1.0,
    voiceMatch: /guy|mark|aaron|eric|ryan|james|google us english|liam/i,
    style:
      "\n\n[Speak like a friendly study buddy: warm, upbeat, casual peer tone, simple " +
      "everyday words and contractions, encouraging, never lecture. Keep it natural.]",
    label: 'Spark', sub: 'your study buddy', avatarEmoji: '🙂',
    kick: "Greet me by my first name in ONE short, warm, buddy-style sentence, then suggest ONE fun thing to study next. Casual and friendly.",
    quick: [
      { label: '📚 What now?', msg: "What should I study right now? Keep it short and casual." },
      { label: '🔥 Hype me up', msg: "Give me a quick, genuine pep talk like a friend would." },
      { label: '🧠 Quiz me', msg: "Ask me ONE short, fun question to check my recent learning. Wait for my reply." },
    ],
  },
  teacher: {
    pitch: 0.84, rate: 0.95,
    voiceMatch: /daniel|david|rishi|brian|matthew|google uk english male|arthur|oliver/i,
    style:
      "\n\n[Speak like a respected senior mentor / lead educator: composed, knowledgeable, " +
      "professional and warm but authoritative, precise wording, no slang or filler.]",
    label: 'Mentor', sub: 'your teaching assistant', avatarEmoji: '🧑‍🏫',
    kick: "Greet me by my first name in ONE concise, professional, respectful sentence, then note ONE specific thing worth focusing on next.",
    quick: [
      { label: '📋 Focus today', msg: "What should I prioritise right now? One concise line." },
      { label: '🎯 Class idea', msg: "Suggest one effective teaching idea for my next session." },
      { label: '📈 Quick check', msg: "Ask me ONE focused question to gauge where my class stands. Wait for my reply." },
    ],
  },
}

/* -----------------------------------------------------------------
   PHONEME → VISEME LIP-SYNC
   ----------------------------------------------------------------- */
const VISEME = {
  sil:{key:'viseme_sil',jaw:0}, PP:{key:'viseme_PP',jaw:0}, FF:{key:'viseme_FF',jaw:.12},
  TH:{key:'viseme_TH',jaw:.14}, DD:{key:'viseme_DD',jaw:.18}, kk:{key:'viseme_kk',jaw:.20},
  CH:{key:'viseme_CH',jaw:.16}, SS:{key:'viseme_SS',jaw:.12}, nn:{key:'viseme_nn',jaw:.14},
  RR:{key:'viseme_RR',jaw:.18}, aa:{key:'viseme_aa',jaw:.55}, E:{key:'viseme_E',jaw:.32},
  I:{key:'viseme_I',jaw:.26},   O:{key:'viseme_O',jaw:.42},  U:{key:'viseme_U',jaw:.30},
}
const ALL_VISEME_KEYS = Object.values(VISEME).map(v => v.key)
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
  if (typeof document === 'undefined' || document.getElementById('tb3d-styles')) return
  const s = document.createElement('style'); s.id = 'tb3d-styles'
  s.textContent = `
    @keyframes tbPop{from{opacity:0;transform:scale(.85) translateY(12px)}to{opacity:1;transform:none}}
    @keyframes tbBub{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:none}}
    @keyframes tbDot{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
    @keyframes tbSpin{to{transform:rotate(360deg)}}
    @keyframes tbPulse{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.45)}70%{box-shadow:0 0 0 12px rgba(99,102,241,0)}}
  `
  document.head.appendChild(s)
}
function lerp(a, b, t) { return a + (b - a) * t }

const _e = new THREE.Euler(), _q = new THREE.Quaternion()

/* -----------------------------------------------------------------
   THE 3D AVATAR
   ----------------------------------------------------------------- */
function Avatar({ url, speechRef, gestureRef, restMode }) {
  const group = useRef()
  const { scene, animations } = useGLTF(url, true)

  // mixer drives bones only — we own the entire face (synced to live speech)
  const boneClips = useMemo(() => animations.map(c => {
    const cc = c.clone(); cc.tracks = cc.tracks.filter(tr => !/\.morphTargetInfluences/.test(tr.name)); return cc
  }), [animations])
  const { actions } = useAnimations(boneClips, group)

  const clipMap = useMemo(() => {
    const names = Object.keys(actions)
    const find = (re, avoid) => names.find(n => re.test(n) && (!avoid || !avoid.test(n)))
    return {
      idle: find(/idle|breath/i) || names[0],
      talk: find(/talk.*(hands|body|lip)/i, /walk|fast|preview/i) || find(/talk/i, /walk|preview/i),
      wave: find(/wave|greet/i),
    }
  }, [actions])

  const meshesRef = useRef([]); const dictRef = useRef([])
  const curRef = useRef({}); const boneRef = useRef({}); const restRef = useRef({})
  const blinkRef = useRef({ t:0, next:1.6+Math.random()*3 })
  const saccadeRef = useRef({ t:0, next:2+Math.random()*4, x:0, y:0, tx:0, ty:0 })
  const visRef = useRef({ smile:.18, jaw:0, brow:0, browTarget:0 })
  const gRef = useRef({ energy:0, lead:0, accL:0, accR:0, lastIdx:-1, sit:1, headTilt:0, htT:0, htN:4 })
  const latRef = useRef({ x:0, tx:0, t:0, next:1.5 })
  const animRef = useRef({ current:null, mode:'idle', waving:false })

  // bones we fully own (reset→pose each frame)
  const OWN_ARMS = useMemo(() => {
    const out = ['LeftShoulder','RightShoulder','LeftArm','RightArm','LeftForeArm','RightForeArm','LeftHand','RightHand']
    for (const side of ['Left','Right']) for (const f of ['Index','Middle','Ring','Pinky','Thumb']) for (const k of [1,2,3]) out.push(`${side}Hand${f}${k}`)
    return out
  }, [])
  const OWN_LEGS = ['LeftUpLeg','RightUpLeg','LeftLeg','RightLeg','LeftFoot','RightFoot']

  /* setup: scale, recenter, collect meshes + bones + capture REST pose */
  useEffect(() => {
    let box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3(); box.getSize(size)
    scene.scale.setScalar(TARGET_HEIGHT / (size.y || 1))
    box = new THREE.Box3().setFromObject(scene)
    const center = new THREE.Vector3(); box.getCenter(center)
    scene.position.x -= center.x; scene.position.z -= center.z; scene.position.y -= box.min.y

    const meshes = [], dicts = [], bones = {}, rest = {}
    scene.traverse(o => {
      if (o.isMesh && o.morphTargetDictionary) { meshes.push(o); dicts.push(o.morphTargetDictionary) }
      if (o.isMesh) { o.castShadow = true; o.frustumCulled = false }
      if (o.isBone) { bones[o.name] = o; rest[o.name] = o.quaternion.clone() }  // pristine rest (mixer hasn't run yet)
    })
    meshesRef.current = meshes; dictRef.current = dicts; boneRef.current = bones; restRef.current = rest
    gRef.current.sit = restMode === 'sit' ? 1 : 0
  }, [scene, restMode])

  useEffect(() => {
    const idle = actions[clipMap.idle]
    if (idle) { idle.reset().fadeIn(0.4).play(); animRef.current.current = idle; animRef.current.mode = 'idle' }
    return () => idle && idle.fadeOut(0.3)
  }, [actions, clipMap])

  const transition = useCallback((name, fade = 0.45, opts = {}) => {
    const a = animRef.current, next = actions[name]
    if (!next || next === a.current) return
    if (opts.once) { next.setLoop(THREE.LoopOnce, 1); next.clampWhenFinished = true }
    else { next.setLoop(THREE.LoopRepeat, Infinity); next.clampWhenFinished = false }
    next.reset(); next.setEffectiveWeight(1); next.fadeIn(fade).play()
    if (a.current && a.current !== next) a.current.fadeOut(fade)
    a.current = next
  }, [actions])

  const setMorph = useCallback((name, value) => {
    const meshes = meshesRef.current, dicts = dictRef.current
    for (let i = 0; i < meshes.length; i++) { const idx = dicts[i][name]; if (idx !== undefined) meshes[i].morphTargetInfluences[idx] = value }
  }, [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime, d = Math.min(1, delta * 14)
    const sp = speechRef.current, speaking = !!(sp && sp.active)
    const a = animRef.current, g = gRef.current
    const B = boneRef.current, R = restRef.current

    /* ===== body clip: idle ↔ talk, plus a one-shot wave on greeting ===== */
    if (gestureRef.current === 'wave' && clipMap.wave && !a.waving) {
      gestureRef.current = null; a.waving = true
      transition(clipMap.wave, 0.25, { once: true })
      const wa = actions[clipMap.wave]
      const onFin = () => { a.waving = false; wa.getMixer().removeEventListener('finished', onFin); transition(speaking ? clipMap.talk||clipMap.idle : clipMap.idle, 0.4); a.mode = speaking ? 'talk':'idle' }
      wa.getMixer().addEventListener('finished', onFin)
    }
    if (!a.waving) {
      if (speaking && a.mode !== 'talk') { transition(clipMap.talk || clipMap.idle, 0.45); a.mode = 'talk' }
      else if (!speaking && a.mode !== 'idle') { transition(clipMap.idle, 0.5); a.mode = 'idle' }
    }

    /* ===== FACE ===== */
    const v = visRef.current
    let targetJaw = 0, activeKey = 'viseme_sil', beat = false
    if (speaking && sp.seq && sp.seq.length) {
      let idx = sp.syncIdx, acc = sp.syncTime
      while (idx < sp.seq.length - 1 && acc + sp.seq[idx].dur < t) { acc += sp.seq[idx].dur; idx++ }
      sp.idx = idx
      const cur = sp.seq[idx], vinfo = VISEME[cur.code] || VISEME.sil
      activeKey = vinfo.key
      const amp = sp.amp ? sp.amp() : null
      targetJaw = amp != null ? Math.max(vinfo.jaw * 0.4, amp) : vinfo.jaw * (0.85 + Math.random() * 0.3)
      v.browTarget = VOWELS.has(cur.code) ? 0.22 : 0.05
      if (idx !== g.lastIdx) { if (cur.stressed) beat = true; g.lastIdx = idx }
    } else v.browTarget = 0

    v.jaw = lerp(v.jaw, targetJaw, d * 1.6)
    for (const key of ALL_VISEME_KEYS) {
      const cur = curRef.current[key] || 0
      const nv = lerp(cur, key === activeKey ? 1 : 0, d * (key === activeKey ? 1.7 : 1.1))
      curRef.current[key] = nv; setMorph(key, nv * Math.max(0.5, v.jaw * 1.4 + 0.2))
    }
    setMorph('jawOpen', v.jaw); setMorph('mouthOpen', v.jaw * 0.5)
    const smileT = speaking ? 0.26 : 0.34 + Math.sin(t * 0.3) * 0.03
    v.smile = lerp(v.smile, smileT, d * 0.5)
    setMorph('mouthSmile', v.smile); setMorph('mouthSmileLeft', v.smile); setMorph('mouthSmileRight', v.smile)
    v.brow = lerp(v.brow, v.browTarget, d * 0.8)
    setMorph('browInnerUp', v.brow); setMorph('browOuterUpLeft', v.brow * 0.7); setMorph('browOuterUpRight', v.brow * 0.7)
    const b = blinkRef.current; b.t += delta; if (b.t > b.next) { b.t = 0; b.next = 1.6 + Math.random() * 3.6 }
    const bv = b.t < 0.06 ? b.t/0.06 : b.t < 0.14 ? 1 - (b.t-0.06)/0.08 : 0
    setMorph('eyeBlinkLeft', bv); setMorph('eyeBlinkRight', bv)
    const sc = saccadeRef.current; sc.t += delta
    if (sc.t > sc.next) { sc.t = 0; sc.next = 1.5 + Math.random()*3.5; sc.tx = (Math.random()-.5)*.5; sc.ty = (Math.random()-.5)*.3 }
    sc.x = lerp(sc.x, sc.tx, d*0.4); sc.y = lerp(sc.y, sc.ty, d*0.4)
    setMorph('eyesLookUp', Math.max(0, sc.y)); setMorph('eyesLookDown', Math.max(0, -sc.y))

    /* ===== gesture energy (speaking only) ===== */
    const ampNow = (speaking && sp.amp) ? sp.amp() : null
    const baseE = speaking ? (ampNow != null ? Math.min(1, ampNow*1.3 + 0.25) : 0.45) : 0
    g.energy = lerp(g.energy, baseE, d * 0.5)
    if (beat) { g.lead = g.lead ? 0 : 1; if (g.lead) g.accR = 1; else g.accL = 1; g.energy = Math.min(1, g.energy + 0.5) }
    g.accL *= Math.max(0, 1 - delta*4.5); g.accR *= Math.max(0, 1 - delta*4.5)
    const E = g.energy

    // seated amount: sit while idle (if restMode sit), stand up to talk
    g.sit = lerp(g.sit, (restMode === 'sit' && !speaking) ? 1 : 0, Math.min(1, delta * 2.2))
    const sit = g.sit

    /* ===== OWNED upper-limb chain: reset to rest, then pose (no accumulation) ===== */
    const set = (name, x, y, z) => {
      const bb = B[name], rr = R[name]; if (!bb || !rr) return
      bb.quaternion.copy(rr); _e.set(x, y, z, 'XYZ'); _q.setFromEuler(_e); bb.quaternion.multiply(_q)
    }
    const s1 = Math.sin(t*0.9), s3 = Math.sin(t*1.7+0.6)
    // ── Hands clasped low in front, "stand at ease" — elbows tucked to the body ──
    //    Tweak these if needed (see notes after the file):
    const ARM_FWD = -0.10   // upper arms: almost straight down, a touch forward
    const ARM_IN  = 0.60    // upper arms drawn IN to the body (drops the elbows to the sides)
    const FORE    = 0.95    // forearm bend so the hands come to the front
    const FORE_IN = 0.55    // forearms angled inward so the hands meet/clasp at the center
    const FCURL   = 0.26    // relaxed finger curl (hands softly closed, resting together)
    const THUMB   = 0.45    // thumbs tucked in toward the body
    set('LeftShoulder', 0, 0, 0)
    set('RightShoulder', 0, 0, 0)
    set('LeftArm',  ARM_FWD, 0,  ARM_IN)
    set('RightArm', ARM_FWD, 0, -ARM_IN)
    set('LeftForeArm',  -FORE,  FORE_IN, 0)
    set('RightForeArm', -FORE, -FORE_IN, 0)
    set('LeftHand', 0, 0, 0)
    set('RightHand', 0, 0, 0)
    ;['Index','Middle','Ring','Pinky'].forEach((f, i) => {
      const c = FCURL + i*0.012
      set(`LeftHand${f}1`,0,0, c);  set(`LeftHand${f}2`,0,0, c*0.8);  set(`LeftHand${f}3`,0,0, c*0.6)
      set(`RightHand${f}1`,0,0,-c); set(`RightHand${f}2`,0,0,-c*0.8); set(`RightHand${f}3`,0,0,-c*0.6)
    })
    set('LeftHandThumb1', 0, -THUMB, THUMB*0.5);  set('LeftHandThumb2', 0, 0, THUMB*0.4)
    set('RightHandThumb1', 0, THUMB, -THUMB*0.5); set('RightHandThumb2', 0, 0, -THUMB*0.4)

    /* ===== OWNED legs: reset to rest, then bend for sitting (parent-space) ===== */
    const setLeg = (name, ax) => {
      const bb = B[name], rr = R[name]; if (!bb || !rr) return
      bb.quaternion.copy(rr); _e.set(ax, 0, 0, 'XYZ'); _q.setFromEuler(_e); bb.quaternion.premultiply(_q)
    }
    setLeg('LeftUpLeg', SIT_HIP*sit);  setLeg('RightUpLeg', SIT_HIP*sit)
    setLeg('LeftLeg',   SIT_KNEE*sit);  setLeg('RightLeg',  SIT_KNEE*sit)

    /* ===== core (mixer-driven → safe additive sway, gated to speaking) ===== */
    const sway = E * 0.008
    _e.set(E*0.015 + sit*0.05, s1*sway*0.4, Math.sin(t*0.55)*sway, 'XYZ'); _q.setFromEuler(_e); B.Spine && B.Spine.quaternion.multiply(_q)
    _e.set(E*0.012, s1*sway*0.4, Math.sin(t*0.55)*sway*0.7, 'XYZ'); _q.setFromEuler(_e); B.Spine1 && B.Spine1.quaternion.multiply(_q)
    _e.set(E*0.012, s1*sway*0.4, s3*sway*0.6, 'XYZ'); _q.setFromEuler(_e); B.Spine2 && B.Spine2.quaternion.multiply(_q)
    g.htT += delta; if (g.htT > g.htN) { g.htT = 0; g.htN = 4 + Math.random()*6; g.headTilt = (Math.random()-.5)*0.12 }
    _e.set(-E*0.02 - (g.accL+g.accR)*0.03, 0, g.headTilt*0.4, 'XYZ'); _q.setFromEuler(_e); B.Neck && B.Neck.quaternion.multiply(_q)
    _e.set(-E*0.015 + s3*0.01*(E>0?1:0), sc.x*0.12, g.headTilt*0.5, 'XYZ'); _q.setFromEuler(_e); B.Head && B.Head.quaternion.multiply(_q)

    /* ===== whole-body placement: lateral shift (speaking) + sit drop ===== */
    const L = latRef.current; L.t += delta
    if (speaking) { if (L.t > L.next) { L.t = 0; L.next = 1.2 + Math.random()*1.8; L.tx = (Math.random()-.5) * 2 * LATERAL } }
    else L.tx = 0
    L.x = lerp(L.x, L.tx, d * 0.2)
    if (group.current) {
      group.current.position.x = L.x
      group.current.position.y = -SIT_DROP * sit
      group.current.position.z = -0.03 * sit
    }
  })

  return (
    <group ref={group} rotation={[0, MODEL_ROTATION_Y, 0]}>
      <primitive object={scene} />
    </group>
  )
}

/* simple stool so "resting" reads as sitting */
function Stool() {
  return (
    <group position={[0, 0, 0.02]}>
      <mesh position={[0, STOOL_SEAT_Y, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.05, 24]} />
        <meshStandardMaterial color="#6b7280" roughness={0.8} />
      </mesh>
      {[[0.12,0.12],[-0.12,0.12],[0.12,-0.12],[-0.12,-0.12]].map(([x,z],i)=>(
        <mesh key={i} position={[x, STOOL_SEAT_Y/2, z]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, STOOL_SEAT_Y, 12]} />
          <meshStandardMaterial color="#4b5563" roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function Rig() { const { camera } = useThree(); useFrame(() => camera.lookAt(0, 0.92, 0)); return null }
function Loader() {
  return <Html center><div style={{ width:26, height:26, border:'3px solid rgba(99,102,241,.3)', borderTopColor:'#6366F1', borderRadius:'50%', animation:'tbSpin .8s linear infinite' }} /></Html>
}

const BREVITY = "\n\n[Reply in 1-3 short sentences. Conversational. No lists.]"

export default function TalkingBuddy({
  user,
  audience,
  restMode = 'stand',               // 'stand' (calm + smiling when idle) | 'sit'
  apiUrl = DEFAULT_API,
  getAuthHeaders = defaultHeaders,
  modelUrl = MODEL_URL,
  accent = '#6366F1',
  accent2 = '#8B5CF6',
  synthesizeAudio = null,
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
  const gestureRef = useRef(null); const audioCtxRef = useRef(null)

  useEffect(() => { injectStyles() }, [])
  useEffect(() => { msgsRef.current = messages }, [messages])
  useEffect(() => { mutedRef.current = muted }, [muted])
  useEffect(() => { if (open) bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, open, loading])
  useEffect(() => { const fn = () => setIsNarrow(window.innerWidth < 640); fn(); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn) }, [])

  // Score every installed voice and pick the warmest, most natural, Indian-English MALE one.
  // Quality matters more than accent for emotional connection — a robotic "Indian" voice
  // (e.g. iOS compact "Rishi") feels worse than a warm one, so we reward natural/neural voices.
  const pickVoice = useCallback(() => {
    const synth = window.speechSynthesis; if (!synth) return null
    const voices = synth.getVoices() || []
    if (!voices.length) return null
    const FEMALE = /female|woman|samantha|zira|aria|jenny|salli|joanna|kendra|tessa|veena|raveena|heera|kalpana|swara|neerja|asha|priya|isha|ananya|sneha|google.*(hindi|हिन्दी)/i
    const MALE   = /\bmale\b|\bman\b|prabhat|aarav|kunal|rehaan|arjun|rishi|ravi|hemant|madhur|gagan|sandeep|daniel|alex|fred|guy|mark|aaron|orson/i
    const score = v => {
      const n = v.name || '', l = (v.lang || '').toLowerCase()
      let s = 0
      // ── warmth / quality (the biggest lever) ──
      if (/online \(natural\)|neural|natural/i.test(n)) s += 120  // Edge/Azure neural voices — best & free
      if (/enhanced|premium|siri/i.test(n))             s += 60   // iOS/macOS downloaded HQ voice
      if (/google/i.test(n))                            s += 35   // Google network voices (Android/Chrome)
      if (v.localService === false)                     s += 25   // network voice ≈ higher fidelity
      // ── Indian connection ──
      if      (l.startsWith('en-in')) s += 70
      else if (l.startsWith('hi'))    s += 35
      else if (l.startsWith('en-gb')) s += 12
      else if (l.startsWith('en'))    s += 4
      // ── gender ──
      if (FEMALE.test(n)) s -= 200
      if (MALE.test(n))   s += 45
      return s
    }
    let best = null, bestS = -Infinity
    for (const v of voices) {
      const l = (v.lang || '').toLowerCase()
      if (!l.startsWith('en') && !l.startsWith('hi')) continue  // ignore non-English/Hindi
      const s = score(v)
      if (s > bestS) { bestS = s; best = v }
    }
    return best
  }, [])

  const showBubble = useCallback((text) => {
    setBubble(text)
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current)
    const ms = Math.max(9000, text.split(/\s+/).length * 380)   // keep up for the full reply
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
        u.lang = 'en-IN'
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

  // speak the FULL reply (no truncation), lip-synced to the words
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
    const t = setTimeout(() => { gestureRef.current = 'wave'; send(persona.kick, true) }, 1200)
    return () => clearTimeout(t)
  }, [send, persona])

  function toggleMute() { setMuted(m => { if (!m) { try { window.speechSynthesis?.cancel() } catch {}; stopVisemes() } return !m }) }
  function toggleMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return
    if (listening) { try { recogRef.current?.stop() } catch {}; return }
    try {
      const r = new SR(); r.lang='en-IN'; r.interimResults=false; r.maxAlternatives=1
      r.onresult = e => { setInput(prev => (prev ? prev+' ' : '') + e.results[0][0].transcript) }
      r.onend = () => setListening(false); r.onerror = () => setListening(false)
      recogRef.current = r; setListening(true); r.start()
    } catch { setListening(false) }
  }
  const micSupported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
  const renderMd = (s='') => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br/>')

  const FONT = "'Nunito', system-ui, sans-serif"
  const stageW = isNarrow ? 150 : 210
  const stageH = isNarrow ? 300 : 400

  return (
    <>
      <div style={{ position:'fixed', right:isNarrow?4:18, bottom:0, width:stageW, height:stageH, zIndex:1000, pointerEvents:'none' }}>
        {bubble && (
          <div style={{ position:'absolute', bottom:stageH-18, left:'50%', transform:'translateX(-50%)', width:isNarrow?200:250, maxWidth:'78vw', background:'#fff', color:'#1e293b', borderRadius:14, padding:'10px 13px', fontSize:13, lineHeight:1.55, fontFamily:FONT, boxShadow:'0 12px 34px rgba(15,23,42,.22)', border:'1px solid rgba(15,23,42,.08)', animation:'tbBub .25s ease-out', pointerEvents:'auto' }}>
            {bubble}
            <span style={{ position:'absolute', bottom:-7, left:'50%', transform:'translateX(-50%) rotate(45deg)', width:14, height:14, background:'#fff', borderRight:'1px solid rgba(15,23,42,.08)', borderBottom:'1px solid rgba(15,23,42,.08)' }} />
          </div>
        )}
        <Canvas shadows dpr={[1,2]} camera={{ position:[0,0.95,3.25], fov:30 }} gl={{ alpha:true, antialias:true }} style={{ width:'100%', height:'100%', background:'transparent' }}>
          <ambientLight intensity={0.85} />
          <hemisphereLight intensity={0.5} groundColor={'#b9b9c9'} />
          <directionalLight position={[2.5,4,3]} intensity={1.5} castShadow shadow-mapSize={[1024,1024]} />
          <directionalLight position={[-2.5,2,1.5]} intensity={0.5} />
          <Suspense fallback={<Loader />}>
            {restMode === 'sit' && <Stool />}
            <Avatar url={modelUrl} speechRef={speechRef} gestureRef={gestureRef} restMode={restMode} />
            <ContactShadows position={[0,0.01,0]} opacity={0.35} scale={3} blur={2.4} far={2} resolution={512} color="#1e293b" />
          </Suspense>
          <Rig />
        </Canvas>
        <button onClick={toggleMute} title={muted?'Unmute voice':'Mute voice'} style={{ position:'absolute', top:4, right:0, width:30, height:30, borderRadius:9, background:'rgba(255,255,255,.92)', border:'1px solid rgba(15,23,42,.1)', cursor:'pointer', fontSize:13, pointerEvents:'auto', boxShadow:'0 2px 8px rgba(15,23,42,.12)' }}>{muted?'🔇':'🔊'}</button>
        {!open && (
          <button onClick={() => setOpen(true)} style={{ position:'absolute', bottom:isNarrow?26:34, left:'50%', transform:'translateX(-50%)', pointerEvents:'auto', display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap', padding:'8px 15px', borderRadius:24, border:'none', cursor:'pointer', background:`linear-gradient(135deg, ${accent}, ${accent2})`, color:'#fff', fontFamily:FONT, fontWeight:800, fontSize:12.5, boxShadow:`0 6px 18px ${accent}55`, animation:'tbPulse 2.4s infinite' }}>
            💬 Chat with me
            <span style={{ position:'absolute', top:-5, right:-5, width:11, height:11, borderRadius:'50%', background:'#22c55e', border:'2px solid #fff' }} />
          </button>
        )}
      </div>

      {open && (
        <div style={{ position:'fixed', zIndex:1001, display:'flex', flexDirection:'column', ...(isNarrow ? { left:12, right:12, bottom:stageH-16, maxHeight:'calc(100vh - 320px)' } : { right:stageW+28, bottom:24, width:350, height:'min(500px, calc(100vh - 120px))' }), borderRadius:18, overflow:'hidden', fontFamily:FONT, animation:'tbPop .22s ease-out', background:'var(--bg2, #ffffff)', border:'1px solid var(--border, rgba(15,23,42,.1))', boxShadow:'0 24px 70px rgba(15,23,42,.28)' }}>
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

useGLTF.preload(MODEL_URL)