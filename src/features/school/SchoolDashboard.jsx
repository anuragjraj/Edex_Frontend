import { useState, useEffect } from 'react'
import { PageSpinner } from '../../components/ui/Feedback'
import { PageHeader } from '../../components/ui/Layout'
import { api } from '../../lib/apiClient'
import { timeAgo } from '../../utils/time'

// ══════════════════════════════════════════════════════════════
//  SCHOOL ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════
export function SchoolDashboard({ user }) {
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
