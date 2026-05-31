export function Spinner({ size=16 }) {
  return <div style={{ width:size, height:size, border:`2px solid rgba(255,255,255,.15)`, borderTopColor:'white', borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }}/>
}

export function PageSpinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:64, flexDirection:'column', gap:12 }}>
      <div style={{ width:36, height:36, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
      <span style={{ fontSize:13, color:'var(--text)', fontFamily:"'Nunito', sans-serif" }}>Loading...</span>
    </div>
  )
}

export function ErrMsg({ msg }) {
  if (!msg) return null
  return <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', borderRadius:9, padding:'10px 14px', color:'#fca5a5', fontSize:13, fontWeight:600, marginTop:8, fontFamily:"'Nunito', sans-serif" }}>⚠️ {msg}</div>
}

export function SuccessMsg({ msg }) {
  if (!msg) return null
  return <div style={{ background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', borderRadius:9, padding:'10px 14px', color:'#6ee7b7', fontSize:13, fontWeight:600, marginTop:8, fontFamily:"'Nunito', sans-serif" }}>✅ {msg}</div>
}
