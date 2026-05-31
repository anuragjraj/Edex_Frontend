import { useState, useEffect } from 'react'
import { PageSpinner } from '../../components/ui/Feedback'
import { Card } from '../../components/ui/Layout'
import { getLevel, getNextLevel } from '../../constants/levels'
import { api } from '../../lib/apiClient'

// ══════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════
export function Dashboard({ user, onNavigate }) {
  const [stats,setStats]=useState(null); const [achs,setAchs]=useState([]); const [loading,setLoading]=useState(true)
  useEffect(()=>{ Promise.all([api.get('/api/user/stats'),api.get('/api/user/achievements')]).then(([s,a])=>{setStats(s);setAchs(a)}).catch(()=>{}).finally(()=>setLoading(false)) },[])
  if(loading) return <PageSpinner/>
  const xp=stats?.stats?.total_xp||0; const level=getLevel(xp); const nextLevel=getNextLevel(xp)
  const pct=nextLevel?Math.round(((xp-level.min)/(nextLevel.min-level.min))*100):100
  const streak=stats?.stats?.current_streak||0; const unlocked=achs.filter(a=>a.unlocked).slice(0,3)
  const hour=new Date().getHours(); const greeting=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'
  const quickStart = [
    { icon: '🕘', label: 'My History', tab: 'history', color: '#6366F1' },
    {icon:'📣',label:'Study Feed',tab:'feed',color:'#6366F1'},
    {icon:'📚',label:'Chapter Courses',tab:'courses',color:'#8B5CF6'},
    {icon:'🤔',label:'Ask a Doubt',tab:'doubt',color:'#818CF8'},
    {icon:'📖',label:'Generate Notes',tab:'notes',color:'#10B981'},
    ...(user.type==='school'?[{icon:'📝',label:'Assignments',tab:'assignments',color:'#F59E0B'}]:[]),
    ...(user.role==='student'?[{icon:'📋',label:'Exam Cheat Sheet',tab:'cheatsheet',color:'#F97316'}]:[{icon:'🎓',label:'Lesson Planner',tab:'lessonplan',color:'#7C3AED'}]),
    {icon:'🎯',label:'Take a Quiz',tab:'quiz',color:'#F59E0B'},
    {icon:'🔍',label:'Find People',tab:'search',color:'#06b6d4'},
    
  ]
  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0, fontFamily:"'Sora',sans-serif", fontWeight:900, color:'var(--text-h)', fontSize:'clamp(1.1rem,2.5vw,1.5rem)' }}>{greeting}, {user.name.split(' ')[0]}! {level.emoji}</h2>
          <p style={{ margin:'4px 0 0', color:'var(--text)', fontSize:13 }}>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</p>
        </div>
        <div style={{ background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:20, padding:'6px 16px', display:'inline-flex', alignItems:'center', gap:6 }}>
          <span style={{ fontWeight:800, color:'var(--accent)', fontSize:14, fontFamily:"'Sora',sans-serif" }}>{level.emoji} {level.label}</span>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:22 }}>
        {[{label:'Total XP',value:xp.toLocaleString(),icon:'⚡',bg:'rgba(99,102,241,.15)',color:'#818CF8'},{label:'Streak',value:`${streak}d`,icon:'🔥',bg:'rgba(249,115,22,.15)',color:'#FB923C'},{label:'Doubts',value:stats?.stats?.doubts_solved||0,icon:'🤔',bg:'rgba(16,185,129,.15)',color:'#34D399'},{label:'Quizzes',value:stats?.stats?.quizzes_done||0,icon:'🎯',bg:'rgba(139,92,246,.15)',color:'#A78BFA'},{label:'Notes',value:stats?.stats?.notes_made||0,icon:'📖',bg:'rgba(239,68,68,.15)',color:'#FCA5A5'},{label:'Papers',value:stats?.stats?.papers_made||0,icon:'📄',bg:'rgba(245,158,11,.15)',color:'#FCD34D'}].map(stat=>(
          <div key={stat.label} style={{ background:stat.bg, borderRadius:14, padding:'14px 12px', textAlign:'center', border:'1px solid rgba(255,255,255,.05)' }}>
            <div style={{ fontSize:24, marginBottom:4 }}>{stat.icon}</div>
            <div style={{ fontSize:20, fontWeight:900, color:stat.color, fontFamily:"'Sora',sans-serif" }}>{stat.value}</div>
            <div style={{ fontSize:11, color:'var(--text)', marginTop:2, fontWeight:600 }}>{stat.label}</div>
          </div>
        ))}
      </div>
      <Card style={{ marginBottom:20, background:'linear-gradient(135deg,#4338ca,#6366F1,#8B5CF6)', border:'none' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div>
            <span style={{ fontWeight:900, color:'#fff', fontSize:18, fontFamily:"'Sora',sans-serif" }}>{level.emoji} {level.label}</span>
            {nextLevel&&<span style={{ color:'rgba(255,255,255,.75)', fontSize:12.5, marginLeft:10 }}>→ {nextLevel.emoji} {nextLevel.label} at {nextLevel.min.toLocaleString()} XP</span>}
          </div>
          <span style={{ fontSize:24, fontWeight:900, color:'#fff', fontFamily:"'Sora',sans-serif" }}>{xp.toLocaleString()} XP</span>
        </div>
        <div style={{ background:'rgba(255,255,255,.25)', borderRadius:999, height:8 }}><div style={{ background:'#fff', width:`${pct}%`, height:'100%', borderRadius:999, transition:'width 1s ease' }}/></div>
        {nextLevel&&<p style={{ fontSize:12, color:'rgba(255,255,255,.75)', margin:'8px 0 0', textAlign:'right' }}>{(nextLevel.min-xp).toLocaleString()} XP to {nextLevel.label}</p>}
      </Card>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>
        <Card>
          <h3 style={{ margin:'0 0 14px', fontSize:15, fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text-h)' }}>⚡ Quick Start</h3>
          {quickStart.map(item=>(
            <button key={item.tab} onClick={()=>onNavigate(item.tab)} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--code-bg)', color:'var(--text-h)', cursor:'pointer', marginBottom:9, fontSize:14, fontWeight:600, fontFamily:"'Nunito',sans-serif", transition:'all .15s' }}
              onMouseEnter={e=>{e.currentTarget.style.background='var(--accent-bg)';e.currentTarget.style.borderColor='var(--accent)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='var(--code-bg)';e.currentTarget.style.borderColor='var(--border)'}}>
              <span style={{ fontSize:20 }}>{item.icon}</span>{item.label}<span style={{ marginLeft:'auto', fontSize:16, color:'var(--text)' }}>→</span>
            </button>
          ))}
        </Card>
        <Card>
          <h3 style={{ margin:'0 0 14px', fontSize:15, fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text-h)' }}>🏆 Recent Achievements</h3>
          {unlocked.length===0?<p style={{ color:'var(--text)', fontSize:13 }}>Complete activities to unlock achievements!</p>:unlocked.map(a=>(
            <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ fontSize:24 }}>{a.emoji}</span>
              <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:13.5, color:'var(--text-h)' }}>{a.name}</div><div style={{ fontSize:12, color:'var(--text)' }}>{a.description}</div></div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
