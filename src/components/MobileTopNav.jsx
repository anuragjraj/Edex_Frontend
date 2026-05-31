// ══════════════════════════════════════════════════════════════
//  MOBILE TOP NAV
// ══════════════════════════════════════════════════════════════
export function MobileTopNav({ tabs, activeTab, onTabChange }) {
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
