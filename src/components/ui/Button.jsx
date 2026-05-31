export function PrimaryBtn({ children, onClick, disabled, color='var(--accent)', small, style={}, gradient }) {
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

export function OutlineBtn({ children, onClick, disabled, color='var(--accent)', small, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background:'var(--code-bg)', color, padding:small?'6px 13px':'9px 18px', borderRadius:small?9:10, border:`2px solid ${color}`, fontWeight:700, fontSize:small?12.5:14, cursor:disabled?'not-allowed':'pointer', display:'inline-flex', alignItems:'center', gap:5, fontFamily:"'Nunito', sans-serif", opacity:disabled?.6:1, ...style }}>
      {children}
    </button>
  )
}

export function GhostBtn({ children, onClick, disabled, small, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background:'var(--social-bg)', color:'var(--text-h)', padding:small?'6px 12px':'9px 16px', borderRadius:small?8:10, border:'1px solid var(--border)', fontWeight:700, fontSize:small?12.5:14, cursor:disabled?'not-allowed':'pointer', display:'inline-flex', alignItems:'center', gap:5, fontFamily:"'Nunito', sans-serif", opacity:disabled?.6:1, ...style }}>
      {children}
    </button>
  )
}
