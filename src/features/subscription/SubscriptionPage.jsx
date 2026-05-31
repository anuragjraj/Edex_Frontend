import { useState } from 'react'
import { GhostBtn, PrimaryBtn } from '../../components/ui/Button'
import { ErrMsg, Spinner } from '../../components/ui/Feedback'
import { api } from '../../lib/apiClient'
import { T } from '../../theme/tokens'
import { loadScript } from '../../utils/pdf'

// ══════════════════════════════════════════════════════════════
//  SUBSCRIPTION PAGE
// ══════════════════════════════════════════════════════════════
export function SubscriptionPage({ user, onSuccess, onBack }) {
  const [loading,setLoading]=useState(false); const [err,setErr]=useState('')
  const plans = user?.role==='teacher'
    ? [{id:'teacher_monthly',label:'Monthly',price:'₹180',desc:'₹180/month',months:1},{id:'teacher_yearly',label:'Annual',price:'₹1,800',desc:'Save ₹360/year',months:12,popular:true}]
    : [{id:'student_monthly',label:'Monthly',price:'₹150',desc:'₹150/month',months:1},{id:'student_yearly',label:'Annual',price:'₹1,500',desc:'Save ₹300/year',months:12,popular:true}]
  async function subscribe(planType) {
    setErr('');setLoading(true)
    try {
      await loadScript('https://checkout.razorpay.com/v1/checkout.js')
      const order = await api.post('/api/subscription/create-order',{planType})
      const rzp = new window.Razorpay({ key:import.meta.env.VITE_RAZORPAY_KEY_ID, amount:order.amount, currency:'INR', name:'BrainSpark AI', description:order.planLabel, order_id:order.orderId, prefill:{name:user.name,email:user.email}, theme:{color:'#6366F1'},
        handler:async({razorpay_payment_id,razorpay_order_id,razorpay_signature})=>{
          try{ await api.post('/api/subscription/verify',{orderId:razorpay_order_id,paymentId:razorpay_payment_id,signature:razorpay_signature,planType}); onSuccess() }
          catch(e){ setErr('Payment verification failed.') }
        },
      })
      rzp.open()
    } catch(e){setErr(e.message)} finally{setLoading(false)}
  }
  return (
    <div style={{ padding:24, fontFamily:"'Nunito',sans-serif" }}>
      {onBack&&<GhostBtn small onClick={onBack} style={{ marginBottom:20 }}>← Back</GhostBtn>}
      <div style={{ textAlign:'center', marginBottom:32 }}><div style={{ fontSize:48, marginBottom:8 }}>💎</div><h2 style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, color:'var(--text-h)', margin:'0 0 6px' }}>Upgrade BrainSpark AI</h2><p style={{ color:'var(--text)', fontSize:14 }}>Unlimited access to all AI tools</p></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16, marginBottom:24, maxWidth:700, margin:'0 auto 24px' }}>
        {plans.map(p=>(
          <div key={p.id} style={{ ...T.card, position:'relative', borderColor:p.popular?'var(--accent)':'var(--border)', borderWidth:p.popular?2:1, textAlign:'center' }}>
            {p.popular&&<div style={{ position:'absolute', top:-13, left:'50%', transform:'translateX(-50%)', background:'var(--accent)', color:'#fff', borderRadius:20, padding:'3px 14px', fontSize:11, fontWeight:800 }}>BEST VALUE</div>}
            <div style={{ fontSize:30, fontWeight:900, color:'var(--accent)', marginBottom:4, fontFamily:"'Sora',sans-serif" }}>{p.price}</div>
            <div style={{ fontSize:13, color:'var(--text)', marginBottom:16 }}>{p.desc}</div>
            <PrimaryBtn onClick={()=>subscribe(p.id)} disabled={loading} style={{ width:'100%', justifyContent:'center' }}>{loading?<><Spinner/> ...</>:`Get ${p.label}`}</PrimaryBtn>
          </div>
        ))}
      </div>
      <ErrMsg msg={err}/>
    </div>
  )
}
