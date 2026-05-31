import { useState, useEffect, useRef } from 'react'
import { MediaUploader } from '../../components/MediaUploader'
import { PrimaryBtn } from '../../components/ui/Button'
import { useIsMobile } from '../../hooks/useIsMobile'
import { api } from '../../lib/apiClient'
import { T } from '../../theme/tokens'

// ══════════════════════════════════════════════════════════════
//  MESSAGING PAGE
// ══════════════════════════════════════════════════════════════
export function MessagingPage({ currentUser, startWithUserId }) {
  const [convs,setConvs]=useState([]); const [active,setActive]=useState(null); const [msgs,setMsgs]=useState([]); const [input,setInput]=useState(''); const [media,setMedia]=useState(null); const [sending,setSending]=useState(false); const [loading,setLoading]=useState(true)
  const bottomRef=useRef(null); const isMobile=useIsMobile()

  useEffect(()=>{
    api.get('/api/conversations').then(d=>{setConvs(d);setLoading(false)}).catch(()=>setLoading(false))
  },[])

  useEffect(()=>{
    if(startWithUserId){ startConversation(startWithUserId) }
  },[startWithUserId])

  useEffect(()=>{
    if(!active) return
    api.get(`/api/conversations/${active.id}/messages`).then(setMsgs).catch(()=>{})
  },[active])

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[msgs])

  const startConversation=async(receiverId)=>{
    try{ const conv=await api.post('/api/conversations',{receiverId}); setActive(conv); api.get('/api/conversations').then(setConvs) }
    catch(e){ alert(e.message) }
  }

  const send=async()=>{
    if(!input.trim()&&!media) return; setSending(true)
    try{
      const msg=await api.post(`/api/conversations/${active.id}/messages`,{content:input.trim(),media_url:media?.url,media_type:media?.type})
      setMsgs(m=>[...m,msg]); setInput(''); setMedia(null)
      setConvs(c=>c.map(x=>x.id===active.id?{...x,last_message:input.slice(0,60),last_message_at:new Date().toISOString()}:x))
    } catch(e){ alert(e.message) }
    setSending(false)
  }

  return (
    <div style={{ display:'flex', height:'calc(100vh - 120px)', fontFamily:"'Nunito',sans-serif" }}>
      {(!isMobile||!active)&&(
        <div style={{ width:isMobile?'100%':280, borderRight:'1px solid var(--border)', overflowY:'auto', flexShrink:0 }}>
          <div style={{ padding:'16px 16px 10px', fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:16, color:'var(--text-h)', borderBottom:'1px solid var(--border)' }}>💬 Messages</div>
          {loading&&<div style={{ padding:20, textAlign:'center', color:'var(--text)' }}>Loading...</div>}
          {convs.map(c=>(
            <div key={c.id} onClick={()=>setActive(c)} style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer', background:active?.id===c.id?'var(--accent-bg)':'transparent', transition:'background .15s' }}>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:900, color:'#fff', flexShrink:0 }}>{c.other?.name?.[0]||'?'}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13.5, color:'var(--text-h)' }}>{c.other?.name||'Unknown'}</div>
                  <div style={{ fontSize:11.5, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.last_message||'No messages yet'}</div>
                </div>
              </div>
            </div>
          ))}
          {!loading&&convs.length===0&&<div style={{ padding:24, textAlign:'center', color:'var(--text)', fontSize:13 }}>No conversations yet. Visit a profile to start a chat.</div>}
        </div>
      )}
      {active?(
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
            {isMobile&&<button onClick={()=>setActive(null)} style={{ background:'none', border:'none', color:'var(--text)', cursor:'pointer', fontSize:18 }}>←</button>}
            <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, color:'#fff' }}>{active.other?.name?.[0]||'?'}</div>
            <div>
              <div style={{ fontWeight:700, color:'var(--text-h)', fontSize:15 }}>{active.other?.name||'Chat'}</div>
              <div style={{ fontSize:11.5, color:'var(--text)' }}>{active.other?.role} {active.other?.class_level?`· ${active.other.class_level}`:''}</div>
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:8 }}>
            {msgs.map(m=>{
              const isMe=m.sender_id===currentUser.id
              return (
                <div key={m.id} style={{ display:'flex', justifyContent:isMe?'flex-end':'flex-start' }}>
                  <div style={{ maxWidth:'72%', padding:'10px 14px', borderRadius:isMe?'14px 4px 14px 14px':'4px 14px 14px 14px', background:isMe?'linear-gradient(135deg,#6366F1,#8B5CF6)':'var(--bg2)', color:isMe?'#fff':'var(--text-h)', border:isMe?'none':'1px solid var(--border)', fontSize:14, lineHeight:1.6 }}>
                    {m.media_url&&m.media_type==='image'&&<img src={m.media_url} style={{ width:'100%', borderRadius:8, marginBottom:6, maxHeight:200, objectFit:'cover' }} alt=""/>}
                    {m.content&&<div>{m.content}</div>}
                    <div style={{ fontSize:9.5, opacity:.6, marginTop:4, textAlign:'right' }}>{new Date(m.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef}/>
          </div>
          {media?.url&&<div style={{ padding:'0 12px 6px', display:'flex', gap:6 }}><img src={media.url} style={{ height:44, borderRadius:6 }} alt=""/><button onClick={()=>setMedia(null)} style={{ background:'none', border:'none', color:'var(--text)', cursor:'pointer' }}>✕</button></div>}
          <div style={{ padding:12, borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
            <MediaUploader accept="image/*" label="📷" small onUpload={(url,type)=>setMedia({url,type})} onClear={()=>setMedia(null)} current={null}/>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder="Type a message..." style={{ flex:1, ...T.input, fontSize:14 }}/>
            <PrimaryBtn onClick={send} disabled={sending||(!input.trim()&&!media)} small>Send</PrimaryBtn>
          </div>
        </div>
      ):(!isMobile&&<div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text)', flexDirection:'column', gap:12 }}><div style={{ fontSize:48 }}>💬</div><div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:16, color:'var(--text-h)' }}>Select a conversation</div></div>)}
    </div>
  )
}
