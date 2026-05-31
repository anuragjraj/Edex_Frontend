// ══════════════════════════════════════════════════════════════
//  LANDING PAGE
// ══════════════════════════════════════════════════════════════
export function LandingPage({ onStart }) {
  const feats = [
    {e:'📣',t:'Study Feed',d:"Share achievements and ask questions like a social app — with anonymous mode.",c:'#6366F1'},
    {e:'📚',t:'Chapter Courses',d:"Pre-built CBSE courses cached for all students — instant after first generation.",c:'#8B5CF6'},
    {e:'🤖',t:'AI Buddy',d:"Your personal AI friend who knows your schedule, activity, and school notices.",c:'#06b6d4'},
    {e:'🤔',t:'Doubt Solver',d:"Step-by-step answers to any CBSE question with full explanations.",c:'#10B981'},
    {e:'📖',t:'Chapter Notes',d:"Textbook-quality notes downloadable as PDF.",c:'#F59E0B'},
    {e:'📋',t:'Exam Cheat Sheet',d:"6-page exam prep with top questions, formulas, and strategy.",c:'#EF4444'},
    {e:'🎓',t:'Lesson Planner',d:"Minute-by-minute plans with teaching scripts for teachers.",c:'#A855F7'},
    {e:'🏫',t:'School Platform',d:"Assignments, timetables, notices, analytics — everything a school needs.",c:'#F97316'},
  ]
  return (
    <div style={{ minHeight:'100vh', background:'#05050e', fontFamily:"'Nunito',sans-serif" }}>
      <nav style={{ padding:'0 5%', height:62, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, background:'rgba(5,5,14,.95)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🧠</div>
          <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:17, color:'#f1f5f9' }}>BrainSpark<span style={{ color:'#818CF8' }}> AI</span></span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>onStart('signin')} style={{ padding:'7px 16px', borderRadius:9, border:'1px solid rgba(255,255,255,.1)', background:'transparent', color:'#94a3b8', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>Sign In</button>
          <button onClick={()=>onStart('signup')} style={{ padding:'7px 16px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>Get Started Free →</button>
        </div>
      </nav>
      <section style={{ position:'relative', padding:'88px 5% 64px', textAlign:'center', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:'20%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,.15),transparent 65%)', filter:'blur(80px)', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1, maxWidth:820, margin:'0 auto' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 14px', borderRadius:30, background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.22)', marginBottom:18, fontSize:12, color:'#818CF8', fontWeight:700 }}>✦ India's All-in-One School Learning Platform</div>
          <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(28px,5.5vw,62px)', fontWeight:900, lineHeight:1.08, color:'#f1f5f9', marginBottom:16 }}>
            Where Students<br/>
            <span style={{ background:'linear-gradient(135deg,#818CF8,#A855F7,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Learn, Share & Grow</span>
          </h1>
          <p style={{ fontSize:'clamp(14px,1.8vw,17px)', color:'#64748b', lineHeight:1.8, marginBottom:30, maxWidth:520, margin:'0 auto 30px' }}>AI study tools + social feed + school management — one platform built for Indian students and teachers.</p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={()=>onStart('signup')} style={{ padding:'13px 34px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>🚀 Start Free — 10 Min Trial</button>
            <button onClick={()=>onStart('school')} style={{ padding:'12px 22px', borderRadius:10, border:'1px solid rgba(99,102,241,.3)', background:'rgba(99,102,241,.08)', color:'#818CF8', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>🏫 School Login</button>
          </div>
        </div>
      </section>
      <section style={{ padding:'64px 5%' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(18px,3vw,34px)', fontWeight:800, color:'#e2e8f0', marginBottom:8 }}>Everything to excel</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12, maxWidth:1000, margin:'0 auto' }}>
          {feats.map((f,i)=>(
            <div key={i} onClick={()=>onStart('signup')} style={{ background:'#0b0b1e', border:'1px solid rgba(255,255,255,.06)', borderRadius:13, padding:20, cursor:'pointer', transition:'border-color .2s,transform .2s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=f.c+'44';e.currentTarget.style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.06)';e.currentTarget.style.transform='none'}}>
              <div style={{ width:44, height:44, borderRadius:11, background:`${f.c}18`, border:`1px solid ${f.c}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:21, marginBottom:11 }}>{f.e}</div>
              <div style={{ fontFamily:"'Sora',sans-serif", fontSize:13.5, fontWeight:700, color:'#e2e8f0', marginBottom:5 }}>{f.t}</div>
              <p style={{ fontSize:12, color:'#64748b', lineHeight:1.65, margin:0 }}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{ padding:'52px 5%', textAlign:'center' }}>
        <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(20px,4vw,42px)', fontWeight:900, color:'#f1f5f9', marginBottom:10 }}>
          Ready to study <span style={{ background:'linear-gradient(135deg,#f59e0b,#ef4444)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>smarter?</span>
        </h2>
        <p style={{ color:'#64748b', fontSize:13.5, marginBottom:26 }}>Free 10-min trial · AI-powered · CBSE aligned · Built for India</p>
        <button onClick={()=>onStart('signup')} style={{ padding:'14px 42px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>🚀 Get Started Free</button>
      </section>
      <footer style={{ padding:'18px 5%', borderTop:'1px solid rgba(255,255,255,.04)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:"'Sora',sans-serif", color:'#334155', fontSize:12, fontWeight:700 }}>BrainSpark AI © 2025</span>
        <span style={{ fontSize:10.5, color:'#1e293b' }}>Powered by Claude · OpenAI · Groq · Built for CBSE</span>
      </footer>
    </div>
  )
}
