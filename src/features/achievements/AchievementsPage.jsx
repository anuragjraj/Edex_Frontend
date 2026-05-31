import { useState, useEffect } from 'react'
import { Card, PageHeader } from '../../components/ui/Layout'
import { DIFF_COLORS } from '../../constants/levels'
import { api } from '../../lib/apiClient'

// ══════════════════════════════════════════════════════════════
//  ACHIEVEMENTS PAGE
// ══════════════════════════════════════════════════════════════
export function AchievementsPage() {
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
