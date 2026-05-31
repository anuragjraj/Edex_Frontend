export function Tag({ label, onRemove }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'var(--accent-bg)', color:'var(--accent)', border:'1px solid var(--accent-border)', borderRadius:20, padding:'3px 10px', fontSize:12, fontWeight:700, fontFamily:"'Nunito', sans-serif" }}>
      {label} {onRemove && <span onClick={onRemove} style={{ cursor:'pointer', fontWeight:800 }}>×</span>}
    </span>
  )
}

export function XPBadge({ amount, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', marginTop:14 }}>
      <div style={{ background:'var(--accent-bg)', padding:'5px 14px', borderRadius:20, display:'flex', alignItems:'center', gap:5, border:'1px solid var(--accent-border)', color:'var(--accent)', fontWeight:700, fontSize:12.5, fontFamily:"'Nunito', sans-serif" }}>
        ⚡ Earn +{amount} XP {label}
      </div>
    </div>
  )
}
