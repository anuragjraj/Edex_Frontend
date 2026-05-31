import { useState, useEffect } from 'react'
import { PrimaryBtn } from '../../components/ui/Button'
import { PageSpinner } from '../../components/ui/Feedback'
import { PageHeader } from '../../components/ui/Layout'
import { AssignmentCreator } from './AssignmentCreator'
import { AssignmentDetail } from './AssignmentDetail'
import { api } from '../../lib/apiClient'
import { T } from '../../theme/tokens'

// ══════════════════════════════════════════════════════════════
//  ASSIGNMENTS (Teacher create + Student view)
// ══════════════════════════════════════════════════════════════
export function AssignmentsPage({ user }) {
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
