import { useState } from 'react'
import { downloadQPaperAsPDF } from '../utils/pdf'
import { printQPaper } from '../utils/print'

export function QPaperDocument({ paper, onPaperChange, schoolName, onSchoolNameChange }) {
  const [showAnswers, setShowAnswers] = useState(false)
  const [editingQ, setEditingQ] = useState(null)  // {sIdx, qIdx}
  const [editingInstr, setEditingInstr] = useState(null)

  const h = paper.header || {}

  function updateQuestion(sIdx, qIdx, field, value) {
    const updated = JSON.parse(JSON.stringify(paper))
    updated.sections[sIdx].questions[qIdx][field] = value
    onPaperChange(updated)
  }

  function updateOption(sIdx, qIdx, oIdx, value) {
    const updated = JSON.parse(JSON.stringify(paper))
    updated.sections[sIdx].questions[qIdx].options[oIdx] = value
    onPaperChange(updated)
  }

  function updateInstruction(idx, value) {
    const updated = JSON.parse(JSON.stringify(paper))
    updated.general_instructions[idx] = value
    onPaperChange(updated)
  }

  function addQuestion(sIdx) {
    const updated = JSON.parse(JSON.stringify(paper))
    const sec = updated.sections[sIdx]
    const lastNum = sec.questions[sec.questions.length - 1]?.number || 0
    sec.questions.push({ number: lastNum + 1, text: 'New question', options: [], marks: 2, answer: '', solution: '' })
    onPaperChange(updated)
  }

  function deleteQuestion(sIdx, qIdx) {
    const updated = JSON.parse(JSON.stringify(paper))
    updated.sections[sIdx].questions.splice(qIdx, 1)
    onPaperChange(updated)
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=IM+Fell+English&family=Source+Serif+4:wght@400;600;700&display=swap" rel="stylesheet"/>

      <div style={{ background: '#e8e6e0', borderRadius: 14, padding: '20px 16px', marginTop: 20 }}>

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }}/>)}
            <input value={schoolName} onChange={e => onSchoolNameChange(e.target.value)} placeholder="School Name" style={{ fontSize: 12, color: '#64748b', background: 'transparent', border: 'none', outline: 'none', fontFamily: "'Nunito', sans-serif", minWidth: 180 }}/>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setShowAnswers(v => !v)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: showAnswers ? '#1d4ed8' : '#fff', color: showAnswers ? '#fff' : '#374151', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
              {showAnswers ? '📖 Hide Answers' : '🔑 Show Answers'}
            </button>
            <button onClick={() => downloadQPaperAsPDF(paper, { schoolName, includeAnswers: false })}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
              ⬇ Paper PDF
            </button>
            <button onClick={() => downloadQPaperAsPDF(paper, { schoolName, includeAnswers: true })}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
              ⬇ With Answers
            </button>
            <button onClick={() => printQPaper(paper, { schoolName, includeAnswers: false })}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#1e3a5f', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
              🖨 Print Paper
            </button>
          </div>
        </div>

        {/* ── Paper document ── */}
        <div style={{ background: '#fff', borderRadius: 10, padding: 'clamp(24px,4vw,52px) clamp(18px,5vw,60px)', boxShadow: '0 4px 24px rgba(0,0,0,.12)', maxHeight: '78vh', overflowY: 'auto', fontFamily: "'Source Serif 4', Georgia, serif" }}>

          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 'clamp(15px,2.5vw,20px)', fontWeight: 700, letterSpacing: 1.5, marginBottom: 4, textTransform: 'uppercase' }}>
              {schoolName || 'School Name'}
            </div>
            <div style={{ fontSize: 13, marginBottom: 10, color: '#444' }}>
              {h.board || 'CBSE'} Examination — {h.year || '2024-25'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px', fontSize: 13, textAlign: 'left', maxWidth: 520, margin: '0 auto' }}>
              {[['Subject', h.subject], ['Class', h.class_level], ['Max. Marks', h.max_marks], ['Time', h.duration]].map(([l, v]) => (
                <div key={l} style={{ borderBottom: '1px solid #ddd', paddingBottom: 3 }}>
                  <span style={{ fontWeight: 700 }}>{l}: </span>{v}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, borderBottom: '1px dashed #ccc', paddingBottom: 3 }}>
              General Instructions:
            </div>
            {(paper.general_instructions || []).map((inst, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
                <span style={{ fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{i + 1}.</span>
                {editingInstr === i ? (
                  <input value={inst} onChange={e => updateInstruction(i, e.target.value)}
                    onBlur={() => setEditingInstr(null)} autoFocus
                    style={{ flex: 1, fontSize: 12, border: '1.5px solid #6366F1', borderRadius: 5, padding: '2px 6px', fontFamily: "'Source Serif 4', serif" }}/>
                ) : (
                  <span onClick={() => setEditingInstr(i)} style={{ fontSize: 12, color: '#374151', cursor: 'text', lineHeight: 1.6, flex: 1, padding: '1px 4px', borderRadius: 4, transition: 'background .15s' }}
                    onMouseEnter={e => e.target.style.background = '#f0f9ff'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}>{inst}</span>
                )}
              </div>
            ))}
          </div>

          {/* Sections */}
          {(paper.sections || []).map((sec, sIdx) => (
            <div key={sIdx} style={{ marginBottom: 20 }}>
              <div style={{ borderTop: '1.5px solid #000', borderBottom: '1px solid #000', padding: '6px 0', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {sec.name}
                </div>
                {sec.description && <div style={{ textAlign: 'center', fontSize: 12, color: '#555', marginTop: 3, fontStyle: 'italic' }}>{sec.description}</div>}
              </div>

              {(sec.questions || []).map((q, qIdx) => {
                const isEditing = editingQ?.sIdx === sIdx && editingQ?.qIdx === qIdx
                return (
                  <div key={qIdx} style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 8, border: isEditing ? '1.5px solid #6366F1' : '1px solid transparent', background: isEditing ? '#f8f7ff' : 'transparent', transition: 'all .15s' }}>

                    {/* Question header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ display: 'flex', gap: 6, flex: 1, alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 1 }}>Q{q.number}.</span>
                        {isEditing ? (
                          <textarea value={q.text} onChange={e => updateQuestion(sIdx, qIdx, 'text', e.target.value)}
                            style={{ flex: 1, fontSize: 13, border: '1px solid #d1d5db', borderRadius: 6, padding: '4px 8px', resize: 'vertical', minHeight: 60, fontFamily: "'Source Serif 4', serif" }}/>
                        ) : (
                          <span onClick={() => setEditingQ({ sIdx, qIdx })} style={{ fontSize: 13, lineHeight: 1.7, cursor: 'text', flex: 1, padding: '1px 4px', borderRadius: 4 }}
                            onMouseEnter={e => e.target.style.background = '#f0f9ff'}
                            onMouseLeave={e => e.target.style.background = 'transparent'}>{q.text}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 10 }}>
                        {isEditing ? (
                          <input type="number" value={q.marks} onChange={e => updateQuestion(sIdx, qIdx, 'marks', parseInt(e.target.value))}
                            style={{ width: 48, fontSize: 12, border: '1px solid #d1d5db', borderRadius: 5, padding: '2px 5px', textAlign: 'center' }}/>
                        ) : (
                          <span style={{ fontWeight: 700, fontSize: 12, background: '#1e3a5f', color: '#fff', padding: '2px 10px', borderRadius: 12 }}>{q.marks}M</span>
                        )}
                        <button onClick={() => setEditingQ(isEditing ? null : { sIdx, qIdx })}
                          style={{ padding: '2px 8px', borderRadius: 6, border: '1px solid #d1d5db', background: isEditing ? '#6366F1' : '#f8fafc', color: isEditing ? '#fff' : '#374151', fontSize: 11, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
                          {isEditing ? 'Done' : '✏️'}
                        </button>
                        <button onClick={() => deleteQuestion(sIdx, qIdx)}
                          style={{ padding: '2px 7px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff5f5', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>

                    {/* Options */}
                    {q.options?.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px', margin: '6px 0 4px 24px' }}>
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {isEditing ? (
                              <input value={opt} onChange={e => updateOption(sIdx, qIdx, oIdx, e.target.value)}
                                style={{ flex: 1, fontSize: 12, border: '1px solid #d1d5db', borderRadius: 5, padding: '2px 6px', fontFamily: "'Source Serif 4', serif" }}/>
                            ) : (
                              <span style={{ fontSize: 12.5, color: '#374151' }}>{opt}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Answer lines */}
                    {!showAnswers && (
                      <div style={{ marginTop: 6, marginLeft: 24 }}>
                        {Array(Math.min(q.marks >= 5 ? q.marks : 2, 6)).fill(0).map((_, li) => (
                          <div key={li} style={{ borderBottom: '1px solid #ccc', height: 20, marginBottom: 2 }}/>
                        ))}
                      </div>
                    )}

                    {/* Answer key (visible when toggled) */}
                    {showAnswers && (
                      <div style={{ marginTop: 8, marginLeft: 24, padding: '8px 12px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: isEditing ? 4 : 0 }}>
                          Answer:&nbsp;
                          {isEditing ? (
                            <input value={q.answer} onChange={e => updateQuestion(sIdx, qIdx, 'answer', e.target.value)}
                              style={{ fontSize: 12, border: '1px solid #bfdbfe', borderRadius: 5, padding: '2px 8px', fontFamily: "'Source Serif 4', serif", width: '90%' }}/>
                          ) : (
                            <span style={{ fontWeight: 400, color: '#1e40af' }}>{q.answer}</span>
                          )}
                        </div>
                        {(q.solution || isEditing) && (
                          <div style={{ fontSize: 11.5, color: '#374151', marginTop: 4 }}>
                            <span style={{ fontWeight: 600 }}>Solution: </span>
                            {isEditing ? (
                              <textarea value={q.solution || ''} onChange={e => updateQuestion(sIdx, qIdx, 'solution', e.target.value)}
                                style={{ width: '100%', fontSize: 11.5, border: '1px solid #bfdbfe', borderRadius: 5, padding: '3px 8px', resize: 'vertical', fontFamily: "'Source Serif 4', serif" }} rows={2}/>
                            ) : q.solution}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Add question button */}
              <button onClick={() => addQuestion(sIdx)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 8, border: '1.5px dashed #94a3b8', background: 'transparent', color: '#64748b', fontSize: 12, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", marginTop: 4 }}>
                + Add Question to {sec.name}
              </button>
            </div>
          ))}

          <div style={{ textAlign: 'center', fontSize: 12, color: '#888', marginTop: 16, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
            — End of Question Paper —
          </div>
        </div>
      </div>
    </>
  )
}
