import { useState, useEffect } from 'react'
import { FREE_WINDOW } from '../config/config'
import { getSecondsRemaining } from '../utils/time'

// ══════════════════════════════════════════════════════════════
//  FREE TIER COUNTDOWN
// ══════════════════════════════════════════════════════════════
export function FreeTierCountdown({ user, onSubscribe, onExpired }) {
  const [seconds, setSeconds] = useState(null)
  useEffect(() => {
    if (!user || user.type==='school' || user.subscription_status==='active') return
    const initial = getSecondsRemaining(user.free_tier_started_at)
    setSeconds(initial)
    if (initial <= 0) { onExpired?.(); return }
    if (!user.free_tier_started_at) return // hasn't started yet, no ticking
    const interval = setInterval(() => {
      const rem = getSecondsRemaining(user.free_tier_started_at)
      setSeconds(rem)
      if (rem <= 0) { clearInterval(interval); onExpired?.() }
    }, 1000)
    return () => clearInterval(interval)
  }, [user?.id, user?.free_tier_started_at, user?.subscription_status])

  if (!user || user.type==='school' || user.subscription_status==='active') return null
  if (seconds === null) return null

  if (seconds <= 0) return (
    <div onClick={onSubscribe} style={{ background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.3)', borderRadius:11, padding:'10px 16px', marginBottom:16, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:"'Nunito', sans-serif" }}>
      <span style={{ color:'#fca5a5', fontWeight:700, fontSize:13.5 }}>⛔ Free trial ended — Subscribe to continue</span>
      <span style={{ color:'#ef4444', fontWeight:800, fontSize:12.5 }}>Subscribe →</span>
    </div>
  )

  // If not started yet (first visit)
  if (!user.free_tier_started_at) return (
    <div style={{ background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:11, padding:'9px 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:"'Nunito', sans-serif" }}>
      <span style={{ fontSize:13, color:'var(--text-h)', fontWeight:700 }}>⏱ 10:00 free trial — starts on your first AI call</span>
      <span onClick={onSubscribe} style={{ fontSize:12, color:'var(--accent)', cursor:'pointer', fontWeight:700 }}>Upgrade →</span>
    </div>
  )

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const pct  = Math.round((seconds / FREE_WINDOW) * 100)
  const isLow = seconds <= 120

  return (
    <div style={{ background:isLow?'rgba(239,68,68,.08)':'var(--accent-bg)', border:`1px solid ${isLow?'rgba(239,68,68,.25)':'var(--accent-border)'}`, borderRadius:11, padding:'9px 16px', marginBottom:16, fontFamily:"'Nunito', sans-serif" }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:13, fontWeight:700, color:isLow?'#fca5a5':'var(--text-h)' }}>{isLow?'⚠️':'⏱'} Free Trial:</span>
          <span style={{ fontFamily:"'Sora', monospace", fontWeight:900, fontSize:17, color:isLow?'#ef4444':'var(--accent)', animation:isLow?'pulse 1s infinite':'none', letterSpacing:1 }}>
            {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
          </span>
        </div>
        <span onClick={onSubscribe} style={{ fontSize:12, color:'var(--accent)', cursor:'pointer', fontWeight:700 }}>Upgrade →</span>
      </div>
      <div style={{ background:'var(--border)', borderRadius:999, height:4 }}>
        <div style={{ background:isLow?'#ef4444':'var(--accent)', width:`${pct}%`, height:'100%', borderRadius:999, transition:'width 1s linear' }}/>
      </div>
    </div>
  )
}
