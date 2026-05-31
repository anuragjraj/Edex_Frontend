import { useState, useEffect } from 'react'
import { MultiChapterSelect } from '../../components/MultiChapterSelect'
import { QPaperDocument } from '../../components/QPaperDocument'
import { XPBadge } from '../../components/ui/Badge'
import { GhostBtn, PrimaryBtn } from '../../components/ui/Button'
import { ErrMsg, Spinner, SuccessMsg } from '../../components/ui/Feedback'
import { BSInput, BSSelect, BSTextarea } from '../../components/ui/Input'
import { Card, Field, PageHeader } from '../../components/ui/Layout'
import { CLASSES, SUBJECTS } from '../../constants/subjects'
import { api } from '../../lib/apiClient'
import { saveSessionContent } from '../../lib/sessions'

// ══════════════════════════════════════════════════════════════
//  QUESTION PAPER MAKER
// ══════════════════════════════════════════════════════════════
export function QPMaker({ user, prefill, onClearPrefill }) {
  const [subject, setSubject] = useState('Mathematics')
  const [cls, setCls] = useState('Class 10')
  const [chapters, setChapters] = useState([])
  const [marks, setMarks] = useState('80')
  const [duration, setDuration] = useState('3 Hours')
  const [desc, setDesc] = useState('')
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')
  const [schoolName, setSchoolName] = useState('')

  useEffect(() => {
    if (!prefill) return
    if (prefill.subject) setSubject(prefill.subject)
    if (prefill.chapters?.length) setChapters(prefill.chapters)
    else if (prefill.chapter) setChapters([prefill.chapter])
    onClearPrefill?.()
  }, [])

  const buildPrompt = () => {
  const totalMarks = parseInt(marks)

  // ── Exact distribution calculator ──────────────────────────
  let nA = 0, nB = 0, nC = 0, nD = 0

  if (totalMarks <= 20) {
    nA = Math.ceil(totalMarks * 0.5)
    nB = Math.floor((totalMarks - nA) / 2)
    // absorb any remainder into nA
    const rem = totalMarks - (nA * 1) - (nB * 2)
    if (rem > 0) nA += rem
  } else if (totalMarks <= 40) {
    nA = Math.round(totalMarks * 0.25)
    nB = Math.round((totalMarks * 0.375) / 2)
    nC = Math.round((totalMarks * 0.375) / 3)
  } else {
    nA = Math.round(totalMarks * 0.25)
    nB = Math.round((totalMarks * 0.25) / 2)
    nC = Math.round((totalMarks * 0.25) / 3)
    nD = Math.round((totalMarks * 0.25) / 5)
  }

  // ── Fix rounding so it sums to exactly totalMarks ───────────
  let gap = totalMarks - (nA*1 + nB*2 + nC*3 + nD*5)
  let safety = 50
  while (gap !== 0 && safety-- > 0) {
    if      (gap >= 5)  { nD++; gap -= 5 }
    else if (gap >= 3)  { nC++; gap -= 3 }
    else if (gap >= 2)  { nB++; gap -= 2 }
    else if (gap >= 1)  { nA++; gap -= 1 }
    else if (gap <= -5 && nD > 0) { nD--; gap += 5 }
    else if (gap <= -3 && nC > 0) { nC--; gap += 3 }
    else if (gap <= -2 && nB > 0) { nB--; gap += 2 }
    else if (gap <= -1 && nA > 0) { nA--; gap += 1 }
    else break
  }

  const secA = nA*1, secB = nB*2, secC = nC*3, secD = nD*5
  const totalQ = nA + nB + nC + nD
  const computed = secA + secB + secC + secD

  // Verify — should always be 0
  console.log(`[QPMaker] ${totalMarks}M → A:${nA}×1=${secA} B:${nB}×2=${secB} C:${nC}×3=${secC} D:${nD}×5=${secD} = ${computed} (gap:${totalMarks - computed})`)

  // ── Sequential question numbering ───────────────────────────
  let q = 1
  const a1 = q,         a2 = q + nA - 1;       q += nA
  const b1 = q,         b2 = q + nB - 1;       q += nB
  const c1 = q,         c2 = q + nC - 1;       q += nC
  const d1 = q,         d2 = q + nD - 1

  // ── Build example question templates per section ─────────────
  const makeExampleMCQ = (num) =>
    `{"number":${num},"text":"Write your question here","options":["A. option one","B. option two","C. option three","D. option four"],"marks":1,"answer":"A. option one","solution":"Explanation why A is correct"}`

  const makeExampleShort = (num) =>
    `{"number":${num},"text":"Write your question here","options":[],"marks":2,"answer":"Model answer in 2-3 sentences","solution":"Step-by-step working"}`

  const makeExampleMedium = (num) =>
    `{"number":${num},"text":"Write your question here","options":[],"marks":3,"answer":"Detailed model answer","solution":"Complete step-by-step solution"}`

  const makeExampleLong = (num) =>
    `{"number":${num},"text":"Write your question here","options":[],"marks":5,"answer":"Comprehensive model answer","solution":"Full detailed solution with all steps"}`

  return `You are a senior CBSE examiner with 20 years of experience setting board papers.

═══════════════════════════════════════════════════════
PAPER SPECIFICATION — FOLLOW EVERY POINT EXACTLY
═══════════════════════════════════════════════════════
Subject    : ${subject}
Class      : ${cls}
Chapters   : ${chapters.join(', ')}
Total Marks: ${totalMarks}
Duration   : ${duration}
${desc ? `Special Notes: ${desc}` : ''}

MANDATORY SECTION BREAKDOWN — DO NOT CHANGE THESE NUMBERS:
${nA > 0 ? `Section A : ${nA} MCQ questions  ×  1 mark  =  ${secA} marks  (Q${a1}–Q${a2})` : ''}
${nB > 0 ? `Section B : ${nB} short questions ×  2 marks =  ${secB} marks  (Q${b1}–Q${b2})` : ''}
${nC > 0 ? `Section C : ${nC} questions       ×  3 marks =  ${secC} marks  (Q${c1}–Q${c2})` : ''}
${nD > 0 ? `Section D : ${nD} long questions  ×  5 marks =  ${secD} marks  (Q${d1}–Q${d2})` : ''}
GRAND TOTAL: ${computed} marks  ← must match exactly

NON-NEGOTIABLE RULES:
1. Section A questions MUST have "marks": 1  (exactly 1, never 2 or more)
2. Section B questions MUST have "marks": 2  (exactly 2, never 1 or 3)
3. Section C questions MUST have "marks": 3  (exactly 3, never 2 or 5)
4. Section D questions MUST have "marks": 5  (exactly 5, never 3 or 4)
5. Question numbers must run sequentially from 1 to ${totalQ} — no gaps, no repeats
6. Section A options: exactly 4, labeled "A. ...", "B. ...", "C. ...", "D. ..."
7. Section B/C/D options: empty array []
8. ZERO emojis, ZERO asterisks, ZERO markdown, ZERO special symbols in any field
9. Questions must be genuinely exam-quality, CBSE-standard, chapter-appropriate
10. Every question needs a correct "answer" and a brief "solution"
═══════════════════════════════════════════════════════

Return ONLY this exact JSON (no markdown fences, no explanation before or after):

{
  "header": {
    "subject": "${subject}",
    "class_level": "${cls}",
    "board": "CBSE",
    "max_marks": ${totalMarks},
    "duration": "${duration}",
    "year": "2024-25"
  },
  "general_instructions": [
    "All questions are compulsory.",
    "This paper consists of ${totalQ} questions in ${[nA>0,nB>0,nC>0,nD>0].filter(Boolean).length} sections.",
    ${nA > 0 ? `"Section A: ${nA} Multiple Choice Questions of 1 mark each.",` : ''}
    ${nB > 0 ? `"Section B: ${nB} Short Answer Questions of 2 marks each.",` : ''}
    ${nC > 0 ? `"Section C: ${nC} Questions of 3 marks each.",` : ''}
    ${nD > 0 ? `"Section D: ${nD} Long Answer Questions of 5 marks each.",` : ''}
    "Draw neat, labelled diagrams wherever required.",
    "Show all working steps to earn full credit."
  ],
  "sections": [
    ${nA > 0 ? `{
      "name": "Section A",
      "type": "mcq",
      "description": "Multiple Choice Questions. Select the most appropriate answer. (${nA} x 1 = ${secA} Marks)",
      "marks_per_question": 1,
      "questions": [
        ${Array.from({length: nA}, (_, i) => makeExampleMCQ(a1 + i)).join(',\n        ')}
      ]
    }` : ''}${nA > 0 && nB > 0 ? ',' : ''}
    ${nB > 0 ? `{
      "name": "Section B",
      "type": "short",
      "description": "Short Answer Questions. Answer in 2-3 sentences. (${nB} x 2 = ${secB} Marks)",
      "marks_per_question": 2,
      "questions": [
        ${Array.from({length: nB}, (_, i) => makeExampleShort(b1 + i)).join(',\n        ')}
      ]
    }` : ''}${nB > 0 && nC > 0 ? ',' : ''}
    ${nC > 0 ? `{
      "name": "Section C",
      "type": "medium",
      "description": "Answer the following questions. (${nC} x 3 = ${secC} Marks)",
      "marks_per_question": 3,
      "questions": [
        ${Array.from({length: nC}, (_, i) => makeExampleMedium(c1 + i)).join(',\n        ')}
      ]
    }` : ''}${nC > 0 && nD > 0 ? ',' : ''}
    ${nD > 0 ? `{
      "name": "Section D",
      "type": "long",
      "description": "Long Answer Questions. Answer in detail. (${nD} x 5 = ${secD} Marks)",
      "marks_per_question": 5,
      "questions": [
        ${Array.from({length: nD}, (_, i) => makeExampleLong(d1 + i)).join(',\n        ')}
      ]
    }` : ''}
  ]
}`
}

  // ── Validate and fix marks after parsing ───────────────────
function validateAndFixPaper(parsed) {
  const sectionMarkMap = { mcq: 1, short: 2, medium: 3, long: 5 }
  let runningNum = 1

  for (const sec of parsed.sections || []) {
    const expectedMarks = sectionMarkMap[sec.type] || sec.marks_per_question || 1
    for (const q of sec.questions || []) {
      // Force correct marks regardless of what AI returned
      q.marks = expectedMarks
      // Fix sequential numbering
      q.number = runningNum++
      // Remove any stray symbols from text
      q.text = (q.text || '').replace(/\*\*/g, '').replace(/[^\x00-\x7F]/g, '').trim()
      q.answer = (q.answer || '').replace(/\*\*/g, '').trim()
      q.solution = (q.solution || '').replace(/\*\*/g, '').trim()
      // Fix options
      if (q.options) q.options = q.options.map(o => o.replace(/\*\*/g, '').replace(/[^\x00-\x7F]/g, '').trim())
    }
  }
  return parsed
}

// Inside generate():
async function generate() {
  if (chapters.length === 0) return alert('Please select at least one chapter')
  setErr(''); setLoading(true); setSaved(false); setPaper(null)
  try {
    const r = await api.post('/api/ai/paper', {
      messages: [{ role: 'user', content: buildPrompt() }],
      subject, chapters
    })
    const raw = typeof r.content === 'string' ? r.content : r.content[0]?.text || ''
    let parsed = JSON.parse(raw.replace(/```[\w]*\n?/gi, '').trim())
    if (!parsed.sections) throw new Error('Invalid paper structure')

    // ✅ Always fix marks and numbering after AI response
    parsed = validateAndFixPaper(parsed)

    // ✅ Show mark summary in UI
    const total = parsed.sections.reduce((sum, sec) =>
      sum + sec.questions.reduce((s, q) => s + q.marks, 0), 0)
    if (total !== parseInt(marks)) {
      console.warn(`[QPMaker] Mark mismatch: expected ${marks}, got ${total}`)
    }

    setPaper(parsed)
    saveSessionContent({ tool:'paper', subject, chapters, classLevel:cls, content:parsed, extra:{ marks, duration } })
  } catch (e) {
    if (e.status === 402) setErr('Free trial ended. Please subscribe.')
    else setErr('Failed to generate paper. Try again.')
  }
  setLoading(false)
}

  return (
    <div style={{ padding: 24, width: '100%', boxSizing: 'border-box', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <PageHeader icon="📄" title="Question Paper Maker" subtitle="Standard CBSE papers with answer key — edit questions inline, print or download PDF" color="#8B5CF6"/>

      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 4 }}>
          <Field label="Subject"><BSSelect value={subject} onChange={v => { setSubject(v); setChapters([]) }} options={SUBJECTS}/></Field>
          <Field label="Class"><BSSelect value={cls} onChange={v => { setCls(v); setChapters([]) }} options={CLASSES}/></Field>
          <Field label="Total Marks"><BSSelect value={marks} onChange={setMarks} options={['10','20','25','30','40','50','60','70','80','100']}/></Field>
          <Field label="Duration"><BSSelect value={duration} onChange={setDuration} options={['30 min','45 min','1 Hour','1.5 Hours','2 Hours','2.5 Hours','3 Hours']}/></Field>
        </div>
        <Field label="School Name (for header)">
          <BSInput value={schoolName} onChange={setSchoolName} placeholder="e.g. Delhi Public School"/>
        </Field>
        <Field label={`Select Chapters${chapters.length > 0 ? ` (${chapters.length} selected)` : ''}`}>
  <MultiChapterSelect subject={subject} cls={cls} selected={chapters} onChange={setChapters} />
</Field>
        <Field label="Additional Instructions (optional)">
          <BSTextarea value={desc} onChange={setDesc} rows={2} placeholder="e.g. 'Focus on derivations', 'Include case study', 'Competency-based questions'"/>
        </Field>
        <PrimaryBtn onClick={generate} disabled={loading || chapters.length === 0} color="#8B5CF6">
          {loading ? <><Spinner/> Generating paper...</> : `📄 Generate ${marks}M Paper`}
        </PrimaryBtn>
      </Card>

      <ErrMsg msg={err}/>

      {paper && (
        <>
          <QPaperDocument
            paper={paper}
            onPaperChange={setPaper}
            schoolName={schoolName}
            onSchoolNameChange={setSchoolName}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {!saved
              ? <GhostBtn small onClick={async () => {
                  try {
                    await api.post('/api/user/papers', { subject, classLevel: cls, chapters, marks: parseInt(marks), duration, description: desc, content: JSON.stringify(paper) })
                    setSaved(true)
                  } catch (e) { alert(e.message) }
                }}>💾 Save Paper</GhostBtn>
              : <SuccessMsg msg="Saved!"/>
            }
          </div>
        </>
      )}
      <XPBadge amount={25} label="per paper generated"/>
    </div>
  )
}
