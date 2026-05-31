import { useState, useEffect } from 'react'
import { XPBadge } from '../../components/ui/Badge'
import { GhostBtn, PrimaryBtn } from '../../components/ui/Button'
import { ErrMsg, Spinner } from '../../components/ui/Feedback'
import { BSInput, BSSelect } from '../../components/ui/Input'
import { Card, Field, PageHeader } from '../../components/ui/Layout'
import { CLASSES, SUBJECTS, getChapters } from '../../constants/subjects'
import { api } from '../../lib/apiClient'
import { saveSessionContent } from '../../lib/sessions'

// ══════════════════════════════════════════════════════════════
//  QUIZ GENERATOR
// ══════════════════════════════════════════════════════════════
export function QuizGenerator({ user, prefill, onClearPrefill }) {
  const [subject,   setSubject]   = useState('Mathematics')
  const [cls,       setCls]       = useState('Class 10')
  const [chapter,   setChapter]   = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [diff,      setDiff]      = useState('Medium')
  const [num,       setNum]       = useState('5')
  const [quiz,      setQuiz]      = useState(null)
  const [answers,   setAnswers]   = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [err,       setErr]       = useState('')

  const chapters = getChapters(subject, cls)
  const topic    = chapter || customTopic   // what gets sent to the AI

  useEffect(() => {
    if (!prefill) return
    if (prefill.subject) setSubject(prefill.subject)
    if (prefill.chapter) setChapter(prefill.chapter)
    onClearPrefill?.()
  }, [])

  async function generate() {
    if (!topic.trim()) return alert('Please select or enter a chapter/topic')
    const PROMPT = `Generate a high-quality ${num}-question MCQ quiz on "${topic}" in ${subject} ${cls}. Difficulty: ${diff}. CBSE-standard exam-style questions.
Return ONLY valid JSON (no markdown):
{"title":"${topic} Quiz","questions":[{"q":"Question text?","options":["Option A","Option B","Option C","Option D"],"answer":0,"explanation":"Why this option is correct"}]}`
    setErr(''); setLoading(true); setQuiz(null); 
    try {
      const r = await api.post('/api/ai/quiz', { messages: [{ role: 'user', content: PROMPT }], subject, chapter: topic })
      const raw = typeof r.content === 'string' ? r.content : r.content[0]?.text || ''
      const parsed = JSON.parse(raw.replace(/```[\w]*\n?/gi, '').trim())
      setQuiz(parsed)
      saveSessionContent({ tool:'quiz', subject, chapter:topic, classLevel:cls, content:parsed }); setAnswers({}); setSubmitted(false)
    } catch (e) {
      if (e.status === 402) setErr('Free trial ended. Please subscribe.')
      else setErr('Failed to generate quiz. Try again.')
    }
    setLoading(false)
  }

  async function submit() {
    setSubmitted(true)
    const correct = quiz.questions.filter((q, i) => answers[i] === q.answer).length
    const xpEarned = Math.round((correct / quiz.questions.length) * 50) + 5
    try { await api.post('/api/user/quiz-history', { subject, topic, difficulty: diff, totalQuestions: quiz.questions.length, correctAnswers: correct, xpEarned, isPerfect: correct === quiz.questions.length }) } catch {}
  }

  const score = submitted ? quiz.questions.filter((q, i) => answers[i] === q.answer).length : 0
  const pct   = submitted ? Math.round((score / quiz.questions.length) * 100) : 0

  return (
    <div style={{ padding: 24, width: '100%', boxSizing: 'border-box', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <PageHeader icon="🎯" title="Quiz Generator" subtitle="Auto-generate MCQ quizzes with instant scoring and explanations" color="#F59E0B" />

      {!quiz ? (
        <Card>
          {/* Row 1: Subject + Class + Question count */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 4 }}>
            <Field label="Subject">
              <BSSelect value={subject} onChange={v => { setSubject(v); setChapter('') }} options={SUBJECTS} />
            </Field>
            <Field label="Class">
              <BSSelect value={cls} onChange={v => { setCls(v); setChapter('') }} options={CLASSES} />
            </Field>
            <Field label="Questions">
              <BSSelect value={num} onChange={setNum} options={['5','8','10','15']} />
            </Field>
            <Field label="Difficulty">
              <BSSelect value={diff} onChange={setDiff} options={['Easy','Medium','Hard','Mixed']} />
            </Field>
          </div>

          {/* Chapter dropdown */}
          <Field label="Chapter">
            <BSSelect
              value={chapter}
              onChange={setChapter}
              options={[{ value: '', label: '── Select a Chapter ──' }, ...chapters.map(c => ({ value: c, label: c }))]}
            />
          </Field>

          {/* Custom topic fallback */}
          {!chapter && (
            <Field label="Or enter a custom topic">
              <BSInput value={customTopic} onChange={setCustomTopic} placeholder="e.g. Organic Chemistry, World War II, Trigonometry" />
            </Field>
          )}

          <ErrMsg msg={err} />
          <PrimaryBtn onClick={generate} disabled={loading || !topic.trim()} color="#F59E0B" style={{ marginTop: 4 }}>
            {loading ? <><Spinner /> Generating…</> : '✨ Generate Quiz'}
          </PrimaryBtn>
        </Card>
      ) : (
        <div>
          {submitted && (
            <div style={{ background: `linear-gradient(135deg,${pct >= 80 ? '#F97316' : '#F59E0B'},${pct >= 80 ? '#FB923C' : '#FBBF24'})`, borderRadius: 18, padding: 24, textAlign: 'center', color: '#fff', marginBottom: 18 }}>
              <div style={{ fontSize: 48, marginBottom: 6 }}>{pct === 100 ? '🏆' : pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚'}</div>
              <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 900, margin: '0 0 6px' }}>{score}/{quiz.questions.length}</h3>
              <p style={{ opacity: .9, marginBottom: 10 }}>{pct === 100 ? 'Perfect score! 🌟' : pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Good effort!' : 'Keep practicing!'}</p>
              <div style={{ background: 'rgba(255,255,255,.2)', padding: '4px 16px', borderRadius: 20, display: 'inline-block', fontWeight: 700, fontSize: 13 }}>+{Math.round((score / quiz.questions.length) * 50) + 5} XP ⚡</div>
              <br /><br />
              <GhostBtn small onClick={() => { setQuiz(null); setAnswers({}); setSubmitted(false) }} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff' }}>New Quiz</GhostBtn>
            </div>
          )}
          <h3 style={{ marginBottom: 18, fontFamily: "'Sora', sans-serif", color: 'var(--text-h)' }}>{quiz.title}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(400px,1fr))', gap: 14 }}>
            {quiz.questions.map((q, i) => {
              const sel = answers[i], correct = q.answer, isRight = submitted && sel === correct, isWrong = submitted && sel !== undefined && sel !== correct
              return (
                <Card key={i} style={{ borderLeft: submitted ? `4px solid ${isRight ? '#22c55e' : isWrong ? '#ef4444' : 'var(--border)'}` : '' }}>
                  <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14.5, color: 'var(--text-h)' }}><span style={{ color: 'var(--accent)' }}>Q{i + 1}.</span> {q.q}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {q.options.map((opt, j) => {
                      const isSelected = sel === j, isAnswer = j === correct
                      let bg = 'var(--social-bg)', border = 'var(--border)', color = 'var(--text-h)'
                      if (submitted) { if (isAnswer) { bg = 'rgba(16,185,129,.1)'; border = '#6ee7b7'; color = '#6ee7b7' } else if (isSelected && !isAnswer) { bg = 'rgba(239,68,68,.1)'; border = '#fca5a5'; color = '#fca5a5' } }
                      else if (isSelected) { bg = 'var(--accent-bg)'; border = 'var(--accent)'; color = 'var(--accent)' }
                      return <button key={j} disabled={submitted} onClick={() => setAnswers(a => ({ ...a, [i]: j }))} style={{ padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${border}`, background: bg, color, cursor: submitted ? 'default' : 'pointer', textAlign: 'left', fontSize: 13.5, fontFamily: "'Nunito', sans-serif", fontWeight: 600, transition: 'all .15s' }}><span style={{ fontWeight: 800, marginRight: 4 }}>{String.fromCharCode(65 + j)}.</span>{opt}{submitted && isAnswer ? ' ✓' : ''}</button>
                    })}
                  </div>
                  {submitted && q.explanation && <div style={{ marginTop: 11, padding: '9px 13px', background: 'var(--accent-bg)', borderRadius: 9, fontSize: 13, color: 'var(--accent)' }}>💡 {q.explanation}</div>}
                </Card>
              )
            })}
          </div>
          {!submitted && <PrimaryBtn onClick={submit} disabled={Object.keys(answers).length < quiz.questions.length} color="#F59E0B" style={{ marginTop: 16 }}>Submit ({Object.keys(answers).length}/{quiz.questions.length} answered) →</PrimaryBtn>}
        </div>
      )}
      <XPBadge amount="5–50" label="per quiz" />
    </div>
  )
}
