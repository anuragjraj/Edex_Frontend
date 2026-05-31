import { useState, useEffect } from 'react'
import { GhostBtn, PrimaryBtn } from '../../components/ui/Button'
import { PageSpinner, Spinner, SuccessMsg } from '../../components/ui/Feedback'
import { BSTextarea } from '../../components/ui/Input'
import { Card, Label } from '../../components/ui/Layout'
import { API_URL } from '../../config/config'
import { api } from '../../lib/apiClient'

export function AssignmentDetail({ assignment, user, onBack }) {
  const [submission,setSubmission]=useState(null); const [analysis,setAnalysis]=useState(null); const [answers,setAnswers]=useState({}); const [pdfFile,setPdfFile]=useState(null); const [submitting,setSubmitting]=useState(false); const [submitted,setSubmitted]=useState(false); const [teacherAnalysis,setTeacherAnalysis]=useState(null); const [loading,setLoading]=useState(true)
  const isPast=new Date(assignment.deadline)<new Date()
  useEffect(()=>{
    Promise.all([
      api.get(`/api/assignments/${assignment.id}/analysis/me`),
      user.role==='teacher'?api.get(`/api/assignments/${assignment.id}/analysis/all`):Promise.resolve(null),
    ]).then(([a,ta])=>{setAnalysis(a);setTeacherAnalysis(ta);setLoading(false)}).catch(()=>setLoading(false))
  },[assignment.id])

  const submitText=async()=>{
    setSubmitting(true)
    try{
      const ansArr=Object.entries(answers).map(([q_num,answer_text])=>({q_num:parseInt(q_num),answer_text}))
      await api.post(`/api/assignments/${assignment.id}/submit`,{answers:JSON.stringify(ansArr)})
      setSubmitted(true)
    } catch(e){ alert(e.message) }
    setSubmitting(false)
  }

  const submitPDF=async()=>{
    if(!pdfFile) return
    setSubmitting(true)
    try{
      const form=new FormData(); form.append('pdf',pdfFile)
      const tok=localStorage.getItem('bs_token')
      const r=await fetch(`${API_URL}/api/assignments/${assignment.id}/submit`,{method:'POST',headers:{Authorization:`Bearer ${tok}`},body:form})
      if(!r.ok){ const d=await r.json(); throw new Error(d.error) }
      setSubmitted(true)
    } catch(e){ alert(e.message) }
    setSubmitting(false)
  }

  const questions=assignment.questions_json?.questions||[]
  return (
    <div style={{ padding:24, maxWidth:760, margin:'0 auto', fontFamily:"'Nunito',sans-serif" }}>
      <GhostBtn small onClick={onBack} style={{ marginBottom:16 }}>← Back</GhostBtn>
      <Card style={{ marginBottom:18, borderLeft:`4px solid ${isPast?'#64748b':'var(--accent)'}` }}>
        <h2 style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, color:'var(--text-h)', margin:'0 0 6px' }}>{assignment.title}</h2>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:10 }}>
          <span style={{ fontSize:12.5, color:'var(--text)' }}>{assignment.subject} · {assignment.class_level}</span>
          <span style={{ fontSize:12.5, color:'var(--text)' }}>📊 {assignment.total_marks} marks</span>
          <span style={{ fontSize:12.5, color:isPast?'#fca5a5':'#6ee7b7', fontWeight:700 }}>🕐 {isPast?'Deadline passed':'Due: '}{new Date(assignment.deadline).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
        </div>
        {assignment.description&&<p style={{ color:'var(--text)', fontSize:13.5, marginBottom:10 }}>{assignment.description}</p>}
        {assignment.question_paper_text&&<div style={{ background:'var(--code-bg)', border:'1px solid var(--border)', borderRadius:10, padding:16, whiteSpace:'pre-wrap', fontFamily:'monospace', fontSize:13, color:'var(--text-h)', maxHeight:300, overflowY:'auto' }}>{assignment.question_paper_text}</div>}
      </Card>

      {/* Student: submission form */}
      {user.role==='student'&&!isPast&&!submitted&&!analysis&&(
        <Card style={{ marginBottom:14 }}>
          <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:15, color:'var(--text-h)', margin:'0 0 16px' }}>Your Submission</h3>
          {(assignment.answer_type==='text'||assignment.answer_type==='both')&&questions.map(q=>(
            <div key={q.q_num} style={{ marginBottom:14 }}>
              <div style={{ fontSize:13.5, fontWeight:700, color:'var(--text-h)', marginBottom:6 }}>Q{q.q_num}. {q.question} [{q.max_marks} marks]</div>
              <BSTextarea value={answers[q.q_num]||''} onChange={v=>setAnswers(a=>({...a,[q.q_num]:v}))} rows={3} placeholder="Type your answer here..."/>
            </div>
          ))}
          {(assignment.answer_type==='pdf'||assignment.answer_type==='both')&&(
            <div style={{ marginBottom:14 }}>
              <Label>Upload PDF Answer</Label>
              <input type="file" accept="application/pdf" onChange={e=>setPdfFile(e.target.files[0])} style={{ color:'var(--text)', fontFamily:"'Nunito',sans-serif" }}/>
              {pdfFile&&<div style={{ marginTop:8, fontSize:13, color:'#6ee7b7' }}>📄 {pdfFile.name}</div>}
            </div>
          )}
          <div style={{ display:'flex', gap:10 }}>
            {(assignment.answer_type==='text'||assignment.answer_type==='both')&&Object.keys(answers).length>0&&<PrimaryBtn onClick={submitText} disabled={submitting}>{submitting?<><Spinner/> Submitting...</>:'Submit Text Answers'}</PrimaryBtn>}
            {(assignment.answer_type==='pdf'||assignment.answer_type==='both')&&pdfFile&&<PrimaryBtn onClick={submitPDF} disabled={submitting} color="#F97316">{submitting?<><Spinner/> Uploading...</>:'Upload PDF'}</PrimaryBtn>}
          </div>
        </Card>
      )}

      {submitted&&<SuccessMsg msg="Submitted! You'll receive AI feedback after the deadline."/>}

      {/* Student: analysis */}
      {user.role==='student'&&analysis&&(
        <Card style={{ borderLeft:'4px solid #22c55e' }}>
          <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:16, color:'#6ee7b7', margin:'0 0 16px' }}>🤖 AI Feedback</h3>
          <div style={{ display:'flex', gap:16, marginBottom:16, background:'rgba(34,197,94,.1)', padding:'14px 16px', borderRadius:10 }}>
            <div style={{ textAlign:'center' }}><div style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:28, color:'#6ee7b7' }}>{analysis.total_marks_awarded}/{analysis.total_marks_max}</div><div style={{ fontSize:11, color:'var(--text)' }}>Total Marks</div></div>
          </div>
          {analysis.overall_feedback&&<p style={{ color:'var(--text-h)', fontSize:14, marginBottom:14, lineHeight:1.7 }}>{analysis.overall_feedback}</p>}
          {analysis.handwriting_quality&&<div style={{ marginBottom:12, padding:'8px 12px', background:'var(--code-bg)', borderRadius:8, fontSize:13, color:'var(--text-h)' }}>✍️ Handwriting: <strong>{analysis.handwriting_quality}</strong> — {analysis.handwriting_tips}</div>}
          {(analysis.questions_analysis||[]).map((qa,i)=>(
            <Card key={i} style={{ marginBottom:10, borderLeft:`3px solid ${qa.marks_awarded>=qa.marks_max*0.7?'#22c55e':'#f59e0b'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontWeight:700, color:'var(--text-h)', fontSize:13.5 }}>Q{qa.q_num}</span>
                <span style={{ fontWeight:800, color:'var(--accent)', fontSize:14 }}>{qa.marks_awarded}/{qa.marks_max}</span>
              </div>
              <p style={{ color:'var(--text-h)', fontSize:13, marginBottom:6, lineHeight:1.6 }}>{qa.feedback}</p>
              {qa.improvement_tip&&<p style={{ color:'#FCD34D', fontSize:12.5, margin:0 }}>💡 {qa.improvement_tip}</p>}
            </Card>
          ))}
        </Card>
      )}

      {/* Teacher: all students analysis */}
      {user.role==='teacher'&&teacherAnalysis&&teacherAnalysis.length>0&&(
        <div>
          <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:16, color:'var(--text-h)', margin:'0 0 14px' }}>📊 Student Results Summary</h3>
          {teacherAnalysis.map((a,i)=>(
            <Card key={i} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div>
                  <div style={{ fontWeight:700, color:'var(--text-h)', fontSize:14 }}>{a.users?.name||'Student'}</div>
                  <div style={{ fontSize:12, color:'var(--text)' }}>{a.users?.class_level} {a.users?.section?`· Sec ${a.users.section}`:''}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:20, color:'var(--accent)' }}>{a.total_marks_awarded}/{a.total_marks_max}</div>
                  <div style={{ fontSize:11, color:'var(--text)' }}>Potential marks</div>
                </div>
              </div>
              {a.overall_feedback&&<p style={{ color:'var(--text)', fontSize:12.5, lineHeight:1.6, margin:0 }}>{a.overall_feedback}</p>}
            </Card>
          ))}
        </div>
      )}

      {loading&&<PageSpinner/>}
      {isPast&&!analysis&&user.role==='student'&&<Card style={{ textAlign:'center', padding:24 }}><div style={{ fontSize:36, marginBottom:8 }}>⏳</div><p style={{ color:'var(--text)', fontSize:14 }}>AI analysis is being prepared. Check back shortly.</p></Card>}
    </div>
  )
}
