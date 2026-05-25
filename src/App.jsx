/**
 * BrainSpark AI — Frontend v5.0
 * Complete merged app with all features
 *
 * REQUIRES in .env:
 *   VITE_API_URL=https://your-backend.onrender.com
 *   VITE_GOOGLE_CLIENT_ID=...
 *   VITE_MICROSOFT_CLIENT_ID=...
 *   VITE_RAZORPAY_KEY_ID=rzp_live_...
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ══════════════════════════════════════════════════════════════
//  FONT + STYLE INJECTION
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
    if (!document.getElementById('brainspark-styles')) {
      const style = document.createElement('style')
      style.id = 'brainspark-styles'
      style.textContent = `
        :root {
          --bg: #05050e; --bg2: #0b0b1e; --text: #64748b; --text-h: #e2e8f0;
          --border: rgba(255,255,255,.08); --accent: #6366F1;
          --accent-bg: rgba(99,102,241,.12); --accent-border: rgba(99,102,241,.22);
          --code-bg: rgba(255,255,255,.04); --social-bg: rgba(255,255,255,.04);
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--bg); color: var(--text-h); }
        @keyframes spin      { to { transform: rotate(360deg) } }
        @keyframes dotBounce { 0%,100%{opacity:.25;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes slideUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.5} }
        .brainspark-font { font-family: 'Nunito', system-ui, sans-serif; }
        @media (max-width: 768px) { .desktop-sidebar { display: none !important; } }
        @media (min-width: 769px) { .mobile-top-nav  { display: none !important; } }
      `
      document.head.appendChild(style)
    }
  }, [])
}

// ══════════════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════════════
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const FREE_WINDOW = 600 // 10 minutes in seconds

const SUBJECTS = ['Mathematics','Science','Physics','Chemistry','Biology','English','Hindi',
  'Social Science','History','Geography','Civics','Economics','Computer Science','Sanskrit','Environmental Science']

const CLASSES = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7',
  'Class 8','Class 9','Class 10','Class 11','Class 12']

const CBSE_CHAPTERS = {
  Mathematics: {
    'Class 9':  ['Number Systems','Polynomials','Coordinate Geometry','Linear Equations in Two Variables',"Euclid's Geometry",'Lines and Angles','Triangles','Quadrilaterals','Areas of Parallelograms and Triangles','Circles','Constructions',"Heron's Formula",'Surface Areas and Volumes','Statistics','Probability'],
    'Class 10': ['Real Numbers','Polynomials','Pair of Linear Equations in Two Variables','Quadratic Equations','Arithmetic Progressions','Triangles','Coordinate Geometry','Introduction to Trigonometry','Some Applications of Trigonometry','Circles','Constructions','Areas Related to Circles','Surface Areas and Volumes','Statistics','Probability'],
    'Class 11': ['Sets','Relations and Functions','Trigonometric Functions','Complex Numbers and Quadratic Equations','Linear Inequalities','Permutations and Combinations','Binomial Theorem','Sequences and Series','Straight Lines','Conic Sections','Introduction to Three Dimensional Geometry','Limits and Derivatives','Statistics','Probability'],
    'Class 12': ['Relations and Functions','Inverse Trigonometric Functions','Matrices','Determinants','Continuity and Differentiability','Application of Derivatives','Integrals','Application of Integrals','Differential Equations','Vector Algebra','Three Dimensional Geometry','Linear Programming','Probability'],
  },
  Science: {
    'Class 9':  ['Matter in Our Surroundings','Is Matter Around Us Pure?','Atoms and Molecules','Structure of the Atom','The Fundamental Unit of Life','Tissues','Diversity in Living Organisms','Motion','Force and Laws of Motion','Gravitation','Work and Energy','Sound','Why Do We Fall Ill?','Natural Resources','Improvement in Food Resources'],
    'Class 10': ['Chemical Reactions and Equations','Acids, Bases and Salts','Metals and Non-Metals','Carbon and its Compounds','Periodic Classification of Elements','Life Processes','Control and Coordination','How Do Organisms Reproduce?','Heredity and Evolution','Light - Reflection and Refraction','The Human Eye and the Colourful World','Electricity','Magnetic Effects of Electric Current','Sources of Energy','Our Environment','Management of Natural Resources'],
  },
  Physics: {
    'Class 11': ['Physical World','Units and Measurements','Motion in a Straight Line','Motion in a Plane','Laws of Motion','Work, Energy and Power','Systems of Particles and Rotational Motion','Gravitation','Mechanical Properties of Solids','Mechanical Properties of Fluids','Thermal Properties of Matter','Thermodynamics','Kinetic Theory','Oscillations','Waves'],
    'Class 12': ['Electric Charges and Fields','Electrostatic Potential and Capacitance','Current Electricity','Moving Charges and Magnetism','Magnetism and Matter','Electromagnetic Induction','Alternating Current','Electromagnetic Waves','Ray Optics and Optical Instruments','Wave Optics','Dual Nature of Radiation and Matter','Atoms','Nuclei','Semiconductor Electronics'],
  },
  Chemistry: {
    'Class 11': ['Some Basic Concepts of Chemistry','Structure of Atom','Classification of Elements and Periodicity','Chemical Bonding and Molecular Structure','States of Matter','Thermodynamics','Equilibrium','Redox Reactions','Hydrogen','The s-Block Elements','The p-Block Elements','Organic Chemistry: Basic Principles','Hydrocarbons'],
    'Class 12': ['The Solid State','Solutions','Electrochemistry','Chemical Kinetics','Surface Chemistry','General Principles of Isolation of Elements','The p-Block Elements','The d and f-Block Elements','Coordination Compounds','Haloalkanes and Haloarenes','Alcohols, Phenols and Ethers','Aldehydes, Ketones and Carboxylic Acids','Amines','Biomolecules','Polymers','Chemistry in Everyday Life'],
  },
  Biology: {
    'Class 11': ['The Living World','Biological Classification','Plant Kingdom','Animal Kingdom','Morphology of Flowering Plants','Anatomy of Flowering Plants','Structural Organisation in Animals','Cell: The Unit of Life','Biomolecules','Cell Cycle and Cell Division','Transport in Plants','Photosynthesis in Higher Plants','Cellular Respiration','Plant Growth and Development','Digestion and Absorption','Breathing and Exchange of Gases','Body Fluids and Circulation','Neural Control and Coordination','Chemical Coordination and Integration'],
    'Class 12': ['Sexual Reproduction in Flowering Plants','Human Reproduction','Reproductive Health','Principles of Inheritance and Variation','Molecular Basis of Inheritance','Evolution','Human Health and Disease','Biotechnology: Principles and Processes','Biotechnology and its Applications','Organisms and Populations','Ecosystem','Biodiversity and Conservation','Environmental Issues'],
  },
}

const getChapters = (subject, cls) =>
  CBSE_CHAPTERS[subject]?.[cls] || Array.from({ length: 15 }, (_, i) => `Chapter ${i + 1}`)

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
const GRADS = ['135deg,#6366F1,#8B5CF6','135deg,#f59e0b,#ef4444','135deg,#06b6d4,#6366F1','135deg,#34d399,#2563eb','135deg,#a855f7,#ef4444','135deg,#ec4899,#6366F1']

// ══════════════════════════════════════════════════════════════
//  HOOKS
// ══════════════════════════════════════════════════════════════
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 769)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 769)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

function getSecondsRemaining(freeStartedAt) {
  if (!freeStartedAt) return FREE_WINDOW
  const elapsed = Math.floor((Date.now() - new Date(freeStartedAt)) / 1000)
  return Math.max(0, FREE_WINDOW - elapsed)
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
  async patch(path, body = {}) {
    const r = await fetch(`${API_URL}${path}`, { method: 'PATCH', headers: this.headers(), body: JSON.stringify(body) })
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
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:'Georgia',serif;max-width:800px;margin:40px auto;padding:0 20px;color:#111;line-height:1.7}h1{color:#6366F1}h2{color:#374151;border-bottom:2px solid #E5E7EB;padding-bottom:6px}strong{color:#111}@media print{@page{margin:.8in}}</style></head><body>${html}<script>setTimeout(()=>{window.print()},400)<\/script></body></html>`)
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

const timeAgo = t => {
  const d = (Date.now() - new Date(t)) / 1000
  if (d < 60) return 'just now'
  if (d < 3600) return `${Math.floor(d / 60)}m ago`
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`
  return `${Math.floor(d / 86400)}d ago`
}

// ══════════════════════════════════════════════════════════════
//  DESIGN TOKENS
// ══════════════════════════════════════════════════════════════
const T = {
  card:   { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,.12)' },
  label:  { display:'block', fontSize:'10.5px', fontWeight:800, color:'var(--text)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:'6px', fontFamily:"'Nunito', sans-serif" },
  input:  { width:'100%', padding:'10px 14px', borderRadius:'10px', border:'1.5px solid var(--border)', background:'var(--code-bg)', color:'var(--text-h)', fontSize:'14px', fontFamily:"'Nunito', sans-serif", boxSizing:'border-box', outline:'none', transition:'border-color .2s' },
  select: { width:'100%', padding:'10px 14px', borderRadius:'10px', border:'1.5px solid var(--border)', background:'var(--code-bg)', color:'var(--text-h)', fontSize:'14px', fontFamily:"'Nunito', sans-serif", appearance:'auto', outline:'none', cursor:'pointer' },
}

// ══════════════════════════════════════════════════════════════
//  BASE UI COMPONENTS
// ══════════════════════════════════════════════════════════════
function PageHeader({ icon, title, subtitle, color }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:3 }}>
        <span style={{ fontSize:26 }}>{icon}</span>
        <h2 style={{ fontFamily:"'Sora', sans-serif", fontWeight:900, fontSize:'clamp(1.1rem,2.5vw,1.45rem)', color:'var(--text-h)', margin:0 }}>{title}</h2>
      </div>
      {subtitle && <p style={{ color:'var(--text)', fontSize:13, margin:0, paddingLeft:36 }}>{subtitle}</p>}
      <div style={{ height:3, width:44, background:color||'var(--accent)', borderRadius:2, marginTop:8, marginLeft:36 }}/>
    </div>
  )
}
function Card({ children, style={} }) { return <div style={{ ...T.card, ...style }}>{children}</div> }
function Label({ children }) { return <div style={T.label}>{children}</div> }
function PrimaryBtn({ children, onClick, disabled, color='var(--accent)', small, style={}, gradient }) {
  const bg = gradient || `linear-gradient(135deg, ${color}, ${color}cc)`
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background:bg, color:'#fff', padding:small?'7px 14px':'11px 22px', borderRadius:small?9:11, border:'none', fontWeight:800, fontSize:small?12.5:14.5, cursor:disabled?'not-allowed':'pointer', display:'inline-flex', alignItems:'center', gap:6, fontFamily:"'Nunito', sans-serif", opacity:disabled?.6:1, transition:'opacity .15s', ...style }}
      onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.opacity='.88' }}
      onMouseLeave={e=>{ e.currentTarget.style.opacity='1' }}>
      {children}
    </button>
  )
}
function OutlineBtn({ children, onClick, disabled, color='var(--accent)', small, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background:'var(--code-bg)', color, padding:small?'6px 13px':'9px 18px', borderRadius:small?9:10, border:`2px solid ${color}`, fontWeight:700, fontSize:small?12.5:14, cursor:disabled?'not-allowed':'pointer', display:'inline-flex', alignItems:'center', gap:5, fontFamily:"'Nunito', sans-serif", opacity:disabled?.6:1, ...style }}>
      {children}
    </button>
  )
}
function GhostBtn({ children, onClick, disabled, small, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background:'var(--social-bg)', color:'var(--text-h)', padding:small?'6px 12px':'9px 16px', borderRadius:small?8:10, border:'1px solid var(--border)', fontWeight:700, fontSize:small?12.5:14, cursor:disabled?'not-allowed':'pointer', display:'inline-flex', alignItems:'center', gap:5, fontFamily:"'Nunito', sans-serif", opacity:disabled?.6:1, ...style }}>
      {children}
    </button>
  )
}
function Field({ label, children }) {
  return <div style={{ marginBottom:14 }}><Label>{label}</Label>{children}</div>
}
function BSInput({ value, onChange, placeholder, type='text', required, disabled, style={} }) {
  const [focused, setFocused] = useState(false)
  return (
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type}
      required={required} disabled={disabled}
      style={{ ...T.input, borderColor:focused?'var(--accent)':'var(--border)', ...style }}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}/>
  )
}
function BSSelect({ value, onChange, options, style={} }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)} style={{ ...T.select, ...style }}>
      {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
    </select>
  )
}
function BSTextarea({ value, onChange, placeholder, rows=4, style={} }) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ ...T.input, resize:'vertical', lineHeight:1.6, borderColor:focused?'var(--accent)':'var(--border)', ...style }}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}/>
  )
}
function Spinner({ size=16 }) {
  return <div style={{ width:size, height:size, border:`2px solid rgba(255,255,255,.15)`, borderTopColor:'white', borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }}/>
}
function PageSpinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:64, flexDirection:'column', gap:12 }}>
      <div style={{ width:36, height:36, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
      <span style={{ fontSize:13, color:'var(--text)', fontFamily:"'Nunito', sans-serif" }}>Loading...</span>
    </div>
  )
}
function ErrMsg({ msg }) {
  if (!msg) return null
  return <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', borderRadius:9, padding:'10px 14px', color:'#fca5a5', fontSize:13, fontWeight:600, marginTop:8, fontFamily:"'Nunito', sans-serif" }}>⚠️ {msg}</div>
}
function SuccessMsg({ msg }) {
  if (!msg) return null
  return <div style={{ background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', borderRadius:9, padding:'10px 14px', color:'#6ee7b7', fontSize:13, fontWeight:600, marginTop:8, fontFamily:"'Nunito', sans-serif" }}>✅ {msg}</div>
}
function Tag({ label, onRemove }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'var(--accent-bg)', color:'var(--accent)', border:'1px solid var(--accent-border)', borderRadius:20, padding:'3px 10px', fontSize:12, fontWeight:700, fontFamily:"'Nunito', sans-serif" }}>
      {label} {onRemove && <span onClick={onRemove} style={{ cursor:'pointer', fontWeight:800 }}>×</span>}
    </span>
  )
}
function XPBadge({ amount, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', marginTop:14 }}>
      <div style={{ background:'var(--accent-bg)', padding:'5px 14px', borderRadius:20, display:'flex', alignItems:'center', gap:5, border:'1px solid var(--accent-border)', color:'var(--accent)', fontWeight:700, fontSize:12.5, fontFamily:"'Nunito', sans-serif" }}>
        ⚡ Earn +{amount} XP {label}
      </div>
    </div>
  )
}
function ChapterSelector({ subject, cls, selected, onChange, max=20 }) {
  const chapters = getChapters(subject, cls)
  const toggle = (ch) => {
    if (selected.includes(ch)) onChange(selected.filter(c=>c!==ch))
    else if (selected.length < max) onChange([...selected, ch])
  }
  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap', alignItems:'center' }}>
        <GhostBtn small onClick={()=>onChange(chapters)}>Select All</GhostBtn>
        {selected.length>0 && <GhostBtn small onClick={()=>onChange([])}>Clear</GhostBtn>}
        <span style={{ fontSize:12, color:'var(--text)', fontFamily:"'Nunito', sans-serif" }}>{selected.length} selected</span>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {chapters.map(ch=>{
          const sel = selected.includes(ch)
          return (
            <span key={ch} onClick={()=>toggle(ch)}
              style={{ padding:'5px 13px', borderRadius:20, fontSize:12, cursor:'pointer', fontWeight:700, fontFamily:"'Nunito', sans-serif",
                background:sel?'var(--accent)':'var(--accent-bg)', color:sel?'#fff':'var(--accent)',
                border:`1px solid ${sel?'var(--accent)':'var(--accent-border)'}`, transition:'all .15s' }}>
              {ch}
            </span>
          )
        })}
      </div>
      {selected.length>0 && (
        <div style={{ marginTop:10, display:'flex', flexWrap:'wrap', gap:5 }}>
          <span style={{ fontSize:12, color:'var(--text)', alignSelf:'center', fontFamily:"'Nunito', sans-serif" }}>Selected: </span>
          {selected.map(ch=><Tag key={ch} label={ch} onRemove={()=>toggle(ch)}/>)}
        </div>
      )}
    </div>
  )
}
function ContentBox({ content, onDownload, downloadName, label='Generated Content' }) {
  const lines = (content||'').split('\n')
  return (
    <Card style={{ marginTop:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
        <h3 style={{ margin:0, fontSize:15, color:'var(--text-h)', fontFamily:"'Sora', sans-serif", fontWeight:800 }}>{label}</h3>
        <div style={{ display:'flex', gap:8 }}>
          {onDownload && <GhostBtn small onClick={onDownload}>⬇ Download</GhostBtn>}
          <GhostBtn small onClick={()=>printContent(content, downloadName)}>🖨 Print / PDF</GhostBtn>
        </div>
      </div>
      <div style={{ maxHeight:'60vh', overflowY:'auto', fontFamily:"'Nunito', sans-serif", fontSize:14, lineHeight:1.85, color:'var(--text-h)', padding:'4px 2px' }}>
        {lines.map((line,i)=>{
          if(line.startsWith('# '))   return <h2 key={i} style={{ color:'var(--accent)', borderBottom:'2px solid var(--accent-border)', paddingBottom:6, margin:'16px 0 8px', fontFamily:"'Sora', sans-serif" }}>{line.slice(2)}</h2>
          if(line.startsWith('## '))  return <h3 key={i} style={{ color:'var(--text-h)', margin:'14px 0 6px', fontFamily:"'Sora', sans-serif" }}>{line.slice(3)}</h3>
          if(line.startsWith('### ')) return <h4 key={i} style={{ color:'var(--text-h)', margin:'10px 0 4px', fontFamily:"'Sora', sans-serif" }}>{line.slice(4)}</h4>
          if(line.startsWith('- ')||line.startsWith('• ')) return <div key={i} style={{ paddingLeft:16, marginBottom:2, color:'var(--text-h)' }}>• {line.slice(2)}</div>
          if(/^\d+\./.test(line)) return <div key={i} style={{ paddingLeft:16, marginBottom:2, color:'var(--text-h)' }}>{line}</div>
          if(line.startsWith('---')||line.startsWith('═══')) return <hr key={i} style={{ border:'none', borderTop:'1px solid var(--border)', margin:'12px 0' }}/>
          const bold = line.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
          return <p key={i} style={{ margin:'3px 0', color:'var(--text-h)' }} dangerouslySetInnerHTML={{ __html:bold }}/>
        })}
      </div>
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════
//  MEDIA UPLOADER
// ══════════════════════════════════════════════════════════════
function MediaUploader({ onUpload, onClear, current, accept='image/*,application/pdf', label='📎 Add Photo/File', small=false }) {
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const handleFile = async (file) => {
    if (!file) return
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const tok = localStorage.getItem('bs_token')
      const r = await fetch(`${API_URL}/api/upload/media`, { method:'POST', headers:{ Authorization:`Bearer ${tok}` }, body:form })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      onUpload(data.url, data.type)
    } catch (e) { alert('Upload failed: ' + e.message) }
    setLoading(false)
  }
  if (current?.url) return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
      {current.type==='image'
        ? <img src={current.url} style={{ width:56, height:56, objectFit:'cover', borderRadius:8, border:'1px solid var(--border)' }} alt=""/>
        : <div style={{ background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:8, padding:'5px 10px', fontSize:11.5, color:'var(--accent)', fontWeight:700 }}>📄 PDF</div>
      }
      <button onClick={onClear} style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', color:'#fca5a5', borderRadius:6, padding:'3px 8px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito', sans-serif" }}>✕</button>
    </div>
  )
  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])}/>
      <button onClick={()=>inputRef.current?.click()} disabled={loading}
        style={{ display:'inline-flex', alignItems:'center', gap:5, padding:small?'5px 10px':'7px 14px', borderRadius:8, border:'1px dashed var(--border)', background:'transparent', color:'var(--text)', cursor:'pointer', fontSize:small?11.5:12.5, fontWeight:600, fontFamily:"'Nunito', sans-serif", opacity:loading?.6:1 }}>
        {loading ? '⏳ Uploading...' : label}
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  FREE TIER COUNTDOWN
// ══════════════════════════════════════════════════════════════
function FreeTierCountdown({ user, onSubscribe, onExpired }) {
  const [seconds, setSeconds] = useState(null)
  useEffect(() => {
    if (!user || user.type==='school' || user.subscription_status==='active') return
    const initial = getSecondsRemaining(user.free_tier_started_at)
    setSeconds(initial)
    if (initial <= 0) { onExpired?.(); return }
    if (!user.free_tier_started_at) return // hasn't started yet, no ticking
    const interval = setInterval(() => {
      const rem = getSecondsRemaining(user.free_tier_started_at)
      setSeconds(rem)
      if (rem <= 0) { clearInterval(interval); onExpired?.() }
    }, 1000)
    return () => clearInterval(interval)
  }, [user?.id, user?.free_tier_started_at, user?.subscription_status])

  if (!user || user.type==='school' || user.subscription_status==='active') return null
  if (seconds === null) return null

  if (seconds <= 0) return (
    <div onClick={onSubscribe} style={{ background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.3)', borderRadius:11, padding:'10px 16px', marginBottom:16, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:"'Nunito', sans-serif" }}>
      <span style={{ color:'#fca5a5', fontWeight:700, fontSize:13.5 }}>⛔ Free trial ended — Subscribe to continue</span>
      <span style={{ color:'#ef4444', fontWeight:800, fontSize:12.5 }}>Subscribe →</span>
    </div>
  )

  // If not started yet (first visit)
  if (!user.free_tier_started_at) return (
    <div style={{ background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:11, padding:'9px 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:"'Nunito', sans-serif" }}>
      <span style={{ fontSize:13, color:'var(--text-h)', fontWeight:700 }}>⏱ 10:00 free trial — starts on your first AI call</span>
      <span onClick={onSubscribe} style={{ fontSize:12, color:'var(--accent)', cursor:'pointer', fontWeight:700 }}>Upgrade →</span>
    </div>
  )

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const pct  = Math.round((seconds / FREE_WINDOW) * 100)
  const isLow = seconds <= 120

  return (
    <div style={{ background:isLow?'rgba(239,68,68,.08)':'var(--accent-bg)', border:`1px solid ${isLow?'rgba(239,68,68,.25)':'var(--accent-border)'}`, borderRadius:11, padding:'9px 16px', marginBottom:16, fontFamily:"'Nunito', sans-serif" }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:13, fontWeight:700, color:isLow?'#fca5a5':'var(--text-h)' }}>{isLow?'⚠️':'⏱'} Free Trial:</span>
          <span style={{ fontFamily:"'Sora', monospace", fontWeight:900, fontSize:17, color:isLow?'#ef4444':'var(--accent)', animation:isLow?'pulse 1s infinite':'none', letterSpacing:1 }}>
            {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
          </span>
        </div>
        <span onClick={onSubscribe} style={{ fontSize:12, color:'var(--accent)', cursor:'pointer', fontWeight:700 }}>Upgrade →</span>
      </div>
      <div style={{ background:'var(--border)', borderRadius:999, height:4 }}>
        <div style={{ background:isLow?'#ef4444':'var(--accent)', width:`${pct}%`, height:'100%', borderRadius:999, transition:'width 1s linear' }}/>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  MOBILE TOP NAV
// ══════════════════════════════════════════════════════════════
function MobileTopNav({ tabs, activeTab, onTabChange }) {
  return (
    <div className="mobile-top-nav" style={{ position:'sticky', top:58, zIndex:90, background:'rgba(5,5,14,.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid var(--border)', padding:'4px 8px', display:'flex', gap:2, overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch' }}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>onTabChange(t.id)}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'5px 8px', borderRadius:9, border:'none', cursor:'pointer', background:activeTab===t.id?`${t.color}22`:'transparent', color:activeTab===t.id?t.color:'#64748b', fontFamily:"'Nunito', sans-serif", fontWeight:700, fontSize:8.5, minWidth:46, flexShrink:0, transition:'all .15s', borderBottom:activeTab===t.id?`2px solid ${t.color}`:'2px solid transparent' }}>
          <span style={{ fontSize:17 }}>{t.icon}</span>
          {t.label.split(' ')[0]}
        </button>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  LANDING PAGE
// ══════════════════════════════════════════════════════════════
function LandingPage({ onStart }) {
  const feats = [
    {e:'📣',t:'Study Feed',d:"Share achievements and ask questions like a social app — with anonymous mode.",c:'#6366F1'},
    {e:'📚',t:'Chapter Courses',d:"Pre-built CBSE courses cached for all students — instant after first generation.",c:'#8B5CF6'},
    {e:'🤖',t:'AI Buddy',d:"Your personal AI friend who knows your schedule, activity, and school notices.",c:'#06b6d4'},
    {e:'🤔',t:'Doubt Solver',d:"Step-by-step answers to any CBSE question with full explanations.",c:'#10B981'},
    {e:'📖',t:'Chapter Notes',d:"Textbook-quality notes downloadable as PDF.",c:'#F59E0B'},
    {e:'📋',t:'Exam Cheat Sheet',d:"6-page exam prep with top questions, formulas, and strategy.",c:'#EF4444'},
    {e:'🎓',t:'Lesson Planner',d:"Minute-by-minute plans with teaching scripts for teachers.",c:'#A855F7'},
    {e:'🏫',t:'School Platform',d:"Assignments, timetables, notices, analytics — everything a school needs.",c:'#F97316'},
  ]
  return (
    <div style={{ minHeight:'100vh', background:'#05050e', fontFamily:"'Nunito',sans-serif" }}>
      <nav style={{ padding:'0 5%', height:62, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, background:'rgba(5,5,14,.95)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🧠</div>
          <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:17, color:'#f1f5f9' }}>BrainSpark<span style={{ color:'#818CF8' }}> AI</span></span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>onStart('signin')} style={{ padding:'7px 16px', borderRadius:9, border:'1px solid rgba(255,255,255,.1)', background:'transparent', color:'#94a3b8', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>Sign In</button>
          <button onClick={()=>onStart('signup')} style={{ padding:'7px 16px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>Get Started Free →</button>
        </div>
      </nav>
      <section style={{ position:'relative', padding:'88px 5% 64px', textAlign:'center', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:'20%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,.15),transparent 65%)', filter:'blur(80px)', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1, maxWidth:820, margin:'0 auto' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 14px', borderRadius:30, background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.22)', marginBottom:18, fontSize:12, color:'#818CF8', fontWeight:700 }}>✦ India's All-in-One School Learning Platform</div>
          <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(28px,5.5vw,62px)', fontWeight:900, lineHeight:1.08, color:'#f1f5f9', marginBottom:16 }}>
            Where Students<br/>
            <span style={{ background:'linear-gradient(135deg,#818CF8,#A855F7,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Learn, Share & Grow</span>
          </h1>
          <p style={{ fontSize:'clamp(14px,1.8vw,17px)', color:'#64748b', lineHeight:1.8, marginBottom:30, maxWidth:520, margin:'0 auto 30px' }}>AI study tools + social feed + school management — one platform built for Indian students and teachers.</p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={()=>onStart('signup')} style={{ padding:'13px 34px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>🚀 Start Free — 10 Min Trial</button>
            <button onClick={()=>onStart('school')} style={{ padding:'12px 22px', borderRadius:10, border:'1px solid rgba(99,102,241,.3)', background:'rgba(99,102,241,.08)', color:'#818CF8', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>🏫 School Login</button>
          </div>
        </div>
      </section>
      <section style={{ padding:'64px 5%' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(18px,3vw,34px)', fontWeight:800, color:'#e2e8f0', marginBottom:8 }}>Everything to excel</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12, maxWidth:1000, margin:'0 auto' }}>
          {feats.map((f,i)=>(
            <div key={i} onClick={()=>onStart('signup')} style={{ background:'#0b0b1e', border:'1px solid rgba(255,255,255,.06)', borderRadius:13, padding:20, cursor:'pointer', transition:'border-color .2s,transform .2s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=f.c+'44';e.currentTarget.style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.06)';e.currentTarget.style.transform='none'}}>
              <div style={{ width:44, height:44, borderRadius:11, background:`${f.c}18`, border:`1px solid ${f.c}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:21, marginBottom:11 }}>{f.e}</div>
              <div style={{ fontFamily:"'Sora',sans-serif", fontSize:13.5, fontWeight:700, color:'#e2e8f0', marginBottom:5 }}>{f.t}</div>
              <p style={{ fontSize:12, color:'#64748b', lineHeight:1.65, margin:0 }}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{ padding:'52px 5%', textAlign:'center' }}>
        <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(20px,4vw,42px)', fontWeight:900, color:'#f1f5f9', marginBottom:10 }}>
          Ready to study <span style={{ background:'linear-gradient(135deg,#f59e0b,#ef4444)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>smarter?</span>
        </h2>
        <p style={{ color:'#64748b', fontSize:13.5, marginBottom:26 }}>Free 10-min trial · AI-powered · CBSE aligned · Built for India</p>
        <button onClick={()=>onStart('signup')} style={{ padding:'14px 42px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>🚀 Get Started Free</button>
      </section>
      <footer style={{ padding:'18px 5%', borderTop:'1px solid rgba(255,255,255,.04)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:"'Sora',sans-serif", color:'#334155', fontSize:12, fontWeight:700 }}>BrainSpark AI © 2025</span>
        <span style={{ fontSize:10.5, color:'#1e293b' }}>Powered by Claude · OpenAI · Groq · Built for CBSE</span>
      </footer>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  AUTH PAGE
// ══════════════════════════════════════════════════════════════
function AuthPage({ onAuth, initMode }) {
  useFonts()
  const [tab,    setTab]    = useState(initMode==='school'?'school':'personal')
  const [role,   setRole]   = useState(initMode==='teacher'?'teacher':'student')
  const [mode,   setMode]   = useState('login')
  const [form,   setForm]   = useState({ name:'', email:'', password:'', schoolCode:'', identifier:'', confirmPassword:'' })
  const [err,    setErr]    = useState('')
  const [busy,   setBusy]   = useState(false)
  const [showPw, setShowPw] = useState(false)
  const gBtnRef = useRef(null)
  const set = (k)=>(v)=>setForm(f=>({...f,[k]:v}))

  useEffect(()=>{
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || tab!=='personal') return
    loadScript('https://accounts.google.com/gsi/client').then(()=>{
      if (!window.google || !gBtnRef.current) return
      window.google.accounts.id.initialize({ client_id:clientId, callback:async(resp)=>{
        try { setBusy(true); setErr(''); const data = await api.post('/api/auth/google',{idToken:resp.credential}); saveAuth(data); onAuth(data.user) }
        catch(e){ setErr(e.message) } finally{ setBusy(false) }
      }})
      window.google.accounts.id.renderButton(gBtnRef.current,{ theme:'filled_black', size:'large', width:280 })
    }).catch(()=>{})
  },[tab])

  async function handlePersonal(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      if (mode==='register') {
        if (!form.name.trim()) throw new Error('Name is required')
        if (form.password!==form.confirmPassword) throw new Error('Passwords do not match')
      }
      const data = await api.post(mode==='register'?'/api/auth/register':'/api/auth/login',{ name:form.name, email:form.email, password:form.password, role })
      saveAuth(data); onAuth(data.user)
    } catch(e){ setErr(e.message) } finally{ setBusy(false) }
  }

  async function handleSchool(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const data = await api.post('/api/auth/school',{ schoolCode:form.schoolCode, identifier:form.identifier, password:form.password, role })
      saveAuth(data); onAuth(data.user)
    } catch(e){ setErr(e.message) } finally{ setBusy(false) }
  }

  function saveAuth(data) {
    localStorage.setItem('bs_token',   data.token)
    localStorage.setItem('bs_session', data.sessionToken)
    localStorage.setItem('bs_user',    JSON.stringify(data.user))
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a0533,#0f0f2e,#05050e)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ background:'#0d0d22', border:'1px solid rgba(255,255,255,.08)', borderRadius:18, padding:28, width:'100%', maxWidth:430, boxShadow:'0 28px 70px rgba(0,0,0,.5)' }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px', fontSize:26 }}>🧠</div>
          <h1 style={{ margin:0, fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:22, color:'#f1f5f9' }}>BrainSpark<span style={{ color:'#818CF8' }}> AI</span></h1>
          <p style={{ color:'#64748b', fontSize:13, marginTop:4 }}>Your AI-powered study companion</p>
        </div>
        <div style={{ display:'flex', background:'rgba(255,255,255,.04)', borderRadius:11, padding:3, marginBottom:18 }}>
          {[['personal','Personal'],['school','🏫 School']].map(([t,l])=>(
            <button key={t} onClick={()=>{setTab(t);setErr('')}} style={{ flex:1, padding:'8px', borderRadius:9, border:'none', fontWeight:700, fontSize:13.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:tab===t?'rgba(255,255,255,.08)':'transparent', color:tab===t?'#e2e8f0':'#64748b', transition:'all .2s' }}>{l}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:18 }}>
          {[['student','🎒 Student'],['teacher','👨‍🏫 Teacher']].map(([r,l])=>(
            <button key={r} onClick={()=>setRole(r)} style={{ flex:1, padding:'8px 12px', borderRadius:9, border:`2px solid ${role===r?'var(--accent)':'rgba(255,255,255,.08)'}`, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:role===r?'var(--accent-bg)':'transparent', color:role===r?'var(--accent)':'#64748b', transition:'all .2s' }}>{l}</button>
          ))}
        </div>
        {tab==='personal'&&<>
          <div style={{ display:'flex', gap:8, marginBottom:18 }}>
            {[['login','Sign In'],['register','Register']].map(([m,l])=>(
              <button key={m} onClick={()=>{setMode(m);setErr('')}} style={{ flex:1, padding:'8px', borderRadius:9, border:`2px solid ${mode===m?'var(--accent)':'rgba(255,255,255,.08)'}`, fontWeight:700, fontSize:13.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:mode===m?'var(--accent-bg)':'transparent', color:mode===m?'var(--accent)':'#64748b', transition:'all .2s' }}>{l}</button>
            ))}
          </div>
          <form onSubmit={handlePersonal} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {mode==='register'&&<Field label="Full Name"><BSInput value={form.name} onChange={set('name')} placeholder="Your full name"/></Field>}
            <Field label="Email Address"><BSInput value={form.email} onChange={set('email')} type="email" placeholder="your@email.com"/></Field>
            <Field label="Password">
              <div style={{ position:'relative' }}>
                <BSInput value={form.password} onChange={set('password')} type={showPw?'text':'password'} placeholder="Password" style={{ paddingRight:40 }}/>
                <span onClick={()=>setShowPw(p=>!p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#64748b', userSelect:'none' }}>{showPw?'🙈':'👁'}</span>
              </div>
            </Field>
            {mode==='register'&&<Field label="Confirm Password"><BSInput value={form.confirmPassword} onChange={set('confirmPassword')} type="password" placeholder="Repeat password"/></Field>}
            <ErrMsg msg={err}/>
            <PrimaryBtn style={{ width:'100%', justifyContent:'center', marginTop:4 }} disabled={busy}>
              {busy?<><Spinner/> {mode==='register'?'Creating account...':'Signing in...'}</>:mode==='register'?'Create Account':'Sign In'}
            </PrimaryBtn>
          </form>
          {mode==='login'&&<p style={{ textAlign:'center', fontSize:12.5, color:'#64748b', marginTop:10 }}>
            <span onClick={()=>onAuth('forgot')} style={{ color:'var(--accent)', cursor:'pointer', fontWeight:700 }}>Forgot password?</span>
          </p>}
          <div style={{ display:'flex', alignItems:'center', gap:8, margin:'18px 0' }}>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,.08)' }}/><span style={{ fontSize:12, color:'#64748b', fontWeight:600 }}>OR</span><div style={{ flex:1, height:1, background:'rgba(255,255,255,.08)' }}/>
          </div>
          <div ref={gBtnRef} style={{ display:'flex', justifyContent:'center', marginBottom:10 }}/>
          <p style={{ textAlign:'center', fontSize:11.5, color:'#64748b', marginTop:8 }}>⏱ Free trial: 10 minutes · then ₹{role==='teacher'?'180':'150'}/month</p>
        </>}
        {tab==='school'&&(
          <form onSubmit={handleSchool} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ background:'var(--accent-bg)', padding:'10px 14px', borderRadius:10, fontSize:13, color:'var(--accent)', fontWeight:600 }}>🏫 Enter the School Code provided by your administrator.</div>
            <Field label="School Code"><BSInput value={form.schoolCode} onChange={set('schoolCode')} placeholder="e.g. DPS2024"/></Field>
            <Field label={role==='teacher'?'Employee ID':'Roll Number'}><BSInput value={form.identifier} onChange={set('identifier')} placeholder={role==='teacher'?'e.g. TCH001':'e.g. 101'}/></Field>
            <Field label="Password">
              <div style={{ position:'relative' }}>
                <BSInput value={form.password} onChange={set('password')} type={showPw?'text':'password'} placeholder="Your password" style={{ paddingRight:40 }}/>
                <span onClick={()=>setShowPw(p=>!p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#64748b' }}>{showPw?'🙈':'👁'}</span>
              </div>
            </Field>
            <ErrMsg msg={err}/>
            <PrimaryBtn style={{ width:'100%', justifyContent:'center' }} disabled={busy}>
              {busy?<><Spinner/> Signing in...</>:`Sign In as ${role==='teacher'?'Teacher':'Student'}`}
            </PrimaryBtn>
          </form>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  FORGOT PASSWORD
// ══════════════════════════════════════════════════════════════
function ForgotPasswordPage({ onBack }) {
  useFonts()
  const [email,setEmail]=useState(''); const [sent,setSent]=useState(false); const [err,setErr]=useState(''); const [busy,setBusy]=useState(false)
  async function handleSubmit(e){ e.preventDefault();setErr('');setBusy(true);try{await api.post('/api/auth/forgot-password',{email});setSent(true)}catch(e){setErr(e.message)}finally{setBusy(false)} }
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a0533,#0f0f2e)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ background:'#0d0d22', border:'1px solid rgba(255,255,255,.08)', borderRadius:18, padding:28, maxWidth:400, width:'100%' }}>
        <div style={{ textAlign:'center', marginBottom:24 }}><div style={{ fontSize:40, marginBottom:8 }}>🔐</div><h2 style={{ margin:0, fontFamily:"'Sora',sans-serif", fontWeight:900, color:'#f1f5f9' }}>Reset Password</h2></div>
        {sent?<SuccessMsg msg="Check your inbox for the reset link. It expires in 1 hour."/>:(
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <Field label="Email Address"><BSInput value={email} onChange={setEmail} type="email" placeholder="your@email.com"/></Field>
            <ErrMsg msg={err}/>
            <PrimaryBtn style={{ width:'100%', justifyContent:'center' }} disabled={busy}>{busy?<><Spinner/> Sending...</>:'Send Reset Link'}</PrimaryBtn>
          </form>
        )}
        <p style={{ textAlign:'center', marginTop:16, fontSize:13 }}><span onClick={onBack} style={{ color:'var(--accent)', cursor:'pointer', fontWeight:700 }}>← Back to sign in</span></p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  SUBSCRIPTION PAGE
// ══════════════════════════════════════════════════════════════
function SubscriptionPage({ user, onSuccess, onBack }) {
  const [loading,setLoading]=useState(false); const [err,setErr]=useState('')
  const plans = user?.role==='teacher'
    ? [{id:'teacher_monthly',label:'Monthly',price:'₹180',desc:'₹180/month',months:1},{id:'teacher_yearly',label:'Annual',price:'₹1,800',desc:'Save ₹360/year',months:12,popular:true}]
    : [{id:'student_monthly',label:'Monthly',price:'₹150',desc:'₹150/month',months:1},{id:'student_yearly',label:'Annual',price:'₹1,500',desc:'Save ₹300/year',months:12,popular:true}]
  async function subscribe(planType) {
    setErr('');setLoading(true)
    try {
      await loadScript('https://checkout.razorpay.com/v1/checkout.js')
      const order = await api.post('/api/subscription/create-order',{planType})
      const rzp = new window.Razorpay({ key:import.meta.env.VITE_RAZORPAY_KEY_ID, amount:order.amount, currency:'INR', name:'BrainSpark AI', description:order.planLabel, order_id:order.orderId, prefill:{name:user.name,email:user.email}, theme:{color:'#6366F1'},
        handler:async({razorpay_payment_id,razorpay_order_id,razorpay_signature})=>{
          try{ await api.post('/api/subscription/verify',{orderId:razorpay_order_id,paymentId:razorpay_payment_id,signature:razorpay_signature,planType}); onSuccess() }
          catch(e){ setErr('Payment verification failed.') }
        },
      })
      rzp.open()
    } catch(e){setErr(e.message)} finally{setLoading(false)}
  }
  return (
    <div style={{ padding:24, fontFamily:"'Nunito',sans-serif" }}>
      {onBack&&<GhostBtn small onClick={onBack} style={{ marginBottom:20 }}>← Back</GhostBtn>}
      <div style={{ textAlign:'center', marginBottom:32 }}><div style={{ fontSize:48, marginBottom:8 }}>💎</div><h2 style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, color:'var(--text-h)', margin:'0 0 6px' }}>Upgrade BrainSpark AI</h2><p style={{ color:'var(--text)', fontSize:14 }}>Unlimited access to all AI tools</p></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16, marginBottom:24, maxWidth:700, margin:'0 auto 24px' }}>
        {plans.map(p=>(
          <div key={p.id} style={{ ...T.card, position:'relative', borderColor:p.popular?'var(--accent)':'var(--border)', borderWidth:p.popular?2:1, textAlign:'center' }}>
            {p.popular&&<div style={{ position:'absolute', top:-13, left:'50%', transform:'translateX(-50%)', background:'var(--accent)', color:'#fff', borderRadius:20, padding:'3px 14px', fontSize:11, fontWeight:800 }}>BEST VALUE</div>}
            <div style={{ fontSize:30, fontWeight:900, color:'var(--accent)', marginBottom:4, fontFamily:"'Sora',sans-serif" }}>{p.price}</div>
            <div style={{ fontSize:13, color:'var(--text)', marginBottom:16 }}>{p.desc}</div>
            <PrimaryBtn onClick={()=>subscribe(p.id)} disabled={loading} style={{ width:'100%', justifyContent:'center' }}>{loading?<><Spinner/> ...</>:`Get ${p.label}`}</PrimaryBtn>
          </div>
        ))}
      </div>
      <ErrMsg msg={err}/>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════
function Dashboard({ user, onNavigate }) {
  const [stats,setStats]=useState(null); const [achs,setAchs]=useState([]); const [loading,setLoading]=useState(true)
  useEffect(()=>{ Promise.all([api.get('/api/user/stats'),api.get('/api/user/achievements')]).then(([s,a])=>{setStats(s);setAchs(a)}).catch(()=>{}).finally(()=>setLoading(false)) },[])
  if(loading) return <PageSpinner/>
  const xp=stats?.stats?.total_xp||0; const level=getLevel(xp); const nextLevel=getNextLevel(xp)
  const pct=nextLevel?Math.round(((xp-level.min)/(nextLevel.min-level.min))*100):100
  const streak=stats?.stats?.current_streak||0; const unlocked=achs.filter(a=>a.unlocked).slice(0,3)
  const hour=new Date().getHours(); const greeting=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'
  const quickStart = [
    { icon: '🕘', label: 'My History', tab: 'history', color: '#6366F1' },
    {icon:'📣',label:'Study Feed',tab:'feed',color:'#6366F1'},
    {icon:'📚',label:'Chapter Courses',tab:'courses',color:'#8B5CF6'},
    {icon:'🤔',label:'Ask a Doubt',tab:'doubt',color:'#818CF8'},
    {icon:'📖',label:'Generate Notes',tab:'notes',color:'#10B981'},
    ...(user.type==='school'?[{icon:'📝',label:'Assignments',tab:'assignments',color:'#F59E0B'}]:[]),
    ...(user.role==='student'?[{icon:'📋',label:'Exam Cheat Sheet',tab:'cheatsheet',color:'#F97316'}]:[{icon:'🎓',label:'Lesson Planner',tab:'lessonplan',color:'#7C3AED'}]),
    {icon:'🎯',label:'Take a Quiz',tab:'quiz',color:'#F59E0B'},
    {icon:'🔍',label:'Find People',tab:'search',color:'#06b6d4'},
    
  ]
  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0, fontFamily:"'Sora',sans-serif", fontWeight:900, color:'var(--text-h)', fontSize:'clamp(1.1rem,2.5vw,1.5rem)' }}>{greeting}, {user.name.split(' ')[0]}! {level.emoji}</h2>
          <p style={{ margin:'4px 0 0', color:'var(--text)', fontSize:13 }}>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</p>
        </div>
        <div style={{ background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:20, padding:'6px 16px', display:'inline-flex', alignItems:'center', gap:6 }}>
          <span style={{ fontWeight:800, color:'var(--accent)', fontSize:14, fontFamily:"'Sora',sans-serif" }}>{level.emoji} {level.label}</span>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:22 }}>
        {[{label:'Total XP',value:xp.toLocaleString(),icon:'⚡',bg:'rgba(99,102,241,.15)',color:'#818CF8'},{label:'Streak',value:`${streak}d`,icon:'🔥',bg:'rgba(249,115,22,.15)',color:'#FB923C'},{label:'Doubts',value:stats?.stats?.doubts_solved||0,icon:'🤔',bg:'rgba(16,185,129,.15)',color:'#34D399'},{label:'Quizzes',value:stats?.stats?.quizzes_done||0,icon:'🎯',bg:'rgba(139,92,246,.15)',color:'#A78BFA'},{label:'Notes',value:stats?.stats?.notes_made||0,icon:'📖',bg:'rgba(239,68,68,.15)',color:'#FCA5A5'},{label:'Papers',value:stats?.stats?.papers_made||0,icon:'📄',bg:'rgba(245,158,11,.15)',color:'#FCD34D'}].map(stat=>(
          <div key={stat.label} style={{ background:stat.bg, borderRadius:14, padding:'14px 12px', textAlign:'center', border:'1px solid rgba(255,255,255,.05)' }}>
            <div style={{ fontSize:24, marginBottom:4 }}>{stat.icon}</div>
            <div style={{ fontSize:20, fontWeight:900, color:stat.color, fontFamily:"'Sora',sans-serif" }}>{stat.value}</div>
            <div style={{ fontSize:11, color:'var(--text)', marginTop:2, fontWeight:600 }}>{stat.label}</div>
          </div>
        ))}
      </div>
      <Card style={{ marginBottom:20, background:'linear-gradient(135deg,#4338ca,#6366F1,#8B5CF6)', border:'none' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div>
            <span style={{ fontWeight:900, color:'#fff', fontSize:18, fontFamily:"'Sora',sans-serif" }}>{level.emoji} {level.label}</span>
            {nextLevel&&<span style={{ color:'rgba(255,255,255,.75)', fontSize:12.5, marginLeft:10 }}>→ {nextLevel.emoji} {nextLevel.label} at {nextLevel.min.toLocaleString()} XP</span>}
          </div>
          <span style={{ fontSize:24, fontWeight:900, color:'#fff', fontFamily:"'Sora',sans-serif" }}>{xp.toLocaleString()} XP</span>
        </div>
        <div style={{ background:'rgba(255,255,255,.25)', borderRadius:999, height:8 }}><div style={{ background:'#fff', width:`${pct}%`, height:'100%', borderRadius:999, transition:'width 1s ease' }}/></div>
        {nextLevel&&<p style={{ fontSize:12, color:'rgba(255,255,255,.75)', margin:'8px 0 0', textAlign:'right' }}>{(nextLevel.min-xp).toLocaleString()} XP to {nextLevel.label}</p>}
      </Card>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>
        <Card>
          <h3 style={{ margin:'0 0 14px', fontSize:15, fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text-h)' }}>⚡ Quick Start</h3>
          {quickStart.map(item=>(
            <button key={item.tab} onClick={()=>onNavigate(item.tab)} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--code-bg)', color:'var(--text-h)', cursor:'pointer', marginBottom:9, fontSize:14, fontWeight:600, fontFamily:"'Nunito',sans-serif", transition:'all .15s' }}
              onMouseEnter={e=>{e.currentTarget.style.background='var(--accent-bg)';e.currentTarget.style.borderColor='var(--accent)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='var(--code-bg)';e.currentTarget.style.borderColor='var(--border)'}}>
              <span style={{ fontSize:20 }}>{item.icon}</span>{item.label}<span style={{ marginLeft:'auto', fontSize:16, color:'var(--text)' }}>→</span>
            </button>
          ))}
        </Card>
        <Card>
          <h3 style={{ margin:'0 0 14px', fontSize:15, fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text-h)' }}>🏆 Recent Achievements</h3>
          {unlocked.length===0?<p style={{ color:'var(--text)', fontSize:13 }}>Complete activities to unlock achievements!</p>:unlocked.map(a=>(
            <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ fontSize:24 }}>{a.emoji}</span>
              <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:13.5, color:'var(--text-h)' }}>{a.name}</div><div style={{ fontSize:12, color:'var(--text)' }}>{a.description}</div></div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  SOCIAL FEED (no stories, with media upload)
// ══════════════════════════════════════════════════════════════
const SEED_POSTS = [
  {id:'sp1',uid:'u1',uname:'Priya Sharma',ucls:'Class 10',subj:'Mathematics',body:"Just cracked quadratic equations! 🎉 Key tip: check the discriminant first. b²-4ac ≥ 0 means real roots exist.",likes:24,rich_comments:[],tags:['Maths','ExamTip'],created_at:new Date(Date.now()-3600000).toISOString(),anon:false,grad:'135deg,#6366F1,#8B5CF6'},
  {id:'sp2',uid:'u2',uname:'Anonymous Student',ucls:'Class 11',subj:'Physics',body:'Struggling with thermodynamics 😫 Can someone explain isothermal vs adiabatic processes?',likes:8,rich_comments:[{id:'c1',author_name:'Helpful Student',text:'Isothermal = constant temp, Adiabatic = no heat exchange!',created_at:new Date(Date.now()-1800000).toISOString()}],tags:['Physics','Help'],created_at:new Date(Date.now()-7200000).toISOString(),anon:true,grad:'135deg,#374151,#1f2937'},
  {id:'sp3',uid:'u3',uname:'Arjun Mehta',ucls:'Class 12',subj:'Chemistry',body:'🏆 WON 2nd place in District Chemistry Olympiad!! Months of hard work paid off!',likes:67,rich_comments:[],tags:['Achievement'],created_at:new Date(Date.now()-18000000).toISOString(),anon:false,grad:'135deg,#f59e0b,#ef4444'},
]

function SocialFeed({ user }) {
  const [posts,setPosts]=useState(SEED_POSTS); const [composing,setComposing]=useState(false)
  const [draft,setDraft]=useState({body:'',subj:'Mathematics',tags:'',anon:false,media_url:null,media_type:null})
  const [posting,setPosting]=useState(false); const [openCmt,setOpenCmt]=useState(null)
  const [cmtText,setCmtText]=useState(''); const [cmtMedia,setCmtMedia]=useState(null)
  const [liked,setLiked]=useState(new Set()); const [err,setErr]=useState('')

  useEffect(()=>{
    api.get('/api/posts').then(data=>{
      if(data?.length){ const ids=new Set(SEED_POSTS.map(p=>p.id)); const merged=[...SEED_POSTS,...data.filter(p=>!ids.has(p.id))]; merged.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)); setPosts(merged) }
    }).catch(()=>{})
  },[])

  const submitPost=async()=>{
    if(!draft.body.trim()&&!draft.media_url) return; setPosting(true); setErr('')
    try{
      const post=await api.post('/api/posts',{ body:draft.body.trim(), subj:draft.subj, tags:draft.tags.split(',').map(t=>t.trim()).filter(Boolean), anon:draft.anon, grad:draft.anon?'135deg,#374151,#1f2937':GRADS[Math.floor(Math.random()*GRADS.length)], media_url:draft.media_url, media_type:draft.media_type })
      setPosts(p=>[post,...p]); setDraft({body:'',subj:'Mathematics',tags:'',anon:false,media_url:null,media_type:null}); setComposing(false)
    } catch(e){ setErr(e.message) }
    setPosting(false)
  }

  const likePost=async id=>{
    if(liked.has(id)) return; setLiked(p=>new Set([...p,id])); setPosts(p=>p.map(x=>x.id===id?{...x,likes:(x.likes||0)+1}:x)); api.patch(`/api/posts/${id}/like`).catch(()=>{})
  }

  const addComment=async id=>{
    if(!cmtText.trim()&&!cmtMedia) return
    const cmt={id:Date.now(),author_name:user.name,text:cmtText.trim(),media_url:cmtMedia?.url,media_type:cmtMedia?.type,created_at:new Date().toISOString()}
    setPosts(p=>p.map(x=>x.id===id?{...x,rich_comments:[...(x.rich_comments||[]),cmt]}:x))
    setCmtText(''); setCmtMedia(null)
    api.post(`/api/posts/${id}/comment`,{text:cmtText.trim(),media_url:cmtMedia?.url,media_type:cmtMedia?.type}).catch(()=>{})
  }

  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", maxWidth:680, margin:'0 auto' }}>
      <PageHeader icon="📣" title="Study Feed" subtitle="Share achievements, ask questions, post study stories" color="#6366F1"/>

      {/* Compose */}
      {!composing?(
        <div style={{ ...T.card, marginBottom:12, display:'flex', gap:10, alignItems:'center', cursor:'text', padding:'12px 15px' }} onClick={()=>setComposing(true)}>
          <div style={{ width:34, height:34, borderRadius:'50%', background:`linear-gradient(${GRADS[0]})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:900, color:'#fff', flexShrink:0 }}>{user.name[0].toUpperCase()}</div>
          <div style={{ flex:1, padding:'8px 13px', borderRadius:22, background:'var(--code-bg)', border:'1px solid var(--border)', fontSize:13, color:'var(--text)' }}>What's on your study mind, {user.name.split(' ')[0]}? ✨</div>
        </div>
      ):(
        <div style={{ ...T.card, marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:11 }}>
            <div style={{ display:'flex', gap:9, alignItems:'center' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:`linear-gradient(${draft.anon?'135deg,#374151,#1f2937':GRADS[0]})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, color:'#fff' }}>{draft.anon?'?':user.name[0].toUpperCase()}</div>
              <div style={{ fontSize:12.5, fontWeight:700, color:'var(--text-h)' }}>{draft.anon?'Anonymous Student':user.name}</div>
            </div>
            <button onClick={()=>setComposing(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text)', fontSize:18 }}>×</button>
          </div>
          <BSTextarea value={draft.body} onChange={v=>setDraft(d=>({...d,body:v}))} placeholder="Share achievements, study tips, questions..." rows={3} style={{ marginBottom:8 }}/>
          {draft.media_url&&(
            <div style={{ marginBottom:8 }}>
              {draft.media_type==='image'?<img src={draft.media_url} style={{ maxWidth:'100%', maxHeight:180, objectFit:'cover', borderRadius:8, border:'1px solid var(--border)' }} alt=""/>:<div style={{ padding:'6px 12px', background:'var(--accent-bg)', borderRadius:8, fontSize:12.5, color:'var(--accent)', display:'inline-flex', gap:6 }}>📄 PDF attached <span onClick={()=>setDraft(d=>({...d,media_url:null,media_type:null}))} style={{ cursor:'pointer' }}>✕</span></div>}
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:11 }}>
            <div><Label>Subject</Label><BSSelect value={draft.subj} onChange={v=>setDraft(d=>({...d,subj:v}))} options={SUBJECTS}/></div>
            <div><Label>Tags</Label><BSInput value={draft.tags} onChange={v=>setDraft(d=>({...d,tags:v}))} placeholder="Comma separated"/></div>
          </div>
          {err&&<ErrMsg msg={err}/>}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <MediaUploader accept="image/*" label="📷 Photo" small onUpload={(url,type)=>setDraft(d=>({...d,media_url:url,media_type:type}))} onClear={()=>setDraft(d=>({...d,media_url:null,media_type:null}))} current={null}/>
              <label style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer', fontSize:13, color:draft.anon?'var(--accent)':'var(--text)', fontWeight:700 }}>
                <input type="checkbox" checked={draft.anon} onChange={e=>setDraft(d=>({...d,anon:e.target.checked}))} style={{ accentColor:'var(--accent)' }}/>
                👻 Anon
              </label>
            </div>
            <PrimaryBtn onClick={submitPost} disabled={posting||(!draft.body.trim()&&!draft.media_url)} small>{posting?<Spinner size={12}/>:'Post ✦'}</PrimaryBtn>
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.map(post=>(
        <div key={post.id} style={{ ...T.card, marginBottom:11 }}>
          <div style={{ display:'flex', gap:10, marginBottom:10 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(${post.grad||GRADS[0]})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:900, color:'#fff', flexShrink:0 }}>{post.uname[0].toUpperCase()}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text-h)' }}>{post.uname}</span>
                {post.anon&&<span style={{ background:'rgba(100,116,139,.1)', color:'#94a3b8', border:'1px solid rgba(100,116,139,.2)', borderRadius:20, padding:'1px 7px', fontSize:10, fontWeight:700 }}>👻 anon</span>}
                <span style={{ fontSize:10.5, color:'var(--text)' }}>· {timeAgo(post.created_at)}</span>
              </div>
              <div style={{ fontSize:11.5, color:'var(--text)' }}>{post.ucls} · {post.subj}</div>
            </div>
          </div>
          {post.body&&<p style={{ fontSize:13.5, color:'var(--text-h)', lineHeight:1.72, marginBottom:post.media_url?8:10 }}>{post.body}</p>}
          {post.media_url&&post.media_type==='image'&&<img src={post.media_url} style={{ width:'100%', borderRadius:10, marginBottom:10, maxHeight:300, objectFit:'cover' }} alt=""/>}
          {(post.tags||[]).length>0&&<div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>{post.tags.map((t,i)=><span key={i} style={{ fontSize:11.5, color:'var(--accent)', background:'var(--accent-bg)', padding:'2px 8px', borderRadius:20, border:'1px solid var(--accent-border)' }}>#{t}</span>)}</div>}
          <div style={{ display:'flex', gap:7, paddingTop:10, borderTop:'1px solid var(--border)' }}>
            <GhostBtn small onClick={()=>likePost(post.id)} style={{ color:liked.has(post.id)?'#ef4444':'var(--text-h)' }}>{liked.has(post.id)?'❤️':'🤍'} {(post.likes||0)}</GhostBtn>
            <GhostBtn small onClick={()=>setOpenCmt(openCmt===post.id?null:post.id)}>💬 {(post.rich_comments||[]).length}</GhostBtn>
          </div>
          {openCmt===post.id&&(
            <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)' }}>
              {(post.rich_comments||[]).map((c,i)=>(
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--accent-bg)', border:'1px solid var(--accent-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'var(--accent)', flexShrink:0 }}>{c.author_name?.[0]||'?'}</div>
                  <div style={{ flex:1, background:'var(--code-bg)', borderRadius:'4px 12px 12px 12px', padding:'8px 12px', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:11.5, fontWeight:700, color:'var(--accent)', marginBottom:3 }}>{c.author_name}</div>
                    {c.text&&<div style={{ fontSize:13, color:'var(--text-h)', lineHeight:1.5 }}>{c.text}</div>}
                    {c.media_url&&c.media_type==='image'&&<img src={c.media_url} style={{ maxWidth:'100%', maxHeight:120, borderRadius:6, marginTop:4 }} alt=""/>}
                  </div>
                </div>
              ))}
              {cmtMedia?.url&&(
                <div style={{ marginBottom:6 }}>
                  {cmtMedia.type==='image'?<img src={cmtMedia.url} style={{ height:48, borderRadius:6 }} alt=""/>:<div style={{ padding:'3px 8px', background:'var(--accent-bg)', borderRadius:6, fontSize:11.5, color:'var(--accent)', display:'inline-flex', gap:5 }}>📄 <span onClick={()=>setCmtMedia(null)} style={{ cursor:'pointer' }}>✕</span></div>}
                </div>
              )}
              <div style={{ display:'flex', gap:7, alignItems:'center' }}>
                <MediaUploader accept="image/*" label="📷" small onUpload={(url,type)=>setCmtMedia({url,type})} onClear={()=>setCmtMedia(null)} current={null}/>
                <input value={cmtText} onChange={e=>setCmtText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addComment(post.id)} placeholder="Add a comment…" style={{ flex:1, ...T.input, fontSize:13 }}/>
                <PrimaryBtn small onClick={()=>addComment(post.id)} disabled={!cmtText.trim()&&!cmtMedia}>↑</PrimaryBtn>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  SEARCH PAGE
// ══════════════════════════════════════════════════════════════
function SearchPage({ currentUser, onViewProfile }) {
  const [q,setQ]=useState(''); const [results,setResults]=useState([]); const [loading,setLoading]=useState(false)
  useEffect(()=>{
    if(q.length<2){ setResults([]); return }
    setLoading(true)
    const t = setTimeout(()=>{
      api.get(`/api/search?q=${encodeURIComponent(q)}`).then(d=>{setResults(d);setLoading(false)}).catch(()=>setLoading(false))
    }, 300)
    return ()=>clearTimeout(t)
  },[q])
  return (
    <div style={{ padding:24, maxWidth:640, margin:'0 auto', fontFamily:"'Nunito',sans-serif" }}>
      <PageHeader icon="🔍" title="Find People" subtitle="Search for students and teachers" color="#06b6d4"/>
      <div style={{ position:'relative', marginBottom:20 }}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name..." style={{ ...T.input, paddingLeft:44, fontSize:15 }}/>
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:18, opacity:.5 }}>🔍</span>
      </div>
      {loading&&<div style={{ textAlign:'center', padding:20, color:'var(--text)' }}>Searching...</div>}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {results.map(u=>(
          <div key={u.id} onClick={()=>onViewProfile?.(u.id)} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:'var(--bg2)', borderRadius:12, border:'1px solid var(--border)', cursor:'pointer', transition:'border-color .2s' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--accent)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
            <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color:'#fff', flexShrink:0 }}>{u.name?.[0]?.toUpperCase()}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, color:'var(--text-h)', fontSize:14 }}>{u.name}</div>
              <div style={{ fontSize:12, color:'var(--text)' }}>{u.role} {u.class_level?`· ${u.class_level}`:''} {u.subject_specialization?`· ${u.subject_specialization}`:''}</div>
            </div>
            <span style={{ fontSize:14, color:'var(--text)' }}>→</span>
          </div>
        ))}
      </div>
      {q.length>=2&&results.length===0&&!loading&&<div style={{ textAlign:'center', padding:30, color:'var(--text)' }}>No users found for "{q}"</div>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  PROFILE PAGE (LinkedIn-style)
// ══════════════════════════════════════════════════════════════
function ProfilePage({ userId, currentUser, onMessage, onBack }) {
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [editMode,  setEditMode]  = useState(false)
  const [form,      setForm]      = useState({})
  const [saving,    setSaving]    = useState(false)
  const [ok,        setOk]        = useState(false)
  const [err,       setErr]       = useState('')

  const isOwn    = !userId || userId === currentUser?.id
  const targetId = userId || currentUser?.id

  useEffect(() => {
    if (!targetId) return
    setLoading(true)
    setEditMode(false)
    api.get(`/api/profiles/${targetId}`)
      .then(d => { setData(d); setForm(d.profile || {}); setLoading(false) })
      .catch(() => setLoading(false))
  }, [targetId])

  const save = async () => {
    setSaving(true); setOk(false); setErr('')
    try {
      await api.put('/api/profiles/me', form)
      setData(d => ({ ...d, profile: form }))
      setOk(true)
      setTimeout(() => { setEditMode(false); setOk(false) }, 1500)
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  if (loading) return <PageSpinner />
  if (!data)   return <div style={{ padding:40, textAlign:'center', color:'var(--text)' }}>Profile not found</div>

  const { user, profile: prof, stats, rank } = data

  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", maxWidth:780, margin:'0 auto' }}>

      {/* ── Back button ─────────────────────────────────────── */}
      {onBack && (
        <GhostBtn small onClick={onBack} style={{ marginBottom:16 }}>← Back</GhostBtn>
      )}

      {/* ── Banner ──────────────────────────────────────────── */}
      <div style={{ borderRadius:14, overflow:'hidden', marginBottom:0, position:'relative', height:130, background: prof.banner_url ? `url(${prof.banner_url}) center/cover` : 'linear-gradient(135deg,#4338ca,#6366F1,#8B5CF6)' }}/>

      {/* ── Avatar row ──────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:-32, paddingInline:20, marginBottom:16 }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', border:'3px solid var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:900, color:'#fff', fontFamily:"'Sora',sans-serif", flexShrink:0 }}>
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>

        {/* Action buttons — always visible */}
        <div style={{ display:'flex', gap:8, paddingBottom:4 }}>
          {!isOwn && onMessage && (
            <PrimaryBtn small onClick={() => onMessage(user.id)}>💬 Message</PrimaryBtn>
          )}
          {isOwn && !editMode && (
            <PrimaryBtn small onClick={() => setEditMode(true)}>✏️ Edit Profile</PrimaryBtn>
          )}
          {isOwn && editMode && (
            <>
              <PrimaryBtn small onClick={save} disabled={saving}>
                {saving ? <><Spinner size={12}/> Saving...</> : '💾 Save'}
              </PrimaryBtn>
              <GhostBtn small onClick={() => { setEditMode(false); setForm(data.profile || {}) }}>Cancel</GhostBtn>
            </>
          )}
        </div>
      </div>

      {/* Status messages */}
      {ok  && <SuccessMsg msg="Profile saved successfully!" />}
      {err && <ErrMsg msg={err} />}

      {/* ── Name, headline, badges ──────────────────────────── */}
      <Card style={{ marginBottom:14 }}>
        <h2 style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, color:'var(--text-h)', margin:'0 0 6px', fontSize:22 }}>
          {user?.name}
        </h2>

        {editMode ? (
          <input
            value={form.headline || ''}
            onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
            placeholder="Add a headline — e.g. 'Class 10 student | Science enthusiast'"
            style={{ ...T.input, marginBottom:10 }}
          />
        ) : (
          <p style={{ color:'var(--text)', fontSize:14, margin:'0 0 12px', lineHeight:1.5 }}>
            {prof.headline || `${user?.role === 'teacher' ? '👨‍🏫 Teacher' : '🎒 Student'} ${user?.class_level ? `· ${user.class_level}` : ''}`}
          </p>
        )}

        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          <span style={{ background:'var(--accent-bg)', color:'var(--accent)', border:'1px solid var(--accent-border)', borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700 }}>
            {user?.role === 'teacher' ? '👨‍🏫' : '🎒'} {user?.class_level || user?.role}
          </span>
          {rank?.rank && (
            <span style={{ background:'rgba(245,158,11,.1)', color:'#FCD34D', border:'1px solid rgba(245,158,11,.2)', borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700 }}>
              🏆 Ranked #{rank.rank} of {rank.total_users?.toLocaleString()}
            </span>
          )}
          <span style={{ background:'rgba(99,102,241,.1)', color:'#818CF8', border:'1px solid rgba(99,102,241,.2)', borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700 }}>
            ⚡ {(stats?.total_xp || 0).toLocaleString()} XP
          </span>
          {user?.subject_specialization && (
            <span style={{ background:'rgba(16,185,129,.1)', color:'#6ee7b7', border:'1px solid rgba(16,185,129,.2)', borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700 }}>
              📚 {user.subject_specialization}
            </span>
          )}
        </div>
      </Card>

      {/* ── Stats row ───────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
        {[
          ['🔥', stats?.current_streak || 0, 'Day Streak'],
          ['🤔', stats?.doubts_solved  || 0, 'Doubts'],
          ['🎯', stats?.quizzes_done   || 0, 'Quizzes'],
          ['📖', stats?.notes_made     || 0, 'Notes'],
        ].map(([e, v, l]) => (
          <div key={l} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 10px', textAlign:'center' }}>
            <div style={{ fontSize:20, marginBottom:3 }}>{e}</div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:18, color:'var(--accent)' }}>{v}</div>
            <div style={{ fontSize:10.5, color:'var(--text)' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ── About ───────────────────────────────────────────── */}
      <Card style={{ marginBottom:14 }}>
        <h4 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text-h)', margin:'0 0 10px', fontSize:15 }}>
          About
        </h4>
        {editMode ? (
          <textarea
            value={form.about || ''}
            onChange={e => setForm(f => ({ ...f, about: e.target.value }))}
            placeholder="Tell your story — your goals, interests, favourite subjects..."
            rows={4}
            style={{ ...T.input, resize:'vertical' }}
          />
        ) : (
          <p style={{ color: prof.about ? 'var(--text-h)' : 'var(--text)', fontSize:14, lineHeight:1.7, margin:0, fontStyle: prof.about ? 'normal' : 'italic' }}>
            {prof.about || (isOwn ? 'Click "Edit Profile" to add your bio.' : 'No about section yet.')}
          </p>
        )}
      </Card>

      {/* ── Skills ──────────────────────────────────────────── */}
      <Card style={{ marginBottom:14 }}>
        <h4 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text-h)', margin:'0 0 12px', fontSize:15 }}>
          Skills & Subjects
        </h4>
        {editMode && (
          <div style={{ marginBottom:10 }}>
            <Label>Skills (comma separated)</Label>
            <input
              value={(form.skills || []).join(', ')}
              onChange={e => setForm(f => ({ ...f, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
              placeholder="e.g. Mathematics, Physics, Python, Problem Solving"
              style={{ ...T.input }}
            />
          </div>
        )}
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {(prof.skills || []).map((s, i) => (
            <span key={i} style={{ background:'var(--accent-bg)', color:'var(--accent)', border:'1px solid var(--accent-border)', borderRadius:20, padding:'4px 12px', fontSize:12.5, fontWeight:700 }}>
              {s}
            </span>
          ))}
          {(prof.skills || []).length === 0 && (
            <span style={{ color:'var(--text)', fontSize:13, fontStyle:'italic' }}>
              {isOwn ? 'No skills added yet — click Edit Profile to add some.' : 'No skills listed.'}
            </span>
          )}
        </div>
      </Card>

      {/* ── Location & links (edit mode only) ───────────────── */}
      {editMode && (
        <Card style={{ marginBottom:14 }}>
          <h4 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text-h)', margin:'0 0 14px', fontSize:15 }}>
            More Details
          </h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
            <div>
              <Label>Location</Label>
              <input value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Mumbai, India" style={{ ...T.input }}/>
            </div>
            <div>
              <Label>Website / Portfolio</Label>
              <input value={form.website_url || ''} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://..." style={{ ...T.input }}/>
            </div>
          </div>
          <div style={{ marginTop:12 }}>
            <Label>Hobbies (comma separated)</Label>
            <input value={(form.hobbies || []).join(', ')} onChange={e => setForm(f => ({ ...f, hobbies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} placeholder="e.g. Cricket, Drawing, Reading" style={{ ...T.input }}/>
          </div>
          <div style={{ marginTop:12 }}>
            <Label>Languages (comma separated)</Label>
            <input value={(form.languages || []).join(', ')} onChange={e => setForm(f => ({ ...f, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} placeholder="e.g. English, Hindi, Tamil" style={{ ...T.input }}/>
          </div>
        </Card>
      )}

      {/* ── Non-edit: show location/hobbies if present ──────── */}
      {!editMode && (prof.location || (prof.hobbies || []).length > 0 || (prof.languages || []).length > 0) && (
        <Card style={{ marginBottom:14 }}>
          {prof.location && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, fontSize:13.5, color:'var(--text-h)' }}>
              📍 {prof.location}
            </div>
          )}
          {(prof.languages || []).length > 0 && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
              <span style={{ fontSize:12.5, color:'var(--text)', marginRight:4 }}>🗣️</span>
              {prof.languages.map((l, i) => (
                <span key={i} style={{ background:'var(--code-bg)', border:'1px solid var(--border)', borderRadius:20, padding:'2px 10px', fontSize:12, color:'var(--text-h)', fontWeight:600 }}>{l}</span>
              ))}
            </div>
          )}
          {(prof.hobbies || []).length > 0 && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:12.5, color:'var(--text)', marginRight:4 }}>🎯</span>
              {prof.hobbies.map((h, i) => (
                <span key={i} style={{ background:'var(--code-bg)', border:'1px solid var(--border)', borderRadius:20, padding:'2px 10px', fontSize:12, color:'var(--text-h)', fontWeight:600 }}>{h}</span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Save button at bottom (redundant but helpful UX) ── */}
      {editMode && (
        <div style={{ display:'flex', gap:10, marginTop:4, paddingBottom:24 }}>
          <PrimaryBtn onClick={save} disabled={saving} style={{ flex:1, justifyContent:'center' }}>
            {saving ? <><Spinner/> Saving...</> : '💾 Save Profile'}
          </PrimaryBtn>
          <GhostBtn onClick={() => { setEditMode(false); setForm(data.profile || {}) }}>Cancel</GhostBtn>
        </div>
      )}

    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  MESSAGING PAGE
// ══════════════════════════════════════════════════════════════
function MessagingPage({ currentUser, startWithUserId }) {
  const [convs,setConvs]=useState([]); const [active,setActive]=useState(null); const [msgs,setMsgs]=useState([]); const [input,setInput]=useState(''); const [media,setMedia]=useState(null); const [sending,setSending]=useState(false); const [loading,setLoading]=useState(true)
  const bottomRef=useRef(null); const isMobile=useIsMobile()

  useEffect(()=>{
    api.get('/api/conversations').then(d=>{setConvs(d);setLoading(false)}).catch(()=>setLoading(false))
  },[])

  useEffect(()=>{
    if(startWithUserId){ startConversation(startWithUserId) }
  },[startWithUserId])

  useEffect(()=>{
    if(!active) return
    api.get(`/api/conversations/${active.id}/messages`).then(setMsgs).catch(()=>{})
  },[active])

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[msgs])

  const startConversation=async(receiverId)=>{
    try{ const conv=await api.post('/api/conversations',{receiverId}); setActive(conv); api.get('/api/conversations').then(setConvs) }
    catch(e){ alert(e.message) }
  }

  const send=async()=>{
    if(!input.trim()&&!media) return; setSending(true)
    try{
      const msg=await api.post(`/api/conversations/${active.id}/messages`,{content:input.trim(),media_url:media?.url,media_type:media?.type})
      setMsgs(m=>[...m,msg]); setInput(''); setMedia(null)
      setConvs(c=>c.map(x=>x.id===active.id?{...x,last_message:input.slice(0,60),last_message_at:new Date().toISOString()}:x))
    } catch(e){ alert(e.message) }
    setSending(false)
  }

  return (
    <div style={{ display:'flex', height:'calc(100vh - 120px)', fontFamily:"'Nunito',sans-serif" }}>
      {(!isMobile||!active)&&(
        <div style={{ width:isMobile?'100%':280, borderRight:'1px solid var(--border)', overflowY:'auto', flexShrink:0 }}>
          <div style={{ padding:'16px 16px 10px', fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:16, color:'var(--text-h)', borderBottom:'1px solid var(--border)' }}>💬 Messages</div>
          {loading&&<div style={{ padding:20, textAlign:'center', color:'var(--text)' }}>Loading...</div>}
          {convs.map(c=>(
            <div key={c.id} onClick={()=>setActive(c)} style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer', background:active?.id===c.id?'var(--accent-bg)':'transparent', transition:'background .15s' }}>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:900, color:'#fff', flexShrink:0 }}>{c.other?.name?.[0]||'?'}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13.5, color:'var(--text-h)' }}>{c.other?.name||'Unknown'}</div>
                  <div style={{ fontSize:11.5, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.last_message||'No messages yet'}</div>
                </div>
              </div>
            </div>
          ))}
          {!loading&&convs.length===0&&<div style={{ padding:24, textAlign:'center', color:'var(--text)', fontSize:13 }}>No conversations yet. Visit a profile to start a chat.</div>}
        </div>
      )}
      {active?(
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
            {isMobile&&<button onClick={()=>setActive(null)} style={{ background:'none', border:'none', color:'var(--text)', cursor:'pointer', fontSize:18 }}>←</button>}
            <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, color:'#fff' }}>{active.other?.name?.[0]||'?'}</div>
            <div>
              <div style={{ fontWeight:700, color:'var(--text-h)', fontSize:15 }}>{active.other?.name||'Chat'}</div>
              <div style={{ fontSize:11.5, color:'var(--text)' }}>{active.other?.role} {active.other?.class_level?`· ${active.other.class_level}`:''}</div>
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:8 }}>
            {msgs.map(m=>{
              const isMe=m.sender_id===currentUser.id
              return (
                <div key={m.id} style={{ display:'flex', justifyContent:isMe?'flex-end':'flex-start' }}>
                  <div style={{ maxWidth:'72%', padding:'10px 14px', borderRadius:isMe?'14px 4px 14px 14px':'4px 14px 14px 14px', background:isMe?'linear-gradient(135deg,#6366F1,#8B5CF6)':'var(--bg2)', color:isMe?'#fff':'var(--text-h)', border:isMe?'none':'1px solid var(--border)', fontSize:14, lineHeight:1.6 }}>
                    {m.media_url&&m.media_type==='image'&&<img src={m.media_url} style={{ width:'100%', borderRadius:8, marginBottom:6, maxHeight:200, objectFit:'cover' }} alt=""/>}
                    {m.content&&<div>{m.content}</div>}
                    <div style={{ fontSize:9.5, opacity:.6, marginTop:4, textAlign:'right' }}>{new Date(m.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef}/>
          </div>
          {media?.url&&<div style={{ padding:'0 12px 6px', display:'flex', gap:6 }}><img src={media.url} style={{ height:44, borderRadius:6 }} alt=""/><button onClick={()=>setMedia(null)} style={{ background:'none', border:'none', color:'var(--text)', cursor:'pointer' }}>✕</button></div>}
          <div style={{ padding:12, borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
            <MediaUploader accept="image/*" label="📷" small onUpload={(url,type)=>setMedia({url,type})} onClear={()=>setMedia(null)} current={null}/>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder="Type a message..." style={{ flex:1, ...T.input, fontSize:14 }}/>
            <PrimaryBtn onClick={send} disabled={sending||(!input.trim()&&!media)} small>Send</PrimaryBtn>
          </div>
        </div>
      ):(!isMobile&&<div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text)', flexDirection:'column', gap:12 }}><div style={{ fontSize:48 }}>💬</div><div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:16, color:'var(--text-h)' }}>Select a conversation</div></div>)}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  ASSIGNMENTS (Teacher create + Student view)
// ══════════════════════════════════════════════════════════════
function AssignmentsPage({ user }) {
  const [assignments,setAssignments]=useState([]); const [loading,setLoading]=useState(true); const [creating,setCreating]=useState(false); const [selected,setSelected]=useState(null)
  useEffect(()=>{
    api.get('/api/assignments').then(setAssignments).catch(()=>{}).finally(()=>setLoading(false))
  },[])
  if(loading) return <PageSpinner/>
  if(creating) return <AssignmentCreator user={user} onCreated={a=>{setAssignments(p=>[a,...p]);setCreating(false)}} onBack={()=>setCreating(false)}/>
  if(selected) return <AssignmentDetail assignment={selected} user={user} onBack={()=>setSelected(null)}/>
  return (
    <div style={{ padding:24, fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
        <PageHeader icon="📝" title="Assignments" subtitle={user.role==='teacher'?'Create and manage assignments':'Your assignments'} color="#F59E0B"/>
        {user.role==='teacher'&&<PrimaryBtn onClick={()=>setCreating(true)} color="#F59E0B">+ New Assignment</PrimaryBtn>}
      </div>
      {assignments.length===0&&<div style={{ textAlign:'center', padding:44, color:'var(--text)' }}>No assignments yet.</div>}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {assignments.map(a=>{
          const isPast=new Date(a.deadline)<new Date(); const isUrgent=!isPast&&(new Date(a.deadline)-Date.now())<86400000*2
          return (
            <div key={a.id} onClick={()=>setSelected(a)} style={{ ...T.card, cursor:'pointer', borderLeft:`4px solid ${isPast?'#64748b':isUrgent?'#ef4444':'var(--accent)'}`, transition:'transform .15s' }}
              onMouseEnter={e=>e.currentTarget.style.transform='translateX(3px)'}
              onMouseLeave={e=>e.currentTarget.style.transform='none'}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:15, color:'var(--text-h)', marginBottom:3 }}>{a.title}</div>
                  <div style={{ fontSize:12.5, color:'var(--text)' }}>{a.subject} · {a.class_level} {a.section?`(Sec ${a.section})`:''}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:isPast?'#64748b':isUrgent?'#ef4444':'#22c55e', background:isPast?'rgba(100,116,139,.1)':isUrgent?'rgba(239,68,68,.1)':'rgba(34,197,94,.1)', padding:'3px 10px', borderRadius:20, marginBottom:4 }}>
                    {isPast?'Closed':isUrgent?'⚠️ Due soon':'Active'}
                  </div>
                  <div style={{ fontSize:11.5, color:'var(--text)' }}>Due: {new Date(a.deadline).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <span style={{ background:'var(--code-bg)', border:'1px solid var(--border)', borderRadius:20, padding:'2px 10px', fontSize:11.5, color:'var(--text)', fontWeight:600 }}>📊 {a.total_marks} marks</span>
                <span style={{ background:'var(--code-bg)', border:'1px solid var(--border)', borderRadius:20, padding:'2px 10px', fontSize:11.5, color:'var(--text)', fontWeight:600 }}>{a.answer_type==='pdf'?'📄 PDF only':a.answer_type==='text'?'⌨️ Text only':'🔄 Text or PDF'}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AssignmentCreator({ user, onCreated, onBack }) {
  const [form,setForm]=useState({title:'',description:'',subject:'Mathematics',class_level:'Class 10',section:'',total_marks:20,deadline:'',answer_type:'both',grading_notes:''})
  const [qMode,setQMode]=useState('generate'); const [qPaper,setQPaper]=useState(''); const [qFile,setQFile]=useState(null)
  const [generating,setGenerating]=useState(false); const [saving,setSaving]=useState(false); const [err,setErr]=useState('')
  const set=k=>v=>setForm(f=>({...f,[k]:v}))
  const generatePaper=async()=>{
    setGenerating(true); setErr('')
    try{ const r=await api.post('/api/assignments/generate-paper',{subject:form.subject,class_level:form.class_level,marks:form.total_marks,answer_type:form.answer_type,teacher_notes:form.grading_notes}); setQPaper(r.paper_text) }
    catch(e){ setErr(e.message) }
    setGenerating(false)
  }
  const submit=async()=>{
    if(!form.title||!form.deadline) return setErr('Title and deadline required')
    setSaving(true); setErr('')
    try{ const data=await api.post('/api/assignments',{...form,question_paper_text:qPaper,question_paper_url:qFile}); onCreated?.(data) }
    catch(e){ setErr(e.message) }
    setSaving(false)
  }
  return (
    <div style={{ padding:24, maxWidth:720, margin:'0 auto', fontFamily:"'Nunito',sans-serif" }}>
      {onBack&&<GhostBtn small onClick={onBack} style={{ marginBottom:16 }}>← Back</GhostBtn>}
      <PageHeader icon="📝" title="Create Assignment" subtitle="AI-powered assignment creation with automatic grading after deadline" color="#F59E0B"/>
      <Card style={{ marginBottom:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:14 }}>
          <Field label="Title"><BSInput value={form.title} onChange={set('title')} placeholder="e.g. Chapter 5 Practice"/></Field>
          <Field label="Subject"><BSSelect value={form.subject} onChange={set('subject')} options={SUBJECTS}/></Field>
          <Field label="Class"><BSSelect value={form.class_level} onChange={set('class_level')} options={CLASSES}/></Field>
          <Field label="Section (blank=all)"><BSInput value={form.section} onChange={set('section')} placeholder="A, B, or blank"/></Field>
          <Field label="Total Marks"><input type="number" value={form.total_marks} onChange={e=>set('total_marks')(parseInt(e.target.value))} style={{ ...T.input }}/></Field>
          <Field label="Deadline"><input type="datetime-local" value={form.deadline} onChange={e=>set('deadline')(e.target.value)} min={new Date().toISOString().slice(0,16)} style={{ ...T.input }}/></Field>
        </div>
        <Field label="Expected Answer Format">
          <div style={{ display:'flex', gap:8 }}>
            {[['text','⌨️ Text only'],['pdf','📄 PDF only'],['both','🔄 Either']].map(([v,l])=>(
              <button key={v} onClick={()=>set('answer_type')(v)} style={{ padding:'7px 14px', borderRadius:9, border:`2px solid ${form.answer_type===v?'var(--accent)':'var(--border)'}`, background:form.answer_type===v?'var(--accent-bg)':'transparent', color:form.answer_type===v?'var(--accent)':'var(--text)', fontWeight:700, fontSize:12.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>{l}</button>
            ))}
          </div>
        </Field>
        <Field label="Grading Preferences (AI uses this to grade)">
          <BSTextarea value={form.grading_notes} onChange={set('grading_notes')} rows={2} placeholder="e.g. Focus on method, not just answer. Award partial marks for correct working. Presentation matters."/>
        </Field>
      </Card>
      <Card style={{ marginBottom:14 }}>
        <Label>Question Paper</Label>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          {[['generate','🤖 AI Generate'],['upload','📎 Upload PDF']].map(([v,l])=>(
            <button key={v} onClick={()=>setQMode(v)} style={{ padding:'7px 14px', borderRadius:9, border:`2px solid ${qMode===v?'var(--accent)':'var(--border)'}`, background:qMode===v?'var(--accent-bg)':'transparent', color:qMode===v?'var(--accent)':'var(--text)', fontWeight:700, fontSize:12.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>{l}</button>
          ))}
        </div>
        {qMode==='generate'&&(
          <>
            <PrimaryBtn onClick={generatePaper} disabled={generating} color="#F59E0B" style={{ marginBottom:qPaper?10:0 }}>{generating?<><Spinner/> Generating...</>:'✨ Generate Question Paper'}</PrimaryBtn>
            {qPaper&&<textarea value={qPaper} onChange={e=>setQPaper(e.target.value)} rows={10} style={{ ...T.input, resize:'vertical', marginTop:8 }}/>}
          </>
        )}
        {qMode==='upload'&&<MediaUploader accept="application/pdf" label="Upload Question Paper PDF" onUpload={url=>setQFile(url)} onClear={()=>setQFile(null)} current={qFile?{url:qFile,type:'pdf'}:null}/>}
      </Card>
      <ErrMsg msg={err}/>
      <PrimaryBtn onClick={submit} disabled={saving} color="#F59E0B" style={{ width:'100%', justifyContent:'center', fontSize:15 }}>{saving?<><Spinner/> Publishing...</>:'📤 Publish Assignment'}</PrimaryBtn>
    </div>
  )
}

function AssignmentDetail({ assignment, user, onBack }) {
  const [submission,setSubmission]=useState(null); const [analysis,setAnalysis]=useState(null); const [answers,setAnswers]=useState({}); const [pdfFile,setPdfFile]=useState(null); const [submitting,setSubmitting]=useState(false); const [submitted,setSubmitted]=useState(false); const [teacherAnalysis,setTeacherAnalysis]=useState(null); const [loading,setLoading]=useState(true)
  const isPast=new Date(assignment.deadline)<new Date()
  useEffect(()=>{
    Promise.all([
      api.get(`/api/assignments/${assignment.id}/analysis/me`),
      user.role==='teacher'?api.get(`/api/assignments/${assignment.id}/analysis/all`):Promise.resolve(null),
    ]).then(([a,ta])=>{setAnalysis(a);setTeacherAnalysis(ta);setLoading(false)}).catch(()=>setLoading(false))
  },[assignment.id])

  const submitText=async()=>{
    setSubmitting(true)
    try{
      const ansArr=Object.entries(answers).map(([q_num,answer_text])=>({q_num:parseInt(q_num),answer_text}))
      await api.post(`/api/assignments/${assignment.id}/submit`,{answers:JSON.stringify(ansArr)})
      setSubmitted(true)
    } catch(e){ alert(e.message) }
    setSubmitting(false)
  }

  const submitPDF=async()=>{
    if(!pdfFile) return
    setSubmitting(true)
    try{
      const form=new FormData(); form.append('pdf',pdfFile)
      const tok=localStorage.getItem('bs_token')
      const r=await fetch(`${API_URL}/api/assignments/${assignment.id}/submit`,{method:'POST',headers:{Authorization:`Bearer ${tok}`},body:form})
      if(!r.ok){ const d=await r.json(); throw new Error(d.error) }
      setSubmitted(true)
    } catch(e){ alert(e.message) }
    setSubmitting(false)
  }

  const questions=assignment.questions_json?.questions||[]
  return (
    <div style={{ padding:24, maxWidth:760, margin:'0 auto', fontFamily:"'Nunito',sans-serif" }}>
      <GhostBtn small onClick={onBack} style={{ marginBottom:16 }}>← Back</GhostBtn>
      <Card style={{ marginBottom:18, borderLeft:`4px solid ${isPast?'#64748b':'var(--accent)'}` }}>
        <h2 style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, color:'var(--text-h)', margin:'0 0 6px' }}>{assignment.title}</h2>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:10 }}>
          <span style={{ fontSize:12.5, color:'var(--text)' }}>{assignment.subject} · {assignment.class_level}</span>
          <span style={{ fontSize:12.5, color:'var(--text)' }}>📊 {assignment.total_marks} marks</span>
          <span style={{ fontSize:12.5, color:isPast?'#fca5a5':'#6ee7b7', fontWeight:700 }}>🕐 {isPast?'Deadline passed':'Due: '}{new Date(assignment.deadline).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
        </div>
        {assignment.description&&<p style={{ color:'var(--text)', fontSize:13.5, marginBottom:10 }}>{assignment.description}</p>}
        {assignment.question_paper_text&&<div style={{ background:'var(--code-bg)', border:'1px solid var(--border)', borderRadius:10, padding:16, whiteSpace:'pre-wrap', fontFamily:'monospace', fontSize:13, color:'var(--text-h)', maxHeight:300, overflowY:'auto' }}>{assignment.question_paper_text}</div>}
      </Card>

      {/* Student: submission form */}
      {user.role==='student'&&!isPast&&!submitted&&!analysis&&(
        <Card style={{ marginBottom:14 }}>
          <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:15, color:'var(--text-h)', margin:'0 0 16px' }}>Your Submission</h3>
          {(assignment.answer_type==='text'||assignment.answer_type==='both')&&questions.map(q=>(
            <div key={q.q_num} style={{ marginBottom:14 }}>
              <div style={{ fontSize:13.5, fontWeight:700, color:'var(--text-h)', marginBottom:6 }}>Q{q.q_num}. {q.question} [{q.max_marks} marks]</div>
              <BSTextarea value={answers[q.q_num]||''} onChange={v=>setAnswers(a=>({...a,[q.q_num]:v}))} rows={3} placeholder="Type your answer here..."/>
            </div>
          ))}
          {(assignment.answer_type==='pdf'||assignment.answer_type==='both')&&(
            <div style={{ marginBottom:14 }}>
              <Label>Upload PDF Answer</Label>
              <input type="file" accept="application/pdf" onChange={e=>setPdfFile(e.target.files[0])} style={{ color:'var(--text)', fontFamily:"'Nunito',sans-serif" }}/>
              {pdfFile&&<div style={{ marginTop:8, fontSize:13, color:'#6ee7b7' }}>📄 {pdfFile.name}</div>}
            </div>
          )}
          <div style={{ display:'flex', gap:10 }}>
            {(assignment.answer_type==='text'||assignment.answer_type==='both')&&Object.keys(answers).length>0&&<PrimaryBtn onClick={submitText} disabled={submitting}>{submitting?<><Spinner/> Submitting...</>:'Submit Text Answers'}</PrimaryBtn>}
            {(assignment.answer_type==='pdf'||assignment.answer_type==='both')&&pdfFile&&<PrimaryBtn onClick={submitPDF} disabled={submitting} color="#F97316">{submitting?<><Spinner/> Uploading...</>:'Upload PDF'}</PrimaryBtn>}
          </div>
        </Card>
      )}

      {submitted&&<SuccessMsg msg="Submitted! You'll receive AI feedback after the deadline."/>}

      {/* Student: analysis */}
      {user.role==='student'&&analysis&&(
        <Card style={{ borderLeft:'4px solid #22c55e' }}>
          <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:16, color:'#6ee7b7', margin:'0 0 16px' }}>🤖 AI Feedback</h3>
          <div style={{ display:'flex', gap:16, marginBottom:16, background:'rgba(34,197,94,.1)', padding:'14px 16px', borderRadius:10 }}>
            <div style={{ textAlign:'center' }}><div style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:28, color:'#6ee7b7' }}>{analysis.total_marks_awarded}/{analysis.total_marks_max}</div><div style={{ fontSize:11, color:'var(--text)' }}>Total Marks</div></div>
          </div>
          {analysis.overall_feedback&&<p style={{ color:'var(--text-h)', fontSize:14, marginBottom:14, lineHeight:1.7 }}>{analysis.overall_feedback}</p>}
          {analysis.handwriting_quality&&<div style={{ marginBottom:12, padding:'8px 12px', background:'var(--code-bg)', borderRadius:8, fontSize:13, color:'var(--text-h)' }}>✍️ Handwriting: <strong>{analysis.handwriting_quality}</strong> — {analysis.handwriting_tips}</div>}
          {(analysis.questions_analysis||[]).map((qa,i)=>(
            <Card key={i} style={{ marginBottom:10, borderLeft:`3px solid ${qa.marks_awarded>=qa.marks_max*0.7?'#22c55e':'#f59e0b'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontWeight:700, color:'var(--text-h)', fontSize:13.5 }}>Q{qa.q_num}</span>
                <span style={{ fontWeight:800, color:'var(--accent)', fontSize:14 }}>{qa.marks_awarded}/{qa.marks_max}</span>
              </div>
              <p style={{ color:'var(--text-h)', fontSize:13, marginBottom:6, lineHeight:1.6 }}>{qa.feedback}</p>
              {qa.improvement_tip&&<p style={{ color:'#FCD34D', fontSize:12.5, margin:0 }}>💡 {qa.improvement_tip}</p>}
            </Card>
          ))}
        </Card>
      )}

      {/* Teacher: all students analysis */}
      {user.role==='teacher'&&teacherAnalysis&&teacherAnalysis.length>0&&(
        <div>
          <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:16, color:'var(--text-h)', margin:'0 0 14px' }}>📊 Student Results Summary</h3>
          {teacherAnalysis.map((a,i)=>(
            <Card key={i} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div>
                  <div style={{ fontWeight:700, color:'var(--text-h)', fontSize:14 }}>{a.users?.name||'Student'}</div>
                  <div style={{ fontSize:12, color:'var(--text)' }}>{a.users?.class_level} {a.users?.section?`· Sec ${a.users.section}`:''}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:20, color:'var(--accent)' }}>{a.total_marks_awarded}/{a.total_marks_max}</div>
                  <div style={{ fontSize:11, color:'var(--text)' }}>Potential marks</div>
                </div>
              </div>
              {a.overall_feedback&&<p style={{ color:'var(--text)', fontSize:12.5, lineHeight:1.6, margin:0 }}>{a.overall_feedback}</p>}
            </Card>
          ))}
        </div>
      )}

      {loading&&<PageSpinner/>}
      {isPast&&!analysis&&user.role==='student'&&<Card style={{ textAlign:'center', padding:24 }}><div style={{ fontSize:36, marginBottom:8 }}>⏳</div><p style={{ color:'var(--text)', fontSize:14 }}>AI analysis is being prepared. Check back shortly.</p></Card>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  AI BUDDY FLOATING WIDGET
// ══════════════════════════════════════════════════════════════
function AIBuddy({ user }) {
  const [open,setOpen]=useState(false); const [messages,setMessages]=useState([{role:'assistant',content:`Hey ${user?.name?.split(' ')[0]}! 👋 I'm your AI study buddy. I know your schedule and school updates. What's on your mind?`}]); const [input,setInput]=useState(''); const [loading,setLoading]=useState(false); const bottomRef=useRef(null)
  useEffect(()=>{ if(open) bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages,open])
  const send=async()=>{
    if(!input.trim()) return
    const userMsg={role:'user',content:input.trim()}; setMessages(m=>[...m,userMsg]); setInput(''); setLoading(true)
    try{
      const r=await api.post('/api/buddy/chat',{message:input.trim(),sessionMessages:messages.slice(-8)})
      setMessages(m=>[...m,{role:'assistant',content:r.content}])
    } catch{ setMessages(m=>[...m,{role:'assistant',content:"I had trouble connecting. Try again! 🔄"}]) }
    setLoading(false)
  }
  return (
    <>
      <div onClick={()=>setOpen(!open)} style={{ position:'fixed', bottom:24, right:24, width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow:'0 4px 20px rgba(99,102,241,.4)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:1000, fontSize:22, transition:'transform .2s' }}
        onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
        {open?'✕':'🤖'}
      </div>
      {open&&(
        <div style={{ position:'fixed', bottom:88, right:24, width:320, height:460, borderRadius:18, background:'var(--bg2)', border:'1px solid var(--accent-border)', boxShadow:'0 20px 60px rgba(0,0,0,.5)', display:'flex', flexDirection:'column', zIndex:999, overflow:'hidden', fontFamily:"'Nunito',sans-serif" }}>
          <div style={{ padding:'12px 16px', background:'linear-gradient(135deg,#4338ca,#6366F1)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>🤖</div>
            <div><div style={{ fontWeight:800, color:'#fff', fontSize:14 }}>AI Buddy</div><div style={{ fontSize:11, color:'rgba(255,255,255,.7)' }}>Your personal study companion</div></div>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8 }}>
            {messages.map((m,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
                <div style={{ maxWidth:'86%', padding:'8px 12px', borderRadius:m.role==='user'?'12px 3px 12px 12px':'3px 12px 12px 12px', background:m.role==='user'?'var(--accent)':'var(--code-bg)', color:m.role==='user'?'#fff':'var(--text-h)', fontSize:13, lineHeight:1.6, border:m.role==='assistant'?'1px solid var(--border)':'none' }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading&&<div style={{ display:'flex', gap:4, padding:'8px 12px', background:'var(--code-bg)', borderRadius:'3px 12px 12px 12px', width:'fit-content', border:'1px solid var(--border)' }}>{[0,1,2].map(j=><div key={j} style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', animation:`dotBounce 1s ${j*.2}s infinite` }}/>)}</div>}
            <div ref={bottomRef}/>
          </div>
          <div style={{ padding:10, borderTop:'1px solid var(--border)', display:'flex', gap:6 }}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask me anything..." disabled={loading} style={{ flex:1, ...T.input, fontSize:13 }}/>
            <button onClick={send} disabled={loading||!input.trim()} style={{ padding:'8px 12px', borderRadius:10, border:'none', background:'var(--accent)', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13 }}>→</button>
          </div>
        </div>
      )}
    </>
  )
}

// ══════════════════════════════════════════════════════════════
//  SCHOOL NOTICES
// ══════════════════════════════════════════════════════════════
function NoticesPage({ user }) {
  const [notices,setNotices]=useState([]); const [loading,setLoading]=useState(true); const [creating,setCreating]=useState(false); const [form,setForm]=useState({title:'',content:'',notice_type:'general',target_audience:'all',is_pinned:false}); const [saving,setSaving]=useState(false)
  useEffect(()=>{ api.get('/api/school/notices').then(setNotices).catch(()=>{}).finally(()=>setLoading(false)) },[])
  const submit=async()=>{
    setSaving(true)
    try{
      const n=await api.post('/api/school/notices',form);
      setNotices(p=>[n,...p]);
      setCreating(false);
      setForm({title:'',content:'',notice_type:'general',target_audience:'all',is_pinned:false})
    } catch(e){ alert(e.message) }
    setSaving(false)
  }

  const canCreate = ['admin','principal','teacher'].includes(user.role)
  const TYPES = [{v:'general',l:'📢 General'},{v:'exam',l:'📝 Exam'},{v:'event',l:'🎉 Event'},{v:'holiday',l:'🏖️ Holiday'},{v:'sports',l:'⚽ Sports'},{v:'cultural',l:'🎭 Cultural'}]

  return (
    <div style={{ padding:24, fontFamily:"'Nunito',sans-serif", maxWidth:760, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <PageHeader icon="📢" title="School Notices" subtitle="Stay updated with school announcements" color="#F97316"/>
        {canCreate&&!creating&&<PrimaryBtn onClick={()=>setCreating(true)} color="#F97316">+ New Notice</PrimaryBtn>}
      </div>

      {creating&&(
        <Card style={{ marginBottom:20, borderColor:'#F97316' }}>
          <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text-h)', margin:'0 0 16px', fontSize:15 }}>Create Notice</h3>
          <Field label="Title"><BSInput value={form.title} onChange={v=>setForm(f=>({...f,title:v}))} placeholder="Notice title..."/></Field>
          <Field label="Content"><BSTextarea value={form.content} onChange={v=>setForm(f=>({...f,content:v}))} rows={4} placeholder="Notice details..."/></Field>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12, marginBottom:14 }}>
            <div>
              <Label>Type</Label>
              <BSSelect value={form.notice_type} onChange={v=>setForm(f=>({...f,notice_type:v}))} options={TYPES.map(t=>({value:t.v,label:t.l}))}/>
            </div>
            {user.role!=='teacher'&&<div>
              <Label>Audience</Label>
              <BSSelect value={form.target_audience} onChange={v=>setForm(f=>({...f,target_audience:v}))} options={[{value:'all',label:'Everyone'},{value:'students',label:'Students only'},{value:'teachers',label:'Teachers only'}]}/>
            </div>}
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'var(--text)', fontWeight:600, marginBottom:14 }}>
            <input type="checkbox" checked={form.is_pinned} onChange={e=>setForm(f=>({...f,is_pinned:e.target.checked}))} style={{ accentColor:'var(--accent)' }}/>
            📌 Pin this notice
          </label>
          <div style={{ display:'flex', gap:10 }}>
            <PrimaryBtn onClick={submit} disabled={saving||!form.title||!form.content} color="#F97316">{saving?<><Spinner/> Posting...</>:'📤 Post Notice'}</PrimaryBtn>
            <GhostBtn onClick={()=>setCreating(false)}>Cancel</GhostBtn>
          </div>
        </Card>
      )}

      {loading&&<PageSpinner/>}
      {!loading&&notices.length===0&&<div style={{ textAlign:'center', padding:40, color:'var(--text)' }}>No notices yet.</div>}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {notices.map(n=>{
          const typeColors = {general:'#6366F1',exam:'#F59E0B',event:'#10B981',holiday:'#06b6d4',sports:'#EF4444',cultural:'#A855F7'}
          const color = typeColors[n.notice_type]||'#6366F1'
          return (
            <div key={n.id} style={{ ...T.card, borderLeft:`4px solid ${color}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                    {n.is_pinned&&<span style={{ fontSize:12, color:'#F59E0B' }}>📌</span>}
                    <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:15, color:'var(--text-h)' }}>{n.title}</span>
                    <span style={{ background:`${color}18`, color, border:`1px solid ${color}28`, borderRadius:20, padding:'2px 10px', fontSize:10.5, fontWeight:700, textTransform:'capitalize' }}>{n.notice_type}</span>
                  </div>
                  <p style={{ color:'var(--text-h)', fontSize:13.5, lineHeight:1.7, margin:'0 0 10px' }}>{n.content}</p>
                  <div style={{ fontSize:11.5, color:'var(--text)' }}>{timeAgo(n.created_at)} · {n.target_audience==='all'?'Everyone':n.target_audience}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  TIMETABLE VIEWER
// ══════════════════════════════════════════════════════════════
function TimetablePage({ user }) {
  const [timetable,setTimetable]=useState(null); const [loading,setLoading]=useState(true); const [editing,setEditing]=useState(false)
  const [rawSchedule,setRawSchedule]=useState(''); const [saving,setSaving]=useState(false)
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const COLORS = {'Mathematics':'#6366F1','Science':'#10B981','Physics':'#06b6d4','Chemistry':'#F59E0B','Biology':'#22c55e','English':'#EF4444','Hindi':'#A855F7','Social Science':'#F97316','History':'#ec4899','Geography':'#34d399','default':'#64748b'}

  useEffect(()=>{
    api.get('/api/school/timetable').then(d=>{ setTimetable(d); if(d) setRawSchedule(JSON.stringify(d.schedule, null, 2)) }).catch(()=>{}).finally(()=>setLoading(false))
  },[])

  const save=async()=>{
    setSaving(true)
    try{
      const schedule = JSON.parse(rawSchedule)
      const result = await api.post('/api/school/timetable',{class_level:user.class_level,section:user.section||'A',schedule})
      setTimetable(result); setEditing(false)
    } catch(e){ alert('Invalid JSON or save failed: '+e.message) }
    setSaving(false)
  }

  if(loading) return <PageSpinner/>

  const schedule = timetable?.schedule?.week || []

  return (
    <div style={{ padding:24, fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <PageHeader icon="📅" title="Timetable" subtitle={`${user.class_level||'Your class'} schedule`} color="#06b6d4"/>
        {user.role==='teacher'&&!editing&&<PrimaryBtn onClick={()=>setEditing(true)} color="#06b6d4">✏️ Edit</PrimaryBtn>}
      </div>

      {editing&&(
        <Card style={{ marginBottom:20 }}>
          <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text-h)', margin:'0 0 12px', fontSize:15 }}>Edit Timetable (JSON)</h3>
          <div style={{ background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.25)', borderRadius:9, padding:'10px 14px', marginBottom:12, fontSize:12.5, color:'#FCD34D' }}>
            Format: {"{"}"week": [{"{"}"day": "Monday", "periods": [{"{"}"period": 1, "subject": "Mathematics", "teacher": "Mr. Ramesh", "time_start": "08:00", "time_end": "08:45"{"}"}]{"}"}]{"}"}
          </div>
          <textarea value={rawSchedule} onChange={e=>setRawSchedule(e.target.value)} rows={12} style={{ ...T.input, resize:'vertical', fontFamily:'monospace', fontSize:12 }}/>
          <div style={{ display:'flex', gap:10, marginTop:12 }}>
            <PrimaryBtn onClick={save} disabled={saving} color="#06b6d4">{saving?<><Spinner/> Saving...</>:'💾 Save Timetable'}</PrimaryBtn>
            <GhostBtn onClick={()=>setEditing(false)}>Cancel</GhostBtn>
          </div>
        </Card>
      )}

      {!timetable&&!editing&&(
        <div style={{ textAlign:'center', padding:44, color:'var(--text)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📅</div>
          <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:16, color:'var(--text-h)', marginBottom:8 }}>No timetable uploaded yet</div>
          {user.role==='teacher'&&<PrimaryBtn onClick={()=>setEditing(true)} color="#06b6d4">Upload Timetable</PrimaryBtn>}
        </div>
      )}

      {schedule.length>0&&(
        <div style={{ overflowX:'auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:`120px repeat(${Math.max(...schedule.map(d=>d.periods?.length||0))},1fr)`, gap:6, minWidth:600 }}>
            <div style={{ padding:'10px 12px', fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text)', fontSize:11, textTransform:'uppercase' }}>Day</div>
            {Array.from({length:Math.max(...schedule.map(d=>d.periods?.length||0))},(_, i)=>(
              <div key={i} style={{ padding:'10px 8px', textAlign:'center', fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text)', fontSize:11, textTransform:'uppercase' }}>Period {i+1}</div>
            ))}
            {schedule.map((day,di)=>(
              <div key={di} style={{ display:'contents' }}>
                <div style={{ padding:'10px 12px', display:'flex', alignItems:'center', fontWeight:800, color:'var(--text-h)', fontSize:13, fontFamily:"'Sora',sans-serif", background:'var(--bg2)', borderRadius:10, border:'1px solid var(--border)' }}>{day.day}</div>
                {(day.periods||[]).map((p,pi)=>{
                  const color = COLORS[p.subject]||COLORS.default
                  return (
                    <div key={pi} style={{ background:`${color}15`, border:`1px solid ${color}25`, borderRadius:10, padding:'10px 10px', textAlign:'center' }}>
                      <div style={{ fontWeight:800, fontSize:12.5, color, fontFamily:"'Sora',sans-serif", marginBottom:2 }}>{p.subject}</div>
                      <div style={{ fontSize:10.5, color:'var(--text)' }}>{p.teacher}</div>
                      <div style={{ fontSize:10, color:'var(--text)', marginTop:2 }}>{p.time_start}–{p.time_end}</div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  SCHOOL ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════
function SchoolDashboard({ user }) {
  const [analytics,setAnalytics]=useState([]); const [loading,setLoading]=useState(true); const [filter,setFilter]=useState('all')
  useEffect(()=>{ api.get('/api/school/analytics').then(setAnalytics).catch(()=>{}).finally(()=>setLoading(false)) },[])

  const shown = filter==='all'?analytics:analytics.filter(u=>u.role===filter)
  const totalXP = analytics.reduce((s,u)=>s+(u.total_xp||0),0)
  const totalDoubts = analytics.reduce((s,u)=>s+(u.doubts_solved||0),0)
  const activeToday = analytics.filter(u=>u.last_active_at&&new Date(u.last_active_at)>new Date(Date.now()-86400000)).length

  return (
    <div style={{ padding:24, fontFamily:"'Nunito',sans-serif" }}>
      <PageHeader icon="🏫" title="School Analytics" subtitle="Real-time usage and performance dashboard" color="#A855F7"/>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:20 }}>
        {[['👥',analytics.length,'Total Users','#6366F1'],['⚡',totalXP.toLocaleString(),'Total XP','#F59E0B'],['🤔',totalDoubts,'Doubts Solved','#10B981'],['🟢',activeToday,'Active Today','#22c55e']].map(([e,v,l,c])=>(
          <div key={l} style={{ background:`${c}15`, border:`1px solid ${c}25`, borderRadius:14, padding:'14px 12px', textAlign:'center' }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{e}</div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:22, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:'var(--text)', marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[['all','All'],['student','Students'],['teacher','Teachers']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{ padding:'6px 16px', borderRadius:20, border:'none', fontWeight:700, fontSize:12.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:filter===v?'var(--accent)':'var(--social-bg)', color:filter===v?'#fff':'var(--text-h)', transition:'all .15s' }}>{l}</button>
        ))}
      </div>

      {loading&&<PageSpinner/>}

      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:"'Nunito',sans-serif" }}>
          <thead>
            <tr>
              {['Name','Class/Role','XP','Streak','Doubts','Quizzes','Notes','Assignments','Last Active'].map(h=>(
                <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:10.5, fontWeight:800, color:'var(--text)', textTransform:'uppercase', letterSpacing:'.5px', borderBottom:'1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((u,i)=>(
              <tr key={u.user_id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'rgba(255,255,255,.01)' }}>
                <td style={{ padding:'10px 12px', fontSize:13.5, color:'var(--text-h)', fontWeight:600 }}>{u.name}</td>
                <td style={{ padding:'10px 12px', fontSize:12, color:'var(--text)' }}>{u.class_level||'-'} {u.section?`·${u.section}`:''} <span style={{ fontSize:10.5, color:'var(--accent)' }}>{u.role}</span></td>
                <td style={{ padding:'10px 12px', fontSize:13, color:'#FCD34D', fontWeight:700 }}>{(u.total_xp||0).toLocaleString()}</td>
                <td style={{ padding:'10px 12px', fontSize:13, color:'#FB923C' }}>{u.streak||0}d</td>
                <td style={{ padding:'10px 12px', fontSize:13, color:'#34D399' }}>{u.doubts_solved||0}</td>
                <td style={{ padding:'10px 12px', fontSize:13, color:'#A78BFA' }}>{u.quizzes_done||0}</td>
                <td style={{ padding:'10px 12px', fontSize:13, color:'#FCA5A5' }}>{u.notes_made||0}</td>
                <td style={{ padding:'10px 12px', fontSize:13, color:'#6ee7b7' }}>{u.assignments_submitted||0}</td>
                <td style={{ padding:'10px 12px', fontSize:11.5, color:'var(--text)' }}>{u.last_active_at?timeAgo(u.last_active_at):'Never'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading&&shown.length===0&&<div style={{ textAlign:'center', padding:32, color:'var(--text)' }}>No data yet.</div>}
      </div>
    </div>
  )
}


// Loads the most recent saved item for a tool matching subject + chapter/chapters
async function loadSavedContent(tool, subject, chapter, chapters) {
  const endpoints = {
    notes:      { list: '/api/user/notes',      detail: id => `/api/user/notes/${id}`,      matchFn: (n) => n.subject === subject && n.chapter === chapter },
    paper:      { list: '/api/user/papers',     detail: id => `/api/user/papers`,           matchFn: (n) => n.subject === subject && (n.chapters||[]).some(c => (chapters||[]).includes(c) || c === chapter) },
    cheatsheet: { list: '/api/user/cheatsheets',detail: id => `/api/user/cheatsheets`,      matchFn: (n) => n.subject === subject && (n.chapters||[]).some(c => (chapters||[]).includes(c) || c === chapter) },
    lessonplan: { list: '/api/user/lessonplans', detail: id => `/api/user/lessonplans`,     matchFn: (n) => n.subject === subject && (n.topic === chapter) },
  }
  const cfg = endpoints[tool]
  if (!cfg) return null
  try {
    const list  = await api.get(cfg.list)
    const match = list.find(cfg.matchFn)
    if (!match) return null
    // notes have a real detail endpoint; others store content in list already
    if (tool === 'notes') {
      const full = await api.get(`/api/user/notes/${match.id}`)
      return full.content
    }
    return match.content || null
  } catch { return null }
}

// ══════════════════════════════════════════════════════════════
//  DOUBT SOLVER
// ══════════════════════════════════════════════════════════════
function DoubtSolver({ user, prefill, onClearPrefill }) {
  const [messages,setMessages]=useState([{role:'assistant',content:"👋 Hi! Ask me any doubt — I'll give you a **clear, step-by-step explanation** tailored to your CBSE syllabus. 🎯"}])
  const [input,setInput]=useState(''); const [subject,setSubject]=useState('Mathematics'); const [loading,setLoading]=useState(false); const [err,setErr]=useState('')
  const bottomRef=useRef(null)
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'})},[messages])
  useEffect(() => {
  if (!prefill) return
  if (prefill.subject) setSubject(prefill.subject)
  onClearPrefill?.()
}, [])
  const SYSTEM=`You are an expert CBSE teacher specializing in ${subject}. Help students understand concepts clearly with step-by-step explanations. Use simple language and relatable examples. Use **bold** for key terms. Be encouraging and thorough.`
  const send=async()=>{
    if (!input.trim()) return
    const userMsg={role:'user',content:input.trim()}; setMessages(m=>[...m,userMsg]); setInput(''); setErr(''); setLoading(true)
    try{
      const r=await api.post('/api/ai/doubt',{messages:[...messages,userMsg],system:SYSTEM,subject})
      setMessages(m=>[...m,{role:'assistant',content:r.content}])
    } catch(e){ if(e.status===402){setErr('Free trial ended. Please subscribe.')}else{setErr(e.message)} }
    setLoading(false)
  }
  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', display:'flex', flexDirection:'column', height:'calc(100vh - 100px)', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <PageHeader icon="🤔" title="AI Doubt Solver" subtitle="Ask anything — get clear, step-by-step CBSE explanations" color="#6366F1"/>
      <div style={{ marginBottom:14 }}><BSSelect value={subject} onChange={setSubject} options={SUBJECTS} style={{ maxWidth:220 }}/></div>
      <div style={{ ...T.card, flex:1, overflowY:'auto', marginBottom:14, minHeight:200, display:'flex', flexDirection:'column', gap:14 }}>
        {messages.map((m,i)=>(
          <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', alignItems:'flex-start', gap:10 }}>
            {m.role==='assistant'&&<div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:16, marginTop:2 }}>🧠</div>}
            <div style={{ maxWidth:'78%', padding:'11px 15px', borderRadius:m.role==='user'?'14px 4px 14px 14px':'4px 14px 14px 14px', fontSize:14, lineHeight:1.75, background:m.role==='user'?'linear-gradient(135deg,#6366F1,#8B5CF6)':'var(--code-bg)', color:m.role==='user'?'#fff':'var(--text-h)', border:m.role==='assistant'?'1px solid var(--border)':'none' }}
              dangerouslySetInnerHTML={{__html:m.role==='assistant'?m.content.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>'):m.content}}/>
          </div>
        ))}
        {loading&&<div style={{ display:'flex', alignItems:'center', gap:10 }}><div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🧠</div><div style={{ background:'var(--code-bg)', padding:'12px 16px', borderRadius:'4px 14px 14px 14px', border:'1px solid var(--border)', display:'flex', gap:5, alignItems:'center' }}>{[0,1,2].map(j=><div key={j} style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent)', animation:`dotBounce 1s ${j*.2}s infinite ease-in-out`}}/>)}</div></div>}
        <div ref={bottomRef}/>
      </div>
      <ErrMsg msg={err}/>
      <div style={{ display:'flex', gap:10 }}>
        <input style={{ ...T.input, flex:1 }} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder={`Ask a ${subject} question... (Enter to send)`} disabled={loading}/>
        <PrimaryBtn onClick={send} disabled={loading||!input.trim()}>Send →</PrimaryBtn>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  NOTES MAKER
// ══════════════════════════════════════════════════════════════
function NotesMaker({ user, prefill, onClearPrefill }) {
  const [subject,setSubject]=useState('Mathematics'); const [cls,setCls]=useState('Class 10')
  const [chapter,setChapter]=useState(''); const [customCh,setCustomCh]=useState(''); const [style_,setStyle_]=useState('Detailed')
  const [result,setResult]=useState(''); const [loading,setLoading]=useState(false); const [saved,setSaved]=useState(false); const [err,setErr]=useState('')
  const chapters=getChapters(subject,cls); const finalChapter=chapter||customCh||chapters[0]
  const buildPrompt=()=>`You are a senior CBSE textbook author. Write comprehensive, exam-ready study notes for "${finalChapter}" — ${subject} ${cls} CBSE. Style: ${style_}. TARGET: 900-1200 words.

# ${finalChapter}
**Subject:** ${subject} | **Class:** ${cls} | **Board:** CBSE

## 1. Introduction & Context
## 2. Core Concepts (explain every subtopic thoroughly)
## 3. Important Formulas, Laws & Rules (with derivations where needed)
## 4. Solved Examples (2-3 with step-by-step solutions)
## 5. Exam-Style Questions (5 questions with answers)
## 6. Quick Revision Points ⚡
## 7. Common Mistakes to Avoid ⚠️
## 8. Previous Year CBSE Question Patterns

MANDATORY: Cover EVERY subtopic. Minimum 900 words. Use **bold** for key terms only.`


  useEffect(() => {
    if (!prefill) return
    if (prefill.subject) setSubject(prefill.subject)
    if (prefill.chapter) { setChapter(prefill.chapter); setCustomCh('') }
    onClearPrefill?.()
    // Try to load previously saved note
    loadSavedContent('notes', prefill.subject, prefill.chapter, []).then(content => {
      if (content) { setResult(content); setSaved(true) }
    })
  }, [])

  async function generate() {
    if(!finalChapter) return; setErr(''); setLoading(true); setSaved(false)
    try{ const r=await api.post('/api/ai/notes',{messages:[{role:'user',content:buildPrompt()}],subject,chapter:finalChapter}); setResult(r.content) }
    catch(e){ if(e.status===402){setErr('Free trial ended. Please subscribe.')}else{setErr(e.message)} }
    setLoading(false)
  }
  async function saveNote() { try{await api.post('/api/user/notes',{subject,classLevel:cls,chapter:finalChapter,style:style_,content:result});setSaved(true)}catch(e){alert(e.message)} }

  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <PageHeader icon="📖" title="Chapter Notes Maker" subtitle="Textbook-quality comprehensive notes — download or print as PDF" color="#10B981"/>
      <Card style={{ marginBottom:18 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:4 }}>
          <Field label="Subject"><BSSelect value={subject} onChange={v=>{setSubject(v);setChapter('')}} options={SUBJECTS}/></Field>
          <Field label="Class"><BSSelect value={cls} onChange={setCls} options={CLASSES}/></Field>
        </div>
        <Field label="Chapter">
          <BSSelect value={chapter} onChange={setChapter} options={[{value:'',label:'-- Select Chapter --'},...chapters.map(c=>({value:c,label:c}))]}/>
        </Field>
        {!chapter&&<Field label="Or enter chapter name manually"><BSInput value={customCh} onChange={setCustomCh} placeholder="e.g. Gravitation, Mughal Empire"/></Field>}
        <Field label="Notes Style"><BSSelect value={style_} onChange={setStyle_} options={['Detailed','Concise','Bullet Points','Q&A Format','Mind Map Style']}/></Field>
        <PrimaryBtn onClick={generate} disabled={loading||(!chapter&&!customCh)} color="#10B981">{loading?<><Spinner/> Generating notes...</>:'📖 Generate Comprehensive Notes'}</PrimaryBtn>
      </Card>
      <ErrMsg msg={err}/>
      {result&&<>
        <ContentBox content={result} label={`${finalChapter} Notes — ${subject} ${cls}`} downloadName={`${finalChapter}-notes.txt`} onDownload={()=>downloadText(result,`${finalChapter}-notes.txt`)}/>
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          {!saved?<GhostBtn small onClick={saveNote}>💾 Save to Library</GhostBtn>:<SuccessMsg msg="Saved to Library!"/>}
        </div>
      </>}
      <XPBadge amount={20} label="per notes generated"/>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  CHEAT SHEET MAKER
// ══════════════════════════════════════════════════════════════
function CheatSheetMaker({ user, prefill, onClearPrefill }) {
  const [subject,setSubject]=useState('Mathematics'); const [cls,setCls]=useState('Class 10')
  const [chapters,setChapters]=useState([]); const [examDate,setExamDate]=useState('')
  const [result,setResult]=useState(''); const [loading,setLoading]=useState(false); const [saved,setSaved]=useState(false); const [err,setErr]=useState('')

  const buildPrompt=()=>`You are the world's best CBSE exam preparation expert. Create a COMPREHENSIVE 3-hour exam cheat sheet.
Subject: ${subject} | Class: ${cls} | Chapters: ${chapters.join(', ')}${examDate?` | Exam Date: ${examDate}`:''}
MINIMUM 2500 words.

# 🎯 EXAM CHEAT SHEET: ${subject} — ${cls}
## ⏱️ 3-HOUR STUDY STRATEGY
${chapters.map(ch=>`
## 📚 ${ch}
### ⚡ Key Formulas & Laws
### 📝 Must-Know Definitions (5-8 most important)
### 🎯 Top 15 Exam Questions + Model Answers
### ⚠️ Common Mistakes`).join('\n')}
## 📊 FINAL EXAM STRATEGY & SCORING TIPS`

  useEffect(() => {
    if (!prefill) return
    if (prefill.subject) setSubject(prefill.subject)
    if (prefill.chapters?.length) setChapters(prefill.chapters)
    else if (prefill.chapter) setChapters([prefill.chapter])
    onClearPrefill?.()
    loadSavedContent('cheatsheet', prefill.subject, prefill.chapter, prefill.chapters).then(content => {
      if (content) { setResult(content); setSaved(true) }
    })
  }, [])

  async function generate() {
    if(chapters.length===0) return alert('Please select at least one chapter')
    setErr(''); setLoading(true); setSaved(false)
    try{ const r=await api.post('/api/ai/cheatsheet',{messages:[{role:'user',content:buildPrompt()}],subject,chapters}); setResult(r.content) }
    catch(e){ if(e.status===402){setErr('Free trial ended. Please subscribe.')}else{setErr(e.message)} }
    setLoading(false)
  }

  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
        <PageHeader icon="📋" title="3-Hour Exam Cheat Sheet" subtitle="Top questions, formulas, predictions, scoring strategy" color="#F97316"/>
        <span style={{ background:'#F97316', color:'#fff', borderRadius:20, padding:'2px 12px', fontSize:11, fontWeight:800, flexShrink:0, height:'fit-content' }}>STUDENT ONLY</span>
      </div>
      <Card style={{ marginBottom:18 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:4 }}>
          <Field label="Subject"><BSSelect value={subject} onChange={v=>{setSubject(v);setChapters([])}} options={SUBJECTS}/></Field>
          <Field label="Class"><BSSelect value={cls} onChange={v=>{setCls(v);setChapters([])}} options={CLASSES}/></Field>
        </div>
        <Field label="Select Chapters"><ChapterSelector subject={subject} cls={cls} selected={chapters} onChange={setChapters}/></Field>
        <Field label="Exam Date (optional)"><input type="date" style={{ ...T.input, maxWidth:220 }} value={examDate} onChange={e=>setExamDate(e.target.value)} min={new Date().toISOString().split('T')[0]}/></Field>
        <PrimaryBtn onClick={generate} disabled={loading||chapters.length===0} gradient="linear-gradient(135deg,#F97316,#F59E0B)">{loading?<><Spinner/> Generating cheat sheet...</>:`🎯 Generate Cheat Sheet (${chapters.length} chapter${chapters.length!==1?'s':''})`}</PrimaryBtn>
      </Card>
      <ErrMsg msg={err}/>
      {result&&<>
        <ContentBox content={result} label={`Exam Cheat Sheet — ${subject} | ${chapters.join(', ')}`} downloadName={`cheatsheet-${subject}-${cls}.txt`} onDownload={()=>downloadText(result,`cheatsheet-${subject}-${cls}.txt`)}/>
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          {!saved?<GhostBtn small onClick={async()=>{try{await api.post('/api/user/cheatsheets',{subject,classLevel:cls,chapters,examDate,content:result});setSaved(true)}catch(e){alert(e.message)}}}>💾 Save</GhostBtn>:<SuccessMsg msg="Saved!"/>}
        </div>
      </>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  QUESTION PAPER MAKER
// ══════════════════════════════════════════════════════════════
function QPMaker({ user, prefill, onClearPrefill }) {
  const [subject,setSubject]=useState('Mathematics'); const [cls,setCls]=useState('Class 10')
  const [chapters,setChapters]=useState([]); const [marks,setMarks]=useState('80'); const [duration,setDuration]=useState('3 Hours'); const [desc,setDesc]=useState('')
  const [result,setResult]=useState(''); const [loading,setLoading]=useState(false); const [saved,setSaved]=useState(false); const [err,setErr]=useState('')
  useEffect(() => {
  if (!prefill) return
  if (prefill.subject) setSubject(prefill.subject)
  if (prefill.chapters?.length) setChapters(prefill.chapters)
  else if (prefill.chapter) setChapters([prefill.chapter])
  onClearPrefill?.()
  loadSavedContent('paper', prefill.subject, prefill.chapter, prefill.chapters).then(content => {
    if (content) { setResult(content); setSaved(true) }
  })
}, [])

  async function generate() {
    if(chapters.length===0) return alert('Please select at least one chapter')
    setErr(''); setLoading(true); setSaved(false)
    try{
      const prompt=`Create a complete, formal ${marks}-mark CBSE question paper following CBSE 2024-25 pattern.
Subject: ${subject} | Class: ${cls} | Duration: ${duration} | Chapters: ${chapters.join(', ')}
Special instructions: ${desc||'Standard CBSE pattern with Section A (MCQ), Section B (Short), Section C (Long)'}
CRITICAL: Total marks must equal EXACTLY ${marks}. Number all questions clearly. Write "SECTION A", "SECTION B" etc.
Include general instructions at the top. No markdown formatting — plain text only.`
      const r=await api.post('/api/ai/paper',{messages:[{role:'user',content:prompt}],subject,chapters}); setResult(r.content)
    } catch(e){ if(e.status===402){setErr('Free trial ended. Please subscribe.')}else{setErr(e.message)} }
    setLoading(false)
  }

  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <PageHeader icon="📄" title="Question Paper Maker" subtitle="Generate multi-chapter CBSE papers — download and print" color="#8B5CF6"/>
      <Card style={{ marginBottom:18 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16, marginBottom:4 }}>
          <Field label="Subject"><BSSelect value={subject} onChange={v=>{setSubject(v);setChapters([])}} options={SUBJECTS}/></Field>
          <Field label="Class"><BSSelect value={cls} onChange={v=>{setCls(v);setChapters([])}} options={CLASSES}/></Field>
          <Field label="Total Marks"><BSSelect value={marks} onChange={setMarks} options={['10','20','25','30','40','50','60','70','80','100']}/></Field>
          <Field label="Duration"><BSSelect value={duration} onChange={setDuration} options={['30 min','45 min','1 Hour','1.5 Hours','2 Hours','2.5 Hours','3 Hours']}/></Field>
        </div>
        <Field label="Select Chapters"><ChapterSelector subject={subject} cls={cls} selected={chapters} onChange={setChapters}/></Field>
        <Field label="Additional Instructions (optional)"><BSTextarea value={desc} onChange={setDesc} rows={2} placeholder="e.g. 'Focus on derivations', 'Half-yearly exam style', 'Include map questions'"/></Field>
        <PrimaryBtn onClick={generate} disabled={loading||chapters.length===0} color="#8B5CF6">{loading?<><Spinner/> Generating paper...</>:`📄 Generate ${marks}M Paper (${chapters.length} chapter${chapters.length!==1?'s':''})`}</PrimaryBtn>
      </Card>
      <ErrMsg msg={err}/>
      {result&&<>
        <ContentBox content={result} label={`${subject} ${cls} — ${marks}M Question Paper`} downloadName={`${subject}-${cls}-${marks}M-paper.txt`} onDownload={()=>downloadText(result,`${subject}-${cls}-${marks}M-paper.txt`)}/>
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          {!saved?<GhostBtn small onClick={async()=>{try{await api.post('/api/user/papers',{subject,classLevel:cls,chapters,marks:parseInt(marks),duration,description:desc,content:result});setSaved(true)}catch(e){alert(e.message)}}}>💾 Save Paper</GhostBtn>:<SuccessMsg msg="Saved!"/>}
        </div>
      </>}
      <XPBadge amount={25} label="per paper generated"/>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  LESSON PLANNER
// ══════════════════════════════════════════════════════════════
function LessonPlanner({ user, prefill, onClearPrefill }) {
  const [subject,setSubject]=useState('Mathematics'); const [topic,setTopic]=useState(''); const [cls,setCls]=useState('Class 9'); const [duration,setDuration]=useState(45); const [notes,setNotes]=useState('')
  const [result,setResult]=useState(''); const [loading,setLoading]=useState(false); const [saved,setSaved]=useState(false); const [err,setErr]=useState(''); const [rating,setRating]=useState(0)


  const buildPrompt=()=>`You are a world-class master teacher and pedagogy expert. Create an exceptional, fully detailed lesson plan for "${topic}" — ${subject} ${cls} — ${duration} minutes.
Teacher's context: ${notes||'Standard classroom with mixed ability students'}
MINIMUM 1500 words. This must be genuinely useful and specific.

# 🎓 MASTER LESSON PLAN: ${topic}
**Subject:** ${subject} | **Class:** ${cls} | **Duration:** ${duration} minutes

## ⚡ LESSON SNAPSHOT
(Learning objectives, prerequisites, materials needed)

## ⏱️ MINUTE-BY-MINUTE PLAN
### 🚀 OPENING: Hook & Connect [0:00 – ${Math.round(duration*.1)}:00]
(Exact opening statement, hook activity, connecting to prior knowledge)

### 📖 MAIN TEACHING [${Math.round(duration*.1)}:00 – ${Math.round(duration*.6)}:00]
(Step-by-step teaching with exact explanations, board work, examples)

### 🔧 WORKED EXAMPLES [${Math.round(duration*.6)}:00 – ${Math.round(duration*.75)}:00]
(2-3 solved examples with full working)

### 💬 SOCRATIC QUESTIONS TO ASK
(10 questions from basic to challenging to check understanding)

### 🎯 CLOSING & ASSESSMENT [${Math.round(duration*.75)}:00 – ${duration}:00]
(Summary, exit ticket, homework)

## 🏆 DIFFERENTIATION STRATEGIES
## 📊 ASSESSMENT CRITERIA
## 🔗 CONNECTIONS TO CBSE EXAM`

  
  useEffect(() => {
  if (!prefill) return
  if (prefill.subject) setSubject(prefill.subject)
  if (prefill.chapter) setTopic(prefill.chapter)   // topic = chapter for lesson plans
  onClearPrefill?.()
  loadSavedContent('lessonplan', prefill.subject, prefill.chapter, []).then(content => {
    if (content) { setResult(content); setSaved(true) }
  })
}, [])

  async function generate() {
    if(!topic.trim()) return alert('Please enter a topic')
    setErr(''); setLoading(true); setSaved(false); setRating(0)
    try{ const r=await api.post('/api/ai/lessonplan',{messages:[{role:'user',content:buildPrompt()}],subject,chapter:topic}); setResult(r.content) }
    catch(e){ if(e.status===402){setErr('Free trial ended. Please subscribe.')}else{setErr(e.message)} }
    setLoading(false)
  }

  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:4 }}>
        <PageHeader icon="🎓" title="AI Lesson Planner" subtitle="Minute-by-minute plans with teaching scripts and Socratic questions" color="#7C3AED"/>
        <span style={{ background:'#7C3AED', color:'#fff', borderRadius:20, padding:'2px 12px', fontSize:11, fontWeight:800, flexShrink:0, height:'fit-content', marginTop:6 }}>TEACHER ONLY</span>
      </div>
      <Card style={{ marginBottom:18, borderColor:'#7C3AED' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:4 }}>
          <Field label="Subject"><BSSelect value={subject} onChange={setSubject} options={SUBJECTS}/></Field>
          <Field label="Class"><BSSelect value={cls} onChange={setCls} options={CLASSES}/></Field>
        </div>
        <Field label="Topic to Teach"><BSInput value={topic} onChange={setTopic} placeholder="e.g. Quadratic Equations, Photosynthesis, French Revolution"/></Field>
        <Field label={`Teaching Duration: ${duration} minutes`}>
          <input type="range" min={20} max={90} step={5} value={duration} onChange={e=>setDuration(+e.target.value)} style={{ width:'100%', accentColor:'#7C3AED', marginBottom:4 }}/>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, color:'var(--text)', fontWeight:600 }}><span>20 min</span><span style={{ fontWeight:800, color:'#7C3AED' }}>{duration} min</span><span>90 min</span></div>
        </Field>
        <Field label="Your Notes (optional)"><BSTextarea value={notes} onChange={setNotes} rows={3} placeholder="e.g. 'Students already know linear equations. I want real-world examples. Class is weak in algebra.'"/></Field>
        <PrimaryBtn onClick={generate} disabled={loading||!topic.trim()} gradient="linear-gradient(135deg,#7C3AED,#6366F1)">{loading?<><Spinner/> Crafting your lesson plan...</>:'🎓 Generate Master Lesson Plan'}</PrimaryBtn>
      </Card>
      <ErrMsg msg={err}/>
      {result&&<>
        <ContentBox content={result} label={`Lesson Plan: ${topic} — ${subject} ${cls}`} downloadName={`lesson-${topic.replace(/\s+/g,'-')}.txt`} onDownload={()=>downloadText(result,`lesson-plan-${topic.replace(/\s+/g,'-')}-${duration}min.txt`)}/>
        <Card style={{ marginTop:12, display:'flex', alignItems:'center', gap:14 }}>
          <span style={{ fontSize:13.5, fontWeight:700, color:'var(--text)' }}>How was this plan?</span>
          {[1,2,3,4,5].map(n=>(<span key={n} onClick={()=>setRating(n)} style={{ fontSize:22, cursor:'pointer', opacity:n<=rating?1:.3, transition:'opacity .2s' }}>⭐</span>))}
          {rating>0&&<span style={{ fontSize:12.5, color:'#6ee7b7', fontWeight:700 }}>Thank you!</span>}
        </Card>
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          {!saved?<GhostBtn small onClick={async()=>{try{await api.post('/api/user/lessonplans',{subject,topic,classLevel:cls,durationMinutes:duration,customPrompt:notes,content:result});setSaved(true)}catch(e){alert(e.message)}}}>💾 Save</GhostBtn>:<SuccessMsg msg="Saved!"/>}
        </div>
      </>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  QUIZ GENERATOR
// ══════════════════════════════════════════════════════════════
function QuizGenerator({ user, prefill, onClearPrefill }) {
  const [subject,setSubject]=useState('Mathematics'); const [topic,setTopic]=useState(''); const [diff,setDiff]=useState('Medium'); const [num,setNum]=useState('5')
  const [quiz,setQuiz]=useState(null); const [answers,setAnswers]=useState({}); const [submitted,setSubmitted]=useState(false); const [loading,setLoading]=useState(false); const [err,setErr]=useState('')
  useEffect(() => {
  if (!prefill) return
  if (prefill.subject) setSubject(prefill.subject)
  if (prefill.chapter) setTopic(prefill.chapter)
  onClearPrefill?.()
}, [])

  async function generate() {
    if(!topic.trim()) return alert('Enter a topic')
    const PROMPT=`Generate a high-quality ${num}-question MCQ quiz on "${topic}" in ${subject}. Difficulty: ${diff}. CBSE Class-appropriate with real exam-style questions.
Return ONLY valid JSON (no markdown, no explanation):
{"title":"${topic} Quiz","questions":[{"q":"Question text here?","options":["Option A","Option B","Option C","Option D"],"answer":0,"explanation":"Why this option is correct"}]}`
    setErr(''); setLoading(true); setQuiz(null); setAnswers({}); setSubmitted(false)
    try{
      const r=await api.post('/api/ai/quiz',{messages:[{role:'user',content:PROMPT}],subject,chapter:topic})
      const raw=typeof r.content==='string'?r.content:r.content[0]?.text||''
      setQuiz(JSON.parse(raw.replace(/```[\w]*\n?/gi,'').trim()))
    } catch(e){ if(e.status===402){setErr('Free trial ended. Please subscribe.')}else{setErr('Failed to generate quiz. Try again.')} }
    setLoading(false)
  }

  async function submit() {
    setSubmitted(true)
    const correct=quiz.questions.filter((q,i)=>answers[i]===q.answer).length
    const xpEarned=Math.round((correct/quiz.questions.length)*50)+5
    try{await api.post('/api/user/quiz-history',{subject,topic,difficulty:diff,totalQuestions:quiz.questions.length,correctAnswers:correct,xpEarned,isPerfect:correct===quiz.questions.length})}catch{}
  }

  const score=submitted?quiz.questions.filter((q,i)=>answers[i]===q.answer).length:0
  const pct=submitted?Math.round((score/quiz.questions.length)*100):0

  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <PageHeader icon="🎯" title="Quiz Generator" subtitle="Auto-generate MCQ quizzes with instant scoring and explanations" color="#F59E0B"/>
      {!quiz?(
        <Card>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16, marginBottom:4 }}>
            <Field label="Subject"><BSSelect value={subject} onChange={setSubject} options={SUBJECTS}/></Field>
            <Field label="Questions"><BSSelect value={num} onChange={setNum} options={['5','8','10','15']}/></Field>
          </div>
          <Field label="Topic"><BSInput value={topic} onChange={setTopic} placeholder="e.g. Quadratic Equations, World War II, Photosynthesis"/></Field>
          <Field label="Difficulty"><BSSelect value={diff} onChange={setDiff} options={['Easy','Medium','Hard','Mixed']}/></Field>
          <ErrMsg msg={err}/>
          <PrimaryBtn onClick={generate} disabled={loading||!topic.trim()} color="#F59E0B" style={{ marginTop:4 }}>{loading?<><Spinner/> Generating...</>:'✨ Generate Quiz'}</PrimaryBtn>
        </Card>
      ):(
        <div>
          {submitted&&(
            <div style={{ background:`linear-gradient(135deg,${pct>=80?'#F97316':'#F59E0B'},${pct>=80?'#FB923C':'#FBBF24'})`, borderRadius:18, padding:24, textAlign:'center', color:'#fff', marginBottom:18 }}>
              <div style={{ fontSize:48, marginBottom:6 }}>{pct===100?'🏆':pct>=80?'🎉':pct>=50?'👍':'📚'}</div>
              <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:28, fontWeight:900, margin:'0 0 6px' }}>{score}/{quiz.questions.length}</h3>
              <p style={{ opacity:.9, marginBottom:10 }}>{pct===100?'Perfect score! 🌟':pct>=80?'Excellent!':pct>=50?'Good effort! Keep going!':'Keep practicing — you\'ll get there!'}</p>
              <div style={{ background:'rgba(255,255,255,.2)', padding:'4px 16px', borderRadius:20, display:'inline-block', fontWeight:700, fontSize:13 }}>+{Math.round((score/quiz.questions.length)*50)+5} XP ⚡</div>
              <br/><br/>
              <GhostBtn small onClick={()=>{setQuiz(null);setAnswers({});setSubmitted(false)}} style={{ background:'rgba(255,255,255,.2)', border:'none', color:'#fff' }}>New Quiz</GhostBtn>
            </div>
          )}
          <h3 style={{ marginBottom:18, fontFamily:"'Sora',sans-serif", color:'var(--text-h)' }}>{quiz.title}</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(400px,1fr))', gap:14 }}>
            {quiz.questions.map((q,i)=>{
              const selected=answers[i],correct=q.answer,isRight=submitted&&selected===correct,isWrong=submitted&&selected!==undefined&&selected!==correct
              return (
                <Card key={i} style={{ borderLeft:submitted?`4px solid ${isRight?'#22c55e':isWrong?'#ef4444':'var(--border)'}`:'' }}>
                  <p style={{ margin:'0 0 12px', fontWeight:700, fontSize:14.5, color:'var(--text-h)' }}><span style={{ color:'var(--accent)' }}>Q{i+1}.</span> {q.q}</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {q.options.map((opt,j)=>{
                      const isSelected=selected===j,isAnswer=j===correct
                      let bg='var(--social-bg)',border='var(--border)',color='var(--text-h)'
                      if(submitted){if(isAnswer){bg='rgba(16,185,129,.1)';border='#6ee7b7';color='#6ee7b7'}else if(isSelected&&!isAnswer){bg='rgba(239,68,68,.1)';border='#fca5a5';color='#fca5a5'}}
                      else if(isSelected){bg='var(--accent-bg)';border='var(--accent)';color='var(--accent)'}
                      return <button key={j} disabled={submitted} onClick={()=>setAnswers(a=>({...a,[i]:j}))} style={{ padding:'9px 12px', borderRadius:9, border:`1.5px solid ${border}`, background:bg, color, cursor:submitted?'default':'pointer', textAlign:'left', fontSize:13.5, fontFamily:"'Nunito',sans-serif", fontWeight:600, transition:'all .15s' }}><span style={{ fontWeight:800, marginRight:4 }}>{String.fromCharCode(65+j)}.</span>{opt}{submitted&&isAnswer?' ✓':''}</button>
                    })}
                  </div>
                  {submitted&&q.explanation&&<div style={{ marginTop:11, padding:'9px 13px', background:'var(--accent-bg)', borderRadius:9, fontSize:13, color:'var(--accent)' }}>💡 {q.explanation}</div>}
                </Card>
              )
            })}
          </div>
          {!submitted&&<PrimaryBtn onClick={submit} disabled={Object.keys(answers).length<quiz.questions.length} color="#F59E0B" style={{ marginTop:16 }}>Submit ({Object.keys(answers).length}/{quiz.questions.length} answered) →</PrimaryBtn>}
        </div>
      )}
      <XPBadge amount="5–50" label="per quiz"/>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  FLASHCARDS
// ══════════════════════════════════════════════════════════════
function FlashCards({ user, prefill, onClearPrefill }) {
  const [subject,setSubject]=useState('Mathematics'); const [cls,setCls]=useState('Class 10'); const [topic,setTopic]=useState('')
  const [cards,setCards]=useState([]); const [current,setCurrent]=useState(0); const [flipped,setFlipped]=useState({}); const [mode,setMode]=useState('grid'); const [loading,setLoading]=useState(false); const [err,setErr]=useState('')
  useEffect(() => {
  if (!prefill) return
  if (prefill.subject) setSubject(prefill.subject)
  if (prefill.chapter) setTopic(prefill.chapter)
  onClearPrefill?.()
}, [])

  async function generate() {
    if(!topic.trim()) return alert('Enter a topic')
    const PROMPT=`Create 8 high-quality flashcards for "${topic}" in ${subject} ${cls} CBSE. Cover the most important terms, formulas, and concepts.
Return ONLY valid JSON:
{"cards":[{"front":"Key term or concept","back":"Clear, concise definition or explanation (1-2 sentences max)"}]}`
    setErr(''); setLoading(true); setCurrent(0); setFlipped({})
    try{
      const r=await api.post('/api/ai/flashcards',{messages:[{role:'user',content:PROMPT}],subject,chapter:topic})
      const raw=typeof r.content==='string'?r.content:r.content[0]?.text||''
      const parsed=JSON.parse(raw.replace(/```[\w]*\n?/gi,'').trim())
      if(!parsed.cards?.length) throw new Error('No cards in response')
      setCards(parsed.cards)
    } catch(e){ if(e.status===402){setErr('Free trial ended. Please subscribe.')}else{setErr('Failed to generate flashcards. Try again.')} }
    setLoading(false)
  }

  const card=cards[current]
  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <PageHeader icon="🃏" title="Flashcards" subtitle="Grid mode & Study mode for fast revision" color="#EF4444"/>
      <Card style={{ marginBottom:18 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:4 }}>
          <Field label="Subject"><BSSelect value={subject} onChange={setSubject} options={SUBJECTS}/></Field>
          <Field label="Class"><BSSelect value={cls} onChange={setCls} options={CLASSES}/></Field>
        </div>
        <Field label="Topic"><BSInput value={topic} onChange={setTopic} placeholder="e.g. Chemical Bonding, Mughal Empire, Trigonometry"/></Field>
        <ErrMsg msg={err}/>
        <PrimaryBtn onClick={generate} disabled={loading||!topic.trim()} color="#EF4444">{loading?<><Spinner/> Creating cards...</>:'🃏 Generate Flashcards'}</PrimaryBtn>
      </Card>

      {cards.length>0&&<>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:16, color:'var(--text-h)', margin:0 }}>{topic} — {cards.length} Cards</h3>
          <div style={{ display:'flex', gap:7 }}>
            {[['grid','⊞ Grid'],['study','▶ Study']].map(([m,l])=>(
              <button key={m} onClick={()=>setMode(m)} style={{ padding:'6px 14px', borderRadius:8, border:'none', fontWeight:700, fontSize:12.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:mode===m?'#EF4444':'var(--social-bg)', color:mode===m?'#fff':'var(--text-h)', transition:'all .15s' }}>{l}</button>
            ))}
          </div>
        </div>

        {mode==='grid'?(
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:14 }}>
            {cards.map((c,i)=>(
              <div key={i} onClick={()=>setFlipped(f=>({...f,[i]:!f[i]}))} style={{ height:130, borderRadius:14, cursor:'pointer', perspective:1000 }}>
                <div style={{ width:'100%', height:'100%', position:'relative', transformStyle:'preserve-3d', transition:'transform .5s', transform:flipped[i]?'rotateY(180deg)':'none' }}>
                  <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', background:'linear-gradient(135deg,#EF4444,#F97316)', borderRadius:14, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:14, textAlign:'center' }}>
                    <span style={{ fontSize:9, color:'rgba(255,255,255,.7)', fontWeight:800, marginBottom:7, letterSpacing:1 }}>TAP TO REVEAL</span>
                    <span style={{ color:'#fff', fontWeight:800, fontSize:13.5, lineHeight:1.4 }}>{c.front}</span>
                  </div>
                  <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', transform:'rotateY(180deg)', background:'var(--bg2)', borderRadius:14, border:'2px solid #EF4444', display:'flex', alignItems:'center', justifyContent:'center', padding:14, textAlign:'center' }}>
                    <span style={{ color:'var(--text-h)', fontWeight:700, fontSize:13, lineHeight:1.5 }}>{c.back}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ):(
          <Card style={{ textAlign:'center', maxWidth:560, margin:'0 auto' }}>
            <div style={{ fontSize:12, color:'var(--text)', marginBottom:8, fontWeight:700 }}>Card {current+1} of {cards.length}</div>
            <div style={{ background:'var(--border)', borderRadius:999, height:5, margin:'0 auto 18px', maxWidth:240 }}><div style={{ background:'#EF4444', width:`${((current+1)/cards.length)*100}%`, height:'100%', borderRadius:999 }}/></div>
            <div onClick={()=>setFlipped(f=>({...f,[current]:!f[current]}))} style={{ height:180, background:flipped[current]?'var(--code-bg)':'linear-gradient(135deg,#EF4444,#F97316)', borderRadius:14, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', border:flipped[current]?'2px solid #EF4444':'none', marginBottom:18, padding:24 }}>
              <span style={{ fontSize:10, color:flipped[current]?'var(--text)':'rgba(255,255,255,.7)', fontWeight:800, letterSpacing:1, marginBottom:10 }}>{flipped[current]?'ANSWER':'TERM — TAP TO FLIP'}</span>
              <span style={{ color:flipped[current]?'var(--text-h)':'#fff', fontWeight:800, fontSize:16, lineHeight:1.5 }}>{flipped[current]?card.back:card.front}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'center', gap:12 }}>
              <GhostBtn disabled={current===0} onClick={()=>{setCurrent(c=>c-1);setFlipped({})}}>← Prev</GhostBtn>
              <PrimaryBtn color="#EF4444" onClick={()=>setFlipped(f=>({...f,[current]:!f[current]}))}>Flip</PrimaryBtn>
              <GhostBtn disabled={current===cards.length-1} onClick={()=>{setCurrent(c=>c+1);setFlipped({})}}>Next →</GhostBtn>
            </div>
          </Card>
        )}
        <GhostBtn small onClick={()=>setCards([])} style={{ marginTop:14 }}>↺ New Flashcards</GhostBtn>
      </>}
      <XPBadge amount={15} label="per set"/>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  ACHIEVEMENTS PAGE
// ══════════════════════════════════════════════════════════════
function AchievementsPage() {
  const [achs,setAchs]=useState([]); const [filter,setFilter]=useState('all')
  useEffect(()=>{api.get('/api/user/achievements').then(setAchs).catch(()=>{})},[])
  const unlocked=achs.filter(a=>a.unlocked)
  const cats=['all','unlocked','streak','xp','tools','special','legendary']
  const shown=achs.filter(a=>filter==='all'||(filter==='unlocked'&&a.unlocked)||a.category===filter)
  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <PageHeader icon="🏆" title={`Achievements (${unlocked.length}/${achs.length})`} subtitle="Unlock achievements by completing activities and earning XP" color="#F59E0B"/>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:22 }}>
        {cats.map(c=>(<button key={c} onClick={()=>setFilter(c)} style={{ padding:'6px 16px', borderRadius:20, border:'none', fontWeight:700, fontSize:12.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:filter===c?'var(--accent)':'var(--social-bg)', color:filter===c?'#fff':'var(--text-h)', transition:'all .15s', textTransform:'capitalize' }}>{c}</button>))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:13 }}>
        {shown.map(a=>(
          <Card key={a.id} style={{ opacity:a.unlocked?1:.5, borderColor:a.unlocked?DIFF_COLORS[a.difficulty]:'var(--border)', position:'relative' }}>
            {a.unlocked&&<div style={{ position:'absolute', top:10, right:10, width:8, height:8, background:'#22c55e', borderRadius:'50%' }}/>}
            <div style={{ fontSize:32, marginBottom:8 }}>{a.unlocked?a.emoji:'🔒'}</div>
            <div style={{ fontWeight:800, fontSize:14, color:'var(--text-h)', marginBottom:5, fontFamily:"'Sora',sans-serif" }}>{a.name}</div>
            <div style={{ fontSize:12.5, color:'var(--text)', marginBottom:10 }}>{a.description}</div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:11, fontWeight:800, color:DIFF_COLORS[a.difficulty], textTransform:'capitalize' }}>{a.difficulty}</span>
              <span style={{ fontSize:11.5, color:'var(--accent)', fontWeight:700 }}>+{a.xp_reward} XP</span>
            </div>
            {a.unlocked&&a.unlocked_at&&<div style={{ fontSize:10.5, color:'var(--text)', marginTop:6 }}>Unlocked {new Date(a.unlocked_at).toLocaleDateString('en-IN')}</div>}
          </Card>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  CHAPTER COURSES
// ══════════════════════════════════════════════════════════════
function ChapterCourses({ user, prefill, onClearPrefill }) {
  const [subj,     setSubj]    = useState('Mathematics');
  const [cls,      setCls]     = useState(user?.class_level || 'Class 10');
  const [chapter,  setChapter] = useState('');
  const [phase,    setPhase]   = useState('select');   // select | generating | course | module
  const [courseKey, setCourseKey] = useState('');
  const [modules,  setModules] = useState([]);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [moduleData, setModuleData] = useState(null);    // loaded module content
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [statusMsg, setStatusMsg] = useState('');
  const [err, setErr] = useState('');
  const [completedIds, setCompletedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('bs_completed_modules') || '[]')); }
    catch { return new Set(); }
  });

  const chs    = getChapters(subj, cls);
  const sseRef = useRef(null);
  const autoGenRef = useRef(false)

  useEffect(() => {
  if (!prefill?.chapter) return
  if (prefill.subject) setSubj(prefill.subject)
  setChapter(prefill.chapter)
  autoGenRef.current = true
  onClearPrefill?.()
}, [])


  useEffect(() => {
  if (!autoGenRef.current || !chapter) return
  autoGenRef.current = false
  generateCourse()
}, [chapter, subj])

  // ── Close SSE on unmount ──────────────────────────────────
  useEffect(() => () => sseRef.current?.close(), []);

  // ── Mark module complete ──────────────────────────────────
  function markComplete(id) {
    setCompletedIds(prev => {
      const next = new Set([...prev, `${courseKey}-${id}`]);
      localStorage.setItem('bs_completed_modules', JSON.stringify([...next]));
      return next;
    });
  }
  const isComplete = id => completedIds.has(`${courseKey}-${id}`);

  // ── Generate course ───────────────────────────────────────
  async function generateCourse() {
    if (!chapter) return;
    setErr(''); setPhase('generating'); setModules([]); setProgress({ done: 0, total: 0 });
    setStatusMsg(`Designing modules for "${chapter}"…`);

    try {
      const { courseKey: key, existing } = await api.post('/api/chapter-courses/generate', {
        subject: subj, cls, chapter,
      });
      setCourseKey(key);

      if (existing) {
        // Already cached — load directly
        const cached = await api.get(`/api/chapter-courses/list/${key}`);
        if (cached?.modules) {
          setModules(cached.modules);
          setProgress({ done: cached.modules.filter(m => m.status === 'done').length, total: cached.modules.length });
          setPhase('course');
          return;
        }
      }

      // Connect SSE for live progress
      connectSSE(key);
    } catch (e) {
      setErr(e.message);
      setPhase('select');
    }
  }

  function connectSSE(key) {
    const token = localStorage.getItem('bs_token');
    const es    = new EventSource(`${API_URL}/api/chapter-courses/stream/${key}?token=${token}`);
    sseRef.current = es;

    es.onmessage = e => {
      try {
        const msg = JSON.parse(e.data);
        handleSSEMessage(msg);
      } catch {}
    };

    es.onerror = () => {
      es.close();
      // Fallback: poll once
      api.get(`/api/chapter-courses/list/${key}`).then(cached => {
        if (cached?.modules) { setModules(cached.modules); setPhase('course'); }
      }).catch(() => {});
    };
  }

  function handleSSEMessage(msg) {
    switch (msg.type) {
      case 'status':
        setStatusMsg(msg.message);
        break;

      case 'modules_listed':
        setModules(msg.modules || []);
        setProgress({ done: 0, total: msg.modules?.length || 0 });
        setStatusMsg('Searching YouTube & generating content for each module…');
        break;

      case 'module_building':
        setModules(prev => prev.map(m => m.id === msg.moduleId ? { ...m, status: 'building' } : m));
        setStatusMsg(`Building module ${msg.moduleId}: "${msg.title}"…`);
        break;

      case 'module_done':
        setModules(prev => prev.map(m => m.id === msg.moduleId
          ? { ...m, status: 'done', videoId: msg.videoId, transcriptStatus: msg.transcriptStatus } : m));
        setProgress(p => ({ ...p, done: p.done + 1 }));
        break;

      case 'module_error':
        setModules(prev => prev.map(m => m.id === msg.moduleId ? { ...m, status: 'error' } : m));
        break;

      case 'generation_complete':
        if (msg.modules) setModules(msg.modules);
        setPhase('course');
        sseRef.current?.close();
        break;

      case 'already_done':
        if (msg.data?.modules) setModules(msg.data.modules);
        setPhase('course');
        sseRef.current?.close();
        break;

      case 'error':
        setErr(msg.message || 'Generation failed');
        setPhase('select');
        sseRef.current?.close();
        break;
    }
  }

  // ── Open a module ─────────────────────────────────────────
  async function openModule(mod) {
    if (mod.status !== 'done') return;
    setActiveModuleId(mod.id);
    setModuleData(null);
    setPhase('module');

    const modKey = buildModKey(subj, cls, chapter, mod.id);
    try {
      const data = await api.get(`/api/chapter-courses/module/${modKey}`);
      setModuleData(data);
    } catch (e) {
      setErr('Could not load module content: ' + e.message);
    }
  }

  function buildModKey(subject, cls, chapter, moduleId) {
    const safe = s => s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 16);
    return `bscm-mod-${safe(subject)}-${safe(cls)}-${safe(chapter)}-${moduleId}`;
  }

  // ── Render phases ─────────────────────────────────────────
  if (phase === 'module' && activeModuleId !== null) {
    const mod = modules.find(m => m.id === activeModuleId);
    return (
      <ModuleView
        mod={mod}
        moduleData={moduleData}
        subject={subj}
        cls={cls}
        chapter={chapter}
        courseKey={courseKey}
        isComplete={isComplete(activeModuleId)}
        onComplete={() => markComplete(activeModuleId)}
        onBack={() => setPhase('course')}
        onPrev={() => {
          const idx = modules.findIndex(m => m.id === activeModuleId);
          if (idx > 0) openModule(modules[idx - 1]);
        }}
        onNext={() => {
          const idx = modules.findIndex(m => m.id === activeModuleId);
          const next = modules.slice(idx + 1).find(m => m.status === 'done');
          if (next) openModule(next);
        }}
        hasPrev={modules.findIndex(m => m.id === activeModuleId) > 0}
        hasNext={modules.slice(modules.findIndex(m => m.id === activeModuleId) + 1).some(m => m.status === 'done')}
      />
    );
  }

  if (phase === 'generating') {
    return (
      <div style={{ padding: 24, fontFamily: "'Nunito', sans-serif", maxWidth: 800, margin: '0 auto' }}>
        <GhostBtn small onClick={() => { sseRef.current?.close(); setPhase('select'); }} style={{ marginBottom: 20 }}>
          ← Back
        </GhostBtn>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, color: 'var(--text-h)', margin: '0 0 6px' }}>
            📚 Building Your Course
          </h2>
          <p style={{ color: 'var(--text)', margin: 0, fontSize: 13 }}>
            {chapter} · {subj} · {cls}
          </p>
        </div>

        {/* Progress bar */}
        <Card style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-h)' }}>{statusMsg}</span>
            {progress.total > 0 && (
              <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 800 }}>
                {progress.done}/{progress.total}
              </span>
            )}
          </div>
          {progress.total > 0 && (
            <div style={{ background: 'var(--border)', borderRadius: 999, height: 8 }}>
              <div style={{ background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', width: `${Math.round((progress.done / progress.total) * 100)}%`, height: '100%', borderRadius: 999, transition: 'width .5s ease' }} />
            </div>
          )}
        </Card>

        {/* Live module cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {modules.map(mod => (
            <div key={mod.id} style={{
              background: 'var(--bg2)', border: `1px solid ${mod.status === 'done' ? '#6366F1' : mod.status === 'building' ? '#F59E0B' : mod.status === 'error' ? '#EF4444' : 'var(--border)'}`,
              borderRadius: 12, padding: '12px 14px', transition: 'border-color .3s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{mod.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-h)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mod.title}
                  </div>
                </div>
                <StatusDot status={mod.status} />
              </div>
              {mod.status === 'building' && (
                <div style={{ fontSize: 11, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Spinner size={10} /> Searching YouTube…
                </div>
              )}
              {mod.status === 'done' && mod.videoId && (
                <div style={{ fontSize: 10.5, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>▶</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mod.videoTitle ? mod.videoTitle.slice(0, 35) + '…' : 'Video found'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        <ErrMsg msg={err} />
      </div>
    );
  }

    if (phase === 'course') {
    const doneCount  = modules.filter(m => m.status === 'done').length;
    const compCount  = modules.filter(m => isComplete(m.id)).length;
    const pct        = doneCount > 0 ? Math.round((compCount / doneCount) * 100) : 0;

    return (
      <div style={{ display: 'flex', height: 'calc(100vh - 120px)', fontFamily: "'Nunito', sans-serif", overflow: 'hidden' }}>

        {/* ── Left sidebar — module list ── */}
        <div style={{ width: 272, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'rgba(5,5,14,.85)', overflow: 'hidden' }}>

          {/* Sidebar header */}
          <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <GhostBtn small onClick={() => setPhase('select')} style={{ marginBottom: 12 }}>← Change Chapter</GhostBtn>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 5 }}>Course Content</div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 13.5, color: 'var(--text-h)', marginBottom: 2, lineHeight: 1.3 }}>{chapter}</div>
            <div style={{ fontSize: 11, color: 'var(--text)', marginBottom: 8 }}>{subj} · {cls} · {doneCount} modules</div>
            <div style={{ background: 'var(--border)', borderRadius: 999, height: 3 }}>
              <div style={{ background: 'linear-gradient(90deg, var(--accent), #8B5CF6)', width: `${pct}%`, height: '100%', borderRadius: 999, transition: 'width .5s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 10, color: 'var(--text)' }}>{pct}% complete</span>
              <span style={{ fontSize: 10, color: 'var(--text)' }}>{compCount}/{doneCount} done</span>
            </div>
          </div>

          {/* Module list — top to bottom */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
            {modules.map((mod, idx) => {
              const done     = mod.status === 'done'
              const comp     = isComplete(mod.id)
              const building = mod.status === 'building'
              const error    = mod.status === 'error'
              return (
                <div key={mod.id}
                  onClick={() => done && openModule(mod)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 10px', borderRadius: 10, cursor: done ? 'pointer' : 'default', border: '1px solid transparent', opacity: !done && !building ? .5 : 1, marginBottom: 2, transition: 'all .15s' }}
                  onMouseEnter={e => { if (done) { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.borderColor = 'var(--border)' } }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}>

                  {/* Number badge */}
                  <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginTop: 1,
                    background: comp ? 'rgba(34,197,94,.2)' : building ? 'rgba(245,158,11,.15)' : error ? 'rgba(239,68,68,.15)' : 'rgba(255,255,255,.06)',
                    color: comp ? '#34d399' : building ? '#fbbf24' : error ? '#fca5a5' : '#374151' }}>
                    {comp ? '✓' : building ? <Spinner size={9} /> : error ? '!' : idx + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: '#94a3b8', fontWeight: 400, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {mod.emoji && <span style={{ marginRight: 4 }}>{mod.emoji}</span>}
                      {mod.title || '…'}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                      {done && mod.videoId && <span style={{ fontSize: 9.5, background: 'rgba(34,197,94,.1)', color: '#34d399', borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>▶ Video</span>}
                      {done && mod.transcriptStatus === 'success' && <span style={{ fontSize: 9.5, background: 'rgba(6,182,212,.1)', color: '#22d3ee', borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>✓ Transcript</span>}
                      {comp && <span style={{ fontSize: 9.5, background: 'rgba(245,158,11,.1)', color: '#fbbf24', borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>🏆 Done</span>}
                      {building && <span style={{ fontSize: 9.5, color: '#fbbf24' }}>Building…</span>}
                      {error && <span style={{ fontSize: 9.5, color: '#fca5a5' }}>⚠ Failed</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Right — select prompt ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text)', padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 52 }}>📚</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--text-h)' }}>Select a module to start</div>
          <p style={{ fontSize: 13, color: 'var(--text)', maxWidth: 300, lineHeight: 1.7, margin: 0 }}>
            Click any module from the list on the left to watch the video and study the notes, Q&amp;A and quiz.
          </p>
          {modules.some(m => m.status === 'error') && (
            <p style={{ fontSize: 12.5, color: '#fca5a5', marginTop: 8 }}>⚠️ Some modules had errors. Check the sidebar.</p>
          )}
          <ErrMsg msg={err} />
        </div>

      </div>
    )
  }


  // ── PHASE: select chapter ─────────────────────────────────
  return (
    <div style={{ padding: 24, width: '100%', boxSizing: 'border-box', fontFamily: "'Nunito', sans-serif" }}>
      <PageHeader icon="📚" title="Chapter Courses" subtitle="AI selects the best YouTube videos per topic & generates notes + quiz from transcripts" color="#8B5CF6" />

      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
          <Field label="Subject">
            <BSSelect value={subj} onChange={v => { setSubj(v); setChapter(''); }} options={SUBJECTS} />
          </Field>
          <Field label="Class">
            <BSSelect value={cls} onChange={v => { setCls(v); setChapter(''); }} options={CLASSES} />
          </Field>
        </div>

        <Field label="Select Chapter">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {chs.map(ch => (
              <button key={ch} onClick={() => setChapter(ch)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer',
                  fontWeight: 700, fontFamily: "'Nunito', sans-serif", transition: 'all .15s',
                  background: chapter === ch ? 'var(--accent)' : 'var(--accent-bg)',
                  color: chapter === ch ? '#fff' : 'var(--accent)',
                  border: `1px solid ${chapter === ch ? 'var(--accent)' : 'var(--accent-border)'}`,
                }}>
                {ch}
              </button>
            ))}
          </div>
        </Field>

        {chapter && (
          <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--text-h)', fontSize: 14 }}>{chapter}</div>
                <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 3 }}>
                  AI will generate 8-12 focused modules · YouTube videos selected for each · Notes + Quiz from transcript
                </div>
              </div>
              <PrimaryBtn onClick={generateCourse} color="#8B5CF6">
                🚀 Build Course
              </PrimaryBtn>
            </div>
          </div>
        )}
      </Card>

      {/* Feature highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 20 }}>
        {[
          ['🎬', 'Best Video Selected', 'YouTube searched per sub-topic — best video with transcript chosen'],
          ['📄', 'Transcript-Based', 'Notes & quiz generated from actual video content, not guesswork'],
          ['🎯', 'Per-Module Quiz', '8 MCQs per module based on what the video teaches'],
          ['💬', 'Deep Q&A', '6 practice questions per module from Hard to Easy'],
        ].map(([e, t, d]) => (
          <div key={t} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 15px' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{e}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-h)', marginBottom: 4 }}>{t}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.5 }}>{d}</div>
          </div>
        ))}
      </div>
      <ErrMsg msg={err} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  STATUS DOT (module status indicator)
// ══════════════════════════════════════════════════════════════
function StatusDot({ status }) {
  const MAP = {
    done:     { color: '#22c55e', label: '✓' },
    building: { color: '#F59E0B', label: '…' },
    error:    { color: '#EF4444', label: '!' },
    pending:  { color: '#64748b', label: '' },
  };
  const { color, label } = MAP[status] || MAP.pending;
  return (
    <div style={{ width: 18, height: 18, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 900, flexShrink: 0 }}>
      {status === 'building' ? <Spinner size={10} /> : label}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MODULE VIEW — Video player + Notes/Q&A/Quiz tabs
// ══════════════════════════════════════════════════════════════
function ModuleView({ mod, moduleData, subject, cls, chapter, courseKey, isComplete, onComplete, onBack, onPrev, onNext, hasPrev, hasNext }) {
  const [qAns,   setQAns]   = useState({})
  const [qDone,  setQDone]  = useState(false)
  const [qScore, setQScore] = useState(0)
  const [qaOpen, setQaOpen] = useState(null)
  const [swapping, setSwapping] = useState(false)

  const notes = moduleData?.notes
  const qa    = moduleData?.qa   || []
  const quiz  = moduleData?.quiz || []

  function submitQuiz() {
    let s = 0
    quiz.forEach((q, i) => { if (qAns[i] === q.ans) s++ })
    setQScore(s); setQDone(true)
    if (!isComplete) onComplete?.()
  }

  async function swapVideo(newVideoId) {
    try {
      await api.patch('/api/chapter-courses/module/video', { subject, cls, chapter, moduleId: mod.id, newVideoId, moduleTitle: mod.title })
      setSwapping(false)
    } catch (e) { alert('Swap failed: ' + e.message) }
  }

  const currentVideoId = moduleData?.videoId || mod?.videoId
  const searchResults  = moduleData?.searchResults || []
  const pct = qDone ? Math.round((qScore / Math.max(quiz.length, 1)) * 100) : 0

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', fontFamily: "'Nunito', sans-serif" }}>

      {/* ── Top nav ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 24px 14px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
        <GhostBtn small onClick={onBack}>← All Modules</GhostBtn>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 20 }}>{mod?.emoji}</span>
            <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 15, color: 'var(--text-h)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod?.title}</span>
            {isComplete && <span style={{ background: 'var(--accent-bg)', color: 'var(--accent)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓ Completed</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text)', paddingLeft: 28, marginTop: 2 }}>{subject} · {cls} · {chapter}</div>
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          <GhostBtn small onClick={onPrev} disabled={!hasPrev}>← Prev</GhostBtn>
          <GhostBtn small onClick={onNext} disabled={!hasNext}>Next →</GhostBtn>
        </div>
      </div>

      {/* ── Video (full width) ── */}
      <div style={{ padding: '20px 24px 0' }}>
        {currentVideoId ? (
          <>
            <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 14, overflow: 'hidden', background: '#000', boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
              <iframe
                src={`https://www.youtube.com/embed/${currentVideoId}?rel=0&modestbranding=1`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allowFullScreen title={mod?.title}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-h)' }}>{moduleData?.videoTitle || 'YouTube Video'}</div>
                {moduleData?.videoChannel && <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 2 }}>📺 {moduleData.videoChannel}</div>}
                <div style={{ fontSize: 11, marginTop: 3, color: moduleData?.transcriptStatus === 'success' ? '#6ee7b7' : '#94a3b8' }}>
                  {moduleData?.transcriptStatus === 'success' ? '✓ Transcript-based notes' : '🧠 AI knowledge used'}
                </div>
              </div>
              {searchResults.length > 1 && (
                <GhostBtn small onClick={() => setSwapping(!swapping)}>{swapping ? '✕ Close' : '🔄 Different Video'}</GhostBtn>
              )}
            </div>
            {swapping && searchResults.length > 0 && (
              <Card style={{ marginTop: 12, marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-h)', marginBottom: 10 }}>Pick a different video:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {searchResults.map(v => (
                    <div key={v.videoId} onClick={() => swapVideo(v.videoId)}
                      style={{ display: 'flex', gap: 10, padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${v.videoId === currentVideoId ? 'var(--accent)' : 'var(--border)'}`, background: v.videoId === currentVideoId ? 'var(--accent-bg)' : 'transparent', cursor: 'pointer', alignItems: 'center', transition: 'all .15s' }}>
                      {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width: 80, height: 54, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-h)', marginBottom: 2 }}>{v.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text)' }}>{v.channel}</div>
                        {v.videoId === currentVideoId && <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>Currently playing</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        ) : (
          <div style={{ ...T.card, textAlign: 'center', padding: 36 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎬</div>
            <p style={{ color: 'var(--text)', fontSize: 13 }}>No video found. Notes were generated from AI knowledge.</p>
          </div>
        )}
      </div>

      {/* ── 3-column: Notes | Q&A | Quiz ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, padding: '20px 24px 32px' }}>

        {/* Notes */}
        <div style={{ ...T.card, display: 'flex', flexDirection: 'column', maxHeight: '68vh', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 13, color: 'var(--text-h)' }}>Notes</span>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '14px 16px' }}>
            {!moduleData ? <PageSpinner /> : !notes ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text)', fontSize: 13 }}>Notes not available.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {notes.summary && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 }}>Summary</div>
                    <p style={{ fontSize: 13, color: 'var(--text-h)', lineHeight: 1.75, margin: 0 }}>{notes.summary}</p>
                  </div>
                )}
                {notes.keyConcepts?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 7 }}>Key Concepts</div>
                    {notes.keyConcepts.map((c, i) => (
                      <div key={i} style={{ padding: '7px 10px', background: 'rgba(6,182,212,.05)', borderRadius: 8, border: '1px solid rgba(6,182,212,.1)', marginBottom: 5 }}>
                        <span style={{ fontSize: 11.5, color: '#38bdf8', fontWeight: 700 }}>{c.term}: </span>
                        <span style={{ fontSize: 12.5, color: 'var(--text)' }}>{c.definition}</span>
                      </div>
                    ))}
                  </div>
                )}
                {notes.keyPoints?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 7 }}>Key Points</div>
                    {notes.keyPoints.map((p, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 7 }} />
                        <span style={{ fontSize: 12.5, color: 'var(--text-h)', lineHeight: 1.6 }}>{p}</span>
                      </div>
                    ))}
                  </div>
                )}
                {notes.formulas?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 7 }}>Formulas</div>
                    {notes.formulas.map((f, i) => (
                      <div key={i} style={{ padding: '8px 10px', background: 'rgba(245,158,11,.06)', borderRadius: 7, border: '1px solid rgba(245,158,11,.12)', fontFamily: 'monospace', fontSize: 12, color: '#fcd34d', marginBottom: 5 }}>{f}</div>
                    ))}
                  </div>
                )}
                {notes.solvedExample && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 7 }}>Solved Example</div>
                    <p style={{ fontSize: 12.5, color: 'var(--text-h)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>{notes.solvedExample}</p>
                  </div>
                )}
                {notes.commonMistakes?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 7 }}>Common Mistakes</div>
                    {notes.commonMistakes.map((m, i) => (
                      <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 5, fontSize: 12.5, color: 'var(--text-h)', lineHeight: 1.5 }}>
                        <span style={{ color: '#ef4444', flexShrink: 0 }}>✗</span>{m}
                      </div>
                    ))}
                  </div>
                )}
                {notes.examTips?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 7 }}>Exam Tips</div>
                    {notes.examTips.map((t, i) => (
                      <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 5, fontSize: 12.5, color: 'var(--text-h)', lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--accent)', flexShrink: 0 }}>★</span>{t}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Q&A */}
        <div style={{ ...T.card, display: 'flex', flexDirection: 'column', maxHeight: '68vh', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 13, color: 'var(--text-h)' }}>Q&amp;A</span>
            {qa.length > 0 && <span style={{ fontSize: 10.5, color: 'var(--text)', marginLeft: 2 }}>{qa.length} questions</span>}
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '10px 12px' }}>
            {!moduleData ? <PageSpinner /> : qa.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text)', fontSize: 13 }}>Q&A not available.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {qa.map((item, i) => (
                  <div key={i} style={{ borderRadius: 9, border: `1px solid ${qaOpen === i ? 'var(--accent-border)' : 'var(--border)'}`, background: qaOpen === i ? 'var(--accent-bg)' : 'transparent', overflow: 'hidden', transition: 'all .15s' }}>
                    <div onClick={() => setQaOpen(qaOpen === i ? null : i)}
                      style={{ padding: '9px 12px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--accent)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>Q{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        {item.difficulty && (
                          <div style={{ fontSize: 9.5, fontWeight: 700, color: item.difficulty === 'Easy' ? '#22c55e' : item.difficulty === 'Hard' ? '#ef4444' : '#06b6d4', marginBottom: 3 }}>{item.difficulty}</div>
                        )}
                        <div style={{ fontSize: 12.5, color: 'var(--text-h)', lineHeight: 1.45 }}>{item.q}</div>
                      </div>
                      <span style={{ color: 'var(--text)', fontSize: 10, flexShrink: 0 }}>{qaOpen === i ? '▲' : '▼'}</span>
                    </div>
                    {qaOpen === i && (
                      <div style={{ padding: '0 12px 11px 38px', fontSize: 12.5, color: 'var(--text-h)', lineHeight: 1.75, borderTop: '1px solid var(--border)', paddingTop: 9 }}>
                        💡 {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quiz */}
        <div style={{ ...T.card, display: 'flex', flexDirection: 'column', maxHeight: '68vh', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 13, color: 'var(--text-h)' }}>Quiz</span>
            </div>
            {qDone && <span style={{ fontSize: 11, fontWeight: 800, color: pct >= 70 ? '#6ee7b7' : '#fca5a5' }}>{pct}%</span>}
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '14px 16px' }}>
            {!moduleData ? <PageSpinner /> : quiz.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text)', fontSize: 13 }}>Quiz not available.</div>
            ) : qDone ? (
              <div>
                <div style={{ padding: '20px', borderRadius: 12, background: `linear-gradient(135deg,${pct >= 80 ? '#6366F1' : pct >= 50 ? '#F59E0B' : '#EF4444'},${pct >= 80 ? '#8B5CF6' : pct >= 50 ? '#FBBF24' : '#F87171'})`, textAlign: 'center', color: '#fff', marginBottom: 14 }}>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 30 }}>{qScore}/{quiz.length}</div>
                  <div style={{ fontSize: 13, opacity: .85, marginTop: 4 }}>{pct >= 80 ? 'Excellent! 🎉' : pct >= 50 ? 'Good effort! 👍' : 'Keep practicing! 📚'}</div>
                  <button onClick={() => { setQAns({}); setQDone(false) }} style={{ marginTop: 12, padding: '5px 16px', borderRadius: 8, background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>↺ Retake</button>
                </div>
                {quiz.map((q, i) => (
                  <div key={i} style={{ marginBottom: 9, padding: '10px 12px', borderRadius: 9, border: `1px solid ${qAns[i] === q.ans ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.2)'}`, background: qAns[i] === q.ans ? 'rgba(34,197,94,.05)' : 'rgba(239,68,68,.04)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-h)', fontWeight: 500, marginBottom: 6, lineHeight: 1.4 }}>{i + 1}. {q.q}</div>
                    {q.opts.map((opt, j) => (
                      <div key={j} style={{ fontSize: 11.5, padding: '2px 0', color: j === q.ans ? '#6ee7b7' : qAns[i] === j ? '#fca5a5' : 'var(--text)' }}>
                        {j === q.ans ? '✓ ' : qAns[i] === j ? '✗ ' : '   '}{opt}
                      </div>
                    ))}
                    {q.exp && <div style={{ marginTop: 7, fontSize: 11, color: 'var(--accent)', padding: '5px 9px', background: 'var(--accent-bg)', borderRadius: 7 }}>{q.exp}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 3, marginBottom: 14, flexWrap: 'wrap' }}>
                  {quiz.map((_, i) => (
                    <div key={i} style={{ flex: '1 0 auto', maxWidth: 28, height: 4, borderRadius: 100, background: qAns[i] !== undefined ? 'var(--accent)' : 'rgba(255,255,255,.09)', cursor: 'pointer' }} onClick={() => {}} />
                  ))}
                </div>
                {quiz.map((q, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12.5, color: 'var(--text-h)', fontWeight: 600, marginBottom: 8, lineHeight: 1.45 }}>
                      <span style={{ color: 'var(--accent)' }}>Q{i + 1}.</span> {q.q}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {q.opts.map((opt, j) => (
                        <button key={j} onClick={() => setQAns(a => ({ ...a, [i]: j }))}
                          style={{ padding: '8px 12px', borderRadius: 9, border: `1.5px solid ${qAns[i] === j ? 'var(--accent)' : 'var(--border)'}`, background: qAns[i] === j ? 'var(--accent-bg)' : 'var(--code-bg)', color: qAns[i] === j ? 'var(--accent)' : 'var(--text-h)', cursor: 'pointer', textAlign: 'left', fontSize: 12.5, fontFamily: "'Nunito', sans-serif", fontWeight: 600, transition: 'all .15s' }}>
                          <span style={{ fontWeight: 800, marginRight: 4 }}>{String.fromCharCode(65 + j)}.</span>{opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(qAns).length === quiz.length && (
                  <PrimaryBtn onClick={submitQuiz} color="#8B5CF6" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                    Submit Quiz ({Object.keys(qAns).length}/{quiz.length}) →
                  </PrimaryBtn>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  VIDEO LEARNING
// ══════════════════════════════════════════════════════════════
function VideoLearn({ user }) {
  const [phase,setPhase]=useState('search'); const [query,setQuery]=useState(''); const [urlIn,setUrlIn]=useState('')
  const [vidId,setVidId]=useState(null); const [title,setTitle]=useState(''); const [gen,setGen]=useState(false)
  const [notes,setNotes]=useState(null); const [quiz,setQuiz]=useState([]); const [tab,setTab]=useState('video')
  const [ans,setAns]=useState({}); const [done,setDone]=useState(false); const [score,setScore]=useState(0); const [err,setErr]=useState('')
  const SUGG=['Photosynthesis CBSE Class 10','Quadratic Equations Class 10','French Revolution Class 9','Newton Laws of Motion Class 9','Chemical Bonding Class 11']
  const getId=s=>{
    if(!s?.trim()) return null
    if(/^[a-zA-Z0-9_-]{11}$/.test(s.trim())) return s.trim()
    const m=s.match(/(?:[?&]v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/)
    return m?.[1]||null
  }
  const load=async(vid,t='')=>{
    const id=getId(vid)||null
    setVidId(id||'dQw4w9WgXcQ');setTitle(t||`Video Study: ${vid}`)
    setPhase('watch');setTab('video');setNotes(null);setQuiz([]);setGen(true);setAns({});setDone(false);setErr('')
    const ck=`bsv-${(id||vid.replace(/\W/g,'').slice(0,12))}`
    const cached=await api.get(`/api/courses/${ck}`).catch(()=>null)
    if(cached?.notes){setNotes(cached.notes);setQuiz(cached.quiz||[]);setGen(false);return}
    try{
      const r=await api.post('/api/ai/notes',{messages:[{role:'user',content:`A student is watching a YouTube video on "${t||vid}". Generate:
1. Study notes with ## headings, **bold** key terms (~400 words)
2. Then on a new line write EXACTLY: ===JSON===
3. Then ONLY this JSON (no markdown): {"quiz":[{"q":"...","opts":["A","B","C","D"],"ans":0,"exp":"..."}]}
Generate 6 quiz questions.`}],subject:'General'})
      let content=r.content,pqz=[]
      const sep=content.indexOf('===JSON===')
      if(sep>-1){try{const jsonPart=content.slice(sep+10).trim();const parsed=JSON.parse(jsonPart.replace(/```[\w]*\n?/g,''));pqz=parsed.quiz||[]}catch{}content=content.slice(0,sep).trim()}
      api.post('/api/courses',{cacheKey:ck,notes:content,quiz:pqz,subject:'Video',cls:'',chapter:t||vid}).catch(()=>{})
      setNotes(content);setQuiz(pqz)
    }catch(e){setErr(e.status===402?'Subscribe to generate video notes.':e.message)}
    setGen(false)
  }
  if(phase==='watch') return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:16, flexWrap:'wrap' }}>
        <OutlineBtn small onClick={()=>setPhase('search')}>← Back</OutlineBtn>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Sora',sans-serif", fontSize:14, color:'var(--text-h)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</div>
          {gen&&<div style={{ fontSize:11, color:'#f59e0b', display:'flex', alignItems:'center', gap:4 }}><Spinner size={10}/> Generating AI notes…</div>}
        </div>
      </div>
      <div style={{ display:'flex', gap:3, marginBottom:14, background:'var(--code-bg)', borderRadius:10, padding:3 }}>
        {[['video','📹 Video'],['notes','📝 Notes'],['quiz',`🎯 Quiz (${quiz.length})`]].map(([id,l])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:'7px 15px', borderRadius:7, border:'none', fontWeight:700, fontSize:12.5, cursor:'pointer', background:tab===id?'var(--accent)':'transparent', color:tab===id?'#fff':'var(--text)', fontFamily:"'Nunito',sans-serif", whiteSpace:'nowrap' }}>{l}</button>
        ))}
      </div>
      {tab==='video'&&<div style={{ position:'relative', paddingBottom:'56.25%', borderRadius:12, overflow:'hidden', background:'#000' }}>
        <iframe src={`https://www.youtube.com/embed/${vidId}?rel=0&modestbranding=1`} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }} allowFullScreen/>
      </div>}
      {tab==='notes'&&(notes?<ContentBox content={notes} label={title} downloadName="video-notes.txt" onDownload={()=>downloadText(notes,'video-notes.txt')}/>:<div style={{ padding:24, textAlign:'center', color:'var(--text)' }}>{gen?<><PageSpinner/><p style={{ marginTop:10 }}>Generating notes…</p></>:<p>Notes unavailable.</p>}</div>)}
      {tab==='quiz'&&(!quiz||quiz.length===0?<div style={{ padding:24, textAlign:'center', color:'var(--text)' }}>{gen?<PageSpinner/>:<p>Quiz not generated yet.</p>}</div>:
        done?(<div><div style={{ textAlign:'center', padding:22, background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:14, marginBottom:14 }}><div style={{ fontFamily:"'Sora',sans-serif", fontSize:24, fontWeight:900, color:'var(--accent)' }}>{score}/{quiz.length}</div><div style={{ color:'var(--text)', fontSize:13 }}>{Math.round(score/quiz.length*100)}% correct</div></div><OutlineBtn small onClick={()=>{setAns({});setDone(false)}}>Retake →</OutlineBtn></div>):
        (<div>{quiz.map((q,i)=>(<Card key={i} style={{marginBottom:10}}><p style={{fontWeight:700,fontSize:14,color:'var(--text-h)',margin:'0 0 10px'}}><span style={{color:'var(--accent)'}}>Q{i+1}.</span> {q.q}</p><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>{q.opts.map((o,j)=><button key={j} onClick={()=>setAns(a=>({...a,[i]:j}))} style={{padding:'8px 12px',borderRadius:9,border:`1.5px solid ${ans[i]===j?'var(--accent)':'var(--border)'}`,background:ans[i]===j?'var(--accent-bg)':'var(--code-bg)',color:ans[i]===j?'var(--accent)':'var(--text-h)',cursor:'pointer',textAlign:'left',fontSize:13.5,fontFamily:"'Nunito',sans-serif",fontWeight:600}}>{String.fromCharCode(65+j)}. {o}</button>)}</div></Card>))}{Object.keys(ans).length===quiz.length&&<PrimaryBtn onClick={()=>{let s=0;quiz.forEach((q,i)=>{if(ans[i]===q.ans)s++});setScore(s);setDone(true)}}>Submit →</PrimaryBtn>}</div>)
      )}
      <ErrMsg msg={err}/>
    </div>
  )
  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", maxWidth:700, margin:'0 auto' }}>
      <PageHeader icon="🎬" title="Video Learning" subtitle="Paste any YouTube URL → AI generates notes, Q&A and quiz" color="#06b6d4"/>
      <Card style={{ marginBottom:16 }}>
        <Field label="Search a topic or enter YouTube URL">
          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
            <BSInput value={query} onChange={setQuery} placeholder="e.g. Photosynthesis Class 10 CBSE" style={{ flex:1 }}/>
            <PrimaryBtn onClick={()=>query&&load(query,query)} gradient="linear-gradient(135deg,#06b6d4,#6366F1)">Search</PrimaryBtn>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <BSInput value={urlIn} onChange={setUrlIn} placeholder="https://youtube.com/watch?v=..." style={{ flex:1 }}/>
            <OutlineBtn onClick={()=>urlIn&&load(urlIn)} color="#06b6d4">Load →</OutlineBtn>
          </div>
        </Field>
      </Card>
      <Label>Suggested Topics</Label>
      <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginTop:7 }}>
        {SUGG.map(s=><button key={s} onClick={()=>{setQuery(s);load(s,s)}} style={{ padding:'5px 12px', borderRadius:20, border:'1.5px solid var(--accent-border)', background:'var(--accent-bg)', color:'var(--accent)', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>{s}</button>)}
      </div>
    </div>
  )
}


function HistoryPage({ onNavigate }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    setLoading(true);
    api.get(`/api/user/history?page=${page}`)
      .then(data => {
        setHistory(prev => page === 1 ? data : [...prev, ...data]);
        setHasMore(data.length === 50);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const TOOL_META = {
    doubt:      { icon: '🤔', label: 'Doubt Solved',    color: '#818CF8' },
    notes:      { icon: '📖', label: 'Notes Generated', color: '#10B981' },
    quiz:       { icon: '🎯', label: 'Quiz Generated',  color: '#F59E0B' },
    paper:      { icon: '📄', label: 'Question Paper',  color: '#A855F7' },
    flashcards: { icon: '🃏', label: 'Flashcards',      color: '#EF4444' },
    cheatsheet: { icon: '📋', label: 'Cheat Sheet',     color: '#F97316' },
    lessonplan: { icon: '🎓', label: 'Lesson Plan',     color: '#7C3AED' },
  };

  const tools = ['all', ...Object.keys(TOOL_META)];

  const shown = filter === 'all'
    ? history
    : history.filter(h => h.tool === filter);

  // Group by date
  const grouped = shown.reduce((acc, item) => {
    const date = new Date(item.created_at).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <div style={{ padding: 24, width: '100%', boxSizing: 'border-box', fontFamily: "'Nunito', sans-serif" }}>
      <PageHeader icon="🕘" title="Activity History" subtitle="Everything you've generated — notes, quizzes, papers and more" color="#6366F1" />

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 22 }}>
        {tools.map(t => {
          const meta = TOOL_META[t];
          return (
            <button key={t} onClick={() => setFilter(t)}
              style={{
                padding: '5px 15px', borderRadius: 20, border: 'none', fontWeight: 700,
                fontSize: 12.5, cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                background: filter === t ? (meta?.color || 'var(--accent)') : 'var(--social-bg)',
                color: filter === t ? '#fff' : 'var(--text-h)', transition: 'all .15s',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
              {meta ? `${meta.icon} ${meta.label}` : '⚡ All'}
            </button>
          );
        })}
      </div>

      {loading && page === 1 && <PageSpinner />}

      {!loading && shown.length === 0 && (
        <div style={{ textAlign: 'center', padding: 52, color: 'var(--text)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🕘</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text-h)', marginBottom: 6 }}>No history yet</div>
          <p style={{ fontSize: 13 }}>Start using AI tools and your activity will appear here.</p>
        </div>
      )}

      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 11.5, fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase',
            letterSpacing: '0.6px', marginBottom: 10, paddingLeft: 4,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ height: 1, width: 20, background: 'var(--border)' }} />
            {date}
            <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {items.map((item, i) => {
              const meta = TOOL_META[item.tool] || { icon: '⚡', label: item.tool, color: '#6366F1' };
              const chapters = item.chapters?.length > 0
                ? item.chapters.join(', ')
                : item.chapter || null;

              return (
                      <div key={i}
          onClick={() => onNavigate?.(item)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            background: 'var(--bg2)', borderRadius: 12, cursor: 'pointer',
            border: '1px solid var(--border)', transition: 'all .18s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = meta.color + '66';
            e.currentTarget.style.background  = `${meta.color}08`;
            e.currentTarget.style.transform   = 'translateX(3px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background  = 'var(--bg2)';
            e.currentTarget.style.transform   = 'none';
          }}>

          {/* Icon — NO CHANGE */}
          <div style={{
            width: 40, height: 40, borderRadius: 11, flexShrink: 0,
            background: `${meta.color}18`, border: `1px solid ${meta.color}28`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19,
          }}>
            {meta.icon}
          </div>

          {/* Details — NO CHANGE */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 2 }}>
              <span style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--text-h)' }}>
                {meta.label}
              </span>
              {item.subject && (
                <span style={{
                  fontSize: 11.5, fontWeight: 700, color: meta.color,
                  background: `${meta.color}15`, borderRadius: 20,
                  padding: '1px 8px', border: `1px solid ${meta.color}25`,
                }}>
                  {item.subject}
                </span>
              )}
            </div>
            {chapters && (
              <div style={{
                fontSize: 12, color: 'var(--text)', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                📌 {chapters}
              </div>
            )}
          </div>

          {/* Right side: XP + time — NO CHANGE */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {item.xp_earned > 0 && (
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#FCD34D', marginBottom: 2 }}>
                +{item.xp_earned} XP
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--text)' }}>
              {new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
            {item.ai_provider && (
              <div style={{ fontSize: 10, color: 'var(--text)', marginTop: 1, opacity: .6 }}>
                via {item.ai_provider}
              </div>
            )}
          </div>

          {/* ✅ CHANGE 2: arrow added here, after the time block, before closing div */}
          <span style={{ fontSize: 13, color: 'var(--text)', opacity: .5, flexShrink: 0 }}>→</span>

        </div>  
              );
            })}
          </div>
        </div>
      ))}

      {/* Load more */}
      {hasMore && !loading && shown.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <GhostBtn onClick={() => setPage(p => p + 1)}>Load More</GhostBtn>
        </div>
      )}
      {loading && page > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}><Spinner size={20} /></div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════════
export default function App() {
  useFonts()
  const isMobile = useIsMobile()

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bs_user')) } catch { return null }
  })
  const [page, setPage]               = useState(() => localStorage.getItem('bs_user') ? 'app' : 'landing')
  const [tab, setTab]                 = useState('dashboard')
  const [initAuthMode, setInitAuthMode] = useState('login')
  const [viewProfileId, setViewProfileId] = useState(null)
  const [msgUserId, setMsgUserId]     = useState(null)
  const [trialExpired, setTrialExpired] = useState(false)
  const [prefill, setPrefill]         = useState(null)

  // Refresh user on mount
  useEffect(() => {
    if (!user) return
    api.get('/api/auth/me')
      .then(u => { setUser(u); localStorage.setItem('bs_user', JSON.stringify(u)) })
      .catch(e => {
        if (e.code === 'SESSION_REPLACED') { alert('You have been signed in on another device.'); logout() }
        else if (e.status === 401) logout()
      })
  }, [])

  function handleAuth(data) {
    if (data === 'forgot') { setPage('forgot'); return }
    setUser(data); setPage('app'); setTab('dashboard')
    localStorage.setItem('bs_user', JSON.stringify(data))
  }

  function logout() {
    api.post('/api/auth/logout', {}).catch(() => {})
    localStorage.clear()
    setUser(null); setPage('landing'); setTab('dashboard')
  }

  function updateUser(u) {
    setUser(u); localStorage.setItem('bs_user', JSON.stringify(u))
  }

  function handleHistoryNav(item) {
    setPrefill({
      tool:     item.tool,
      subject:  item.subject  || '',
      chapter:  item.chapter  || '',
      chapters: item.chapters || [],
    })
    setTab(item.tool)
  }

  function clearPrefill() { setPrefill(null) }

  // ── Landing ──────────────────────────────────────────────────
  if (page === 'landing') return (
    <LandingPage onStart={mode => { setInitAuthMode(mode === 'signup' ? 'register' : 'login'); setPage('auth') }} />
  )
  if (!user || page === 'auth') return (
    <AuthPage onAuth={handleAuth} initMode={initAuthMode} />
  )
  if (page === 'forgot') return (
    <ForgotPasswordPage onBack={() => setPage('auth')} />
  )

  // ── App tabs ─────────────────────────────────────────────────
  const isStudent = user.role === 'student'
  const isTeacher = user.role === 'teacher'
  const isSchool  = user.type === 'school'

  const tabs = [
    { id: 'dashboard',   icon: '🏠', label: 'Dashboard',      color: '#6366F1' },
    { id: 'feed',        icon: '📣', label: 'Study Feed',      color: '#6366F1' },
    { id: 'search',      icon: '🔍', label: 'Search',          color: '#06b6d4' },
    { id: 'messages',    icon: '💬', label: 'Messages',        color: '#10B981' },
    { id: 'history',     icon: '🕘', label: 'History',         color: '#6366F1' },
    { id: 'doubt',       icon: '🤔', label: 'Doubt Solver',    color: '#818CF8' },
    { id: 'notes',       icon: '📖', label: 'Notes',           color: '#10B981' },
    { id: 'courses',     icon: '📚', label: 'Chapter Courses', color: '#8B5CF6' },
    { id: 'video',       icon: '🎬', label: 'Video Learning',  color: '#06b6d4' },
    ...(isStudent ? [{ id: 'cheatsheet', icon: '📋', label: 'Cheat Sheet',   color: '#F97316' }] : []),
    { id: 'paper',       icon: '📄', label: 'Question Paper',  color: '#A855F7' },
    ...(isTeacher ? [{ id: 'lessonplan', icon: '🎓', label: 'Lesson Planner', color: '#7C3AED' }] : []),
    { id: 'quiz',        icon: '🎯', label: 'Quiz',            color: '#F59E0B' },
    { id: 'flashcards',  icon: '🃏', label: 'Flashcards',      color: '#EF4444' },
    ...(isSchool ? [
      { id: 'assignments', icon: '📝', label: 'Assignments', color: '#F59E0B' },
      { id: 'notices',     icon: '📢', label: 'Notices',     color: '#F97316' },
      { id: 'timetable',   icon: '📅', label: 'Timetable',   color: '#06b6d4' },
    ] : []),
    ...(isTeacher && isSchool ? [{ id: 'school', icon: '🏫', label: 'Analytics', color: '#A855F7' }] : []),
  ]

  const renderPage = () => {
    if (tab === 'subscription') return (
      <SubscriptionPage
        user={user}
        onSuccess={() => { api.get('/api/auth/me').then(updateUser); setTab('dashboard') }}
        onBack={() => setTab('dashboard')}
      />
    )
    if (tab === 'achievements') return <AchievementsPage />
    if (tab === 'profile')      return (
      <ProfilePage
        userId={viewProfileId || undefined}
        currentUser={user}
        onBack={() => { setTab(viewProfileId ? 'search' : 'dashboard'); setViewProfileId(null) }}
        onMessage={id => { setMsgUserId(id); setTab('messages') }}
      />
    )
    if (tab === 'dashboard')  return <Dashboard user={user} onNavigate={setTab} />
    if (tab === 'feed')       return <SocialFeed user={user} />
    if (tab === 'search')     return <SearchPage currentUser={user} onViewProfile={id => { setViewProfileId(id); setTab('profile') }} />
    if (tab === 'messages')   return <MessagingPage currentUser={user} startWithUserId={msgUserId} />
    if (tab === 'history')    return <HistoryPage onNavigate={handleHistoryNav} />
    if (tab === 'doubt')      return <DoubtSolver    user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'notes')      return <NotesMaker      user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'courses')    return <ChapterCourses  user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'video')      return <VideoLearn user={user} />
    if (tab === 'cheatsheet') return <CheatSheetMaker user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'paper')      return <QPMaker         user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'lessonplan') return <LessonPlanner   user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'quiz')       return <QuizGenerator   user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'flashcards') return <FlashCards      user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'assignments') return <AssignmentsPage user={user} />
    if (tab === 'notices')    return <NoticesPage user={user} />
    if (tab === 'timetable')  return <TimetablePage user={user} />
    if (tab === 'school')     return <SchoolDashboard user={user} />
    return <Dashboard user={user} onNavigate={setTab} />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', fontFamily: "'Nunito', sans-serif" }}>

      {/* ── Top header ───────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid var(--border)', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5,5,14,.95)', backdropFilter: 'blur(20px)', boxShadow: '0 2px 20px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setTab('dashboard')}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧠</div>
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 17, color: 'var(--text-h)' }}>
            BrainSpark<span style={{ color: '#818CF8' }}> AI</span>
          </span>
          {isSchool && user.schools && (
            <span style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 700, background: 'var(--accent-bg)', padding: '2px 10px', borderRadius: 20, border: '1px solid var(--accent-border)' }}>
              🏫 {user.schools.name}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isSchool && user.subscription_status !== 'active' && (
            <button onClick={() => setTab('subscription')} style={{ padding: '6px 14px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
              ⚡ Upgrade
            </button>
          )}
          <button onClick={() => setTab('achievements')} title="Achievements" style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--social-bg)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏆</button>
          <button onClick={() => { setViewProfileId(null); setTab('profile') }} title="My Profile" style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', cursor: 'pointer', fontSize: 14, fontWeight: 900, color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora', sans-serif" }}>
            {user.name?.[0]?.toUpperCase() || '?'}
          </button>
          <button onClick={logout} style={{ padding: '6px 13px', borderRadius: 9, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>Sign Out</button>
        </div>
      </header>

      {/* ── Mobile top nav ───────────────────────────────────── */}
      <MobileTopNav tabs={tabs} activeTab={tab} onTabChange={setTab} />

      <div style={{ display: 'flex', flex: 1 }}>

        {/* ── Desktop sidebar ──────────────────────────────────── */}
        <nav className="desktop-sidebar" style={{ width: 210, borderRight: '1px solid var(--border)', padding: '12px 8px', background: 'rgba(5,5,14,.8)', flexShrink: 0, position: 'sticky', top: 58, height: 'calc(100vh - 58px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tabs.map(t => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif", background: active ? `linear-gradient(135deg,${t.color},${t.color}bb)` : 'transparent', color: active ? '#fff' : 'var(--text-h)', fontWeight: active ? 800 : 600, fontSize: 13.5, textAlign: 'left', transition: 'all .15s' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.05)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                {t.label}
              </button>
            )
          })}
          <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
          <button onClick={() => setTab('achievements')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif", background: tab === 'achievements' ? 'linear-gradient(135deg,#F59E0B,#FBBF24)' : 'transparent', color: tab === 'achievements' ? '#fff' : 'var(--text-h)', fontWeight: 600, fontSize: 13.5, textAlign: 'left', transition: 'all .15s' }}>
            <span style={{ fontSize: 16 }}>🏆</span> Achievements
          </button>
        </nav>

        {/* ── Main content ─────────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          <div style={{ padding: '16px 24px 0', paddingBottom: 0 }}>
            <FreeTierCountdown
              user={user}
              onSubscribe={() => setTab('subscription')}
              onExpired={() => { setTrialExpired(true); setTab('subscription') }}
            />
          </div>
          {renderPage()}
        </main>

      </div>

      {/* ── AI Buddy (school users only) ─────────────────────── */}
      {isSchool && <AIBuddy user={user} />}

    </div>
  )
}
