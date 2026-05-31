import { useState } from 'react'
import { MediaUploader } from '../../components/MediaUploader'
import { GhostBtn, PrimaryBtn } from '../../components/ui/Button'
import { ErrMsg, Spinner } from '../../components/ui/Feedback'
import { BSInput, BSSelect, BSTextarea } from '../../components/ui/Input'
import { Card, Field, Label, PageHeader } from '../../components/ui/Layout'
import { CLASSES, SUBJECTS } from '../../constants/subjects'
import { api } from '../../lib/apiClient'
import { T } from '../../theme/tokens'

export function AssignmentCreator({ user, onCreated, onBack }) {
  const [form,setForm]=useState({title:'',description:'',subject:'Mathematics',class_level:'Class 10',section:'',total_marks:20,deadline:'',answer_type:'both',grading_notes:''})
  const [qMode,setQMode]=useState('generate'); const [qPaper,setQPaper]=useState(''); const [qFile,setQFile]=useState(null)
  const [generating,setGenerating]=useState(false); const [saving,setSaving]=useState(false); const [err,setErr]=useState('')
  const set=k=>v=>setForm(f=>({...f,[k]:v}))
  const generatePaper=async()=>{
    setGenerating(true); setErr('')
    try{ const r=await api.post('/api/assignments/generate-paper',{subject:form.subject,class_level:form.class_level,marks:form.total_marks,answer_type:form.answer_type,teacher_notes:form.grading_notes}); setQPaper(r.paper_text) }
    catch(e){ setErr(e.message) }
    setGenerating(false)
  }
  const submit=async()=>{
    if(!form.title||!form.deadline) return setErr('Title and deadline required')
    setSaving(true); setErr('')
    try{ const data=await api.post('/api/assignments',{...form,question_paper_text:qPaper,question_paper_url:qFile}); onCreated?.(data) }
    catch(e){ setErr(e.message) }
    setSaving(false)
  }
  return (
    <div style={{ padding:24, maxWidth:720, margin:'0 auto', fontFamily:"'Nunito',sans-serif" }}>
      {onBack&&<GhostBtn small onClick={onBack} style={{ marginBottom:16 }}>← Back</GhostBtn>}
      <PageHeader icon="📝" title="Create Assignment" subtitle="AI-powered assignment creation with automatic grading after deadline" color="#F59E0B"/>
      <Card style={{ marginBottom:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:14 }}>
          <Field label="Title"><BSInput value={form.title} onChange={set('title')} placeholder="e.g. Chapter 5 Practice"/></Field>
          <Field label="Subject"><BSSelect value={form.subject} onChange={set('subject')} options={SUBJECTS}/></Field>
          <Field label="Class"><BSSelect value={form.class_level} onChange={set('class_level')} options={CLASSES}/></Field>
          <Field label="Section (blank=all)"><BSInput value={form.section} onChange={set('section')} placeholder="A, B, or blank"/></Field>
          <Field label="Total Marks"><input type="number" value={form.total_marks} onChange={e=>set('total_marks')(parseInt(e.target.value))} style={{ ...T.input }}/></Field>
          <Field label="Deadline"><input type="datetime-local" value={form.deadline} onChange={e=>set('deadline')(e.target.value)} min={new Date().toISOString().slice(0,16)} style={{ ...T.input }}/></Field>
        </div>
        <Field label="Expected Answer Format">
          <div style={{ display:'flex', gap:8 }}>
            {[['text','⌨️ Text only'],['pdf','📄 PDF only'],['both','🔄 Either']].map(([v,l])=>(
              <button key={v} onClick={()=>set('answer_type')(v)} style={{ padding:'7px 14px', borderRadius:9, border:`2px solid ${form.answer_type===v?'var(--accent)':'var(--border)'}`, background:form.answer_type===v?'var(--accent-bg)':'transparent', color:form.answer_type===v?'var(--accent)':'var(--text)', fontWeight:700, fontSize:12.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>{l}</button>
            ))}
          </div>
        </Field>
        <Field label="Grading Preferences (AI uses this to grade)">
          <BSTextarea value={form.grading_notes} onChange={set('grading_notes')} rows={2} placeholder="e.g. Focus on method, not just answer. Award partial marks for correct working. Presentation matters."/>
        </Field>
      </Card>
      <Card style={{ marginBottom:14 }}>
        <Label>Question Paper</Label>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          {[['generate','🤖 AI Generate'],['upload','📎 Upload PDF']].map(([v,l])=>(
            <button key={v} onClick={()=>setQMode(v)} style={{ padding:'7px 14px', borderRadius:9, border:`2px solid ${qMode===v?'var(--accent)':'var(--border)'}`, background:qMode===v?'var(--accent-bg)':'transparent', color:qMode===v?'var(--accent)':'var(--text)', fontWeight:700, fontSize:12.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>{l}</button>
          ))}
        </div>
        {qMode==='generate'&&(
          <>
            <PrimaryBtn onClick={generatePaper} disabled={generating} color="#F59E0B" style={{ marginBottom:qPaper?10:0 }}>{generating?<><Spinner/> Generating...</>:'✨ Generate Question Paper'}</PrimaryBtn>
            {qPaper&&<textarea value={qPaper} onChange={e=>setQPaper(e.target.value)} rows={10} style={{ ...T.input, resize:'vertical', marginTop:8 }}/>}
          </>
        )}
        {qMode==='upload'&&<MediaUploader accept="application/pdf" label="Upload Question Paper PDF" onUpload={url=>setQFile(url)} onClear={()=>setQFile(null)} current={qFile?{url:qFile,type:'pdf'}:null}/>}
      </Card>
      <ErrMsg msg={err}/>
      <PrimaryBtn onClick={submit} disabled={saving} color="#F59E0B" style={{ width:'100%', justifyContent:'center', fontSize:15 }}>{saving?<><Spinner/> Publishing...</>:'📤 Publish Assignment'}</PrimaryBtn>
    </div>
  )
}
