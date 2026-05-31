import { useEffect } from 'react'
import { NotesDocument } from '../../components/NotesDocument'
import { QPaperDocument } from '../../components/QPaperDocument'
import { ReplayDoubt } from './ReplayDoubt'
import { ReplayFlashcards } from './ReplayFlashcards'
import { ReplayQuiz } from './ReplayQuiz'
import { downloadText } from '../../utils/download'

// ══════════════════════════════════════════════════════════════
//  HISTORY SESSION VIEW  (full-screen modal)
// ══════════════════════════════════════════════════════════════
export function HistorySessionView({ item, session, onClose }) {
  const TOOL_META_LOCAL = {
    doubt:      { icon:'🤔', label:'Doubt',        color:'#818CF8', bg:'rgba(129,140,248,.13)' },
    notes:      { icon:'📖', label:'Notes',         color:'#10B981', bg:'rgba(16,185,129,.13)'  },
    quiz:       { icon:'🎯', label:'Quiz',          color:'#F59E0B', bg:'rgba(245,158,11,.13)'  },
    paper:      { icon:'📄', label:'Paper',         color:'#A855F7', bg:'rgba(168,85,247,.13)'  },
    flashcards: { icon:'🃏', label:'Flashcards',    color:'#EF4444', bg:'rgba(239,68,68,.13)'   },
    cheatsheet: { icon:'📋', label:'Cheat Sheet',   color:'#F97316', bg:'rgba(249,115,22,.13)'  },
    lessonplan: { icon:'🎓', label:'Lesson Plan',   color:'#7C3AED', bg:'rgba(124,58,237,.13)'  },
    courses:    { icon:'📚', label:'Course Module', color:'#8B5CF6', bg:'rgba(139,92,246,.13)'  },
  }
  const meta    = TOOL_META_LOCAL[item?.tool] || { icon:'⚡', label:item?.tool, color:'#6366F1', bg:'rgba(99,102,241,.13)' }
  const chapter = session?.chapter || item?.chapter || (item?.chapters||[])[0] || ''

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  // ── Render content using EXISTING app components ─────────
  function renderContent() {
    if (!session?.content) return null
    const { tool, content, subject, chapter: ch, classLevel } = session

    if (tool === 'notes' || tool === 'cheatsheet' || tool === 'lessonplan') {
      return (
        <NotesDocument
          content={content}
          title={`${ch || subject} Notes — ${subject} ${classLevel}`}
          onDownload={() => downloadText(content, `${ch}-notes.txt`)}
        />
      )
    }

    if (tool === 'paper') {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content
      return (
        <QPaperDocument
          paper={parsed}
          onPaperChange={() => {}}
          schoolName={session.extra?.schoolName || ''}
          onSchoolNameChange={() => {}}
        />
      )
    }

    if (tool === 'quiz') {
      return <ReplayQuiz session={session}/>
    }

    if (tool === 'flashcards') {
      return <ReplayFlashcards session={session}/>
    }

    if (tool === 'doubt') {
      return <ReplayDoubt session={session}/>
    }

    return null
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(5,5,14,.94)', backdropFilter:'blur(14px)', overflowY:'auto' }}>
      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:10, background:'rgba(11,11,30,.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,.07)', padding:'12px 24px', display:'flex', alignItems:'center', gap:14 }}>
        <button onClick={onClose} style={{ width:36, height:36, borderRadius:10, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.05)', color:'#e2e8f0', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Nunito',sans-serif" }}>←</button>
        <div style={{ width:36, height:36, borderRadius:10, background:meta.bg, border:`1px solid ${meta.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{meta.icon}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:15, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {meta.label}: {chapter || item?.subject}
          </div>
          <div style={{ fontSize:11.5, color:'#64748b' }}>
            {item?.subject} {session?.classLevel ? `· ${session.classLevel}` : ''} · {new Date(item?.created_at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}
            {!session && <span style={{ color:'#F59E0B', marginLeft:8 }}>⚠ No saved content for this session</span>}
          </div>
        </div>
        <div style={{ fontSize:11, fontWeight:700, color:meta.color, background:meta.bg, borderRadius:20, padding:'3px 12px', border:`1px solid ${meta.color}33`, flexShrink:0 }}>
          {session ? '📂 Session Replay' : '📋 Activity Record'}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:920, margin:'0 auto', padding:'28px 24px 60px' }}>
        {session ? renderContent() || (
          <div style={{ padding:32, textAlign:'center', color:'var(--text)' }}>Content type not supported for replay yet.</div>
        ) : (
          <div style={{ textAlign:'center', padding:'60px 24px', background:'rgba(255,255,255,.02)', borderRadius:16, border:'1px solid rgba(255,255,255,.07)' }}>
            <div style={{ fontSize:52, marginBottom:14 }}>{meta.icon}</div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:18, color:'#e2e8f0', marginBottom:8 }}>No saved content</div>
            <p style={{ fontSize:13.5, color:'#64748b', maxWidth:360, margin:'0 auto 24px', lineHeight:1.7 }}>
              Content is now auto-saved after every generation. Older records show your stats only.
            </p>
            <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
              <div style={{ padding:'10px 18px', borderRadius:10, background:meta.bg, border:`1px solid ${meta.color}33`, fontSize:13, color:meta.color, fontWeight:700 }}>
                📅 {new Date(item?.created_at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}
              </div>
              {item?.xp_earned > 0 && <div style={{ padding:'10px 18px', borderRadius:10, background:'rgba(252,211,77,.08)', border:'1px solid rgba(252,211,77,.2)', fontSize:13, color:'#FCD34D', fontWeight:700 }}>⚡ +{item.xp_earned} XP earned</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
