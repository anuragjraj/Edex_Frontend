/**
 * BrainSpark AI — Frontend v5.0
 * Complete merged app with all features
 *
 * REQUIRES in .env:
 *   VITE_API_URL=https://your-backend.onrender.com
 *   VITE_GOOGLE_CLIENT_ID=...
 *   VITE_MICROSOFT_CLIENT_ID=...
 *   VITE_RAZORPAY_KEY_ID=rzp_live_...
 */

import { useState, useEffect } from 'react'
import { FreeTierCountdown } from './components/FreeTierCountdown'
import { MobileTopNav } from './components/MobileTopNav'
import { AchievementsPage } from './features/achievements/AchievementsPage'
import { AssignmentsPage } from './features/assignments/AssignmentsPage'
import { AuthPage } from './features/auth/AuthPage'
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage'
import { LandingPage } from './features/auth/LandingPage'
import { AIBuddy } from './features/buddy/AIBuddy'
import { Dashboard } from './features/dashboard/Dashboard'
import { HistoryPage } from './features/history/HistoryPage'
import { NoticesPage } from './features/school/NoticesPage'
import { SchoolDashboard } from './features/school/SchoolDashboard'
import { TimetablePage } from './features/school/TimetablePage'
import { MessagingPage } from './features/social/MessagingPage'
import { ProfilePage } from './features/social/ProfilePage'
import { SearchPage } from './features/social/SearchPage'
import { SocialFeed } from './features/social/SocialFeed'
import { SubscriptionPage } from './features/subscription/SubscriptionPage'
import { ChapterCourses } from './features/tools/ChapterCourses'
import { CheatSheetMaker } from './features/tools/CheatSheetMaker'
import { DoubtSolver } from './features/tools/DoubtSolver'
import { FlashCards } from './features/tools/FlashCards'
import { LessonPlanner } from './features/tools/LessonPlanner'
import { NotesMaker } from './features/tools/NotesMaker'
import { QPMaker } from './features/tools/QPMaker'
import { QuizGenerator } from './features/tools/QuizGenerator'
import { VideoLearn } from './features/tools/VideoLearn'
import { useFonts } from './hooks/useFonts'
import { useIsMobile } from './hooks/useIsMobile'
import { api } from './lib/apiClient'

// ══════════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════════
export default function App() {
  useFonts()
  const isMobile = useIsMobile()

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bs_user')) } catch { return null }
  })
  const [page, setPage]               = useState(() => localStorage.getItem('bs_user') ? 'app' : 'landing')
  const [tab, setTab]                 = useState('dashboard')
  const [initAuthMode, setInitAuthMode] = useState('login')
  const [viewProfileId, setViewProfileId] = useState(null)
  const [msgUserId, setMsgUserId]     = useState(null)
  const [trialExpired, setTrialExpired] = useState(false)
  const [prefill, setPrefill]         = useState(null)

  // Refresh user on mount
  useEffect(() => {
    if (!user) return
    api.get('/api/auth/me')
      .then(u => { setUser(u); localStorage.setItem('bs_user', JSON.stringify(u)) })
      .catch(e => {
        if (e.code === 'SESSION_REPLACED') { alert('You have been signed in on another device.'); logout() }
        else if (e.status === 401) logout()
      })
  }, [])

  function handleAuth(data) {
    if (data === 'forgot') { setPage('forgot'); return }
    setUser(data); setPage('app'); setTab('dashboard')
    localStorage.setItem('bs_user', JSON.stringify(data))
  }

  function logout() {
    api.post('/api/auth/logout', {}).catch(() => {})
    localStorage.clear()
    setUser(null); setPage('landing'); setTab('dashboard')
  }

  function updateUser(u) {
    setUser(u); localStorage.setItem('bs_user', JSON.stringify(u))
  }

  // function handleHistoryNav(item) {
  //   setPrefill({
  //     tool:     item.tool,
  //     subject:  item.subject  || '',
  //     chapter:  item.chapter  || '',
  //     chapters: item.chapters || [],
  //   })
  //   setTab(item.tool)
  // }

  function clearPrefill() { setPrefill(null) }

  // ── Landing ──────────────────────────────────────────────────
  if (page === 'landing') return (
    <LandingPage onStart={mode => { setInitAuthMode(mode === 'signup' ? 'register' : 'login'); setPage('auth') }} />
  )
  if (!user || page === 'auth') return (
    <AuthPage onAuth={handleAuth} initMode={initAuthMode} />
  )
  if (page === 'forgot') return (
    <ForgotPasswordPage onBack={() => setPage('auth')} />
  )

  // ── App tabs ─────────────────────────────────────────────────
  const isStudent = user.role === 'student'
  const isTeacher = user.role === 'teacher'
  const isSchool  = user.type === 'school'

  const tabs = [
    { id: 'dashboard',   icon: '🏠', label: 'Dashboard',      color: '#6366F1' },
    { id: 'courses',     icon: '📚', label: 'Chapter Courses', color: '#8B5CF6' },
    { id: 'notes',       icon: '📖', label: 'Notes',           color: '#10B981' },
    { id: 'paper',       icon: '📄', label: 'Question Paper',  color: '#A855F7' },
    { id: 'quiz',        icon: '🎯', label: 'Quiz',            color: '#F59E0B' },
    { id: 'flashcards',  icon: '🃏', label: 'Flashcards',      color: '#EF4444' },
    { id: 'doubt',       icon: '🤔', label: 'Doubt Solver',    color: '#818CF8' },
    { id: 'search',      icon: '🔍', label: 'Search',          color: '#06b6d4' },
    { id: 'messages',    icon: '💬', label: 'Messages',        color: '#10B981' },
    // { id: 'video',       icon: '🎬', label: 'Video Learning',  color: '#06b6d4' },
    // ...(isStudent ? [{ id: 'cheatsheet', icon: '📋', label: 'Cheat Sheet',   color: '#F97316' }] : []),
    ...(isTeacher ? [{ id: 'lessonplan', icon: '🎓', label: 'Lesson Planner', color: '#7C3AED' }] : []),
    ...(isSchool ? [
      { id: 'assignments', icon: '📝', label: 'Assignments', color: '#F59E0B' },
      { id: 'notices',     icon: '📢', label: 'Notices',     color: '#F97316' },
      { id: 'timetable',   icon: '📅', label: 'Timetable',   color: '#06b6d4' },
    ] : []),
    ...(isTeacher && isSchool ? [{ id: 'school', icon: '🏫', label: 'Analytics', color: '#A855F7' }] : []),
    { id: 'feed',        icon: '📣', label: 'Study Feed',      color: '#6366F1' },
    { id: 'history',     icon: '🕘', label: 'History',         color: '#6366F1' }
  ]

//   const tabs = [
//   { id: 'dashboard',  icon: '🏠', label: 'Dashboard',       color: '#6366F1' },
//   { id: 'courses',    icon: '📚', label: 'Chapter Courses',  color: '#8B5CF6' },
//   { id: 'notes',      icon: '📖', label: 'Notes',            color: '#10B981' },
//   { id: 'paper',      icon: '📄', label: 'Question Paper',   color: '#A855F7' },
//   { id: 'quiz',       icon: '🎯', label: 'Quiz',             color: '#F59E0B' },
//   { id: 'flashcards', icon: '🃏', label: 'Flashcards',       color: '#EF4444' },
//   { id: 'doubt',      icon: '🤔', label: 'Doubt Solver',     color: '#818CF8' },
//   { id: 'history',    icon: '🕘', label: 'History',          color: '#6366F1' },
//   { id: 'feed',       icon: '📣', label: 'Study Feed',       color: '#6366F1' },
// ]

  const renderPage = () => {
    if (tab === 'subscription') return (
      <SubscriptionPage
        user={user}
        onSuccess={() => { api.get('/api/auth/me').then(updateUser); setTab('dashboard') }}
        onBack={() => setTab('dashboard')}
      />
    )
    if (tab === 'achievements') return <AchievementsPage />
    if (tab === 'profile')      return (
      <ProfilePage
        userId={viewProfileId || undefined}
        currentUser={user}
        onBack={() => { setTab(viewProfileId ? 'search' : 'dashboard'); setViewProfileId(null) }}
        onMessage={id => { setMsgUserId(id); setTab('messages') }}
      />
    )
    if (tab === 'dashboard')  return <Dashboard user={user} onNavigate={setTab} />
    if (tab === 'feed')       return <SocialFeed user={user} />
    if (tab === 'search')     return <SearchPage currentUser={user} onViewProfile={id => { setViewProfileId(id); setTab('profile') }} />
    if (tab === 'messages')   return <MessagingPage currentUser={user} startWithUserId={msgUserId} />
    if (tab === 'history')    return <HistoryPage  />
    if (tab === 'doubt')      return <DoubtSolver    user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'notes')      return <NotesMaker      user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'courses')    return <ChapterCourses  user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'video')      return <VideoLearn user={user} />
    if (tab === 'cheatsheet') return <CheatSheetMaker user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'paper')      return <QPMaker         user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'lessonplan') return <LessonPlanner   user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'quiz')       return <QuizGenerator   user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'flashcards') return <FlashCards      user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'assignments') return <AssignmentsPage user={user} />
    if (tab === 'notices')    return <NoticesPage user={user} />
    if (tab === 'timetable')  return <TimetablePage user={user} />
    if (tab === 'school')     return <SchoolDashboard user={user} />
    return <Dashboard user={user} onNavigate={setTab} />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', fontFamily: "'Nunito', sans-serif" }}>

      {/* ── Top header ───────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid var(--border)', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58, position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5,5,14,.95)', backdropFilter: 'blur(20px)', boxShadow: '0 2px 20px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setTab('dashboard')}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧠</div>
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 17, color: 'var(--text-h)' }}>
            BrainSpark<span style={{ color: '#818CF8' }}> AI</span>
          </span>
          {isSchool && user.schools && (
            <span style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 700, background: 'var(--accent-bg)', padding: '2px 10px', borderRadius: 20, border: '1px solid var(--accent-border)' }}>
              🏫 {user.schools.name}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isSchool && user.subscription_status !== 'active' && (
            <button onClick={() => setTab('subscription')} style={{ padding: '6px 14px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
              ⚡ Upgrade
            </button>
          )}
          <button onClick={() => setTab('achievements')} title="Achievements" style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--social-bg)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏆</button>
          <button onClick={() => { setViewProfileId(null); setTab('profile') }} title="My Profile" style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', cursor: 'pointer', fontSize: 14, fontWeight: 900, color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora', sans-serif" }}>
            {user.name?.[0]?.toUpperCase() || '?'}
          </button>
          <button onClick={logout} style={{ padding: '6px 13px', borderRadius: 9, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>Sign Out</button>
        </div>
      </header>

      {/* ── Mobile top nav ───────────────────────────────────── */}
      <MobileTopNav tabs={tabs} activeTab={tab} onTabChange={setTab} />

      <div style={{ display: 'flex', flex: 1 }}>

        {/* ── Desktop sidebar ──────────────────────────────────── */}
        <nav className="desktop-sidebar" style={{ width: 210, borderRight: '1px solid var(--border)', padding: '12px 8px', background: 'rgba(5,5,14,.8)', flexShrink: 0, position: 'sticky', top: 58, height: 'calc(100vh - 58px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tabs.map(t => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif", background: active ? `linear-gradient(135deg,${t.color},${t.color}bb)` : 'transparent', color: active ? '#fff' : 'var(--text-h)', fontWeight: active ? 800 : 600, fontSize: 13.5, textAlign: 'left', transition: 'all .15s' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.05)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                {t.label}
              </button>
            )
          })}
          <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
          <button onClick={() => setTab('achievements')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif", background: tab === 'achievements' ? 'linear-gradient(135deg,#F59E0B,#FBBF24)' : 'transparent', color: tab === 'achievements' ? '#fff' : 'var(--text-h)', fontWeight: 600, fontSize: 13.5, textAlign: 'left', transition: 'all .15s' }}>
            <span style={{ fontSize: 16 }}>🏆</span> Achievements
          </button>
        </nav>

        {/* ── Main content ─────────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          <div style={{ padding: '16px 24px 0', paddingBottom: 0 }}>
            <FreeTierCountdown
              user={user}
              onSubscribe={() => setTab('subscription')}
              onExpired={() => { setTrialExpired(true); setTab('subscription') }}
            />
          </div>
          {renderPage()}
        </main>

      </div>

      {/* ── AI Buddy (school users only) ─────────────────────── */}
      {isSchool && <AIBuddy user={user} />}

    </div>
  )
}
