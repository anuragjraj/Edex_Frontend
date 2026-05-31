import { useState, useEffect } from 'react'
import { GhostBtn, PrimaryBtn } from '../../components/ui/Button'
import { PageSpinner, Spinner } from '../../components/ui/Feedback'
import { BSInput, BSSelect, BSTextarea } from '../../components/ui/Input'
import { Card, Field, Label, PageHeader } from '../../components/ui/Layout'
import { api } from '../../lib/apiClient'
import { T } from '../../theme/tokens'
import { timeAgo } from '../../utils/time'

// ══════════════════════════════════════════════════════════════
//  SCHOOL NOTICES
// ══════════════════════════════════════════════════════════════
export function NoticesPage({ user }) {
  const [notices,setNotices]=useState([]); const [loading,setLoading]=useState(true); const [creating,setCreating]=useState(false); const [form,setForm]=useState({title:'',content:'',notice_type:'general',target_audience:'all',is_pinned:false}); const [saving,setSaving]=useState(false)
  useEffect(()=>{ api.get('/api/school/notices').then(setNotices).catch(()=>{}).finally(()=>setLoading(false)) },[])
  const submit=async()=>{
    setSaving(true)
    try{
      const n=await api.post('/api/school/notices',form);
      setNotices(p=>[n,...p]);
      setCreating(false);
      setForm({title:'',content:'',notice_type:'general',target_audience:'all',is_pinned:false})
    } catch(e){ alert(e.message) }
    setSaving(false)
  }

  const canCreate = ['admin','principal','teacher'].includes(user.role)
  const TYPES = [{v:'general',l:'📢 General'},{v:'exam',l:'📝 Exam'},{v:'event',l:'🎉 Event'},{v:'holiday',l:'🏖️ Holiday'},{v:'sports',l:'⚽ Sports'},{v:'cultural',l:'🎭 Cultural'}]

  return (
    <div style={{ padding:24, fontFamily:"'Nunito',sans-serif", maxWidth:760, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <PageHeader icon="📢" title="School Notices" subtitle="Stay updated with school announcements" color="#F97316"/>
        {canCreate&&!creating&&<PrimaryBtn onClick={()=>setCreating(true)} color="#F97316">+ New Notice</PrimaryBtn>}
      </div>

      {creating&&(
        <Card style={{ marginBottom:20, borderColor:'#F97316' }}>
          <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text-h)', margin:'0 0 16px', fontSize:15 }}>Create Notice</h3>
          <Field label="Title"><BSInput value={form.title} onChange={v=>setForm(f=>({...f,title:v}))} placeholder="Notice title..."/></Field>
          <Field label="Content"><BSTextarea value={form.content} onChange={v=>setForm(f=>({...f,content:v}))} rows={4} placeholder="Notice details..."/></Field>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12, marginBottom:14 }}>
            <div>
              <Label>Type</Label>
              <BSSelect value={form.notice_type} onChange={v=>setForm(f=>({...f,notice_type:v}))} options={TYPES.map(t=>({value:t.v,label:t.l}))}/>
            </div>
            {user.role!=='teacher'&&<div>
              <Label>Audience</Label>
              <BSSelect value={form.target_audience} onChange={v=>setForm(f=>({...f,target_audience:v}))} options={[{value:'all',label:'Everyone'},{value:'students',label:'Students only'},{value:'teachers',label:'Teachers only'}]}/>
            </div>}
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'var(--text)', fontWeight:600, marginBottom:14 }}>
            <input type="checkbox" checked={form.is_pinned} onChange={e=>setForm(f=>({...f,is_pinned:e.target.checked}))} style={{ accentColor:'var(--accent)' }}/>
            📌 Pin this notice
          </label>
          <div style={{ display:'flex', gap:10 }}>
            <PrimaryBtn onClick={submit} disabled={saving||!form.title||!form.content} color="#F97316">{saving?<><Spinner/> Posting...</>:'📤 Post Notice'}</PrimaryBtn>
            <GhostBtn onClick={()=>setCreating(false)}>Cancel</GhostBtn>
          </div>
        </Card>
      )}

      {loading&&<PageSpinner/>}
      {!loading&&notices.length===0&&<div style={{ textAlign:'center', padding:40, color:'var(--text)' }}>No notices yet.</div>}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {notices.map(n=>{
          const typeColors = {general:'#6366F1',exam:'#F59E0B',event:'#10B981',holiday:'#06b6d4',sports:'#EF4444',cultural:'#A855F7'}
          const color = typeColors[n.notice_type]||'#6366F1'
          return (
            <div key={n.id} style={{ ...T.card, borderLeft:`4px solid ${color}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                    {n.is_pinned&&<span style={{ fontSize:12, color:'#F59E0B' }}>📌</span>}
                    <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:15, color:'var(--text-h)' }}>{n.title}</span>
                    <span style={{ background:`${color}18`, color, border:`1px solid ${color}28`, borderRadius:20, padding:'2px 10px', fontSize:10.5, fontWeight:700, textTransform:'capitalize' }}>{n.notice_type}</span>
                  </div>
                  <p style={{ color:'var(--text-h)', fontSize:13.5, lineHeight:1.7, margin:'0 0 10px' }}>{n.content}</p>
                  <div style={{ fontSize:11.5, color:'var(--text)' }}>{timeAgo(n.created_at)} · {n.target_audience==='all'?'Everyone':n.target_audience}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
