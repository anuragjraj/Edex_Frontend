import { useState, useEffect, useCallback } from 'react'
import { GhostBtn } from '../../components/ui/Button'
import { PageSpinner, Spinner } from '../../components/ui/Feedback'
import { PageHeader } from '../../components/ui/Layout'
import { HistorySessionView } from './HistorySessionView'
import { api } from '../../lib/apiClient'
import { findSessionForActivity, listAllSessions } from '../../lib/sessions'

// ══════════════════════════════════════════════════════════════
//  HISTORY PAGE  (Coursera-style grid)
// ══════════════════════════════════════════════════════════════
export function HistoryPage({ onNavigate }) {
  const TOOL_META_H = {
    doubt:      { icon:'🤔', label:'Doubt',        color:'#818CF8' },
    notes:      { icon:'📖', label:'Notes',         color:'#10B981' },
    quiz:       { icon:'🎯', label:'Quiz',          color:'#F59E0B' },
    paper:      { icon:'📄', label:'Paper',         color:'#A855F7' },
    flashcards: { icon:'🃏', label:'Flashcards',    color:'#EF4444' },
    cheatsheet: { icon:'📋', label:'Cheat Sheet',   color:'#F97316' },
    lessonplan: { icon:'🎓', label:'Lesson Plan',   color:'#7C3AED' },
    courses:    { icon:'📚', label:'Course Module', color:'#8B5CF6' },
  }

  const [history,  setHistory]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [hasMore,  setHasMore]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [selected, setSelected] = useState(null)   // { item, session }
  const [sessions, setSessions] = useState([])

  useEffect(() => { setSessions(listAllSessions()) }, [])

  useEffect(() => {
    setLoading(true)
    api.get(`/api/user/history?page=${page}`)
      .then(data => {
        setHistory(prev => page===1 ? data : [...prev, ...data])
        setHasMore(data.length === 50)
      })
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }, [page])

  const shown   = filter==='all' ? history : history.filter(h=>h.tool===filter)
  const grouped = shown.reduce((acc,item) => {
    const key = new Date(item.created_at).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const hasSessionFor = useCallback(item =>
    sessions.some(s =>
      s.tool===item.tool && s.subject===item.subject &&
      (s.chapter===item.chapter || (item.chapters||[]).some(c=>s.chapter===c||(s.chapters||[]).includes(c))) &&
      Math.abs(new Date(s.savedAt)-new Date(item.created_at)) < 2*60*60*1000
    ), [sessions])

  const openItem = useCallback(item => {
    const sess = findSessionForActivity(item)
    setSelected({ item, session:sess })
  }, [])

  const tools = ['all', ...Object.keys(TOOL_META_H)]

  function HistoryCard({ item }) {
    const meta = TOOL_META_H[item.tool] || { icon:'⚡', label:item.tool, color:'#6366F1' }
    const [hov, setHov] = useState(false)
    const chapter = item.chapter || (item.chapters||[])[0] || ''
    return (
      <div
        onClick={()=>openItem(item)}
        onMouseEnter={()=>setHov(true)}
        onMouseLeave={()=>setHov(false)}
        style={{
          position:'relative', width:'100%', aspectRatio:'1 / 1.1',
          borderRadius:16, cursor:'pointer', padding:'14px 12px 12px',
          display:'flex', flexDirection:'column', justifyContent:'space-between',
          background: hov ? `${meta.color}14` : 'rgba(255,255,255,.025)',
          border: `1.5px solid ${hov ? meta.color+'55' : 'rgba(255,255,255,.07)'}`,
          transition:'all .18s ease',
          transform: hov ? 'translateY(-3px)' : 'none',
          boxShadow: hov ? `0 8px 28px ${meta.color}20` : 'none',
          fontFamily:"'Nunito',sans-serif", overflow:'hidden',
        }}
      >
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${meta.color},transparent)`, borderRadius:'16px 16px 0 0', opacity:hov?1:0, transition:'opacity .18s' }}/>
        {hasSessionFor(item) && <div style={{ position:'absolute', top:9, right:9, width:7, height:7, borderRadius:'50%', background:meta.color, boxShadow:`0 0 7px ${meta.color}` }}/>}
        <div style={{ width:42, height:42, borderRadius:11, background:`${meta.color}18`, border:`1px solid ${meta.color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:21, flexShrink:0, marginBottom:7 }}>{meta.icon}</div>
        <div style={{ flex:1, minHeight:0 }}>
          <div style={{ fontSize:10.5, fontWeight:800, color:meta.color, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3 }}>{meta.label}</div>
          {item.subject && <div style={{ fontSize:12.5, fontWeight:700, color:'var(--text-h)', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.subject}</div>}
          {chapter && <div style={{ fontSize:11, color:'var(--text)', lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{chapter}</div>}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8, paddingTop:8, borderTop:'1px solid rgba(255,255,255,.05)' }}>
          <span style={{ fontSize:10, color:'#475569' }}>{(() => { const diff=(Date.now()-new Date(item.created_at))/1000; if(diff<3600) return `${Math.floor(diff/60)}m ago`; if(diff<86400) return `${Math.floor(diff/3600)}h ago`; return new Date(item.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) })()}</span>
          {item.xp_earned>0 && <span style={{ fontSize:10, fontWeight:800, color:'#FCD34D', background:'rgba(252,211,77,.08)', borderRadius:20, padding:'1px 7px' }}>+{item.xp_earned}</span>}
        </div>
        <div style={{ position:'absolute', bottom:10, right:10, fontSize:13, color:meta.color, opacity:hov?1:0, transition:'opacity .15s' }}>→</div>
      </div>
    )
  }

  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <PageHeader icon="🕘" title="Activity History" subtitle="Tap any card to replay the full session" color="#6366F1"/>

      {/* Filter pills */}
      <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:20 }}>
        {tools.map(t => {
          const meta = TOOL_META_H[t]
          return (
            <button key={t} onClick={()=>setFilter(t)} style={{ padding:'5px 14px', borderRadius:20, border:'none', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:filter===t?(meta?.color||'#6366F1'):'var(--social-bg)', color:filter===t?'#fff':'var(--text-h)', transition:'all .15s', display:'flex', alignItems:'center', gap:4 }}>
              {meta ? `${meta.icon} ${meta.label}` : '⚡ All'}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:22, padding:'9px 14px', background:'rgba(255,255,255,.02)', borderRadius:10, border:'1px solid rgba(255,255,255,.05)', fontSize:12, color:'var(--text)', flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:7, height:7, borderRadius:'50%', background:'#6366F1', boxShadow:'0 0 6px #6366F1' }}/> Glowing dot = full session saved (tap to replay)</div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:7, height:7, borderRadius:'50%', background:'rgba(255,255,255,.15)' }}/> No dot = metadata only (older sessions)</div>
      </div>

      {loading && page===1 && <PageSpinner/>}
      {!loading && shown.length===0 && (
        <div style={{ textAlign:'center', padding:60, color:'var(--text)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🕘</div>
          <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:16, color:'var(--text-h)', marginBottom:6 }}>No history yet</div>
          <p style={{ fontSize:13 }}>Start using AI tools and every session will appear here.</p>
        </div>
      )}

      {/* Grouped grids */}
      {Object.entries(grouped).map(([date,items]) => (
        <div key={date} style={{ marginBottom:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={{ height:1, width:14, background:'var(--border)' }}/>
            <span style={{ fontSize:11, fontWeight:800, color:'var(--text)', textTransform:'uppercase', letterSpacing:'.6px', whiteSpace:'nowrap' }}>{date}</span>
            <div style={{ height:1, flex:1, background:'var(--border)' }}/>
            <span style={{ fontSize:11, color:'#1e293b', fontWeight:700 }}>{items.length} session{items.length!==1?'s':''}</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))', gap:12 }}>
            {items.map((item,i) => <HistoryCard key={item.id||i} item={item}/>)}
          </div>
        </div>
      ))}

      {hasMore && !loading && shown.length>0 && (
        <div style={{ textAlign:'center', marginTop:16 }}>
          <GhostBtn onClick={()=>setPage(p=>p+1)}>Load More</GhostBtn>
        </div>
      )}
      {loading && page>1 && <div style={{ display:'flex', justifyContent:'center', padding:16 }}><Spinner size={22}/></div>}

      {selected && <HistorySessionView item={selected.item} session={selected.session} onClose={()=>setSelected(null)}/>}
    </div>
  )
}
