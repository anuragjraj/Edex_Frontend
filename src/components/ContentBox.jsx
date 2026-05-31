import { GhostBtn } from './ui/Button'
import { Card } from './ui/Layout'
import { printContent } from '../utils/print'

export function ContentBox({ content, onDownload, downloadName, label='Generated Content' }) {
  const lines = (content||'').split('\n')
  return (
    <Card style={{ marginTop:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
        <h3 style={{ margin:0, fontSize:15, color:'var(--text-h)', fontFamily:"'Sora', sans-serif", fontWeight:800 }}>{label}</h3>
        <div style={{ display:'flex', gap:8 }}>
          {onDownload && <GhostBtn small onClick={onDownload}>⬇ Download</GhostBtn>}
          <GhostBtn small onClick={()=>printContent(content, downloadName)}>🖨 Print / PDF</GhostBtn>
        </div>
      </div>
      <div style={{ maxHeight:'60vh', overflowY:'auto', fontFamily:"'Nunito', sans-serif", fontSize:14, lineHeight:1.85, color:'var(--text-h)', padding:'4px 2px' }}>
        {lines.map((line,i)=>{
          if(line.startsWith('# '))   return <h2 key={i} style={{ color:'var(--accent)', borderBottom:'2px solid var(--accent-border)', paddingBottom:6, margin:'16px 0 8px', fontFamily:"'Sora', sans-serif" }}>{line.slice(2)}</h2>
          if(line.startsWith('## '))  return <h3 key={i} style={{ color:'var(--text-h)', margin:'14px 0 6px', fontFamily:"'Sora', sans-serif" }}>{line.slice(3)}</h3>
          if(line.startsWith('### ')) return <h4 key={i} style={{ color:'var(--text-h)', margin:'10px 0 4px', fontFamily:"'Sora', sans-serif" }}>{line.slice(4)}</h4>
          if(line.startsWith('- ')||line.startsWith('• ')) return <div key={i} style={{ paddingLeft:16, marginBottom:2, color:'var(--text-h)' }}>• {line.slice(2)}</div>
          if(/^\d+\./.test(line)) return <div key={i} style={{ paddingLeft:16, marginBottom:2, color:'var(--text-h)' }}>{line}</div>
          if(line.startsWith('---')||line.startsWith('═══')) return <hr key={i} style={{ border:'none', borderTop:'1px solid var(--border)', margin:'12px 0' }}/>
          const bold = line.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
          return <p key={i} style={{ margin:'3px 0', color:'var(--text-h)' }} dangerouslySetInnerHTML={{ __html:bold }}/>
        })}
      </div>
    </Card>
  )
}
