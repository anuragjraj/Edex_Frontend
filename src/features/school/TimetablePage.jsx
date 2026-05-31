import { useState, useEffect } from 'react'
import { GhostBtn, PrimaryBtn } from '../../components/ui/Button'
import { PageSpinner, Spinner } from '../../components/ui/Feedback'
import { Card, PageHeader } from '../../components/ui/Layout'
import { api } from '../../lib/apiClient'
import { T } from '../../theme/tokens'

// ══════════════════════════════════════════════════════════════
//  TIMETABLE VIEWER
// ══════════════════════════════════════════════════════════════
export function TimetablePage({ user }) {
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
