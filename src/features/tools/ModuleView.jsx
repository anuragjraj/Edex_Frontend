import { useState, useEffect } from 'react'
import { GhostBtn, PrimaryBtn } from '../../components/ui/Button'
import { PageSpinner } from '../../components/ui/Feedback'
import { Card } from '../../components/ui/Layout'
import { api } from '../../lib/apiClient'
import { T } from '../../theme/tokens'

// ══════════════════════════════════════════════════════════════
//  MODULE VIEW — Video player + Notes/Q&A/Quiz tabs
// ══════════════════════════════════════════════════════════════
export function ModuleView({ mod, moduleData, subject, cls, chapter, courseKey, isComplete, onComplete, onPrev, onNext, hasPrev, hasNext }) {
  const [tab,    setTab]    = useState('video')
  const [qAns,   setQAns]   = useState({})
  const [qDone,  setQDone]  = useState(false)
  const [qScore, setQScore] = useState(0)
  const [qaOpen, setQaOpen] = useState(null)
  const [swapping, setSwapping] = useState(false)

  // Reset when module changes
  useEffect(() => {
    setTab('video'); setQAns({}); setQDone(false); setQScore(0); setQaOpen(null); setSwapping(false)
  }, [mod?.id])

  const notes          = moduleData?.notes
  const qa             = moduleData?.qa   || []
  const quiz           = moduleData?.quiz || []
  const currentVideoId = moduleData?.videoId || mod?.videoId
  const searchResults  = moduleData?.searchResults || []
  const pct = qDone ? Math.round((qScore / Math.max(quiz.length, 1)) * 100) : 0

  function submitQuiz() {
    let s = 0; quiz.forEach((q, i) => { if (qAns[i] === q.ans) s++ })
    setQScore(s); setQDone(true); if (!isComplete) onComplete?.()
  }

  async function swapVideo(newVideoId) {
    try { await api.patch('/api/chapter-courses/module/video', { subject, cls, chapter, moduleId: mod.id, newVideoId, moduleTitle: mod.title }); setSwapping(false) }
    catch (e) { alert('Swap failed: ' + e.message) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Module title bar ── */}
      <div style={{ padding: '13px 20px 11px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 20 }}>{mod?.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 15, color: 'var(--text-h)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod?.title}</div>
          <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 1 }}>{subject} · {cls} · {chapter}</div>
        </div>
        {isComplete && <span style={{ background: 'var(--accent-bg)', color: 'var(--accent)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓ Done</span>}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <GhostBtn small onClick={onPrev} disabled={!hasPrev}>← Prev</GhostBtn>
          <GhostBtn small onClick={onNext} disabled={!hasNext}>Next →</GhostBtn>
        </div>
      </div>

      {/* ── Tabs at top ── */}
      <div style={{ display: 'flex', gap: 2, padding: '7px 12px', background: 'var(--code-bg)', borderBottom: '1px solid var(--border)', flexShrink: 0, overflowX: 'auto' }}>
        {[['video', '▶ Video'], ['notes', '📝 Notes'], ['qa', `💬 Q&A (${qa.length})`], ['quiz', `🎯 Quiz (${quiz.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '7px 18px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Nunito', sans-serif", transition: 'all .15s', flexShrink: 0, background: tab === id ? 'var(--accent)' : 'transparent', color: tab === id ? '#fff' : 'var(--text)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* VIDEO */}
        {tab === 'video' && (
          <div>
            {currentVideoId ? (
              <>
                <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 13, overflow: 'hidden', background: '#000', boxShadow: '0 8px 28px rgba(0,0,0,.4)', marginBottom: 12 }}>
                  <iframe src={`https://www.youtube.com/embed/${currentVideoId}?rel=0&modestbranding=1`}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allowFullScreen title={mod?.title} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-h)' }}>{moduleData?.videoTitle || 'YouTube Video'}</div>
                    {moduleData?.videoChannel && <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 2 }}>📺 {moduleData.videoChannel}</div>}
                    <div style={{ fontSize: 11, marginTop: 3, color: moduleData?.transcriptStatus === 'success' ? '#6ee7b7' : '#94a3b8' }}>
                      {moduleData?.transcriptStatus === 'success' ? '✓ Transcript-based notes' : '🧠 AI knowledge used'}
                    </div>
                  </div>
                  {searchResults.length > 1 && <GhostBtn small onClick={() => setSwapping(!swapping)}>{swapping ? '✕ Close' : '🔄 Different Video'}</GhostBtn>}
                </div>
                {swapping && (
                  <Card style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-h)', marginBottom: 10 }}>Pick a different video:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {searchResults.map(v => (
                        <div key={v.videoId} onClick={() => swapVideo(v.videoId)}
                          style={{ display: 'flex', gap: 10, padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${v.videoId === currentVideoId ? 'var(--accent)' : 'var(--border)'}`, background: v.videoId === currentVideoId ? 'var(--accent-bg)' : 'transparent', cursor: 'pointer', alignItems: 'center', transition: 'all .15s' }}>
                          {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width: 80, height: 54, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-h)', marginBottom: 2 }}>{v.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--text)' }}>{v.channel}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                {mod?.keyTopics?.length > 0 && (
                  <Card style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-h)', marginBottom: 8 }}>🎯 What you'll learn</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {mod.keyTopics.map((t, i) => <span key={i} style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: 20, padding: '3px 11px', fontSize: 12, fontWeight: 700 }}>{t}</span>)}
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <div style={{ ...T.card, textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🎬</div>
                <p style={{ color: 'var(--text)', fontSize: 13 }}>No video found. Notes were generated from AI knowledge.</p>
              </div>
            )}
          </div>
        )}

        {/* NOTES */}
        {tab === 'notes' && (
          !moduleData ? <PageSpinner /> : !notes ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text)', fontSize: 13 }}>Notes not available.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {notes.summary && (
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 7, fontFamily: "'Sora', sans-serif" }}>Summary</div>
                  <p style={{ fontSize: 14, color: 'var(--text-h)', lineHeight: 1.8, margin: 0 }}>{notes.summary}</p>
                </div>
              )}
              {notes.keyConcepts?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>Key Concepts</div>
                  {notes.keyConcepts.map((c, i) => (
                    <div key={i} style={{ padding: '9px 13px', background: 'rgba(6,182,212,.05)', borderRadius: 9, border: '1px solid rgba(6,182,212,.1)', marginBottom: 6 }}>
                      <span style={{ fontSize: 12.5, color: '#38bdf8', fontWeight: 700 }}>{c.term}: </span>
                      <span style={{ fontSize: 13, color: 'var(--text)' }}>{c.definition}</span>
                    </div>
                  ))}
                </div>
              )}
              {notes.keyPoints?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>Key Points</div>
                  {notes.keyPoints.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 7, padding: '8px 11px', background: 'var(--code-bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                      <span style={{ fontSize: 13.5, color: 'var(--text-h)', lineHeight: 1.6 }}>{p}</span>
                    </div>
                  ))}
                </div>
              )}
              {notes.formulas?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>Formulas</div>
                  {notes.formulas.map((f, i) => (
                    <div key={i} style={{ padding: '9px 13px', background: 'rgba(245,158,11,.06)', borderRadius: 8, border: '1px solid rgba(245,158,11,.12)', fontFamily: 'monospace', fontSize: 13, color: '#fcd34d', marginBottom: 6 }}>{f}</div>
                  ))}
                </div>
              )}
              {notes.solvedExample && (
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>Solved Example</div>
                  <p style={{ fontSize: 13.5, color: 'var(--text-h)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap', padding: '13px 15px', background: 'rgba(16,185,129,.05)', borderRadius: 9, border: '1px solid rgba(16,185,129,.12)' }}>{notes.solvedExample}</p>
                </div>
              )}
              {notes.commonMistakes?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>Common Mistakes</div>
                  {notes.commonMistakes.map((m, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 13.5, color: 'var(--text-h)', lineHeight: 1.55 }}>
                      <span style={{ color: '#ef4444', flexShrink: 0 }}>✗</span>{m}
                    </div>
                  ))}
                </div>
              )}
              {notes.examTips?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>Exam Tips</div>
                  {notes.examTips.map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 13.5, color: 'var(--text-h)', lineHeight: 1.55 }}>
                      <span style={{ color: 'var(--accent)', flexShrink: 0 }}>★</span>{t}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {/* Q&A */}
        {tab === 'qa' && (
          !moduleData ? <PageSpinner /> : qa.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text)', fontSize: 13 }}>Q&A not available.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {qa.map((item, i) => (
                <div key={i} style={{ borderRadius: 11, border: `1px solid ${qaOpen === i ? 'var(--accent-border)' : 'var(--border)'}`, background: qaOpen === i ? 'var(--accent-bg)' : 'transparent', overflow: 'hidden', transition: 'all .15s' }}>
                  <div onClick={() => setQaOpen(qaOpen === i ? null : i)} style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 21, height: 21, borderRadius: '50%', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--accent)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>Q{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      {item.difficulty && <div style={{ fontSize: 10.5, fontWeight: 700, color: item.difficulty === 'Easy' ? '#22c55e' : item.difficulty === 'Hard' ? '#ef4444' : '#06b6d4', marginBottom: 3 }}>{item.difficulty}</div>}
                      <div style={{ fontSize: 13.5, color: 'var(--text-h)', lineHeight: 1.5 }}>{item.q}</div>
                    </div>
                    <span style={{ color: 'var(--text)', fontSize: 12, flexShrink: 0 }}>{qaOpen === i ? '▲' : '▼'}</span>
                  </div>
                  {qaOpen === i && (
                    <div style={{ padding: '0 14px 14px 45px', fontSize: 13.5, color: 'var(--text-h)', lineHeight: 1.8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      💡 {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* QUIZ */}
        {tab === 'quiz' && (
          !moduleData ? <PageSpinner /> : quiz.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text)', fontSize: 13 }}>Quiz not available.</div>
          ) : qDone ? (
            <div>
              <div style={{ padding: '28px', borderRadius: 16, background: `linear-gradient(135deg,${pct >= 80 ? '#6366F1' : pct >= 50 ? '#F59E0B' : '#EF4444'},${pct >= 80 ? '#8B5CF6' : pct >= 50 ? '#FBBF24' : '#F87171'})`, textAlign: 'center', color: '#fff', marginBottom: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 6 }}>{pct === 100 ? '🏆' : pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚'}</div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 32, marginBottom: 4 }}>{qScore}/{quiz.length}</div>
                <div style={{ fontSize: 14, opacity: .85, marginBottom: 14 }}>{pct >= 80 ? 'Excellent work!' : pct >= 50 ? 'Good effort!' : 'Keep practicing!'}</div>
                <button onClick={() => { setQAns({}); setQDone(false) }} style={{ padding: '7px 22px', borderRadius: 9, background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>↺ Retake</button>
              </div>
              {quiz.map((q, i) => (
                <Card key={i} style={{ marginBottom: 10, borderLeft: `4px solid ${qAns[i] === q.ans ? '#22c55e' : '#ef4444'}` }}>
                  <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 14, color: 'var(--text-h)' }}><span style={{ color: 'var(--accent)' }}>Q{i + 1}.</span> {q.q}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                    {q.opts.map((opt, j) => {
                      const isAns = j === q.ans, isSel = qAns[i] === j
                      return <div key={j} style={{ padding: '8px 11px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: `1.5px solid ${isAns ? '#6ee7b7' : isSel && !isAns ? '#fca5a5' : 'var(--border)'}`, background: isAns ? 'rgba(34,197,94,.08)' : isSel && !isAns ? 'rgba(239,68,68,.07)' : 'transparent', color: isAns ? '#6ee7b7' : isSel && !isAns ? '#fca5a5' : 'var(--text-h)' }}>{String.fromCharCode(65 + j)}. {opt}{isAns ? ' ✓' : ''}</div>
                    })}
                  </div>
                  {q.exp && <div style={{ padding: '8px 12px', background: 'var(--accent-bg)', borderRadius: 8, fontSize: 12.5, color: 'var(--accent)' }}>💡 {q.exp}</div>}
                </Card>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
                {quiz.map((_, i) => <div key={i} style={{ flex: '1 0 auto', maxWidth: 32, height: 4, borderRadius: 100, background: qAns[i] !== undefined ? 'var(--accent)' : 'rgba(255,255,255,.09)', transition: 'background .2s' }} />)}
              </div>
              {quiz.map((q, i) => (
                <Card key={i} style={{ marginBottom: 14 }}>
                  <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14.5, color: 'var(--text-h)', lineHeight: 1.45 }}><span style={{ color: 'var(--accent)' }}>Q{i + 1}.</span> {q.q}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {q.opts.map((opt, j) => (
                      <button key={j} onClick={() => setQAns(a => ({ ...a, [i]: j }))}
                        style={{ padding: '10px 13px', borderRadius: 9, border: `1.5px solid ${qAns[i] === j ? 'var(--accent)' : 'var(--border)'}`, background: qAns[i] === j ? 'var(--accent-bg)' : 'var(--code-bg)', color: qAns[i] === j ? 'var(--accent)' : 'var(--text-h)', cursor: 'pointer', textAlign: 'left', fontSize: 13.5, fontFamily: "'Nunito', sans-serif", fontWeight: 600, transition: 'all .15s' }}>
                        <span style={{ fontWeight: 800, marginRight: 5 }}>{String.fromCharCode(65 + j)}.</span>{opt}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
              {Object.keys(qAns).length === quiz.length && (
                <PrimaryBtn onClick={submitQuiz} color="#8B5CF6" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                  Submit Quiz ({Object.keys(qAns).length}/{quiz.length} answered) →
                </PrimaryBtn>
              )}
            </div>
          )
        )}

      </div>
    </div>
  )
}
