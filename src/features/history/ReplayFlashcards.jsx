import { useState } from 'react'
import { GhostBtn, PrimaryBtn } from '../../components/ui/Button'
import { Card } from '../../components/ui/Layout'

export function ReplayFlashcards({ session }) {
  const cards   = Array.isArray(session.content) ? session.content : (session.content?.cards||[])
  const [flipped, setFlipped] = useState({})
  const [mode, setMode]       = useState('grid')
  const [cur, setCur]         = useState(0)
  const card = cards[cur]
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <h3 style={{ margin:0, fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:16, color:'var(--text-h)' }}>{session.chapter} — {cards.length} Cards</h3>
        <div style={{ display:'flex', gap:7 }}>
          {[['grid','⊞ Grid'],['study','▶ Study']].map(([m,l])=>(
            <button key={m} onClick={()=>setMode(m)} style={{ padding:'6px 14px', borderRadius:8, border:'none', fontWeight:700, fontSize:12.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:mode===m?'#EF4444':'var(--social-bg)', color:mode===m?'#fff':'var(--text-h)' }}>{l}</button>
          ))}
        </div>
      </div>
      {mode==='grid'?(
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:14 }}>
          {cards.map((c,i)=>(
            <div key={i} onClick={()=>setFlipped(f=>({...f,[i]:!f[i]}))} style={{ height:130, borderRadius:14, cursor:'pointer', perspective:1000 }}>
              <div style={{ width:'100%', height:'100%', position:'relative', transformStyle:'preserve-3d', transition:'transform .5s', transform:flipped[i]?'rotateY(180deg)':'none' }}>
                <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', background:'linear-gradient(135deg,#EF4444,#F97316)', borderRadius:14, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:14, textAlign:'center' }}><span style={{ fontSize:9, color:'rgba(255,255,255,.7)', fontWeight:800, marginBottom:7, letterSpacing:1 }}>TAP TO REVEAL</span><span style={{ color:'#fff', fontWeight:800, fontSize:13.5, lineHeight:1.4 }}>{c.front}</span></div>
                <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', transform:'rotateY(180deg)', background:'var(--bg2)', borderRadius:14, border:'2px solid #EF4444', display:'flex', alignItems:'center', justifyContent:'center', padding:14, textAlign:'center' }}><span style={{ color:'var(--text-h)', fontWeight:700, fontSize:13, lineHeight:1.5 }}>{c.back}</span></div>
              </div>
            </div>
          ))}
        </div>
      ):(
        <Card style={{ textAlign:'center', maxWidth:560, margin:'0 auto' }}>
          <div style={{ fontSize:12, color:'var(--text)', marginBottom:8, fontWeight:700 }}>Card {cur+1} of {cards.length}</div>
          <div style={{ background:'var(--border)', borderRadius:999, height:5, margin:'0 auto 18px', maxWidth:240 }}><div style={{ background:'#EF4444', width:`${((cur+1)/cards.length)*100}%`, height:'100%', borderRadius:999 }}/></div>
          <div onClick={()=>setFlipped(f=>({...f,[cur]:!f[cur]}))} style={{ height:180, background:flipped[cur]?'var(--code-bg)':'linear-gradient(135deg,#EF4444,#F97316)', borderRadius:14, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', border:flipped[cur]?'2px solid #EF4444':'none', marginBottom:18, padding:24 }}>
            <span style={{ fontSize:10, color:flipped[cur]?'var(--text)':'rgba(255,255,255,.7)', fontWeight:800, letterSpacing:1, marginBottom:10 }}>{flipped[cur]?'ANSWER':'TERM — TAP TO FLIP'}</span>
            <span style={{ color:flipped[cur]?'var(--text-h)':'#fff', fontWeight:800, fontSize:16, lineHeight:1.5 }}>{flipped[cur]?card?.back:card?.front}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'center', gap:12 }}>
            <GhostBtn disabled={cur===0} onClick={()=>{setCur(c=>c-1);setFlipped({})}}>← Prev</GhostBtn>
            <PrimaryBtn color='#EF4444' onClick={()=>setFlipped(f=>({...f,[cur]:!f[cur]}))}>Flip</PrimaryBtn>
            <GhostBtn disabled={cur===cards.length-1} onClick={()=>{setCur(c=>c+1);setFlipped({})}}>Next →</GhostBtn>
          </div>
        </Card>
      )}
    </div>
  )
}
