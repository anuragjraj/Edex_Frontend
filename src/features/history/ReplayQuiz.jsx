import { useState } from 'react'
import { PrimaryBtn } from '../../components/ui/Button'
import { Card } from '../../components/ui/Layout'

// ── Small replay components (only used for tools that don't have
//    a dedicated app-level component) ─────────────────────────

export function ReplayQuiz({ session }) {
  const quiz = session.content?.questions || (Array.isArray(session.content) ? session.content : [])
  const [ans, setAns] = useState({})
  const [done, setDone] = useState(false)
  const score = done ? quiz.filter((q,i) => ans[i] === (q.answer ?? q.ans)).length : 0
  return (
    <div>
      {done && (
        <div style={{ background:'linear-gradient(135deg,#F59E0B,#F97316)', borderRadius:16, padding:24, textAlign:'center', marginBottom:20, color:'#fff' }}>
          <div style={{ fontSize:42, marginBottom:6 }}>{score===quiz.length?'🏆':score>=quiz.length*.7?'🎉':'📚'}</div>
          <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:28 }}>{score}/{quiz.length}</div>
          <div style={{ opacity:.85, fontSize:14, marginBottom:12 }}>{Math.round((score/quiz.length)*100)}% correct</div>
          <button onClick={()=>{setAns({});setDone(false)}} style={{ padding:'7px 20px', borderRadius:9, background:'rgba(255,255,255,.2)', border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>↺ Retake</button>
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:12 }}>
        {quiz.map((q,i) => {
          const sel=ans[i], correct=q.answer??q.ans
          return (
            <Card key={i} style={{ borderLeft: done ? `4px solid ${sel===correct?'#22c55e':'#ef4444'}` : '' }}>
              <p style={{ fontWeight:700, fontSize:14.5, color:'var(--text-h)', margin:'0 0 12px', lineHeight:1.5 }}><span style={{ color:'var(--accent)' }}>Q{i+1}.</span> {q.q||q.text}</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {(q.options||q.opts||[]).map((opt,j)=>{
                  const isAns=j===correct, isSel=sel===j
                  let bg='var(--social-bg)', border='var(--border)', color='var(--text-h)'
                  if(done){if(isAns){bg='rgba(34,197,94,.1)';border='#6ee7b7';color='#6ee7b7';}else if(isSel){bg='rgba(239,68,68,.1)';border='#fca5a5';color='#fca5a5';}}
                  else if(isSel){bg='var(--accent-bg)';border='var(--accent)';color='var(--accent)';}
                  return <button key={j} disabled={done} onClick={()=>setAns(a=>({...a,[i]:j}))} style={{ padding:'9px 12px', borderRadius:9, border:`1.5px solid ${border}`, background:bg, color, cursor:done?'default':'pointer', textAlign:'left', fontSize:13.5, fontFamily:"'Nunito',sans-serif", fontWeight:600 }}><span style={{ fontWeight:800, marginRight:4 }}>{String.fromCharCode(65+j)}.</span>{typeof opt==='string'?opt.replace(/^[A-D]\.\s*/,''):opt}{done&&isAns?' ✓':''}</button>
                })}
              </div>
              {done&&(q.explanation||q.exp)&&<div style={{ marginTop:10, padding:'9px 13px', background:'var(--accent-bg)', borderRadius:9, fontSize:13, color:'var(--accent)' }}>💡 {q.explanation||q.exp}</div>}
            </Card>
          )
        })}
      </div>
      {!done && Object.keys(ans).length===quiz.length && <PrimaryBtn onClick={()=>setDone(true)} color='#F59E0B' style={{ marginTop:16 }}>Submit Quiz →</PrimaryBtn>}
    </div>
  )
}
