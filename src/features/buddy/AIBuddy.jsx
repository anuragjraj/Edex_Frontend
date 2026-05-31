import { useState, useEffect, useRef } from 'react'
import { api } from '../../lib/apiClient'
import { T } from '../../theme/tokens'

// ══════════════════════════════════════════════════════════════
//  AI BUDDY FLOATING WIDGET
// ══════════════════════════════════════════════════════════════
export function AIBuddy({ user }) {
  const [open,setOpen]=useState(false); const [messages,setMessages]=useState([{role:'assistant',content:`Hey ${user?.name?.split(' ')[0]}! 👋 I'm your AI study buddy. I know your schedule and school updates. What's on your mind?`}]); const [input,setInput]=useState(''); const [loading,setLoading]=useState(false); const bottomRef=useRef(null)
  useEffect(()=>{ if(open) bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages,open])
  const send=async()=>{
    if(!input.trim()) return
    const userMsg={role:'user',content:input.trim()}; setMessages(m=>[...m,userMsg]); setInput(''); setLoading(true)
    try{
      const r=await api.post('/api/buddy/chat',{message:input.trim(),sessionMessages:messages.slice(-8)})
      setMessages(m=>[...m,{role:'assistant',content:r.content}])
    } catch{ setMessages(m=>[...m,{role:'assistant',content:"I had trouble connecting. Try again! 🔄"}]) }
    setLoading(false)
  }
  return (
    <>
      <div onClick={()=>setOpen(!open)} style={{ position:'fixed', bottom:24, right:24, width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow:'0 4px 20px rgba(99,102,241,.4)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:1000, fontSize:22, transition:'transform .2s' }}
        onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
        {open?'✕':'🤖'}
      </div>
      {open&&(
        <div style={{ position:'fixed', bottom:88, right:24, width:320, height:460, borderRadius:18, background:'var(--bg2)', border:'1px solid var(--accent-border)', boxShadow:'0 20px 60px rgba(0,0,0,.5)', display:'flex', flexDirection:'column', zIndex:999, overflow:'hidden', fontFamily:"'Nunito',sans-serif" }}>
          <div style={{ padding:'12px 16px', background:'linear-gradient(135deg,#4338ca,#6366F1)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>🤖</div>
            <div><div style={{ fontWeight:800, color:'#fff', fontSize:14 }}>AI Buddy</div><div style={{ fontSize:11, color:'rgba(255,255,255,.7)' }}>Your personal study companion</div></div>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8 }}>
            {messages.map((m,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
                <div style={{ maxWidth:'86%', padding:'8px 12px', borderRadius:m.role==='user'?'12px 3px 12px 12px':'3px 12px 12px 12px', background:m.role==='user'?'var(--accent)':'var(--code-bg)', color:m.role==='user'?'#fff':'var(--text-h)', fontSize:13, lineHeight:1.6, border:m.role==='assistant'?'1px solid var(--border)':'none' }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading&&<div style={{ display:'flex', gap:4, padding:'8px 12px', background:'var(--code-bg)', borderRadius:'3px 12px 12px 12px', width:'fit-content', border:'1px solid var(--border)' }}>{[0,1,2].map(j=><div key={j} style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', animation:`dotBounce 1s ${j*.2}s infinite` }}/>)}</div>}
            <div ref={bottomRef}/>
          </div>
          <div style={{ padding:10, borderTop:'1px solid var(--border)', display:'flex', gap:6 }}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask me anything..." disabled={loading} style={{ flex:1, ...T.input, fontSize:13 }}/>
            <button onClick={send} disabled={loading||!input.trim()} style={{ padding:'8px 12px', borderRadius:10, border:'none', background:'var(--accent)', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13 }}>→</button>
          </div>
        </div>
      )}
    </>
  )
}
