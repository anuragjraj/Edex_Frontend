import { useState } from 'react'
import { ContentBox } from '../../components/ContentBox'
import { OutlineBtn, PrimaryBtn } from '../../components/ui/Button'
import { ErrMsg, PageSpinner, Spinner } from '../../components/ui/Feedback'
import { BSInput } from '../../components/ui/Input'
import { Card, Field, Label, PageHeader } from '../../components/ui/Layout'
import { api } from '../../lib/apiClient'
import { downloadText } from '../../utils/download'

// ══════════════════════════════════════════════════════════════
//  VIDEO LEARNING
// ══════════════════════════════════════════════════════════════
export function VideoLearn({ user }) {
  const [phase,setPhase]=useState('search'); const [query,setQuery]=useState(''); const [urlIn,setUrlIn]=useState('')
  const [vidId,setVidId]=useState(null); const [title,setTitle]=useState(''); const [gen,setGen]=useState(false)
  const [notes,setNotes]=useState(null); const [quiz,setQuiz]=useState([]); const [tab,setTab]=useState('video')
  const [ans,setAns]=useState({}); const [done,setDone]=useState(false); const [score,setScore]=useState(0); const [err,setErr]=useState('')
  const SUGG=['Photosynthesis CBSE Class 10','Quadratic Equations Class 10','French Revolution Class 9','Newton Laws of Motion Class 9','Chemical Bonding Class 11']
  const getId=s=>{
    if(!s?.trim()) return null
    if(/^[a-zA-Z0-9_-]{11}$/.test(s.trim())) return s.trim()
    const m=s.match(/(?:[?&]v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/)
    return m?.[1]||null
  }
  const load=async(vid,t='')=>{
    const id=getId(vid)||null
    setVidId(id||'dQw4w9WgXcQ');setTitle(t||`Video Study: ${vid}`)
    setPhase('watch');setTab('video');setNotes(null);setQuiz([]);setGen(true);setAns({});setDone(false);setErr('')
    const ck=`bsv-${(id||vid.replace(/\W/g,'').slice(0,12))}`
    const cached=await api.get(`/api/courses/${ck}`).catch(()=>null)
    if(cached?.notes){setNotes(cached.notes);setQuiz(cached.quiz||[]);setGen(false);return}
    try{
      const r=await api.post('/api/ai/notes',{messages:[{role:'user',content:`A student is watching a YouTube video on "${t||vid}". Generate:
1. Study notes with ## headings, **bold** key terms (~400 words)
2. Then on a new line write EXACTLY: ===JSON===
3. Then ONLY this JSON (no markdown): {"quiz":[{"q":"...","opts":["A","B","C","D"],"ans":0,"exp":"..."}]}
Generate 6 quiz questions.`}],subject:'General'})
      let content=r.content,pqz=[]
      const sep=content.indexOf('===JSON===')
      if(sep>-1){try{const jsonPart=content.slice(sep+10).trim();const parsed=JSON.parse(jsonPart.replace(/```[\w]*\n?/g,''));pqz=parsed.quiz||[]}catch{}content=content.slice(0,sep).trim()}
      api.post('/api/courses',{cacheKey:ck,notes:content,quiz:pqz,subject:'Video',cls:'',chapter:t||vid}).catch(()=>{})
      setNotes(content);setQuiz(pqz)
    }catch(e){setErr(e.status===402?'Subscribe to generate video notes.':e.message)}
    setGen(false)
  }
  if(phase==='watch') return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:16, flexWrap:'wrap' }}>
        <OutlineBtn small onClick={()=>setPhase('search')}>← Back</OutlineBtn>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Sora',sans-serif", fontSize:14, color:'var(--text-h)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</div>
          {gen&&<div style={{ fontSize:11, color:'#f59e0b', display:'flex', alignItems:'center', gap:4 }}><Spinner size={10}/> Generating AI notes…</div>}
        </div>
      </div>
      <div style={{ display:'flex', gap:3, marginBottom:14, background:'var(--code-bg)', borderRadius:10, padding:3 }}>
        {[['video','📹 Video'],['notes','📝 Notes'],['quiz',`🎯 Quiz (${quiz.length})`]].map(([id,l])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:'7px 15px', borderRadius:7, border:'none', fontWeight:700, fontSize:12.5, cursor:'pointer', background:tab===id?'var(--accent)':'transparent', color:tab===id?'#fff':'var(--text)', fontFamily:"'Nunito',sans-serif", whiteSpace:'nowrap' }}>{l}</button>
        ))}
      </div>
      {tab==='video'&&<div style={{ position:'relative', paddingBottom:'56.25%', borderRadius:12, overflow:'hidden', background:'#000' }}>
        <iframe src={`https://www.youtube.com/embed/${vidId}?rel=0&modestbranding=1`} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }} allowFullScreen/>
      </div>}
      {tab==='notes'&&(notes?<ContentBox content={notes} label={title} downloadName="video-notes.txt" onDownload={()=>downloadText(notes,'video-notes.txt')}/>:<div style={{ padding:24, textAlign:'center', color:'var(--text)' }}>{gen?<><PageSpinner/><p style={{ marginTop:10 }}>Generating notes…</p></>:<p>Notes unavailable.</p>}</div>)}
      {tab==='quiz'&&(!quiz||quiz.length===0?<div style={{ padding:24, textAlign:'center', color:'var(--text)' }}>{gen?<PageSpinner/>:<p>Quiz not generated yet.</p>}</div>:
        done?(<div><div style={{ textAlign:'center', padding:22, background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:14, marginBottom:14 }}><div style={{ fontFamily:"'Sora',sans-serif", fontSize:24, fontWeight:900, color:'var(--accent)' }}>{score}/{quiz.length}</div><div style={{ color:'var(--text)', fontSize:13 }}>{Math.round(score/quiz.length*100)}% correct</div></div><OutlineBtn small onClick={()=>{setAns({});setDone(false)}}>Retake →</OutlineBtn></div>):
        (<div>{quiz.map((q,i)=>(<Card key={i} style={{marginBottom:10}}><p style={{fontWeight:700,fontSize:14,color:'var(--text-h)',margin:'0 0 10px'}}><span style={{color:'var(--accent)'}}>Q{i+1}.</span> {q.q}</p><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>{q.opts.map((o,j)=><button key={j} onClick={()=>setAns(a=>({...a,[i]:j}))} style={{padding:'8px 12px',borderRadius:9,border:`1.5px solid ${ans[i]===j?'var(--accent)':'var(--border)'}`,background:ans[i]===j?'var(--accent-bg)':'var(--code-bg)',color:ans[i]===j?'var(--accent)':'var(--text-h)',cursor:'pointer',textAlign:'left',fontSize:13.5,fontFamily:"'Nunito',sans-serif",fontWeight:600}}>{String.fromCharCode(65+j)}. {o}</button>)}</div></Card>))}{Object.keys(ans).length===quiz.length&&<PrimaryBtn onClick={()=>{let s=0;quiz.forEach((q,i)=>{if(ans[i]===q.ans)s++});setScore(s);setDone(true)}}>Submit →</PrimaryBtn>}</div>)
      )}
      <ErrMsg msg={err}/>
    </div>
  )
  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", maxWidth:700, margin:'0 auto' }}>
      <PageHeader icon="🎬" title="Video Learning" subtitle="Paste any YouTube URL → AI generates notes, Q&A and quiz" color="#06b6d4"/>
      <Card style={{ marginBottom:16 }}>
        <Field label="Search a topic or enter YouTube URL">
          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
            <BSInput value={query} onChange={setQuery} placeholder="e.g. Photosynthesis Class 10 CBSE" style={{ flex:1 }}/>
            <PrimaryBtn onClick={()=>query&&load(query,query)} gradient="linear-gradient(135deg,#06b6d4,#6366F1)">Search</PrimaryBtn>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <BSInput value={urlIn} onChange={setUrlIn} placeholder="https://youtube.com/watch?v=..." style={{ flex:1 }}/>
            <OutlineBtn onClick={()=>urlIn&&load(urlIn)} color="#06b6d4">Load →</OutlineBtn>
          </div>
        </Field>
      </Card>
      <Label>Suggested Topics</Label>
      <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginTop:7 }}>
        {SUGG.map(s=><button key={s} onClick={()=>{setQuery(s);load(s,s)}} style={{ padding:'5px 12px', borderRadius:20, border:'1.5px solid var(--accent-border)', background:'var(--accent-bg)', color:'var(--accent)', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>{s}</button>)}
      </div>
    </div>
  )
}
