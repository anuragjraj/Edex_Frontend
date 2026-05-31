import { useState } from 'react'
import { PrimaryBtn } from '../../components/ui/Button'
import { ErrMsg, Spinner, SuccessMsg } from '../../components/ui/Feedback'
import { BSInput } from '../../components/ui/Input'
import { Field } from '../../components/ui/Layout'
import { useFonts } from '../../hooks/useFonts'
import { api } from '../../lib/apiClient'

// ══════════════════════════════════════════════════════════════
//  FORGOT PASSWORD
// ══════════════════════════════════════════════════════════════
export function ForgotPasswordPage({ onBack }) {
  useFonts()
  const [email,setEmail]=useState(''); const [sent,setSent]=useState(false); const [err,setErr]=useState(''); const [busy,setBusy]=useState(false)
  async function handleSubmit(e){ e.preventDefault();setErr('');setBusy(true);try{await api.post('/api/auth/forgot-password',{email});setSent(true)}catch(e){setErr(e.message)}finally{setBusy(false)} }
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a0533,#0f0f2e)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ background:'#0d0d22', border:'1px solid rgba(255,255,255,.08)', borderRadius:18, padding:28, maxWidth:400, width:'100%' }}>
        <div style={{ textAlign:'center', marginBottom:24 }}><div style={{ fontSize:40, marginBottom:8 }}>🔐</div><h2 style={{ margin:0, fontFamily:"'Sora',sans-serif", fontWeight:900, color:'#f1f5f9' }}>Reset Password</h2></div>
        {sent?<SuccessMsg msg="Check your inbox for the reset link. It expires in 1 hour."/>:(
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <Field label="Email Address"><BSInput value={email} onChange={setEmail} type="email" placeholder="your@email.com"/></Field>
            <ErrMsg msg={err}/>
            <PrimaryBtn style={{ width:'100%', justifyContent:'center' }} disabled={busy}>{busy?<><Spinner/> Sending...</>:'Send Reset Link'}</PrimaryBtn>
          </form>
        )}
        <p style={{ textAlign:'center', marginTop:16, fontSize:13 }}><span onClick={onBack} style={{ color:'var(--accent)', cursor:'pointer', fontWeight:700 }}>← Back to sign in</span></p>
      </div>
    </div>
  )
}
