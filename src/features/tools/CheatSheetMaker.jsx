import { useState, useEffect } from 'react'
import { ChapterSelector } from '../../components/ChapterSelector'
import { ContentBox } from '../../components/ContentBox'
import { GhostBtn, PrimaryBtn } from '../../components/ui/Button'
import { ErrMsg, Spinner, SuccessMsg } from '../../components/ui/Feedback'
import { BSSelect } from '../../components/ui/Input'
import { Card, Field, PageHeader } from '../../components/ui/Layout'
import { CLASSES, SUBJECTS } from '../../constants/subjects'
import { api } from '../../lib/apiClient'
import { loadSavedContent, saveSessionContent } from '../../lib/sessions'
import { T } from '../../theme/tokens'
import { downloadText } from '../../utils/download'

// ══════════════════════════════════════════════════════════════
//  CHEAT SHEET MAKER
// ══════════════════════════════════════════════════════════════
export function CheatSheetMaker({ user, prefill, onClearPrefill }) {
  const [subject,setSubject]=useState('Mathematics'); const [cls,setCls]=useState('Class 10')
  const [chapters,setChapters]=useState([]); const [examDate,setExamDate]=useState('')
  const [result,setResult]=useState(''); const [loading,setLoading]=useState(false); const [saved,setSaved]=useState(false); const [err,setErr]=useState('')

  const buildPrompt=()=>`You are the world's best CBSE exam preparation expert. Create a COMPREHENSIVE 3-hour exam cheat sheet.
Subject: ${subject} | Class: ${cls} | Chapters: ${chapters.join(', ')}${examDate?` | Exam Date: ${examDate}`:''}
MINIMUM 2500 words.

# 🎯 EXAM CHEAT SHEET: ${subject} — ${cls}
## ⏱️ 3-HOUR STUDY STRATEGY
${chapters.map(ch=>`
## 📚 ${ch}
### ⚡ Key Formulas & Laws
### 📝 Must-Know Definitions (5-8 most important)
### 🎯 Top 15 Exam Questions + Model Answers
### ⚠️ Common Mistakes`).join('\n')}
## 📊 FINAL EXAM STRATEGY & SCORING TIPS`

  useEffect(() => {
    if (!prefill) return
    if (prefill.subject) setSubject(prefill.subject)
    if (prefill.chapters?.length) setChapters(prefill.chapters)
    else if (prefill.chapter) setChapters([prefill.chapter])
    onClearPrefill?.()
    loadSavedContent('cheatsheet', prefill.subject, prefill.chapter, prefill.chapters).then(content => {
      if (content) { setResult(content); setSaved(true) }
    })
  }, [])

  async function generate() {
    if(chapters.length===0) return alert('Please select at least one chapter')
    setErr(''); setLoading(true); setSaved(false)
    try{ const r=await api.post('/api/ai/cheatsheet',{messages:[{role:'user',content:buildPrompt()}],subject,chapters}); setResult(r.content)
  saveSessionContent({ tool:'cheatsheet', subject, chapters, classLevel:cls, content:r.content }) }
    catch(e){ if(e.status===402){setErr('Free trial ended. Please subscribe.')}else{setErr(e.message)} }
    setLoading(false)
  }

  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
        <PageHeader icon="📋" title="3-Hour Exam Cheat Sheet" subtitle="Top questions, formulas, predictions, scoring strategy" color="#F97316"/>
        <span style={{ background:'#F97316', color:'#fff', borderRadius:20, padding:'2px 12px', fontSize:11, fontWeight:800, flexShrink:0, height:'fit-content' }}>STUDENT ONLY</span>
      </div>
      <Card style={{ marginBottom:18 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:4 }}>
          <Field label="Subject"><BSSelect value={subject} onChange={v=>{setSubject(v);setChapters([])}} options={SUBJECTS}/></Field>
          <Field label="Class"><BSSelect value={cls} onChange={v=>{setCls(v);setChapters([])}} options={CLASSES}/></Field>
        </div>
        <Field label="Select Chapters"><ChapterSelector subject={subject} cls={cls} selected={chapters} onChange={setChapters}/></Field>
        <Field label="Exam Date (optional)"><input type="date" style={{ ...T.input, maxWidth:220 }} value={examDate} onChange={e=>setExamDate(e.target.value)} min={new Date().toISOString().split('T')[0]}/></Field>
        <PrimaryBtn onClick={generate} disabled={loading||chapters.length===0} gradient="linear-gradient(135deg,#F97316,#F59E0B)">{loading?<><Spinner/> Generating cheat sheet...</>:`🎯 Generate Cheat Sheet (${chapters.length} chapter${chapters.length!==1?'s':''})`}</PrimaryBtn>
      </Card>
      <ErrMsg msg={err}/>
      {result&&<>
        <ContentBox content={result} label={`Exam Cheat Sheet — ${subject} | ${chapters.join(', ')}`} downloadName={`cheatsheet-${subject}-${cls}.txt`} onDownload={()=>downloadText(result,`cheatsheet-${subject}-${cls}.txt`)}/>
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          {!saved?<GhostBtn small onClick={async()=>{try{await api.post('/api/user/cheatsheets',{subject,classLevel:cls,chapters,examDate,content:result});setSaved(true)}catch(e){alert(e.message)}}}>💾 Save</GhostBtn>:<SuccessMsg msg="Saved!"/>}
        </div>
      </>}
    </div>
  )
}
