import { Tag } from './ui/Badge'
import { GhostBtn } from './ui/Button'
import { getChapters } from '../constants/subjects'

export function ChapterSelector({ subject, cls, selected, onChange, max=20 }) {
  const chapters = getChapters(subject, cls)
  const toggle = (ch) => {
    if (selected.includes(ch)) onChange(selected.filter(c=>c!==ch))
    else if (selected.length < max) onChange([...selected, ch])
  }
  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap', alignItems:'center' }}>
        <GhostBtn small onClick={()=>onChange(chapters)}>Select All</GhostBtn>
        {selected.length>0 && <GhostBtn small onClick={()=>onChange([])}>Clear</GhostBtn>}
        <span style={{ fontSize:12, color:'var(--text)', fontFamily:"'Nunito', sans-serif" }}>{selected.length} selected</span>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {chapters.map(ch=>{
          const sel = selected.includes(ch)
          return (
            <span key={ch} onClick={()=>toggle(ch)}
              style={{ padding:'5px 13px', borderRadius:20, fontSize:12, cursor:'pointer', fontWeight:700, fontFamily:"'Nunito', sans-serif",
                background:sel?'var(--accent)':'var(--accent-bg)', color:sel?'#fff':'var(--accent)',
                border:`1px solid ${sel?'var(--accent)':'var(--accent-border)'}`, transition:'all .15s' }}>
              {ch}
            </span>
          )
        })}
      </div>
      {selected.length>0 && (
        <div style={{ marginTop:10, display:'flex', flexWrap:'wrap', gap:5 }}>
          <span style={{ fontSize:12, color:'var(--text)', alignSelf:'center', fontFamily:"'Nunito', sans-serif" }}>Selected: </span>
          {selected.map(ch=><Tag key={ch} label={ch} onRemove={()=>toggle(ch)}/>)}
        </div>
      )}
    </div>
  )
}
