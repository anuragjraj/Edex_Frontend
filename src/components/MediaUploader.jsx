import { useState, useRef } from 'react'
import { API_URL } from '../config/config'

// ══════════════════════════════════════════════════════════════
//  MEDIA UPLOADER
// ══════════════════════════════════════════════════════════════
export function MediaUploader({ onUpload, onClear, current, accept='image/*,application/pdf', label='📎 Add Photo/File', small=false }) {
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const handleFile = async (file) => {
    if (!file) return
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const tok = localStorage.getItem('bs_token')
      const r = await fetch(`${API_URL}/api/upload/media`, { method:'POST', headers:{ Authorization:`Bearer ${tok}` }, body:form })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      onUpload(data.url, data.type)
    } catch (e) { alert('Upload failed: ' + e.message) }
    setLoading(false)
  }
  if (current?.url) return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
      {current.type==='image'
        ? <img src={current.url} style={{ width:56, height:56, objectFit:'cover', borderRadius:8, border:'1px solid var(--border)' }} alt=""/>
        : <div style={{ background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:8, padding:'5px 10px', fontSize:11.5, color:'var(--accent)', fontWeight:700 }}>📄 PDF</div>
      }
      <button onClick={onClear} style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', color:'#fca5a5', borderRadius:6, padding:'3px 8px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito', sans-serif" }}>✕</button>
    </div>
  )
  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])}/>
      <button onClick={()=>inputRef.current?.click()} disabled={loading}
        style={{ display:'inline-flex', alignItems:'center', gap:5, padding:small?'5px 10px':'7px 14px', borderRadius:8, border:'1px dashed var(--border)', background:'transparent', color:'var(--text)', cursor:'pointer', fontSize:small?11.5:12.5, fontWeight:600, fontFamily:"'Nunito', sans-serif", opacity:loading?.6:1 }}>
        {loading ? '⏳ Uploading...' : label}
      </button>
    </div>
  )
}
