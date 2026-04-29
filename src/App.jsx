/**
 * BrainSpark AI — Frontend v4.0
 * First code's features + Second code's UI polish
 *
 * REQUIRES in .env:
 *   VITE_API_URL=https://your-render-url.onrender.com
 *   VITE_GOOGLE_CLIENT_ID=...
 *   VITE_MICROSOFT_CLIENT_ID=...
 *   VITE_RAZORPAY_KEY_ID=rzp_live_...
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ══════════════════════════════════════════════════════════════
//  FONT INJECTION
// ══════════════════════════════════════════════════════════════
function useFonts() {
  useEffect(() => {
    if (!document.getElementById('brainspark-fonts')) {
      const link = document.createElement('link')
      link.id = 'brainspark-fonts'
      link.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Sora:wght@600;700;800;900&display=swap'
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    if (!document.getElementById('brainspark-keyframes')) {
      const style = document.createElement('style')
      style.id = 'brainspark-keyframes'
      style.textContent = `
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes dotBounce { 0%,100%{opacity:.25;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .brainspark-font { font-family: 'Nunito', system-ui, sans-serif; }
      `
      document.head.appendChild(style)
    }
  }, [])
}

// ══════════════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════════════
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const SUBJECTS = ['Mathematics','Science','Physics','Chemistry','Biology',
  'English','Hindi','Social Science','History','Geography',
  'Civics','Economics','Computer Science','Sanskrit','Environmental Science']

const CLASSES = ['Class 1','Class 2','Class 3','Class 4','Class 5',
  'Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12']

const CBSE_CHAPTERS = {
  Mathematics: {
    'Class 10': ['Real Numbers','Polynomials','Linear Equations','Quadratic Equations','AP','Triangles','Coordinate Geometry','Trigonometry','Circles','Constructions','Areas Related to Circles','Surface Areas & Volumes','Statistics','Probability'],
    'Class 9': ['Number Systems','Polynomials','Coordinate Geometry','Linear Equations','Euclid\'s Geometry','Lines & Angles','Triangles','Quadrilaterals','Areas of Parallelograms','Circles','Constructions','Heron\'s Formula','Surface Areas','Statistics','Probability']
  },
  Science: {
    'Class 10': ['Chemical Reactions','Acids, Bases & Salts','Metals & Non-Metals','Carbon Compounds','Life Processes','Control & Coordination','Reproduction','Heredity','Light - Reflection','Human Eye','Electricity','Magnetic Effects','Management of Natural Resources'],
    'Class 9': ['Matter in Our Surroundings','Is Matter Around Us Pure?','Atoms & Molecules','Structure of Atom','Cell Fundamentals','Tissues','Motion','Force & Laws of Motion','Gravitation','Work & Energy','Sound','Natural Resources']
  },
}
const getChapters = (subject, cls) => CBSE_CHAPTERS[subject]?.[cls] || Array.from({ length: 15 }, (_, i) => `Chapter ${i + 1}`)

const LEVELS = [
  { min: 0,      label: 'Beginner',        color: '#94A3B8', emoji: '🌱' },
  { min: 200,    label: 'Learner',          color: '#6EE7B7', emoji: '📗' },
  { min: 600,    label: 'Student',          color: '#34D399', emoji: '📘' },
  { min: 1500,   label: 'Scholar',          color: '#60A5FA', emoji: '🎓' },
  { min: 3500,   label: 'Knowledge Seeker', color: '#818CF8', emoji: '🔍' },
  { min: 7000,   label: 'Expert',           color: '#A78BFA', emoji: '💡' },
  { min: 15000,  label: 'Master',           color: '#F59E0B', emoji: '⚡' },
  { min: 30000,  label: 'Elite',            color: '#EF4444', emoji: '🔥' },
  { min: 60000,  label: 'Champion',         color: '#EC4899', emoji: '🏆' },
  { min: 120000, label: 'Legend',           color: '#F97316', emoji: '🌟' },
  { min: 250000, label: 'Genius',           color: '#C084FC', emoji: '💎' },
  { min: 500000, label: 'Transcendent',     color: '#FBBF24', emoji: '🌌' },
]
function getLevel(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) if (xp >= LEVELS[i].min) return { ...LEVELS[i], index: i }
  return { ...LEVELS[0], index: 0 }
}
function getNextLevel(xp) { const cur = getLevel(xp); return LEVELS[cur.index + 1] || null }

const DIFF_COLORS = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444', legendary: '#8b5cf6' }

const TOOL_COLORS = {
  doubt: '#6366F1', notes: '#10B981', cheatsheet: '#F97316',
  paper: '#8B5CF6', lessonplan: '#7C3AED', quiz: '#F59E0B', flashcards: '#EF4444',
  dashboard: '#6366F1', achievements: '#F59E0B', profile: '#64748B',
}

// ══════════════════════════════════════════════════════════════
//  API CLIENT
// ══════════════════════════════════════════════════════════════
const api = {
  headers() {
    const h = { 'Content-Type': 'application/json' }
    const t = localStorage.getItem('bs_token')
    const s = localStorage.getItem('bs_session')
    if (t) h['Authorization'] = `Bearer ${t}`
    if (s) h['x-session-token'] = s
    return h
  },
  async get(path) {
    const r = await fetch(`${API_URL}${path}`, { headers: this.headers() })
    const data = await r.json()
    if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { code: data.code, status: r.status })
    return data
  },
  async post(path, body) {
    const r = await fetch(`${API_URL}${path}`, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) })
    const data = await r.json()
    if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { code: data.code, status: r.status })
    return data
  },
  async put(path, body) {
    const r = await fetch(`${API_URL}${path}`, { method: 'PUT', headers: this.headers(), body: JSON.stringify(body) })
    const data = await r.json()
    if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { code: data.code, status: r.status })
    return data
  },
  async del(path) {
    const r = await fetch(`${API_URL}${path}`, { method: 'DELETE', headers: this.headers() })
    const data = await r.json()
    if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { code: data.code, status: r.status })
    return data
  },
}

// ══════════════════════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════════════════════
function downloadText(content, filename = 'brainspark.txt') {
  const blob = new Blob([content], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function printContent(content, title = 'BrainSpark AI') {
  const html = content
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>')
    .replace(/## (.*?)(\n|$)/g, '<h2>$1</h2>')
    .replace(/# (.*?)(\n|$)/g, '<h1>$1</h1>')
    .replace(/\n/g, '<br>')
  const win = window.open('', '_blank')
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>body{font-family:'Georgia',serif;max-width:800px;margin:40px auto;padding:0 20px;color:#111;line-height:1.7}
    h1{color:#6366F1;font-size:24px}h2{color:#374151;border-bottom:2px solid #E5E7EB;padding-bottom:6px}
    h3{color:#4B5563}strong{color:#111}@media print{@page{margin:.8in}}</style>
    </head><body>${html}<script>setTimeout(()=>{window.print()},400)</script></body></html>`)
  win.document.close()
}

async function loadScript(src) {
  if (document.querySelector(`script[src="${src}"]`)) return
  return new Promise((res, rej) => {
    const s = document.createElement('script')
    s.src = src; s.async = true; s.defer = true
    s.onload = res; s.onerror = rej
    document.head.appendChild(s)
  })
}

// ══════════════════════════════════════════════════════════════
//  DESIGN TOKENS
// ══════════════════════════════════════════════════════════════
const T = {
  // Card
  card: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,.06)',
  },
  // Label
  label: {
    display: 'block',
    fontSize: '10.5px',
    fontWeight: 800,
    color: 'var(--text)',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    marginBottom: '6px',
    fontFamily: "'Nunito', sans-serif",
  },
  // Input
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text-h)',
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color .2s',
  },
  // Select
  select: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text-h)',
    fontSize: '14px',
    fontFamily: "'Nunito', sans-serif",
    appearance: 'auto',
    outline: 'none',
    cursor: 'pointer',
  },
}

// ══════════════════════════════════════════════════════════════
//  BASE UI COMPONENTS
// ══════════════════════════════════════════════════════════════

function PageHeader({ icon, title, subtitle, color }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
        <span style={{ fontSize: 26 }}>{icon}</span>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 'clamp(1.1rem,2.5vw,1.45rem)', color: 'var(--text-h)', margin: 0 }}>{title}</h2>
      </div>
      {subtitle && <p style={{ color: 'var(--text)', fontSize: 13, margin: 0, paddingLeft: 36 }}>{subtitle}</p>}
      <div style={{ height: 3, width: 44, background: color || 'var(--accent)', borderRadius: 2, marginTop: 8, marginLeft: 36 }} />
    </div>
  )
}

function Card({ children, style = {} }) {
  return <div style={{ ...T.card, ...style }}>{children}</div>
}

function Label({ children }) {
  return <div style={T.label}>{children}</div>
}

function PrimaryBtn({ children, onClick, disabled, color = 'var(--accent)', small, style = {}, gradient }) {
  const bg = gradient || `linear-gradient(135deg, ${color}, ${color}cc)`
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: bg, color: '#fff', padding: small ? '7px 14px' : '11px 22px', borderRadius: small ? 9 : 11, border: 'none', fontWeight: 800, fontSize: small ? 12.5 : 14.5, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Nunito', sans-serif", opacity: disabled ? .6 : 1, transition: 'opacity .15s, transform .1s', ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '.88' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
      {children}
    </button>
  )
}

function OutlineBtn({ children, onClick, disabled, color = 'var(--accent)', small, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: 'var(--bg)', color, padding: small ? '6px 13px' : '9px 18px', borderRadius: small ? 9 : 10, border: `2px solid ${color}`, fontWeight: 700, fontSize: small ? 12.5 : 14, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'Nunito', sans-serif", opacity: disabled ? .6 : 1, ...style }}>
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick, disabled, small, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: 'var(--social-bg)', color: 'var(--text-h)', padding: small ? '6px 12px' : '9px 16px', borderRadius: small ? 8 : 10, border: '1px solid var(--border)', fontWeight: 700, fontSize: small ? 12.5 : 14, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'Nunito', sans-serif", opacity: disabled ? .6 : 1, ...style }}>
      {children}
    </button>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function BSInput({ value, onChange, placeholder, type = 'text', required, minLength, disabled, style = {} }) {
  const [focused, setFocused] = useState(false)
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
      required={required} minLength={minLength} disabled={disabled}
      style={{ ...T.input, borderColor: focused ? 'var(--accent)' : 'var(--border)', ...style }}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
  )
}

function BSSelect({ value, onChange, options, style = {} }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...T.select, ...style }}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  )
}

function BSTextarea({ value, onChange, placeholder, rows = 4, style = {} }) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ ...T.input, resize: 'vertical', lineHeight: 1.6, borderColor: focused ? 'var(--accent)' : 'var(--border)', ...style }}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
  )
}

function Spinner({ size = 16 }) {
  return (
    <div style={{ width: size, height: size, border: `2px solid rgba(255,255,255,.4)`, borderTopColor: 'white', borderRadius: '50%', animation: 'spin .7s linear infinite', flexShrink: 0 }} />
  )
}

function PageSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 64, flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: "'Nunito', sans-serif" }}>Loading...</span>
    </div>
  )
}

function ErrMsg({ msg }) {
  if (!msg) return null
  return <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '10px 14px', color: '#dc2626', fontSize: 13, fontWeight: 600, marginTop: 8, fontFamily: "'Nunito', sans-serif" }}>⚠️ {msg}</div>
}

function SuccessMsg({ msg }) {
  if (!msg) return null
  return <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, padding: '10px 14px', color: '#16a34a', fontSize: 13, fontWeight: 600, marginTop: 8, fontFamily: "'Nunito', sans-serif" }}>✅ {msg}</div>
}

function Tag({ label, onRemove }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
      {label} {onRemove && <span onClick={onRemove} style={{ cursor: 'pointer', fontWeight: 800 }}>×</span>}
    </span>
  )
}

function XPBadge({ amount, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginTop: 14 }}>
      <div style={{ background: 'var(--accent-bg)', padding: '5px 14px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5, border: '1px solid var(--accent-border)', color: 'var(--accent)', fontWeight: 700, fontSize: 12.5, fontFamily: "'Nunito', sans-serif" }}>
        ⚡ Earn +{amount} XP {label}
      </div>
    </div>
  )
}

// Multi-chapter selector
function ChapterSelector({ subject, cls, selected, onChange, max = 20 }) {
  const chapters = getChapters(subject, cls)
  const toggle = (ch) => {
    if (selected.includes(ch)) onChange(selected.filter(c => c !== ch))
    else if (selected.length < max) onChange([...selected, ch])
  }
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <GhostBtn small onClick={() => onChange(chapters)}>Select All</GhostBtn>
        {selected.length > 0 && <GhostBtn small onClick={() => onChange([])}>Clear</GhostBtn>}
        <span style={{ fontSize: 12, color: 'var(--text)', fontFamily: "'Nunito', sans-serif" }}>{selected.length} selected</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {chapters.map(ch => {
          const sel = selected.includes(ch)
          return (
            <span key={ch} onClick={() => toggle(ch)}
              style={{ padding: '5px 13px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
                background: sel ? 'var(--accent)' : 'var(--accent-bg)',
                color: sel ? '#fff' : 'var(--accent)',
                border: `1px solid ${sel ? 'var(--accent)' : 'var(--accent-border)'}`,
                transition: 'all .15s' }}>
              {ch}
            </span>
          )
        })}
      </div>
      {selected.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          <span style={{ fontSize: 12, color: 'var(--text)', alignSelf: 'center', fontFamily: "'Nunito', sans-serif" }}>Selected: </span>
          {selected.map(ch => <Tag key={ch} label={ch} onRemove={() => toggle(ch)} />)}
        </div>
      )}
    </div>
  )
}

// Content renderer
function ContentBox({ content, onDownload, downloadName, label = 'Generated Content' }) {
  const lines = (content || '').split('\n')
  return (
    <Card style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ margin: 0, fontSize: 15, color: 'var(--text-h)', fontFamily: "'Sora', sans-serif", fontWeight: 800 }}>{label}</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {onDownload && <GhostBtn small onClick={onDownload}>⬇ Download</GhostBtn>}
          <GhostBtn small onClick={() => printContent(content, downloadName)}>🖨 Print / PDF</GhostBtn>
        </div>
      </div>
      <div style={{ maxHeight: '60vh', overflowY: 'auto', fontFamily: "'Nunito', sans-serif", fontSize: 14, lineHeight: 1.85, color: 'var(--text-h)', padding: '4px 2px' }}>
        {lines.map((line, i) => {
          if (line.startsWith('# '))   return <h2 key={i} style={{ color: 'var(--accent)', borderBottom: '2px solid var(--accent-border)', paddingBottom: 6, margin: '16px 0 8px', fontFamily: "'Sora', sans-serif" }}>{line.slice(2)}</h2>
          if (line.startsWith('## '))  return <h3 key={i} style={{ color: 'var(--text-h)', margin: '14px 0 6px', fontFamily: "'Sora', sans-serif" }}>{line.slice(3)}</h3>
          if (line.startsWith('### ')) return <h4 key={i} style={{ color: 'var(--text-h)', margin: '10px 0 4px', fontFamily: "'Sora', sans-serif" }}>{line.slice(4)}</h4>
          if (line.startsWith('- ') || line.startsWith('• ')) return <div key={i} style={{ paddingLeft: 16, marginBottom: 2 }}>• {line.slice(2)}</div>
          if (/^\d+\./.test(line)) return <div key={i} style={{ paddingLeft: 16, marginBottom: 2 }}>{line}</div>
          if (line.startsWith('---') || line.startsWith('═══')) return <hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
          const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          return <p key={i} style={{ margin: '3px 0' }} dangerouslySetInnerHTML={{ __html: bold }} />
        })}
      </div>
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════
//  FREE TIER BANNER
// ══════════════════════════════════════════════════════════════
function FreeTierBanner({ user, onSubscribe }) {
  if (!user || user.type === 'school') return null
  if (user.subscription_status === 'active') return null
  const used = user.free_tier_minutes_used || 0
  const pct  = Math.min(100, Math.round((used / 60) * 100))
  const left = Math.max(0, 60 - used)
  if (left <= 0) return (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 11, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, fontFamily: "'Nunito', sans-serif" }}>
      <span style={{ color: '#dc2626', fontWeight: 700, fontSize: 14 }}>⚠️ Free trial ended. Subscribe to continue.</span>
      <PrimaryBtn small onClick={onSubscribe} color="#ef4444">Subscribe Now</PrimaryBtn>
    </div>
  )
  return (
    <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 11, padding: '10px 18px', marginBottom: 18, fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text-h)', fontWeight: 700 }}>🕐 Free Trial: {left} min remaining</span>
        <span onClick={onSubscribe} style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}>Upgrade →</span>
      </div>
      <div style={{ background: 'var(--border)', borderRadius: 999, height: 5 }}>
        <div style={{ background: 'var(--accent)', width: `${pct}%`, height: '100%', borderRadius: 999, transition: 'width .3s' }} />
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  AUTH PAGE
// ══════════════════════════════════════════════════════════════
function AuthPage({ onAuth }) {
  useFonts()
  const [tab,    setTab]   = useState('personal')
  const [role,   setRole]  = useState('student')
  const [mode,   setMode]  = useState('login')
  const [form,   setForm]  = useState({ name: '', email: '', password: '', schoolCode: '', identifier: '', confirmPassword: '' })
  const [err,    setErr]   = useState('')
  const [busy,   setBusy]  = useState(false)
  const [showPw, setShowPw] = useState(false)
  const gBtnRef = useRef(null)

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || tab !== 'personal') return
    loadScript('https://accounts.google.com/gsi/client').then(() => {
      if (!window.google || !gBtnRef.current) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp) => {
          try { setBusy(true); setErr(''); const data = await api.post('/api/auth/google', { idToken: resp.credential }); saveAuth(data); onAuth(data.user) }
          catch (e) { setErr(e.message) } finally { setBusy(false) }
        },
      })
      window.google.accounts.id.renderButton(gBtnRef.current, { theme: 'outline', size: 'large', width: 280 })
    }).catch(() => {})
  }, [tab])

  async function handleMicrosoft() {
    setErr(''); setBusy(true)
    try {
      await loadScript('https://alcdn.msauth.net/browser/2.38.0/js/msal-browser.min.js')
      const msal = new window.msal.PublicClientApplication({
        auth: { clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID, authority: 'https://login.microsoftonline.com/common', redirectUri: window.location.origin },
        cache: { cacheLocation: 'sessionStorage' },
      })
      await msal.initialize()
      const result = await msal.loginPopup({ scopes: ['openid', 'profile', 'email', 'User.Read'] })
      const data   = await api.post('/api/auth/microsoft', { accessToken: result.accessToken })
      saveAuth(data); onAuth(data.user)
    } catch (e) { setErr(e.message || 'Microsoft sign-in failed') } finally { setBusy(false) }
  }

  async function handlePersonal(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      if (mode === 'register') {
        if (!form.name.trim()) throw new Error('Name is required')
        if (form.password !== form.confirmPassword) throw new Error('Passwords do not match')
      }
      const data = await api.post(mode === 'register' ? '/api/auth/register' : '/api/auth/login', { name: form.name, email: form.email, password: form.password, role })
      saveAuth(data); onAuth(data.user)
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  async function handleSchool(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const data = await api.post('/api/auth/school', { schoolCode: form.schoolCode, identifier: form.identifier, password: form.password, role })
      saveAuth(data); onAuth(data.user)
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  function saveAuth(data) {
    localStorage.setItem('bs_token',   data.token)
    localStorage.setItem('bs_session', data.sessionToken)
    localStorage.setItem('bs_user',    JSON.stringify(data.user))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #6366F1, #8B5CF6 50%, #A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ ...T.card, width: '100%', maxWidth: 430, boxShadow: '0 28px 70px rgba(0,0,0,.22)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 26 }}>🧠</div>
          <h1 style={{ margin: 0, fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 22, color: 'var(--text-h)' }}>BrainSpark<span style={{ color: '#6366F1' }}> AI</span></h1>
          <p style={{ color: 'var(--text)', fontSize: 13, marginTop: 4 }}>Your AI-powered study companion</p>
        </div>

        {/* Portal tabs */}
        <div style={{ display: 'flex', background: 'var(--code-bg)', borderRadius: 11, padding: 3, marginBottom: 20 }}>
          {[['personal', 'Personal'], ['school', '🏫 School']].map(([t, l]) => (
            <button key={t} onClick={() => { setTab(t); setErr('') }}
              style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", background: tab === t ? 'var(--bg)' : 'transparent', color: tab === t ? 'var(--text-h)' : 'var(--text)', boxShadow: tab === t ? '0 2px 7px rgba(0,0,0,.08)' : 'none', transition: 'all .2s' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Role selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[['student', '🎒 Student'], ['teacher', '👨‍🏫 Teacher']].map(([r, l]) => (
            <button key={r} onClick={() => setRole(r)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 9, border: `2px solid ${role === r ? 'var(--accent)' : 'var(--border)'}`, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", background: role === r ? 'var(--accent-bg)' : 'var(--bg)', color: role === r ? 'var(--accent)' : 'var(--text)', transition: 'all .2s' }}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'personal' && <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[['login', 'Sign In'], ['register', 'Register']].map(([m, l]) => (
              <button key={m} onClick={() => setMode(m)}
                style={{ flex: 1, padding: '8px', borderRadius: 9, border: `2px solid ${mode === m ? 'var(--accent)' : 'var(--border)'}`, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", background: mode === m ? 'var(--accent-bg)' : 'var(--bg)', color: mode === m ? 'var(--accent)' : 'var(--text)', transition: 'all .2s' }}>
                {l}
              </button>
            ))}
          </div>

          <form onSubmit={handlePersonal} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'register' && <Field label="Full Name"><BSInput value={form.name} onChange={set('name')} placeholder="Your full name" /></Field>}
            <Field label="Email Address"><BSInput value={form.email} onChange={set('email')} type="email" placeholder="your@email.com" /></Field>
            <Field label="Password">
              <div style={{ position: 'relative' }}>
                <BSInput value={form.password} onChange={set('password')} type={showPw ? 'text' : 'password'} placeholder="Password" style={{ paddingRight: 40 }} />
                <span onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text)', userSelect: 'none' }}>{showPw ? '🙈' : '👁'}</span>
              </div>
            </Field>
            {mode === 'register' && <Field label="Confirm Password"><BSInput value={form.confirmPassword} onChange={set('confirmPassword')} type="password" placeholder="Repeat password" /></Field>}
            <ErrMsg msg={err} />
            <PrimaryBtn style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={busy}>
              {busy ? <><Spinner /> {mode === 'register' ? 'Creating account...' : 'Signing in...'}</> : mode === 'register' ? 'Create Account' : 'Sign In'}
            </PrimaryBtn>
          </form>

          {mode === 'login' && <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text)', marginTop: 10 }}>
            <span onClick={() => onAuth('forgot')} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}>Forgot password?</span>
          </p>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <div ref={gBtnRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }} />

          <button onClick={handleMicrosoft} disabled={busy}
            style={{ width: '100%', padding: '10px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: "'Nunito', sans-serif" }}>
            <img src="https://learn.microsoft.com/favicon.ico" width={18} height={18} alt="" />
            Sign in with Microsoft
          </button>

          <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text)', marginTop: 12 }}>
            🕐 Free trial: 1 hour · then ₹{role === 'teacher' ? '180' : '150'}/month
          </p>
        </>}

        {tab === 'school' && (
          <form onSubmit={handleSchool} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--accent-bg)', padding: '10px 14px', borderRadius: 10, fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
              🏫 Enter the School Code provided by your school administrator.
            </div>
            <Field label="School Code"><BSInput value={form.schoolCode} onChange={set('schoolCode')} placeholder="e.g. DPS2024" /></Field>
            <Field label={role === 'teacher' ? 'Employee ID' : 'Roll Number'}><BSInput value={form.identifier} onChange={set('identifier')} placeholder={role === 'teacher' ? 'e.g. TCH001' : 'e.g. 101'} /></Field>
            <Field label="Password">
              <div style={{ position: 'relative' }}>
                <BSInput value={form.password} onChange={set('password')} type={showPw ? 'text' : 'password'} placeholder="Your password" style={{ paddingRight: 40 }} />
                <span onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text)' }}>{showPw ? '🙈' : '👁'}</span>
              </div>
            </Field>
            <ErrMsg msg={err} />
            <PrimaryBtn style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
              {busy ? <><Spinner /> Signing in...</> : `Sign In as ${role === 'teacher' ? 'Teacher' : 'Student'}`}
            </PrimaryBtn>
            <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text)' }}>
              Contact your school admin if you don't have credentials.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  FORGOT PASSWORD PAGE
// ══════════════════════════════════════════════════════════════
function ForgotPasswordPage({ onBack }) {
  useFonts()
  const [email, setEmail] = useState('')
  const [sent,  setSent]  = useState(false)
  const [err,   setErr]   = useState('')
  const [busy,  setBusy]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try { await api.post('/api/auth/forgot-password', { email }); setSent(true) }
    catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Nunito', sans-serif" }}>
      <Card style={{ maxWidth: 400, width: '100%', boxShadow: '0 28px 70px rgba(0,0,0,.22)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
          <h2 style={{ margin: 0, fontFamily: "'Sora', sans-serif", fontWeight: 900, color: 'var(--text-h)' }}>Reset Password</h2>
          <p style={{ color: 'var(--text)', fontSize: 13, marginTop: 6 }}>We'll send a reset link to your email</p>
        </div>
        {sent ? <SuccessMsg msg="✅ Check your inbox for the reset link. It expires in 1 hour." /> : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Email Address"><BSInput value={email} onChange={setEmail} type="email" placeholder="your@email.com" /></Field>
            <ErrMsg msg={err} />
            <PrimaryBtn style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
              {busy ? <><Spinner /> Sending...</> : 'Send Reset Link'}
            </PrimaryBtn>
          </form>
        )}
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
          <span onClick={onBack} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}>← Back to sign in</span>
        </p>
      </Card>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  SUBSCRIPTION PAGE
// ══════════════════════════════════════════════════════════════
function SubscriptionPage({ user, onSuccess, onBack }) {
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')

  const plans = user?.role === 'teacher'
    ? [{ id: 'teacher_monthly', label: 'Monthly', price: '₹180', desc: '₹180/month', months: 1 },
       { id: 'teacher_yearly',  label: 'Annual',  price: '₹1,800', desc: '₹1,800/year — save ₹360', months: 12, popular: true }]
    : [{ id: 'student_monthly', label: 'Monthly', price: '₹150', desc: '₹150/month', months: 1 },
       { id: 'student_yearly',  label: 'Annual',  price: '₹1,500', desc: '₹1,500/year — save ₹300', months: 12, popular: true }]

  async function subscribe(planType) {
    setErr(''); setLoading(true)
    try {
      await loadScript('https://checkout.razorpay.com/v1/checkout.js')
      const order = await api.post('/api/subscription/create-order', { planType })
      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, amount: order.amount, currency: 'INR',
        name: 'BrainSpark AI', description: order.planLabel, order_id: order.orderId,
        prefill: { name: user.name, email: user.email }, theme: { color: '#6366F1' },
        handler: async ({ razorpay_payment_id, razorpay_order_id, razorpay_signature }) => {
          try {
            await api.post('/api/subscription/verify', { orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature, planType })
            onSuccess()
          } catch (e) { setErr('Payment verification failed. Contact support.') }
        },
      })
      rzp.open()
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  return (
    <div style={{ padding: 24, maxWidth: 640, margin: '0 auto', fontFamily: "'Nunito', sans-serif" }}>
      {onBack && <GhostBtn small onClick={onBack} style={{ marginBottom: 20 }}>← Back</GhostBtn>}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>💎</div>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, color: 'var(--text-h)', margin: '0 0 6px' }}>Upgrade BrainSpark AI</h2>
        <p style={{ color: 'var(--text)', fontSize: 14 }}>Unlimited access to all AI tools</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {plans.map(p => (
          <div key={p.id} style={{ ...T.card, position: 'relative', borderColor: p.popular ? 'var(--accent)' : 'var(--border)', borderWidth: p.popular ? 2 : 1, textAlign: 'center' }}>
            {p.popular && <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', borderRadius: 20, padding: '3px 14px', fontSize: 11, fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>BEST VALUE</div>}
            <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--accent)', marginBottom: 4, fontFamily: "'Sora', sans-serif" }}>{p.price}</div>
            <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 16 }}>{p.desc}</div>
            <PrimaryBtn onClick={() => subscribe(p.id)} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <><Spinner /> ...</> : `Get ${p.label}`}
            </PrimaryBtn>
          </div>
        ))}
      </div>
      <Card style={{ background: 'var(--accent-bg)' }}>
        <h4 style={{ margin: '0 0 12px', color: 'var(--text-h)', fontFamily: "'Sora', sans-serif", fontWeight: 800 }}>✨ What's included:</h4>
        {['Unlimited AI-powered study sessions', 'Smart Doubt Solver', 'Comprehensive Chapter Notes', 'Multi-chapter Question Papers', 'Exam Cheat Sheets / Lesson Planner', 'Quizzes & Flashcards', 'Achievements & XP gamification', 'Content download & print'].map(f => (
          <div key={f} style={{ fontSize: 13.5, color: 'var(--text)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#22c55e', fontWeight: 800 }}>✅</span> {f}
          </div>
        ))}
      </Card>
      <ErrMsg msg={err} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════
function Dashboard({ user, onNavigate }) {
  const [stats,  setStats]   = useState(null)
  const [achs,   setAchs]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/api/user/stats'), api.get('/api/user/achievements')])
      .then(([s, a]) => { setStats(s); setAchs(a) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner />

  const xp       = stats?.stats?.total_xp || 0
  const level    = getLevel(xp)
  const nextLevel = getNextLevel(xp)
  const pct      = nextLevel ? Math.round(((xp - level.min) / (nextLevel.min - level.min)) * 100) : 100
  const streak   = stats?.stats?.current_streak || 0
  const unlocked = achs.filter(a => a.unlocked)
  const locked   = achs.filter(a => !a.unlocked).slice(0, 6)
  const recentAchs = unlocked.slice(0, 3)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Sora', sans-serif", fontWeight: 900, color: 'var(--text-h)', fontSize: 'clamp(1.1rem,2.5vw,1.5rem)' }}>{greeting}, {user.name.split(' ')[0]}! {level.emoji}</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text)', fontSize: 13 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 20, padding: '6px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 14, fontFamily: "'Sora', sans-serif" }}>{level.emoji} {level.label}</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 22 }}>
        {[
          { label: 'Total XP', value: xp.toLocaleString(), icon: '⚡', bg: '#EEF2FF', color: '#6366F1' },
          { label: 'Streak',   value: `${streak}d`,         icon: '🔥', bg: '#FFF7ED', color: '#F97316' },
          { label: 'Doubts',   value: stats?.stats?.doubts_solved || 0, icon: '🤔', bg: '#ECFDF5', color: '#10B981' },
          { label: 'Quizzes',  value: stats?.stats?.quizzes_done  || 0, icon: '🎯', bg: '#F5F3FF', color: '#8B5CF6' },
          { label: 'Notes',    value: stats?.stats?.notes_made    || 0, icon: '📖', bg: '#FFF1F2', color: '#EF4444' },
          { label: 'Papers',   value: stats?.stats?.papers_made   || 0, icon: '📄', bg: '#FFFBEB', color: '#F59E0B' },
        ].map(stat => (
          <div key={stat.label} style={{ background: stat.bg, borderRadius: 14, padding: '14px 12px', textAlign: 'center', border: '1px solid rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: stat.color, fontFamily: "'Sora', sans-serif" }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: 600 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Level progress */}
      <Card style={{ marginBottom: 20, background: 'linear-gradient(135deg, #6366F1, #8B5CF6, #A855F7)', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <span style={{ fontWeight: 900, color: '#fff', fontSize: 18, fontFamily: "'Sora', sans-serif" }}>{level.emoji} {level.label}</span>
            {nextLevel && <span style={{ color: 'rgba(255,255,255,.75)', fontSize: 12.5, marginLeft: 10 }}>→ {nextLevel.emoji} {nextLevel.label} at {nextLevel.min.toLocaleString()} XP</span>}
          </div>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#fff', fontFamily: "'Sora', sans-serif" }}>{xp.toLocaleString()} XP</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,.25)', borderRadius: 999, height: 8 }}>
          <div style={{ background: '#fff', width: `${pct}%`, height: '100%', borderRadius: 999, transition: 'width 1s ease' }} />
        </div>
        {nextLevel && <p style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', margin: '8px 0 0', textAlign: 'right' }}>{(nextLevel.min - xp).toLocaleString()} XP to {nextLevel.label}</p>}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent achievements */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontFamily: "'Sora', sans-serif", fontWeight: 800, color: 'var(--text-h)' }}>🏆 Recent Achievements</h3>
            <span onClick={() => onNavigate('achievements')} style={{ fontSize: 12.5, color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}>All ({unlocked.length})</span>
          </div>
          {recentAchs.length === 0 ? (
            <p style={{ color: 'var(--text)', fontSize: 13 }}>Complete activities to unlock achievements!</p>
          ) : recentAchs.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 24 }}>{a.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-h)' }}>{a.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text)' }}>{a.description}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: DIFF_COLORS[a.difficulty] }}>{a.difficulty}</span>
            </div>
          ))}
          {locked.length > 0 && <>
            <div style={{ color: 'var(--text)', fontSize: 12, fontWeight: 700, marginTop: 14, marginBottom: 8 }}>🔒 Locked</div>
            {locked.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, opacity: .5 }}>
                <span style={{ fontSize: 18, filter: 'grayscale(1)' }}>{a.emoji}</span>
                <div><div style={{ fontWeight: 700, fontSize: 12.5 }}>{a.name}</div><div style={{ fontSize: 11, color: 'var(--text)' }}>{a.description}</div></div>
              </div>
            ))}
          </>}
        </Card>

        {/* Quick actions */}
        <Card>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontFamily: "'Sora', sans-serif", fontWeight: 800, color: 'var(--text-h)' }}>⚡ Quick Start</h3>
          {[
            { icon: '🤔', label: 'Ask a Doubt', tab: 'doubt', color: '#6366F1' },
            { icon: '📖', label: 'Generate Notes', tab: 'notes', color: '#10B981' },
            ...(user.role === 'student' ? [{ icon: '📋', label: 'Exam Cheat Sheet', tab: 'cheatsheet', color: '#F97316' }] : [{ icon: '🎓', label: 'Lesson Planner', tab: 'lessonplan', color: '#7C3AED' }]),
            { icon: '🎯', label: 'Take a Quiz', tab: 'quiz', color: '#F59E0B' },
          ].map(item => (
            <button key={item.tab} onClick={() => onNavigate(item.tab)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', cursor: 'pointer', marginBottom: 9, fontSize: 14, fontWeight: 600, fontFamily: "'Nunito', sans-serif", transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-bg)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {item.label}
              <span style={{ marginLeft: 'auto', fontSize: 16, color: 'var(--text)' }}>→</span>
            </button>
          ))}
        </Card>
      </div>

      {streak > 0 && (
        <Card style={{ marginTop: 16, background: 'linear-gradient(135deg, #fff7ed, #fef3c7)', border: '1px solid #fde68a', textAlign: 'center' }}>
          <div style={{ fontSize: 32 }}>🔥</div>
          <div style={{ fontWeight: 900, color: '#92400e', fontSize: 16, fontFamily: "'Sora', sans-serif" }}>{streak}-Day Streak!</div>
          <div style={{ color: '#a16207', fontSize: 13, marginTop: 4 }}>
            {streak >= 365 ? "Year-Round Scholar! Legendary! 👑" : streak >= 30 ? "Monthly Master! Keep going!" : streak >= 7 ? "Week warrior! 7 days strong!" : "Keep it up! Don't break the streak!"}
          </div>
        </Card>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  DOUBT SOLVER
// ══════════════════════════════════════════════════════════════
function DoubtSolver({ user }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: '👋 Hi! Ask me any doubt and I\'ll give you a **clear, step-by-step explanation** tailored to your CBSE syllabus. 🎯' }])
  const [input,    setInput]    = useState('')
  const [subject,  setSubject]  = useState('Mathematics')
  const [loading,  setLoading]  = useState(false)
  const [err,      setErr]      = useState('')
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const SYSTEM = `You are an expert CBSE teacher specializing in ${subject}. 
Help students understand concepts clearly with step-by-step explanations.
Use simple language, examples and analogies appropriate for CBSE students.
Always be encouraging and supportive. Use **bold** for key terms only.`

  async function send() {
    if (!input.trim()) return
    const userMsg = { role: 'user', content: input.trim() }
    setMessages(m => [...m, userMsg]); setInput(''); setErr(''); setLoading(true)
    try {
      const r = await api.post('/api/ai/doubt', { messages: [...messages, userMsg], system: SYSTEM, subject })
      setMessages(m => [...m, { role: 'assistant', content: r.content }])
    } catch (e) {
      if (e.status === 402) setErr('Free trial ended. Please subscribe.')
      else setErr(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ padding: 24, maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <PageHeader icon="🤔" title="AI Doubt Solver" subtitle="Ask anything — get clear, step-by-step CBSE explanations" color="#6366F1" />

      <div style={{ marginBottom: 14 }}>
        <BSSelect value={subject} onChange={setSubject} options={SUBJECTS} style={{ maxWidth: 220 }} />
      </div>

      {/* Chat area */}
      <div style={{ ...T.card, flex: 1, overflowY: 'auto', marginBottom: 14, minHeight: 200, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text)' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🤔</div>
            <h3 style={{ color: 'var(--text-h)', fontFamily: "'Sora', sans-serif" }}>Ask any doubt in {subject}</h3>
            <p style={{ fontSize: 14 }}>Get instant, detailed explanations tailored to the CBSE syllabus</p>
          </div>
        ) : messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: 10 }}>
            {m.role === 'assistant' && (
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, marginTop: 2 }}>🧠</div>
            )}
            <div style={{ maxWidth: '78%', padding: '11px 15px', borderRadius: m.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px', fontSize: 14, lineHeight: 1.75,
              background: m.role === 'user' ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'var(--code-bg)',
              color: m.role === 'user' ? '#fff' : 'var(--text-h)',
              border: m.role === 'assistant' ? '1px solid var(--border)' : 'none' }}
              dangerouslySetInnerHTML={{ __html: m.role === 'assistant' ? m.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') : m.content }}>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🧠</div>
            <div style={{ background: 'var(--code-bg)', padding: '12px 16px', borderRadius: '4px 14px 14px 14px', border: '1px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 1, 2].map(j => <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: `dotBounce 1s ${j * .2}s infinite ease-in-out` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ErrMsg msg={err} />
      <div style={{ display: 'flex', gap: 10 }}>
        <input style={{ ...T.input, flex: 1 }} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={`Ask a ${subject} question... (Enter to send)`} disabled={loading} />
        <PrimaryBtn onClick={send} disabled={loading || !input.trim()}>Send →</PrimaryBtn>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  NOTES MAKER
// ══════════════════════════════════════════════════════════════
function NotesMaker({ user }) {
  const [subject,  setSubject]  = useState('Mathematics')
  const [cls,      setCls]      = useState('Class 10')
  const [chapter,  setChapter]  = useState('')
  const [customCh, setCustomCh] = useState('')
  const [style_,   setStyle_]   = useState('Detailed')
  const [result,   setResult]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [err,      setErr]      = useState('')
  const chapters    = getChapters(subject, cls)
  const finalChapter = chapter || customCh || chapters[0]

  const buildPrompt = () => `You are a senior CBSE textbook author. Write comprehensive, exam-ready study notes for "${finalChapter}" — ${subject} ${cls} CBSE. Style: ${style_}. TARGET: 900-1200 words covering EVERY important concept.

# ${finalChapter}
**Subject:** ${subject} | **Class:** ${cls} | **Board:** CBSE

## 1. Introduction & Context
## 2. Core Concepts
## 3. Important Formulas, Laws & Rules
## 4. Solved Examples
## 5. Exam-Style Questions
## 6. Quick Revision Points ⚡
## 7. Common Mistakes ⚠️
## 8. Previous Year CBSE Questions

MANDATORY: Cover EVERY subtopic. Minimum 900 words. Use **bold** for key terms only.`

  async function generate() {
    if (!finalChapter) return
    setErr(''); setLoading(true); setSaved(false)
    try {
      const r = await api.post('/api/ai/notes', { messages: [{ role: 'user', content: buildPrompt() }], subject, chapter: finalChapter })
      setResult(r.content)
    } catch (e) {
      if (e.status === 402) setErr('Free trial ended. Please subscribe.')
      else setErr(e.message)
    } finally { setLoading(false) }
  }

  async function saveNote() {
    try { await api.post('/api/user/notes', { subject, classLevel: cls, chapter: finalChapter, style: style_, content: result }); setSaved(true) }
    catch (e) { alert(e.message) }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <PageHeader icon="📖" title="Chapter Notes Maker" subtitle="Textbook-quality comprehensive notes — download or print as PDF" color="#10B981" />
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 4 }}>
          <Field label="Subject"><BSSelect value={subject} onChange={v => { setSubject(v); setChapter('') }} options={SUBJECTS} /></Field>
          <Field label="Class"><BSSelect value={cls} onChange={setCls} options={CLASSES} /></Field>
        </div>
        <Field label="Chapter">
          <BSSelect value={chapter} onChange={setChapter} options={[{ value: '', label: '-- Select Chapter --' }, ...chapters.map(c => ({ value: c, label: c }))]} />
        </Field>
        {!chapter && <Field label="Or enter chapter name manually">
          <BSInput value={customCh} onChange={setCustomCh} placeholder="e.g. Gravitation" />
        </Field>}
        <Field label="Notes Style">
          <BSSelect value={style_} onChange={setStyle_} options={['Detailed', 'Concise', 'Bullet Points', 'Q&A Format', 'Mind Map Style']} />
        </Field>
        <PrimaryBtn onClick={generate} disabled={loading || (!chapter && !customCh)} color="#10B981">
          {loading ? <><Spinner /> Generating notes...</> : '📖 Generate Comprehensive Notes'}
        </PrimaryBtn>
      </Card>
      <ErrMsg msg={err} />
      {result && <>
        <ContentBox content={result} label={`${finalChapter} Notes — ${subject} ${cls}`}
          downloadName={`${finalChapter}-notes.txt`}
          onDownload={() => downloadText(result, `${finalChapter}-notes.txt`)} />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {!saved ? <GhostBtn small onClick={saveNote}>💾 Save to Library</GhostBtn> : <SuccessMsg msg="Saved to Library!" />}
        </div>
      </>}
      <XPBadge amount={20} label="per notes generated" />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  CHEAT SHEET MAKER  (student only)
// ══════════════════════════════════════════════════════════════
function CheatSheetMaker({ user }) {
  const [subject,  setSubject]  = useState('Mathematics')
  const [cls,      setCls]      = useState('Class 10')
  const [chapters, setChapters] = useState([])
  const [examDate, setExamDate] = useState('')
  const [result,   setResult]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [err,      setErr]      = useState('')

  const buildPrompt = () => `You are the world's best CBSE exam preparation expert.
A student has a few hours before their exam. Create a COMPREHENSIVE 6-7 page exam cheat sheet.
Subject: ${subject} | Class: ${cls} | Chapters: ${chapters.join(', ')}${examDate ? ` | Exam: ${examDate}` : ''}
MINIMUM 2500 words. Cover EVERYTHING.

# 🎯 EXAM CHEAT SHEET: ${subject} — ${cls}
## ⏱️ 3-HOUR STUDY STRATEGY
${chapters.map(ch => `## 📚 ${ch}\n### Key Formulas\n### Must-Know Definitions\n### Top 15 Exam Questions + Answers\n### Common Mistakes`).join('\n\n')}
## 📊 FINAL EXAM STRATEGY`

  async function generate() {
    if (chapters.length === 0) return alert('Please select at least one chapter')
    setErr(''); setLoading(true); setSaved(false)
    try {
      const r = await api.post('/api/ai/cheatsheet', { messages: [{ role: 'user', content: buildPrompt() }], subject, chapters })
      setResult(r.content)
    } catch (e) {
      if (e.status === 402) setErr('Free trial ended. Please subscribe.')
      else setErr(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <PageHeader icon="📋" title="3-Hour Exam Cheat Sheet" subtitle="6-7 pages of exam-focused material: top questions, formulas, predictions, scoring strategy" color="#F97316" />
        <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 800, fontFamily: "'Sora', sans-serif", flexShrink: 0, height: 'fit-content' }}>STUDENT ONLY</span>
      </div>
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 4 }}>
          <Field label="Subject"><BSSelect value={subject} onChange={v => { setSubject(v); setChapters([]) }} options={SUBJECTS} /></Field>
          <Field label="Class"><BSSelect value={cls} onChange={v => { setCls(v); setChapters([]) }} options={CLASSES} /></Field>
        </div>
        <Field label="Select Chapters (choose all chapters in your exam)">
          <ChapterSelector subject={subject} cls={cls} selected={chapters} onChange={setChapters} />
        </Field>
        <Field label="Exam Date (optional)">
          <input type="date" style={{ ...T.input, maxWidth: 220 }} value={examDate} onChange={e => setExamDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
        </Field>
        <PrimaryBtn onClick={generate} disabled={loading || chapters.length === 0} gradient="linear-gradient(135deg, #F97316, #F59E0B)">
          {loading ? <><Spinner /> Generating cheat sheet...</> : `🎯 Generate Cheat Sheet (${chapters.length} chapter${chapters.length !== 1 ? 's' : ''})`}
        </PrimaryBtn>
      </Card>
      <ErrMsg msg={err} />
      {result && <>
        <ContentBox content={result} label={`Exam Cheat Sheet — ${subject} | ${chapters.join(', ')}`}
          downloadName={`cheatsheet-${subject}-${cls}.txt`}
          onDownload={() => downloadText(result, `cheatsheet-${subject}-${cls}.txt`)} />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {!saved ? <GhostBtn small onClick={async () => { try { await api.post('/api/user/cheatsheets', { subject, classLevel: cls, chapters, examDate, content: result }); setSaved(true) } catch (e) { alert(e.message) } }}>💾 Save to Library</GhostBtn>
            : <SuccessMsg msg="Saved to Library!" />}
        </div>
      </>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  QUESTION PAPER MAKER
// ══════════════════════════════════════════════════════════════
function QPMaker({ user }) {
  const [subject,  setSubject]  = useState('Mathematics')
  const [cls,      setCls]      = useState('Class 10')
  const [chapters, setChapters] = useState([])
  const [marks,    setMarks]    = useState('80')
  const [duration, setDuration] = useState('3 Hours')
  const [desc,     setDesc]     = useState('')
  const [result,   setResult]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [err,      setErr]      = useState('')

  async function generate() {
    if (chapters.length === 0) return alert('Please select at least one chapter')
    setErr(''); setLoading(true); setSaved(false)
    try {
      const prompt = `Create a complete, formal ${marks}-mark CBSE question paper.
Subject: ${subject} | Class: ${cls} | Duration: ${duration} | Chapters: ${chapters.join(', ')}
Special instructions: ${desc || 'Standard CBSE pattern'}
CRITICAL: Total = EXACTLY ${marks} marks. Plain text, no markdown.`
      const r = await api.post('/api/ai/paper', { messages: [{ role: 'user', content: prompt }], subject, chapters })
      setResult(r.content)
    } catch (e) {
      if (e.status === 402) setErr('Free trial ended. Please subscribe.')
      else setErr(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <PageHeader icon="📄" title="Question Paper Maker" subtitle="Generate multi-chapter CBSE papers — download and print" color="#8B5CF6" />
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 4 }}>
          <Field label="Subject"><BSSelect value={subject} onChange={v => { setSubject(v); setChapters([]) }} options={SUBJECTS} /></Field>
          <Field label="Class"><BSSelect value={cls} onChange={v => { setCls(v); setChapters([]) }} options={CLASSES} /></Field>
          <Field label="Total Marks"><BSSelect value={marks} onChange={setMarks} options={['10','20','25','30','40','50','60','70','80','100']} /></Field>
          <Field label="Duration"><BSSelect value={duration} onChange={setDuration} options={['30 min','45 min','1 Hour','1.5 Hours','2 Hours','2.5 Hours','3 Hours']} /></Field>
        </div>
        <Field label="Select Chapters">
          <ChapterSelector subject={subject} cls={cls} selected={chapters} onChange={setChapters} />
        </Field>
        <Field label="Additional Instructions (optional)">
          <BSTextarea value={desc} onChange={setDesc} rows={2} placeholder="e.g. 'Focus on derivations', 'Half-yearly exam style'" />
        </Field>
        <PrimaryBtn onClick={generate} disabled={loading || chapters.length === 0} color="#8B5CF6">
          {loading ? <><Spinner /> Generating paper...</> : `📄 Generate ${marks}M Paper (${chapters.length} chapter${chapters.length !== 1 ? 's' : ''})`}
        </PrimaryBtn>
      </Card>
      <ErrMsg msg={err} />
      {result && <>
        <ContentBox content={result} label={`${subject} ${cls} — ${marks}M Question Paper`}
          downloadName={`${subject}-${marks}marks-paper.txt`}
          onDownload={() => downloadText(result, `${subject}-${cls}-${marks}M-paper.txt`)} />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {!saved ? <GhostBtn small onClick={async () => { try { await api.post('/api/user/papers', { subject, classLevel: cls, chapters, marks: parseInt(marks), duration, description: desc, content: result }); setSaved(true) } catch (e) { alert(e.message) } }}>💾 Save Paper</GhostBtn>
            : <SuccessMsg msg="Saved!" />}
        </div>
      </>}
      <XPBadge amount={25} label="per paper generated" />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  LESSON PLANNER  (teacher only)
// ══════════════════════════════════════════════════════════════
function LessonPlanner({ user }) {
  const [subject,  setSubject]  = useState('Mathematics')
  const [topic,    setTopic]    = useState('')
  const [cls,      setCls]      = useState('Class 9')
  const [duration, setDuration] = useState(45)
  const [notes,    setNotes]    = useState('')
  const [result,   setResult]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [err,      setErr]      = useState('')
  const [rating,   setRating]   = useState(0)

  const buildPrompt = () => `You are a world-class master teacher and pedagogy expert.
Create an exceptional, fully detailed lesson plan for "${topic}" — ${subject} ${cls} — ${duration} minutes.
Teacher's notes: ${notes || 'Standard classroom'}
MINIMUM 1500 words. Every instruction must be immediately actionable.

# 🎓 MASTER LESSON PLAN: ${topic}
## ⚡ LESSON SNAPSHOT
## ⏱️ MINUTE-BY-MINUTE PLAN
### 🚀 OPENING: Hook & Connect [0:00 – ${Math.round(duration * .1)}:00]
### 📖 MAIN TEACHING
### 🔧 WORKED EXAMPLES
### 💬 SOCRATIC QUESTIONS
### 🎯 CLOSING
## 🏆 MAKING THIS CLASS UNFORGETTABLE
## 📊 CONTINUOUS ASSESSMENT`

  async function generate() {
    if (!topic.trim()) return alert('Please enter a topic')
    setErr(''); setLoading(true); setSaved(false); setRating(0)
    try {
      const r = await api.post('/api/ai/lessonplan', { messages: [{ role: 'user', content: buildPrompt() }], subject, chapter: topic })
      setResult(r.content)
    } catch (e) {
      if (e.status === 402) setErr('Free trial ended. Please subscribe.')
      else setErr(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
        <PageHeader icon="🎓" title="AI Lesson Planner" subtitle="Minute-by-minute plans with teaching scripts, real-world examples, and Socratic questions" color="#7C3AED" />
        <span style={{ background: '#7C3AED', color: '#fff', borderRadius: 20, padding: '2px 12px', fontSize: 11, fontWeight: 800, fontFamily: "'Sora', sans-serif", flexShrink: 0, height: 'fit-content', marginTop: 6 }}>TEACHER ONLY</span>
      </div>
      <Card style={{ marginBottom: 18, borderColor: '#7C3AED' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 4 }}>
          <Field label="Subject"><BSSelect value={subject} onChange={setSubject} options={SUBJECTS} /></Field>
          <Field label="Class"><BSSelect value={cls} onChange={setCls} options={CLASSES} /></Field>
        </div>
        <Field label="Topic to Teach">
          <BSInput value={topic} onChange={setTopic} placeholder="e.g. Quadratic Equations, Photosynthesis, French Revolution" />
        </Field>
        <Field label={`Teaching Duration: ${duration} minutes`}>
          <input type="range" min={20} max={90} step={5} value={duration} onChange={e => setDuration(+e.target.value)}
            style={{ width: '100%', accentColor: '#7C3AED', marginBottom: 4 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text)', fontWeight: 600 }}>
            <span>20 min</span><span style={{ fontWeight: 800, color: '#7C3AED' }}>{duration} min</span><span>90 min</span>
          </div>
        </Field>
        <Field label="Your Notes (optional)">
          <BSTextarea value={notes} onChange={setNotes} rows={3} placeholder="e.g. 'Students already know linear equations. I want real-world engineering examples.'" />
        </Field>
        <PrimaryBtn onClick={generate} disabled={loading || !topic.trim()} gradient="linear-gradient(135deg, #7C3AED, #6366F1)">
          {loading ? <><Spinner /> Crafting your lesson plan...</> : '🎓 Generate Master Lesson Plan'}
        </PrimaryBtn>
      </Card>
      <ErrMsg msg={err} />
      {result && <>
        <ContentBox content={result} label={`Lesson Plan: ${topic} — ${subject} ${cls}`}
          downloadName={`lesson-${topic.replace(/\s+/g, '-')}.txt`}
          onDownload={() => downloadText(result, `lesson-plan-${topic.replace(/\s+/g, '-')}-${duration}min.txt`)} />
        <Card style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>How was this plan?</span>
          {[1, 2, 3, 4, 5].map(n => (
            <span key={n} onClick={() => setRating(n)} style={{ fontSize: 22, cursor: 'pointer', opacity: n <= rating ? 1 : .3, transition: 'opacity .2s' }}>⭐</span>
          ))}
          {rating > 0 && <span style={{ fontSize: 12.5, color: '#16a34a', fontWeight: 700 }}>Thank you!</span>}
        </Card>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {!saved ? <GhostBtn small onClick={async () => { try { await api.post('/api/user/lessonplans', { subject, topic, classLevel: cls, durationMinutes: duration, customPrompt: notes, content: result }); setSaved(true) } catch (e) { alert(e.message) } }}>💾 Save to Library</GhostBtn>
            : <SuccessMsg msg="Saved!" />}
        </div>
      </>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  QUIZ GENERATOR
// ══════════════════════════════════════════════════════════════
function QuizGenerator({ user }) {
  const [subject,   setSubject]   = useState('Mathematics')
  const [topic,     setTopic]     = useState('')
  const [diff,      setDiff]      = useState('Medium')
  const [num,       setNum]       = useState('10')
  const [quiz,      setQuiz]      = useState(null)
  const [answers,   setAnswers]   = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [err,       setErr]       = useState('')

  const PROMPT = `Generate a ${num}-question multiple choice quiz on "${topic}" in ${subject}. Difficulty: ${diff}. CBSE Class-appropriate.
Return ONLY valid JSON (no markdown, no explanation):
{"title":"${topic} Quiz","questions":[{"q":"Question text?","options":["A","B","C","D"],"answer":0,"explanation":"Brief explanation"}]}`

  async function generate() {
    if (!topic.trim()) return alert('Enter a topic')
    setErr(''); setLoading(true); setQuiz(null); setAnswers({}); setSubmitted(false)
    try {
      const r = await api.post('/api/ai/quiz', { messages: [{ role: 'user', content: PROMPT }], subject, chapter: topic })
      setQuiz(JSON.parse(r.content.replace(/```json|```/g, '').trim()))
    } catch (e) {
      if (e.status === 402) setErr('Free trial ended. Please subscribe.')
      else setErr('Failed to generate quiz. Try again.')
    } finally { setLoading(false) }
  }

  async function submit() {
    setSubmitted(true)
    const correct = quiz.questions.filter((q, i) => answers[i] === q.answer).length
    const xpEarned = Math.round((correct / quiz.questions.length) * 50) + 5
    try { await api.post('/api/user/quiz-history', { subject, topic, difficulty: diff, totalQuestions: quiz.questions.length, correctAnswers: correct, xpEarned, isPerfect: correct === quiz.questions.length }) }
    catch {}
  }

  const score = submitted ? quiz.questions.filter((q, i) => answers[i] === q.answer).length : 0
  const pct   = submitted ? Math.round((score / quiz.questions.length) * 100) : 0

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <PageHeader icon="🎯" title="Quiz Generator" subtitle="Auto-generate MCQ quizzes with instant scoring and explanations" color="#F59E0B" />
      {!quiz ? (
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 4 }}>
            <Field label="Subject"><BSSelect value={subject} onChange={setSubject} options={SUBJECTS} /></Field>
            <Field label="Questions"><BSSelect value={num} onChange={setNum} options={['5', '8', '10', '15', '20']} /></Field>
          </div>
          <Field label="Topic">
            <BSInput value={topic} onChange={setTopic} placeholder="e.g. Quadratic Equations, World War II" />
          </Field>
          <Field label="Difficulty">
            <BSSelect value={diff} onChange={setDiff} options={['Easy', 'Medium', 'Hard', 'Mixed']} />
          </Field>
          <ErrMsg msg={err} />
          <PrimaryBtn onClick={generate} disabled={loading || !topic.trim()} color="#F59E0B" style={{ marginTop: 4 }}>
            {loading ? <><Spinner /> Generating...</> : '✨ Generate Quiz'}
          </PrimaryBtn>
        </Card>
      ) : (
        <div>
          {submitted && (
            <div style={{ background: `linear-gradient(135deg, ${pct >= 80 ? '#F97316' : pct >= 50 ? '#F59E0B' : '#EF4444'}, ${pct >= 80 ? '#FB923C' : pct >= 50 ? '#FBBF24' : '#F87171'})`, borderRadius: 18, padding: 24, textAlign: 'center', color: '#fff', marginBottom: 18 }}>
              <div style={{ fontSize: 48, marginBottom: 6 }}>{pct === 100 ? '🏆' : pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚'}</div>
              <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 900, margin: '0 0 6px' }}>{score}/{quiz.questions.length}</h3>
              <p style={{ opacity: .9, marginBottom: 10 }}>{pct === 100 ? 'Perfect score!' : pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Good effort!' : 'Keep practicing!'}</p>
              <div style={{ background: 'rgba(255,255,255,.2)', padding: '4px 16px', borderRadius: 20, display: 'inline-block', fontWeight: 700, fontSize: 13 }}>+{Math.round((score / quiz.questions.length) * 50) + 5} XP ⚡</div>
              <br /><br />
              <GhostBtn small onClick={() => { setQuiz(null); setAnswers({}); setSubmitted(false) }} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff' }}>New Quiz</GhostBtn>
            </div>
          )}

          <h3 style={{ marginBottom: 18, fontFamily: "'Sora', sans-serif", color: 'var(--text-h)' }}>{quiz.title}</h3>
          {quiz.questions.map((q, i) => {
            const selected = answers[i]
            const correct  = q.answer
            const isRight  = submitted && selected === correct
            const isWrong  = submitted && selected !== undefined && selected !== correct
            return (
              <Card key={i} style={{ marginBottom: 14, borderLeft: submitted ? `4px solid ${isRight ? '#22c55e' : isWrong ? '#ef4444' : 'var(--border)'}` : 'none' }}>
                <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14.5, color: 'var(--text-h)' }}><span style={{ color: 'var(--accent)' }}>Q{i + 1}.</span> {q.q}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {q.options.map((opt, j) => {
                    const isSelected = selected === j
                    const isAnswer   = j === correct
                    let bg = 'var(--social-bg)', border = 'var(--border)', color = 'var(--text-h)'
                    if (submitted) {
                      if (isAnswer)                             { bg = '#dcfce7'; border = '#86efac'; color = '#166534' }
                      else if (isSelected && !isAnswer)         { bg = '#fee2e2'; border = '#fca5a5'; color = '#991b1b' }
                    } else if (isSelected) { bg = 'var(--accent-bg)'; border = 'var(--accent)'; color = 'var(--accent)' }
                    return (
                      <button key={j} disabled={submitted} onClick={() => setAnswers(a => ({ ...a, [i]: j }))}
                        style={{ padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${border}`, background: bg, color, cursor: submitted ? 'default' : 'pointer', textAlign: 'left', fontSize: 13.5, fontFamily: "'Nunito', sans-serif", fontWeight: 600, transition: 'all .15s' }}>
                        <span style={{ fontWeight: 800, marginRight: 4 }}>{String.fromCharCode(65 + j)}.</span>{opt}
                        {submitted && isAnswer && ' ✓'}
                      </button>
                    )
                  })}
                </div>
                {submitted && q.explanation && (
                  <div style={{ marginTop: 11, padding: '9px 13px', background: 'var(--code-bg)', borderRadius: 9, fontSize: 13, color: 'var(--text)' }}>
                    💡 {q.explanation}
                  </div>
                )}
              </Card>
            )
          })}
          {!submitted && (
            <PrimaryBtn onClick={submit} disabled={Object.keys(answers).length < quiz.questions.length} color="#F59E0B">
              Submit ({Object.keys(answers).length}/{quiz.questions.length} answered) →
            </PrimaryBtn>
          )}
        </div>
      )}
      <XPBadge amount="5–50" label="per quiz" />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  FLASHCARD MAKER
// ══════════════════════════════════════════════════════════════
function FlashCards({ user }) {
  const [subject, setSubject] = useState('Mathematics')
  const [cls,     setCls]     = useState('Class 10')
  const [topic,   setTopic]   = useState('')
  const [cards,   setCards]   = useState([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState({})
  const [mode,    setMode]    = useState('grid')
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')

  const PROMPT = `Create 15 high-quality flashcards for "${topic}" in ${subject} ${cls} CBSE.
Return ONLY valid JSON (no markdown):
{"cards":[{"front":"Term or Question","back":"Definition or Answer (2-3 sentences max)"}]}`

  async function generate() {
    if (!topic.trim()) return alert('Enter a topic')
    setErr(''); setLoading(true); setCurrent(0); setFlipped({})
    try {
      const r = await api.post('/api/ai/flashcards', { messages: [{ role: 'user', content: PROMPT }], subject, chapter: topic })
      const parsed = JSON.parse(r.content.replace(/```json|```/g, '').trim())
      setCards(parsed.cards || [])
    } catch (e) {
      if (e.status === 402) setErr('Free trial ended. Please subscribe.')
      else setErr('Failed to generate flashcards.')
    } finally { setLoading(false) }
  }

  const card = cards[current]

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <PageHeader icon="🃏" title="Flashcards" subtitle="Grid mode & Study mode for fast revision" color="#EF4444" />
      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 4 }}>
          <Field label="Subject"><BSSelect value={subject} onChange={setSubject} options={SUBJECTS} /></Field>
          <Field label="Class"><BSSelect value={cls} onChange={setCls} options={CLASSES} /></Field>
        </div>
        <Field label="Topic">
          <BSInput value={topic} onChange={setTopic} placeholder="e.g. Chemical Bonding, Mughal Empire" />
        </Field>
        <ErrMsg msg={err} />
        <PrimaryBtn onClick={generate} disabled={loading || !topic.trim()} color="#EF4444">
          {loading ? <><Spinner /> Creating cards...</> : '🃏 Generate Flashcards'}
        </PrimaryBtn>
      </Card>

      {cards.length > 0 && <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--text-h)', margin: 0 }}>{topic} — {cards.length} Cards</h3>
          <div style={{ display: 'flex', gap: 7 }}>
            {[['grid', '⊞ Grid'], ['study', '▶ Study']].map(([m, l]) => (
              <button key={m} onClick={() => setMode(m)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", background: mode === m ? '#EF4444' : 'var(--social-bg)', color: mode === m ? '#fff' : 'var(--text-h)', transition: 'all .15s' }}>{l}</button>
            ))}
          </div>
        </div>

        {mode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: 14 }}>
            {cards.map((c, i) => (
              <div key={i} onClick={() => setFlipped(f => ({ ...f, [i]: !f[i] }))} style={{ height: 130, borderRadius: 14, cursor: 'pointer', perspective: 1000 }}>
                <div style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transition: 'transform .5s', transform: flipped[i] ? 'rotateY(180deg)' : 'none' }}>
                  <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', background: 'linear-gradient(135deg, #EF4444, #F97316)', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 14, textAlign: 'center' }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,.7)', fontWeight: 800, marginBottom: 7, letterSpacing: 1 }}>TAP TO REVEAL</span>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: 13.5, lineHeight: 1.4 }}>{c.front}</span>
                  </div>
                  <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'var(--bg)', borderRadius: 14, border: '2px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, textAlign: 'center' }}>
                    <span style={{ color: 'var(--text-h)', fontWeight: 700, fontSize: 13, lineHeight: 1.5 }}>{c.back}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 8, fontWeight: 700 }}>Card {current + 1} of {cards.length}</div>
            <div style={{ background: 'var(--border)', borderRadius: 999, height: 5, margin: '0 auto 18px', maxWidth: 240 }}>
              <div style={{ background: '#EF4444', width: `${((current + 1) / cards.length) * 100}%`, height: '100%', borderRadius: 999 }} />
            </div>
            <div onClick={() => setFlipped(f => ({ ...f, [current]: !f[current] }))} style={{ height: 180, background: flipped[current] ? 'var(--bg)' : 'linear-gradient(135deg, #EF4444, #F97316)', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: flipped[current] ? '2px solid #EF4444' : 'none', marginBottom: 18, padding: 24 }}>
              <span style={{ fontSize: 10, color: flipped[current] ? 'var(--text)' : 'rgba(255,255,255,.7)', fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>{flipped[current] ? 'ANSWER' : 'QUESTION — TAP TO FLIP'}</span>
              <span style={{ color: flipped[current] ? 'var(--text-h)' : '#fff', fontWeight: 800, fontSize: 16, lineHeight: 1.5 }}>{flipped[current] ? card.back : card.front}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <GhostBtn disabled={current === 0}             onClick={() => { setCurrent(c => c - 1); setFlipped({}) }}>← Prev</GhostBtn>
              <PrimaryBtn color="#EF4444"                     onClick={() => setFlipped(f => ({ ...f, [current]: !f[current] }))}>Flip</PrimaryBtn>
              <GhostBtn disabled={current === cards.length - 1} onClick={() => { setCurrent(c => c + 1); setFlipped({}) }}>Next →</GhostBtn>
            </div>
          </Card>
        )}
        <GhostBtn small onClick={() => setCards([])} style={{ marginTop: 14 }}>↺ New Flashcards</GhostBtn>
      </>}
      <XPBadge amount={15} label="per set" />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  ACHIEVEMENTS PAGE
// ══════════════════════════════════════════════════════════════
function AchievementsPage() {
  const [achs,   setAchs]   = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => { api.get('/api/user/achievements').then(setAchs).catch(() => {}) }, [])

  const unlocked = achs.filter(a => a.unlocked)
  const cats = ['all', 'unlocked', 'streak', 'xp', 'tools', 'special', 'legendary']
  const shown = achs.filter(a => filter === 'all' || (filter === 'unlocked' && a.unlocked) || a.category === filter)

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <PageHeader icon="🏆" title={`Achievements (${unlocked.length}/${achs.length})`} subtitle="Unlock achievements by completing activities and earning XP" color="#F59E0B" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            style={{ padding: '6px 16px', borderRadius: 20, border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", background: filter === c ? 'var(--accent)' : 'var(--social-bg)', color: filter === c ? '#fff' : 'var(--text-h)', transition: 'all .15s', textTransform: 'capitalize' }}>
            {c}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 13 }}>
        {shown.map(a => (
          <Card key={a.id} style={{ opacity: a.unlocked ? 1 : .5, borderColor: a.unlocked ? DIFF_COLORS[a.difficulty] : 'var(--border)', position: 'relative' }}>
            {a.unlocked && <div style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, background: '#22c55e', borderRadius: '50%' }} />}
            <div style={{ fontSize: 32, marginBottom: 8 }}>{a.unlocked ? a.emoji : '🔒'}</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-h)', marginBottom: 5, fontFamily: "'Sora', sans-serif" }}>{a.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text)', marginBottom: 10 }}>{a.description}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: DIFF_COLORS[a.difficulty], textTransform: 'capitalize' }}>{a.difficulty}</span>
              <span style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 700 }}>+{a.xp_reward} XP</span>
            </div>
            {a.unlocked && a.unlocked_at && <div style={{ fontSize: 10.5, color: 'var(--text)', marginTop: 6 }}>Unlocked {new Date(a.unlocked_at).toLocaleDateString('en-IN')}</div>}
          </Card>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  PROFILE PAGE
// ══════════════════════════════════════════════════════════════
function ProfilePage({ user, onUpdate }) {
  const [form, setForm] = useState({ name: user.name, bio: user.bio || '', phone: user.phone || '', classLevel: user.class_level || '', section: user.section || '', subjectSpecialization: user.subject_specialization || '' })
  const [ok,   setOk]   = useState(false)
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)
  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  async function save(e) {
    e.preventDefault(); setErr(''); setOk(false); setBusy(true)
    try {
      const updated = await api.put('/api/user/profile', { name: form.name, bio: form.bio, phone: form.phone, classLevel: form.classLevel, section: form.section, subjectSpecialization: form.subjectSpecialization })
      localStorage.setItem('bs_user', JSON.stringify(updated))
      onUpdate(updated); setOk(true)
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div style={{ padding: 24, maxWidth: 640, margin: '0 auto', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <PageHeader icon="👤" title="My Profile" subtitle="Update your personal information and preferences" color="#6366F1" />
      <Card style={{ marginBottom: 18, textAlign: 'center' }}>
        <div style={{ width: 66, height: 66, borderRadius: 18, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 14px', fontWeight: 900, color: '#fff' }}>
          {user.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ fontWeight: 800, color: 'var(--text-h)', fontSize: 17, fontFamily: "'Sora', sans-serif" }}>{user.name}</div>
        <div style={{ color: 'var(--text)', fontSize: 13.5, marginTop: 3 }}>{user.email}</div>
        <div style={{ marginTop: 10 }}>
          <span style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: 20, padding: '3px 14px', fontSize: 12.5, fontWeight: 700 }}>
            {user.type === 'school' ? `🏫 School ${user.role}` : `🌐 Personal ${user.role}`}
          </span>
        </div>
      </Card>

      <form onSubmit={save}>
        <Card>
          <Field label="Full Name"><BSInput value={form.name} onChange={set('name')} placeholder="Your full name" required /></Field>
          <Field label="Bio"><BSTextarea value={form.bio} onChange={set('bio')} placeholder="Tell us about yourself..." rows={2} /></Field>
          <Field label="Phone"><BSInput value={form.phone} onChange={set('phone')} placeholder="Optional" /></Field>
          {user.role === 'student' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Class"><BSSelect value={form.classLevel} onChange={set('classLevel')} options={[{ value: '', label: 'Select class' }, ...CLASSES.map(c => ({ value: c, label: c }))]} /></Field>
              <Field label="Section"><BSInput value={form.section} onChange={set('section')} placeholder="e.g. A" /></Field>
            </div>
          )}
          {user.role === 'teacher' && <Field label="Subject Specialization"><BSInput value={form.subjectSpecialization} onChange={set('subjectSpecialization')} placeholder="e.g. Mathematics, Physics" /></Field>}
          <ErrMsg msg={err} />
          {ok && <SuccessMsg msg="Profile updated successfully!" />}
          <PrimaryBtn style={{ marginTop: 8 }} disabled={busy}>
            {busy ? <><Spinner /> Saving...</> : '💾 Save Changes'}
          </PrimaryBtn>
        </Card>
      </form>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════════
export default function App() {
  useFonts()

  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('bs_user')) } catch { return null } })
  const [page, setPage] = useState('auth')
  const [tab,  setTab]  = useState('dashboard')

  useEffect(() => {
    if (!user) return
    api.get('/api/auth/me').then(u => { setUser(u); localStorage.setItem('bs_user', JSON.stringify(u)) })
      .catch(e => { if (e.code === 'SESSION_REPLACED') { alert('Signed in on another device.'); logout() } else if (e.status === 401) logout() })
  }, [])

  function handleAuth(data) {
    if (data === 'forgot') { setPage('forgot'); return }
    setUser(data); setPage('app'); setTab('dashboard')
  }

  function logout() {
    api.post('/api/auth/logout', {}).catch(() => {})
    localStorage.removeItem('bs_token'); localStorage.removeItem('bs_session'); localStorage.removeItem('bs_user')
    setUser(null); setPage('auth'); setTab('dashboard')
  }

  if (!user || page === 'auth') return <AuthPage onAuth={handleAuth} />
  if (page === 'forgot') return <ForgotPasswordPage onBack={() => setPage('auth')} />

  const isStudent = user.role === 'student'
  const isTeacher = user.role === 'teacher'

  const tabs = [
    { id: 'dashboard',  icon: '🏠', label: 'Dashboard',      color: '#6366F1' },
    { id: 'doubt',      icon: '🤔', label: 'Doubt Solver',   color: '#6366F1' },
    { id: 'notes',      icon: '📖', label: 'Notes',          color: '#10B981' },
    ...(isStudent ? [{ id: 'cheatsheet', icon: '📋', label: 'Cheat Sheet', color: '#F97316' }] : []),
    { id: 'paper',      icon: '📄', label: 'Question Paper', color: '#8B5CF6' },
    ...(isTeacher ? [{ id: 'lessonplan', icon: '🎓', label: 'Lesson Planner', color: '#7C3AED' }] : []),
    { id: 'quiz',       icon: '🎯', label: 'Quiz',           color: '#F59E0B' },
    { id: 'flashcards', icon: '🃏', label: 'Flashcards',     color: '#EF4444' },
  ]

  function navigateTo(t) { setTab(t) }

  const renderPage = () => {
    if (tab === 'subscription') return <SubscriptionPage user={user} onSuccess={() => { api.get('/api/auth/me').then(u => { setUser(u); localStorage.setItem('bs_user', JSON.stringify(u)) }); setTab('dashboard') }} onBack={() => setTab('dashboard')} />
    if (tab === 'achievements') return <AchievementsPage />
    if (tab === 'profile')      return <ProfilePage user={user} onUpdate={u => setUser(u)} />
    if (tab === 'dashboard')    return <Dashboard user={user} onNavigate={navigateTo} />
    if (tab === 'doubt')        return <DoubtSolver user={user} />
    if (tab === 'notes')        return <NotesMaker user={user} />
    if (tab === 'cheatsheet')   return <CheatSheetMaker user={user} />
    if (tab === 'paper')        return <QPMaker user={user} />
    if (tab === 'lessonplan')   return <LessonPlanner user={user} />
    if (tab === 'quiz')         return <QuizGenerator user={user} />
    if (tab === 'flashcards')   return <FlashCards user={user} />
    return <Dashboard user={user} onNavigate={navigateTo} />
  }

  const subExpired = user.subscription_status !== 'active' && user.free_tier_exhausted && user.type === 'personal'
  const activeColor = tabs.find(t => t.id === tab)?.color || '#6366F1'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', fontFamily: "'Nunito', sans-serif" }}>

      {/* Top nav */}
      <header style={{ borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58, position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg)', boxShadow: '0 2px 10px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setTab('dashboard')}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧠</div>
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 17, color: 'var(--text-h)' }}>BrainSpark<span style={{ color: '#6366F1' }}> AI</span></span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {user.type === 'personal' && user.subscription_status !== 'active' && (
            <PrimaryBtn small onClick={() => setTab('subscription')} gradient="linear-gradient(135deg, #6366F1, #8B5CF6)">⚡ Upgrade</PrimaryBtn>
          )}
          <button onClick={() => setTab('achievements')} title="Achievements"
            style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--social-bg)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏆</button>
          <button onClick={() => setTab('profile')} title="Profile"
            style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', cursor: 'pointer', fontSize: 14, fontWeight: 900, color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora', sans-serif" }}>
            {user.name?.[0]?.toUpperCase() || '?'}
          </button>
          <button onClick={logout}
            style={{ padding: '6px 13px', borderRadius: 9, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
            Sign Out
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <nav style={{ width: 205, borderRight: '1px solid var(--border)', padding: '14px 10px', background: 'var(--bg)', flexShrink: 0, position: 'sticky', top: 58, height: 'calc(100vh - 58px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {tabs.map(t => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                  background: active ? `linear-gradient(135deg, ${t.color}, ${t.color}bb)` : 'transparent',
                  color: active ? '#fff' : 'var(--text-h)',
                  fontWeight: active ? 800 : 600, fontSize: 13.5, textAlign: 'left', transition: 'all .15s' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--code-bg)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                <span style={{ fontSize: 17 }}>{t.icon}</span>
                {t.label}
              </button>
            )
          })}

          <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

          <button onClick={() => setTab('achievements')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif", background: tab === 'achievements' ? 'linear-gradient(135deg, #F59E0B, #FBBF24)' : 'transparent', color: tab === 'achievements' ? '#fff' : 'var(--text-h)', fontWeight: 600, fontSize: 13.5, textAlign: 'left', transition: 'all .15s' }}
            onMouseEnter={e => { if (tab !== 'achievements') e.currentTarget.style.background = 'var(--code-bg)' }}
            onMouseLeave={e => { if (tab !== 'achievements') e.currentTarget.style.background = 'transparent' }}>
            <span style={{ fontSize: 17 }}>🏆</span> Achievements
          </button>

          {user.type === 'school' && user.schools && (
            <div style={{ margin: '14px 4px 0', padding: '10px 12px', background: 'var(--accent-bg)', borderRadius: 10, fontSize: 11.5, border: '1px solid var(--accent-border)' }}>
              <div style={{ fontWeight: 800, color: 'var(--accent)', fontFamily: "'Sora', sans-serif" }}>🏫 {user.schools.name}</div>
              <div style={{ color: 'var(--text)', marginTop: 2 }}>{user.schools.school_code}</div>
            </div>
          )}
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          <div style={{ padding: '16px 24px 0' }}>
            <FreeTierBanner user={user} onSubscribe={() => setTab('subscription')} />
            {subExpired && tab !== 'subscription' && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 11, padding: '11px 18px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'Nunito', sans-serif" }}>
                <span style={{ color: '#dc2626', fontSize: 13.5, fontWeight: 700 }}>Your free trial has ended.</span>
                <PrimaryBtn small onClick={() => setTab('subscription')} color="#ef4444">Subscribe Now</PrimaryBtn>
              </div>
            )}
          </div>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
