import { useState, useEffect, useRef } from 'react'
import { PrimaryBtn } from '../../components/ui/Button'
import { ErrMsg, Spinner } from '../../components/ui/Feedback'
import { BSInput } from '../../components/ui/Input'
import { Field } from '../../components/ui/Layout'
import { useFonts } from '../../hooks/useFonts'
import { api } from '../../lib/apiClient'
import { loadScript } from '../../utils/pdf'

// ══════════════════════════════════════════════════════════════
//  AUTH PAGE
// ══════════════════════════════════════════════════════════════
export function AuthPage({ onAuth, initMode }) {
  useFonts()
  const [tab,    setTab]    = useState(initMode==='school'?'school':'personal')
  const [role,   setRole]   = useState(initMode==='teacher'?'teacher':'student')
  const [mode,   setMode]   = useState('login')
  const [form,   setForm]   = useState({ name:'', email:'', password:'', schoolCode:'', identifier:'', confirmPassword:'' })
  const [err,    setErr]    = useState('')
  const [busy,   setBusy]   = useState(false)
  const [showPw, setShowPw] = useState(false)
  const gBtnRef = useRef(null)
  const set = (k)=>(v)=>setForm(f=>({...f,[k]:v}))

  useEffect(()=>{
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || tab!=='personal') return
    loadScript('https://accounts.google.com/gsi/client').then(()=>{
      if (!window.google || !gBtnRef.current) return
      window.google.accounts.id.initialize({ client_id:clientId, callback:async(resp)=>{
        try { setBusy(true); setErr(''); const data = await api.post('/api/auth/google',{idToken:resp.credential}); saveAuth(data); onAuth(data.user) }
        catch(e){ setErr(e.message) } finally{ setBusy(false) }
      }})
      window.google.accounts.id.renderButton(gBtnRef.current,{ theme:'filled_black', size:'large', width:280 })
    }).catch(()=>{})
  },[tab])

  async function handlePersonal(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      if (mode==='register') {
        if (!form.name.trim()) throw new Error('Name is required')
        if (form.password!==form.confirmPassword) throw new Error('Passwords do not match')
      }
      const data = await api.post(mode==='register'?'/api/auth/register':'/api/auth/login',{ name:form.name, email:form.email, password:form.password, role })
      saveAuth(data); onAuth(data.user)
    } catch(e){ setErr(e.message) } finally{ setBusy(false) }
  }

  async function handleSchool(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const data = await api.post('/api/auth/school',{ schoolCode:form.schoolCode, identifier:form.identifier, password:form.password, role })
      saveAuth(data); onAuth(data.user)
    } catch(e){ setErr(e.message) } finally{ setBusy(false) }
  }

  function saveAuth(data) {
    localStorage.setItem('bs_token',   data.token)
    localStorage.setItem('bs_session', data.sessionToken)
    localStorage.setItem('bs_user',    JSON.stringify(data.user))
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a0533,#0f0f2e,#05050e)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ background:'#0d0d22', border:'1px solid rgba(255,255,255,.08)', borderRadius:18, padding:28, width:'100%', maxWidth:430, boxShadow:'0 28px 70px rgba(0,0,0,.5)' }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px', fontSize:26 }}>🧠</div>
          <h1 style={{ margin:0, fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:22, color:'#f1f5f9' }}>BrainSpark<span style={{ color:'#818CF8' }}> AI</span></h1>
          <p style={{ color:'#64748b', fontSize:13, marginTop:4 }}>Your AI-powered study companion</p>
        </div>
        <div style={{ display:'flex', background:'rgba(255,255,255,.04)', borderRadius:11, padding:3, marginBottom:18 }}>
          {[['personal','Personal'],['school','🏫 School']].map(([t,l])=>(
            <button key={t} onClick={()=>{setTab(t);setErr('')}} style={{ flex:1, padding:'8px', borderRadius:9, border:'none', fontWeight:700, fontSize:13.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:tab===t?'rgba(255,255,255,.08)':'transparent', color:tab===t?'#e2e8f0':'#64748b', transition:'all .2s' }}>{l}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:18 }}>
          {[['student','🎒 Student'],['teacher','👨‍🏫 Teacher']].map(([r,l])=>(
            <button key={r} onClick={()=>setRole(r)} style={{ flex:1, padding:'8px 12px', borderRadius:9, border:`2px solid ${role===r?'var(--accent)':'rgba(255,255,255,.08)'}`, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:role===r?'var(--accent-bg)':'transparent', color:role===r?'var(--accent)':'#64748b', transition:'all .2s' }}>{l}</button>
          ))}
        </div>
        {tab==='personal'&&<>
          <div style={{ display:'flex', gap:8, marginBottom:18 }}>
            {[['login','Sign In'],['register','Register']].map(([m,l])=>(
              <button key={m} onClick={()=>{setMode(m);setErr('')}} style={{ flex:1, padding:'8px', borderRadius:9, border:`2px solid ${mode===m?'var(--accent)':'rgba(255,255,255,.08)'}`, fontWeight:700, fontSize:13.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:mode===m?'var(--accent-bg)':'transparent', color:mode===m?'var(--accent)':'#64748b', transition:'all .2s' }}>{l}</button>
            ))}
          </div>
          <form onSubmit={handlePersonal} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {mode==='register'&&<Field label="Full Name"><BSInput value={form.name} onChange={set('name')} placeholder="Your full name"/></Field>}
            <Field label="Email Address"><BSInput value={form.email} onChange={set('email')} type="email" placeholder="your@email.com"/></Field>
            <Field label="Password">
              <div style={{ position:'relative' }}>
                <BSInput value={form.password} onChange={set('password')} type={showPw?'text':'password'} placeholder="Password" style={{ paddingRight:40 }}/>
                <span onClick={()=>setShowPw(p=>!p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#64748b', userSelect:'none' }}>{showPw?'🙈':'👁'}</span>
              </div>
            </Field>
            {mode==='register'&&<Field label="Confirm Password"><BSInput value={form.confirmPassword} onChange={set('confirmPassword')} type="password" placeholder="Repeat password"/></Field>}
            <ErrMsg msg={err}/>
            <PrimaryBtn style={{ width:'100%', justifyContent:'center', marginTop:4 }} disabled={busy}>
              {busy?<><Spinner/> {mode==='register'?'Creating account...':'Signing in...'}</>:mode==='register'?'Create Account':'Sign In'}
            </PrimaryBtn>
          </form>
          {mode==='login'&&<p style={{ textAlign:'center', fontSize:12.5, color:'#64748b', marginTop:10 }}>
            <span onClick={()=>onAuth('forgot')} style={{ color:'var(--accent)', cursor:'pointer', fontWeight:700 }}>Forgot password?</span>
          </p>}
          <div style={{ display:'flex', alignItems:'center', gap:8, margin:'18px 0' }}>
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,.08)' }}/><span style={{ fontSize:12, color:'#64748b', fontWeight:600 }}>OR</span><div style={{ flex:1, height:1, background:'rgba(255,255,255,.08)' }}/>
          </div>
          <div ref={gBtnRef} style={{ display:'flex', justifyContent:'center', marginBottom:10 }}/>
          <p style={{ textAlign:'center', fontSize:11.5, color:'#64748b', marginTop:8 }}>⏱ Free trial: 10 minutes · then ₹{role==='teacher'?'180':'150'}/month</p>
        </>}
        {tab==='school'&&(
          <form onSubmit={handleSchool} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ background:'var(--accent-bg)', padding:'10px 14px', borderRadius:10, fontSize:13, color:'var(--accent)', fontWeight:600 }}>🏫 Enter the School Code provided by your administrator.</div>
            <Field label="School Code"><BSInput value={form.schoolCode} onChange={set('schoolCode')} placeholder="e.g. DPS2024"/></Field>
            <Field label={role==='teacher'?'Employee ID':'Roll Number'}><BSInput value={form.identifier} onChange={set('identifier')} placeholder={role==='teacher'?'e.g. TCH001':'e.g. 101'}/></Field>
            <Field label="Password">
              <div style={{ position:'relative' }}>
                <BSInput value={form.password} onChange={set('password')} type={showPw?'text':'password'} placeholder="Your password" style={{ paddingRight:40 }}/>
                <span onClick={()=>setShowPw(p=>!p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#64748b' }}>{showPw?'🙈':'👁'}</span>
              </div>
            </Field>
            <ErrMsg msg={err}/>
            <PrimaryBtn style={{ width:'100%', justifyContent:'center' }} disabled={busy}>
              {busy?<><Spinner/> Signing in...</>:`Sign In as ${role==='teacher'?'Teacher':'Student'}`}
            </PrimaryBtn>
          </form>
        )}
      </div>
    </div>
  )
}
