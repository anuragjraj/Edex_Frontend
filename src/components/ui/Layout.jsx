import { T } from '../../theme/tokens'

// ══════════════════════════════════════════════════════════════
//  BASE UI COMPONENTS
// ══════════════════════════════════════════════════════════════
export function PageHeader({ icon, title, subtitle, color }) {
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

export function Card({ children, style={} }) { return <div style={{ ...T.card, ...style }}>{children}</div> }

export function Label({ children }) { return <div style={T.label}>{children}</div> }

export function Field({ label, children }) {
  return <div style={{ marginBottom:14 }}><Label>{label}</Label>{children}</div>
}
