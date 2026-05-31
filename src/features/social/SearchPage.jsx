import { useState, useEffect } from 'react'
import { PageHeader } from '../../components/ui/Layout'
import { api } from '../../lib/apiClient'
import { T } from '../../theme/tokens'

// ══════════════════════════════════════════════════════════════
//  SEARCH PAGE
// ══════════════════════════════════════════════════════════════
export function SearchPage({ currentUser, onViewProfile }) {
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
