import { useState, useEffect } from 'react'
import { GhostBtn, PrimaryBtn } from '../../components/ui/Button'
import { ErrMsg, PageSpinner, Spinner, SuccessMsg } from '../../components/ui/Feedback'
import { Card, Label } from '../../components/ui/Layout'
import { api } from '../../lib/apiClient'
import { T } from '../../theme/tokens'

// ══════════════════════════════════════════════════════════════
//  PROFILE PAGE (LinkedIn-style)
// ══════════════════════════════════════════════════════════════
export function ProfilePage({ userId, currentUser, onMessage, onBack }) {
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [editMode,  setEditMode]  = useState(false)
  const [form,      setForm]      = useState({})
  const [saving,    setSaving]    = useState(false)
  const [ok,        setOk]        = useState(false)
  const [err,       setErr]       = useState('')

  const isOwn    = !userId || userId === currentUser?.id
  const targetId = userId || currentUser?.id

  useEffect(() => {
    if (!targetId) return
    setLoading(true)
    setEditMode(false)
    api.get(`/api/profiles/${targetId}`)
      .then(d => { setData(d); setForm(d.profile || {}); setLoading(false) })
      .catch(() => setLoading(false))
  }, [targetId])

  const save = async () => {
    setSaving(true); setOk(false); setErr('')
    try {
      await api.put('/api/profiles/me', form)
      setData(d => ({ ...d, profile: form }))
      setOk(true)
      setTimeout(() => { setEditMode(false); setOk(false) }, 1500)
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  if (loading) return <PageSpinner />
  if (!data)   return <div style={{ padding:40, textAlign:'center', color:'var(--text)' }}>Profile not found</div>

  const { user, profile: prof, stats, rank } = data

  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", maxWidth:780, margin:'0 auto' }}>

      {/* ── Back button ─────────────────────────────────────── */}
      {onBack && (
        <GhostBtn small onClick={onBack} style={{ marginBottom:16 }}>← Back</GhostBtn>
      )}

      {/* ── Banner ──────────────────────────────────────────── */}
      <div style={{ borderRadius:14, overflow:'hidden', marginBottom:0, position:'relative', height:130, background: prof.banner_url ? `url(${prof.banner_url}) center/cover` : 'linear-gradient(135deg,#4338ca,#6366F1,#8B5CF6)' }}/>

      {/* ── Avatar row ──────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:-32, paddingInline:20, marginBottom:16 }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', border:'3px solid var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:900, color:'#fff', fontFamily:"'Sora',sans-serif", flexShrink:0 }}>
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>

        {/* Action buttons — always visible */}
        <div style={{ display:'flex', gap:8, paddingBottom:4 }}>
          {!isOwn && onMessage && (
            <PrimaryBtn small onClick={() => onMessage(user.id)}>💬 Message</PrimaryBtn>
          )}
          {isOwn && !editMode && (
            <PrimaryBtn small onClick={() => setEditMode(true)}>✏️ Edit Profile</PrimaryBtn>
          )}
          {isOwn && editMode && (
            <>
              <PrimaryBtn small onClick={save} disabled={saving}>
                {saving ? <><Spinner size={12}/> Saving...</> : '💾 Save'}
              </PrimaryBtn>
              <GhostBtn small onClick={() => { setEditMode(false); setForm(data.profile || {}) }}>Cancel</GhostBtn>
            </>
          )}
        </div>
      </div>

      {/* Status messages */}
      {ok  && <SuccessMsg msg="Profile saved successfully!" />}
      {err && <ErrMsg msg={err} />}

      {/* ── Name, headline, badges ──────────────────────────── */}
      <Card style={{ marginBottom:14 }}>
        <h2 style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, color:'var(--text-h)', margin:'0 0 6px', fontSize:22 }}>
          {user?.name}
        </h2>

        {editMode ? (
          <input
            value={form.headline || ''}
            onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
            placeholder="Add a headline — e.g. 'Class 10 student | Science enthusiast'"
            style={{ ...T.input, marginBottom:10 }}
          />
        ) : (
          <p style={{ color:'var(--text)', fontSize:14, margin:'0 0 12px', lineHeight:1.5 }}>
            {prof.headline || `${user?.role === 'teacher' ? '👨‍🏫 Teacher' : '🎒 Student'} ${user?.class_level ? `· ${user.class_level}` : ''}`}
          </p>
        )}

        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          <span style={{ background:'var(--accent-bg)', color:'var(--accent)', border:'1px solid var(--accent-border)', borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700 }}>
            {user?.role === 'teacher' ? '👨‍🏫' : '🎒'} {user?.class_level || user?.role}
          </span>
          {rank?.rank && (
            <span style={{ background:'rgba(245,158,11,.1)', color:'#FCD34D', border:'1px solid rgba(245,158,11,.2)', borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700 }}>
              🏆 Ranked #{rank.rank} of {rank.total_users?.toLocaleString()}
            </span>
          )}
          <span style={{ background:'rgba(99,102,241,.1)', color:'#818CF8', border:'1px solid rgba(99,102,241,.2)', borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700 }}>
            ⚡ {(stats?.total_xp || 0).toLocaleString()} XP
          </span>
          {user?.subject_specialization && (
            <span style={{ background:'rgba(16,185,129,.1)', color:'#6ee7b7', border:'1px solid rgba(16,185,129,.2)', borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:700 }}>
              📚 {user.subject_specialization}
            </span>
          )}
        </div>
      </Card>

      {/* ── Stats row ───────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
        {[
          ['🔥', stats?.current_streak || 0, 'Day Streak'],
          ['🤔', stats?.doubts_solved  || 0, 'Doubts'],
          ['🎯', stats?.quizzes_done   || 0, 'Quizzes'],
          ['📖', stats?.notes_made     || 0, 'Notes'],
        ].map(([e, v, l]) => (
          <div key={l} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 10px', textAlign:'center' }}>
            <div style={{ fontSize:20, marginBottom:3 }}>{e}</div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:18, color:'var(--accent)' }}>{v}</div>
            <div style={{ fontSize:10.5, color:'var(--text)' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ── About ───────────────────────────────────────────── */}
      <Card style={{ marginBottom:14 }}>
        <h4 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text-h)', margin:'0 0 10px', fontSize:15 }}>
          About
        </h4>
        {editMode ? (
          <textarea
            value={form.about || ''}
            onChange={e => setForm(f => ({ ...f, about: e.target.value }))}
            placeholder="Tell your story — your goals, interests, favourite subjects..."
            rows={4}
            style={{ ...T.input, resize:'vertical' }}
          />
        ) : (
          <p style={{ color: prof.about ? 'var(--text-h)' : 'var(--text)', fontSize:14, lineHeight:1.7, margin:0, fontStyle: prof.about ? 'normal' : 'italic' }}>
            {prof.about || (isOwn ? 'Click "Edit Profile" to add your bio.' : 'No about section yet.')}
          </p>
        )}
      </Card>

      {/* ── Skills ──────────────────────────────────────────── */}
      <Card style={{ marginBottom:14 }}>
        <h4 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text-h)', margin:'0 0 12px', fontSize:15 }}>
          Skills & Subjects
        </h4>
        {editMode && (
          <div style={{ marginBottom:10 }}>
            <Label>Skills (comma separated)</Label>
            <input
              value={(form.skills || []).join(', ')}
              onChange={e => setForm(f => ({ ...f, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
              placeholder="e.g. Mathematics, Physics, Python, Problem Solving"
              style={{ ...T.input }}
            />
          </div>
        )}
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {(prof.skills || []).map((s, i) => (
            <span key={i} style={{ background:'var(--accent-bg)', color:'var(--accent)', border:'1px solid var(--accent-border)', borderRadius:20, padding:'4px 12px', fontSize:12.5, fontWeight:700 }}>
              {s}
            </span>
          ))}
          {(prof.skills || []).length === 0 && (
            <span style={{ color:'var(--text)', fontSize:13, fontStyle:'italic' }}>
              {isOwn ? 'No skills added yet — click Edit Profile to add some.' : 'No skills listed.'}
            </span>
          )}
        </div>
      </Card>

      {/* ── Location & links (edit mode only) ───────────────── */}
      {editMode && (
        <Card style={{ marginBottom:14 }}>
          <h4 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text-h)', margin:'0 0 14px', fontSize:15 }}>
            More Details
          </h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
            <div>
              <Label>Location</Label>
              <input value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Mumbai, India" style={{ ...T.input }}/>
            </div>
            <div>
              <Label>Website / Portfolio</Label>
              <input value={form.website_url || ''} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://..." style={{ ...T.input }}/>
            </div>
          </div>
          <div style={{ marginTop:12 }}>
            <Label>Hobbies (comma separated)</Label>
            <input value={(form.hobbies || []).join(', ')} onChange={e => setForm(f => ({ ...f, hobbies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} placeholder="e.g. Cricket, Drawing, Reading" style={{ ...T.input }}/>
          </div>
          <div style={{ marginTop:12 }}>
            <Label>Languages (comma separated)</Label>
            <input value={(form.languages || []).join(', ')} onChange={e => setForm(f => ({ ...f, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} placeholder="e.g. English, Hindi, Tamil" style={{ ...T.input }}/>
          </div>
        </Card>
      )}

      {/* ── Non-edit: show location/hobbies if present ──────── */}
      {!editMode && (prof.location || (prof.hobbies || []).length > 0 || (prof.languages || []).length > 0) && (
        <Card style={{ marginBottom:14 }}>
          {prof.location && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, fontSize:13.5, color:'var(--text-h)' }}>
              📍 {prof.location}
            </div>
          )}
          {(prof.languages || []).length > 0 && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
              <span style={{ fontSize:12.5, color:'var(--text)', marginRight:4 }}>🗣️</span>
              {prof.languages.map((l, i) => (
                <span key={i} style={{ background:'var(--code-bg)', border:'1px solid var(--border)', borderRadius:20, padding:'2px 10px', fontSize:12, color:'var(--text-h)', fontWeight:600 }}>{l}</span>
              ))}
            </div>
          )}
          {(prof.hobbies || []).length > 0 && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:12.5, color:'var(--text)', marginRight:4 }}>🎯</span>
              {prof.hobbies.map((h, i) => (
                <span key={i} style={{ background:'var(--code-bg)', border:'1px solid var(--border)', borderRadius:20, padding:'2px 10px', fontSize:12, color:'var(--text-h)', fontWeight:600 }}>{h}</span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Save button at bottom (redundant but helpful UX) ── */}
      {editMode && (
        <div style={{ display:'flex', gap:10, marginTop:4, paddingBottom:24 }}>
          <PrimaryBtn onClick={save} disabled={saving} style={{ flex:1, justifyContent:'center' }}>
            {saving ? <><Spinner/> Saving...</> : '💾 Save Profile'}
          </PrimaryBtn>
          <GhostBtn onClick={() => { setEditMode(false); setForm(data.profile || {}) }}>Cancel</GhostBtn>
        </div>
      )}

    </div>
  )
}
