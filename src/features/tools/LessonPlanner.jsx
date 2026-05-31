import { useState, useEffect } from 'react'
import { ContentBox } from '../../components/ContentBox'
import { GhostBtn, PrimaryBtn } from '../../components/ui/Button'
import { ErrMsg, Spinner, SuccessMsg } from '../../components/ui/Feedback'
import { BSInput, BSSelect, BSTextarea } from '../../components/ui/Input'
import { Card, Field, PageHeader } from '../../components/ui/Layout'
import { CLASSES, SUBJECTS } from '../../constants/subjects'
import { api } from '../../lib/apiClient'
import { loadSavedContent, saveSessionContent } from '../../lib/sessions'
import { downloadText } from '../../utils/download'

// ══════════════════════════════════════════════════════════════
//  LESSON PLANNER
// ══════════════════════════════════════════════════════════════
export function LessonPlanner({ user, prefill, onClearPrefill }) {
  const [subject,setSubject]=useState('Mathematics'); const [topic,setTopic]=useState(''); const [cls,setCls]=useState('Class 9'); const [duration,setDuration]=useState(45); const [notes,setNotes]=useState('')
  const [result,setResult]=useState(''); const [loading,setLoading]=useState(false); const [saved,setSaved]=useState(false); const [err,setErr]=useState(''); const [rating,setRating]=useState(0)


  const buildPrompt=()=>`You are a world-class master teacher and pedagogy expert. Create an exceptional, fully detailed lesson plan for "${topic}" — ${subject} ${cls} — ${duration} minutes.
Teacher's context: ${notes||'Standard classroom with mixed ability students'}
MINIMUM 1500 words. This must be genuinely useful and specific.

# 🎓 MASTER LESSON PLAN: ${topic}
**Subject:** ${subject} | **Class:** ${cls} | **Duration:** ${duration} minutes

## ⚡ LESSON SNAPSHOT
(Learning objectives, prerequisites, materials needed)

## ⏱️ MINUTE-BY-MINUTE PLAN
### 🚀 OPENING: Hook & Connect [0:00 – ${Math.round(duration*.1)}:00]
(Exact opening statement, hook activity, connecting to prior knowledge)

### 📖 MAIN TEACHING [${Math.round(duration*.1)}:00 – ${Math.round(duration*.6)}:00]
(Step-by-step teaching with exact explanations, board work, examples)

### 🔧 WORKED EXAMPLES [${Math.round(duration*.6)}:00 – ${Math.round(duration*.75)}:00]
(2-3 solved examples with full working)

### 💬 SOCRATIC QUESTIONS TO ASK
(10 questions from basic to challenging to check understanding)

### 🎯 CLOSING & ASSESSMENT [${Math.round(duration*.75)}:00 – ${duration}:00]
(Summary, exit ticket, homework)

## 🏆 DIFFERENTIATION STRATEGIES
## 📊 ASSESSMENT CRITERIA
## 🔗 CONNECTIONS TO CBSE EXAM`

  
  useEffect(() => {
  if (!prefill) return
  if (prefill.subject) setSubject(prefill.subject)
  if (prefill.chapter) setTopic(prefill.chapter)   // topic = chapter for lesson plans
  onClearPrefill?.()
  loadSavedContent('lessonplan', prefill.subject, prefill.chapter, []).then(content => {
    if (content) { setResult(content); setSaved(true) }
  })
}, [])

  async function generate() {
    if(!topic.trim()) return alert('Please enter a topic')
    setErr(''); setLoading(true); setSaved(false); setRating(0)
    try{ const r=await api.post('/api/ai/lessonplan',{messages:[{role:'user',content:buildPrompt()}],subject,chapter:topic}); setResult(r.content) 
  saveSessionContent({ tool:'lessonplan', subject, chapter:topic, classLevel:cls, content:r.content })}
    catch(e){ if(e.status===402){setErr('Free trial ended. Please subscribe.')}else{setErr(e.message)} }
    setLoading(false)
  }

  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:4 }}>
        <PageHeader icon="🎓" title="AI Lesson Planner" subtitle="Minute-by-minute plans with teaching scripts and Socratic questions" color="#7C3AED"/>
        <span style={{ background:'#7C3AED', color:'#fff', borderRadius:20, padding:'2px 12px', fontSize:11, fontWeight:800, flexShrink:0, height:'fit-content', marginTop:6 }}>TEACHER ONLY</span>
      </div>
      <Card style={{ marginBottom:18, borderColor:'#7C3AED' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:4 }}>
          <Field label="Subject"><BSSelect value={subject} onChange={setSubject} options={SUBJECTS}/></Field>
          <Field label="Class"><BSSelect value={cls} onChange={setCls} options={CLASSES}/></Field>
        </div>
        <Field label="Topic to Teach"><BSInput value={topic} onChange={setTopic} placeholder="e.g. Quadratic Equations, Photosynthesis, French Revolution"/></Field>
        <Field label={`Teaching Duration: ${duration} minutes`}>
          <input type="range" min={20} max={90} step={5} value={duration} onChange={e=>setDuration(+e.target.value)} style={{ width:'100%', accentColor:'#7C3AED', marginBottom:4 }}/>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, color:'var(--text)', fontWeight:600 }}><span>20 min</span><span style={{ fontWeight:800, color:'#7C3AED' }}>{duration} min</span><span>90 min</span></div>
        </Field>
        <Field label="Your Notes (optional)"><BSTextarea value={notes} onChange={setNotes} rows={3} placeholder="e.g. 'Students already know linear equations. I want real-world examples. Class is weak in algebra.'"/></Field>
        <PrimaryBtn onClick={generate} disabled={loading||!topic.trim()} gradient="linear-gradient(135deg,#7C3AED,#6366F1)">{loading?<><Spinner/> Crafting your lesson plan...</>:'🎓 Generate Master Lesson Plan'}</PrimaryBtn>
      </Card>
      <ErrMsg msg={err}/>
      {result&&<>
        <ContentBox content={result} label={`Lesson Plan: ${topic} — ${subject} ${cls}`} downloadName={`lesson-${topic.replace(/\s+/g,'-')}.txt`} onDownload={()=>downloadText(result,`lesson-plan-${topic.replace(/\s+/g,'-')}-${duration}min.txt`)}/>
        <Card style={{ marginTop:12, display:'flex', alignItems:'center', gap:14 }}>
          <span style={{ fontSize:13.5, fontWeight:700, color:'var(--text)' }}>How was this plan?</span>
          {[1,2,3,4,5].map(n=>(<span key={n} onClick={()=>setRating(n)} style={{ fontSize:22, cursor:'pointer', opacity:n<=rating?1:.3, transition:'opacity .2s' }}>⭐</span>))}
          {rating>0&&<span style={{ fontSize:12.5, color:'#6ee7b7', fontWeight:700 }}>Thank you!</span>}
        </Card>
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          {!saved?<GhostBtn small onClick={async()=>{try{await api.post('/api/user/lessonplans',{subject,topic,classLevel:cls,durationMinutes:duration,customPrompt:notes,content:result});setSaved(true)}catch(e){alert(e.message)}}}>💾 Save</GhostBtn>:<SuccessMsg msg="Saved!"/>}
        </div>
      </>}
    </div>
  )
}
