import { useState, useEffect } from 'react'
import { MediaUploader } from '../../components/MediaUploader'
import { GhostBtn, PrimaryBtn } from '../../components/ui/Button'
import { ErrMsg, Spinner } from '../../components/ui/Feedback'
import { BSInput, BSSelect, BSTextarea } from '../../components/ui/Input'
import { Label, PageHeader } from '../../components/ui/Layout'
import { GRADS } from '../../constants/levels'
import { SUBJECTS } from '../../constants/subjects'
import { SEED_POSTS } from './seedPosts'
import { api } from '../../lib/apiClient'
import { T } from '../../theme/tokens'
import { timeAgo } from '../../utils/time'

export function SocialFeed({ user }) {
  const [posts,setPosts]=useState(SEED_POSTS); const [composing,setComposing]=useState(false)
  const [draft,setDraft]=useState({body:'',subj:'Mathematics',tags:'',anon:false,media_url:null,media_type:null})
  const [posting,setPosting]=useState(false); const [openCmt,setOpenCmt]=useState(null)
  const [cmtText,setCmtText]=useState(''); const [cmtMedia,setCmtMedia]=useState(null)
  const [liked,setLiked]=useState(new Set()); const [err,setErr]=useState('')

  useEffect(()=>{
    api.get('/api/posts').then(data=>{
      if(data?.length){ const ids=new Set(SEED_POSTS.map(p=>p.id)); const merged=[...SEED_POSTS,...data.filter(p=>!ids.has(p.id))]; merged.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)); setPosts(merged) }
    }).catch(()=>{})
  },[])

  const submitPost=async()=>{
    if(!draft.body.trim()&&!draft.media_url) return; setPosting(true); setErr('')
    try{
      const post=await api.post('/api/posts',{ body:draft.body.trim(), subj:draft.subj, tags:draft.tags.split(',').map(t=>t.trim()).filter(Boolean), anon:draft.anon, grad:draft.anon?'135deg,#374151,#1f2937':GRADS[Math.floor(Math.random()*GRADS.length)], media_url:draft.media_url, media_type:draft.media_type })
      setPosts(p=>[post,...p]); setDraft({body:'',subj:'Mathematics',tags:'',anon:false,media_url:null,media_type:null}); setComposing(false)
    } catch(e){ setErr(e.message) }
    setPosting(false)
  }

  const likePost=async id=>{
    if(liked.has(id)) return; setLiked(p=>new Set([...p,id])); setPosts(p=>p.map(x=>x.id===id?{...x,likes:(x.likes||0)+1}:x)); api.patch(`/api/posts/${id}/like`).catch(()=>{})
  }

  const addComment=async id=>{
    if(!cmtText.trim()&&!cmtMedia) return
    const cmt={id:Date.now(),author_name:user.name,text:cmtText.trim(),media_url:cmtMedia?.url,media_type:cmtMedia?.type,created_at:new Date().toISOString()}
    setPosts(p=>p.map(x=>x.id===id?{...x,rich_comments:[...(x.rich_comments||[]),cmt]}:x))
    setCmtText(''); setCmtMedia(null)
    api.post(`/api/posts/${id}/comment`,{text:cmtText.trim(),media_url:cmtMedia?.url,media_type:cmtMedia?.type}).catch(()=>{})
  }

  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", maxWidth:680, margin:'0 auto' }}>
      <PageHeader icon="📣" title="Study Feed" subtitle="Share achievements, ask questions, post study stories" color="#6366F1"/>

      {/* Compose */}
      {!composing?(
        <div style={{ ...T.card, marginBottom:12, display:'flex', gap:10, alignItems:'center', cursor:'text', padding:'12px 15px' }} onClick={()=>setComposing(true)}>
          <div style={{ width:34, height:34, borderRadius:'50%', background:`linear-gradient(${GRADS[0]})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:900, color:'#fff', flexShrink:0 }}>{user.name[0].toUpperCase()}</div>
          <div style={{ flex:1, padding:'8px 13px', borderRadius:22, background:'var(--code-bg)', border:'1px solid var(--border)', fontSize:13, color:'var(--text)' }}>What's on your study mind, {user.name.split(' ')[0]}? ✨</div>
        </div>
      ):(
        <div style={{ ...T.card, marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:11 }}>
            <div style={{ display:'flex', gap:9, alignItems:'center' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:`linear-gradient(${draft.anon?'135deg,#374151,#1f2937':GRADS[0]})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, color:'#fff' }}>{draft.anon?'?':user.name[0].toUpperCase()}</div>
              <div style={{ fontSize:12.5, fontWeight:700, color:'var(--text-h)' }}>{draft.anon?'Anonymous Student':user.name}</div>
            </div>
            <button onClick={()=>setComposing(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text)', fontSize:18 }}>×</button>
          </div>
          <BSTextarea value={draft.body} onChange={v=>setDraft(d=>({...d,body:v}))} placeholder="Share achievements, study tips, questions..." rows={3} style={{ marginBottom:8 }}/>
          {draft.media_url&&(
            <div style={{ marginBottom:8 }}>
              {draft.media_type==='image'?<img src={draft.media_url} style={{ maxWidth:'100%', maxHeight:180, objectFit:'cover', borderRadius:8, border:'1px solid var(--border)' }} alt=""/>:<div style={{ padding:'6px 12px', background:'var(--accent-bg)', borderRadius:8, fontSize:12.5, color:'var(--accent)', display:'inline-flex', gap:6 }}>📄 PDF attached <span onClick={()=>setDraft(d=>({...d,media_url:null,media_type:null}))} style={{ cursor:'pointer' }}>✕</span></div>}
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:11 }}>
            <div><Label>Subject</Label><BSSelect value={draft.subj} onChange={v=>setDraft(d=>({...d,subj:v}))} options={SUBJECTS}/></div>
            <div><Label>Tags</Label><BSInput value={draft.tags} onChange={v=>setDraft(d=>({...d,tags:v}))} placeholder="Comma separated"/></div>
          </div>
          {err&&<ErrMsg msg={err}/>}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <MediaUploader accept="image/*" label="📷 Photo" small onUpload={(url,type)=>setDraft(d=>({...d,media_url:url,media_type:type}))} onClear={()=>setDraft(d=>({...d,media_url:null,media_type:null}))} current={null}/>
              <label style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer', fontSize:13, color:draft.anon?'var(--accent)':'var(--text)', fontWeight:700 }}>
                <input type="checkbox" checked={draft.anon} onChange={e=>setDraft(d=>({...d,anon:e.target.checked}))} style={{ accentColor:'var(--accent)' }}/>
                👻 Anon
              </label>
            </div>
            <PrimaryBtn onClick={submitPost} disabled={posting||(!draft.body.trim()&&!draft.media_url)} small>{posting?<Spinner size={12}/>:'Post ✦'}</PrimaryBtn>
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.map(post=>(
        <div key={post.id} style={{ ...T.card, marginBottom:11 }}>
          <div style={{ display:'flex', gap:10, marginBottom:10 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(${post.grad||GRADS[0]})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:900, color:'#fff', flexShrink:0 }}>{post.uname[0].toUpperCase()}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text-h)' }}>{post.uname}</span>
                {post.anon&&<span style={{ background:'rgba(100,116,139,.1)', color:'#94a3b8', border:'1px solid rgba(100,116,139,.2)', borderRadius:20, padding:'1px 7px', fontSize:10, fontWeight:700 }}>👻 anon</span>}
                <span style={{ fontSize:10.5, color:'var(--text)' }}>· {timeAgo(post.created_at)}</span>
              </div>
              <div style={{ fontSize:11.5, color:'var(--text)' }}>{post.ucls} · {post.subj}</div>
            </div>
          </div>
          {post.body&&<p style={{ fontSize:13.5, color:'var(--text-h)', lineHeight:1.72, marginBottom:post.media_url?8:10 }}>{post.body}</p>}
          {post.media_url&&post.media_type==='image'&&<img src={post.media_url} style={{ width:'100%', borderRadius:10, marginBottom:10, maxHeight:300, objectFit:'cover' }} alt=""/>}
          {(post.tags||[]).length>0&&<div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>{post.tags.map((t,i)=><span key={i} style={{ fontSize:11.5, color:'var(--accent)', background:'var(--accent-bg)', padding:'2px 8px', borderRadius:20, border:'1px solid var(--accent-border)' }}>#{t}</span>)}</div>}
          <div style={{ display:'flex', gap:7, paddingTop:10, borderTop:'1px solid var(--border)' }}>
            <GhostBtn small onClick={()=>likePost(post.id)} style={{ color:liked.has(post.id)?'#ef4444':'var(--text-h)' }}>{liked.has(post.id)?'❤️':'🤍'} {(post.likes||0)}</GhostBtn>
            <GhostBtn small onClick={()=>setOpenCmt(openCmt===post.id?null:post.id)}>💬 {(post.rich_comments||[]).length}</GhostBtn>
          </div>
          {openCmt===post.id&&(
            <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)' }}>
              {(post.rich_comments||[]).map((c,i)=>(
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--accent-bg)', border:'1px solid var(--accent-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'var(--accent)', flexShrink:0 }}>{c.author_name?.[0]||'?'}</div>
                  <div style={{ flex:1, background:'var(--code-bg)', borderRadius:'4px 12px 12px 12px', padding:'8px 12px', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:11.5, fontWeight:700, color:'var(--accent)', marginBottom:3 }}>{c.author_name}</div>
                    {c.text&&<div style={{ fontSize:13, color:'var(--text-h)', lineHeight:1.5 }}>{c.text}</div>}
                    {c.media_url&&c.media_type==='image'&&<img src={c.media_url} style={{ maxWidth:'100%', maxHeight:120, borderRadius:6, marginTop:4 }} alt=""/>}
                  </div>
                </div>
              ))}
              {cmtMedia?.url&&(
                <div style={{ marginBottom:6 }}>
                  {cmtMedia.type==='image'?<img src={cmtMedia.url} style={{ height:48, borderRadius:6 }} alt=""/>:<div style={{ padding:'3px 8px', background:'var(--accent-bg)', borderRadius:6, fontSize:11.5, color:'var(--accent)', display:'inline-flex', gap:5 }}>📄 <span onClick={()=>setCmtMedia(null)} style={{ cursor:'pointer' }}>✕</span></div>}
                </div>
              )}
              <div style={{ display:'flex', gap:7, alignItems:'center' }}>
                <MediaUploader accept="image/*" label="📷" small onUpload={(url,type)=>setCmtMedia({url,type})} onClear={()=>setCmtMedia(null)} current={null}/>
                <input value={cmtText} onChange={e=>setCmtText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addComment(post.id)} placeholder="Add a comment…" style={{ flex:1, ...T.input, fontSize:13 }}/>
                <PrimaryBtn small onClick={()=>addComment(post.id)} disabled={!cmtText.trim()&&!cmtMedia}>↑</PrimaryBtn>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
