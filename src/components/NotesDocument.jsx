import { downloadNotesAsPDF } from '../utils/pdf'
import { printContent } from '../utils/print'

export function NotesDocument({ content, title, onDownload }) {
  const lines = (content || '').split('\n')

  const rendered = lines.map((line, i) => {
    if (line.startsWith('# '))
      return <h2 key={i} style={{ fontFamily:"'Lora',Georgia,serif", fontSize:'clamp(20px,3vw,26px)', fontWeight:700, color:'#1a1a2e', margin:'32px 0 12px', paddingBottom:10, borderBottom:'2px solid #e8e6ff' }}>{line.slice(2)}</h2>
    if (line.startsWith('## '))
      return <h3 key={i} style={{ fontFamily:"'Lora',Georgia,serif", fontSize:'clamp(16px,2vw,20px)', fontWeight:700, color:'#3730a3', margin:'24px 0 8px' }}>{line.slice(3)}</h3>
    if (line.startsWith('### '))
      return <h4 key={i} style={{ fontSize:15, fontWeight:700, color:'#1e293b', margin:'18px 0 6px', paddingLeft:12, borderLeft:'3px solid #818cf8' }}>{line.slice(4)}</h4>
    if (line.startsWith('- ') || line.startsWith('• '))
      return <div key={i} style={{ display:'flex', gap:10, marginBottom:5, paddingLeft:8 }}><span style={{ color:'#818cf8', flexShrink:0, fontWeight:800, marginTop:1 }}>•</span><span style={{ color:'#374151', fontSize:14.5, lineHeight:1.75 }}>{line.slice(2)}</span></div>
    if (/^\d+\./.test(line))
      return <div key={i} style={{ display:'flex', gap:10, marginBottom:5, paddingLeft:8 }}><span style={{ color:'#818cf8', flexShrink:0, fontWeight:800, minWidth:22, fontSize:13 }}>{line.match(/^\d+/)[0]}.</span><span style={{ color:'#374151', fontSize:14.5, lineHeight:1.75 }}>{line.replace(/^\d+\.\s*/,'')}</span></div>
    if (line.startsWith('---') || line.startsWith('═══'))
      return <hr key={i} style={{ border:'none', borderTop:'1px solid #e2e8f0', margin:'20px 0' }}/>
    if (line.startsWith('📝'))
      return <div key={i} style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'8px 14px', margin:'10px 0', fontSize:13.5, color:'#1d4ed8', fontWeight:600 }}>{line}</div>
    if (line.trim() === '')
      return <div key={i} style={{ height:8 }}/>
    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1a1a2e;font-weight:700">$1</strong>')
    return <p key={i} style={{ color:'#374151', fontSize:14.5, lineHeight:1.8, marginBottom:6 }} dangerouslySetInnerHTML={{ __html: bold }}/>
  })

  return (
    <>
      {/* Load Lora font for the document */}
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet"/>

      {/* Outer wrapper — parchment/grey background like image 2 */}
      <div style={{ background:'#f0efe9', borderRadius:14, padding:'20px 16px', marginTop:20 }}>

        {/* Toolbar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:'#ef4444' }}/>
            <div style={{ width:10, height:10, borderRadius:'50%', background:'#f59e0b' }}/>
            <div style={{ width:10, height:10, borderRadius:'50%', background:'#22c55e' }}/>
            <span style={{ fontSize:12, color:'#94a3b8', marginLeft:6, fontFamily:"'Source Sans 3',sans-serif" }}>{title}</span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>downloadNotesAsPDF(content, title)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:8, border:'1px solid #d1d5db', background:'#ffffff', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Source Sans 3',sans-serif", boxShadow:'0 1px 3px rgba(0,0,0,.08)' }}>
              ⬇ Download PDF
            </button>
            <button onClick={()=>printContent(content, title)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:8, border:'none', background:'#3730a3', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Source Sans 3',sans-serif" }}>
              🖨 Print / Save PDF
            </button>
          </div>
        </div>

        {/* The white document paper */}
        <div style={{ background:'#ffffff', borderRadius:10, padding:'clamp(28px,5vw,64px) clamp(20px,6vw,72px)', boxShadow:'0 4px 24px rgba(0,0,0,0.10)', maxHeight:'72vh', overflowY:'auto' }}>

          {/* Document header */}
          <div style={{ borderBottom:'3px solid #3730a3', paddingBottom:20, marginBottom:32 }}>
            <h1 style={{ fontFamily:"'Lora',Georgia,serif", fontSize:'clamp(22px,4vw,32px)', fontWeight:700, color:'#1a1a2e', lineHeight:1.25, margin:'0 0 10px' }}>
              {title.replace(' Notes — ','').replace(' Notes','')}
            </h1>
            <div style={{ fontSize:13, color:'#64748b', fontWeight:600, fontFamily:"'Source Sans 3',sans-serif" }}>
              {title.includes('—') && <span style={{ color:'#3730a3' }}>{title.split('—')[1]?.trim()}</span>}
              {' · '}CBSE 2024-25
            </div>
          </div>

          {/* Content */}
          <div style={{ fontFamily:"'Source Sans 3','Georgia',sans-serif" }}>
            {rendered}
          </div>

        </div>
      </div>
    </>
  )
}
