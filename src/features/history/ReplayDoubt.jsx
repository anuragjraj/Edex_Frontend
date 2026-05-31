export function ReplayDoubt({ session }) {
  const messages = Array.isArray(session.content) ? session.content : []
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {messages.filter(m=>m.role!=='system').map((m,i)=>(
        <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', alignItems:'flex-start', gap:10 }}>
          {m.role==='assistant'&&<div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:16, marginTop:2 }}>🧠</div>}
          <div style={{ maxWidth:'78%', padding:'11px 15px', borderRadius:m.role==='user'?'14px 4px 14px 14px':'4px 14px 14px 14px', fontSize:14, lineHeight:1.75, background:m.role==='user'?'linear-gradient(135deg,#6366F1,#8B5CF6)':'var(--code-bg)', color:m.role==='user'?'#fff':'var(--text-h)', border:m.role==='assistant'?'1px solid var(--border)':'none' }}
            dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>') }}
          />
        </div>
      ))}
    </div>
  )
}
