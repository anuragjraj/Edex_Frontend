import { useState, useEffect } from 'react'
import { NotesDocument } from '../../components/NotesDocument'
import { XPBadge } from '../../components/ui/Badge'
import { GhostBtn, PrimaryBtn } from '../../components/ui/Button'
import { ErrMsg, Spinner, SuccessMsg } from '../../components/ui/Feedback'
import { BSInput, BSSelect } from '../../components/ui/Input'
import { Card, Field, PageHeader } from '../../components/ui/Layout'
import { CLASSES, SUBJECTS, getChapters } from '../../constants/subjects'
import { api } from '../../lib/apiClient'
import { loadSavedContent, saveSessionContent } from '../../lib/sessions'
import { downloadText } from '../../utils/download'

// ══════════════════════════════════════════════════════════════
//  NOTES MAKER
// ══════════════════════════════════════════════════════════════
export function NotesMaker({ user, prefill, onClearPrefill }) {
  const [subject,setSubject]=useState('Mathematics'); const [cls,setCls]=useState('Class 10')
  const [chapter,setChapter]=useState(''); const [customCh,setCustomCh]=useState(''); const [style_,setStyle_]=useState('Detailed')
  const [result,setResult]=useState(''); const [loading,setLoading]=useState(false); const [saved,setSaved]=useState(false); const [err,setErr]=useState('')
  const chapters=getChapters(subject,cls); const finalChapter=chapter||customCh||chapters[0]

  const STYLE_INSTRUCTIONS = {
  'Detailed': `Write in thorough prose under every heading. Explain the "why" behind every concept, not just the "what". Every sub-topic gets its own ### heading with at least 3-4 full paragraphs of explanation.`,
  'Concise': `Write in tight, information-dense paragraphs. No filler. Every sentence must carry a fact, definition, or insight useful for exams.`,
  'Bullet Points': `Use nested bullet points throughout. Main bullets = concepts. Sub-bullets = explanation, example, formula. Every bullet must be a complete, exam-useful thought — not just a label.`,
  'Q&A Format': `Present every concept as a Question followed by a detailed Answer. Use the format:\n**Q: [question]**\nA: [full answer with examples]. Minimum 20 Q&A pairs covering all sub-topics.`,
  'Mind Map Style': `Organize as a hierarchy: Chapter → Topics → Sub-topics → Key facts/formulas/examples. Use indentation and bold headings to show relationships clearly. Still write full explanatory sentences under each node.`,
}

const buildPrompt = () => `You are a world-class CBSE textbook author and examiner with 20+ years of experience. Your task is to write EXHAUSTIVE, publication-quality study notes.

SUBJECT: ${subject} | CLASS: ${cls} | CHAPTER: "${finalChapter}" | BOARD: CBSE
STYLE: ${style_}

STYLE INSTRUCTION: ${STYLE_INSTRUCTIONS[style_] || STYLE_INSTRUCTIONS['Detailed']}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT REQUIREMENTS — YOU MUST FOLLOW ALL OF THESE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✦ MINIMUM LENGTH: 3500 words. Do NOT stop writing until you have covered every single sub-topic completely.
✦ COVER EVERYTHING: List every sub-topic of this chapter from the CBSE textbook and cover each one in depth.
✦ DO NOT SKIP: If you are running out of content, that means you have not gone deep enough. Go deeper.
✦ REAL EXAMPLES: Every concept needs a real-world example or a worked numerical example.
✦ EXAM FOCUS: After every major concept, add a line: "📝 Exam tip: [specific tip for this concept]"
✦ BOLD only key terms on their FIRST use.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ${finalChapter}
**Subject:** ${subject} | **Class:** ${cls} | **Board:** CBSE 2024-25

---

## 1. 📌 Chapter Overview & Importance
- Where this chapter fits in the bigger picture of ${subject}
- Real-world relevance and applications
- How many marks this chapter carries in board exams and which types of questions appear
- What you will know by the end of these notes

---

## 2. 🧠 Core Concepts — Full Explanation
### [Write a separate ### sub-section for EVERY concept and sub-topic in this chapter]
For each concept:
- Full definition (formal + in simple language)  
- How it works and WHY it works that way  
- The underlying principle or theory  
- At least one real-world or relatable example  
- Common student confusions about this concept, corrected  
- 📝 Exam tip for this concept

---

## 3. 📐 All Formulas, Laws & Rules
For EVERY formula in this chapter:
- Write the formula clearly
- Define every variable/symbol
- State the units (SI and CGS if applicable)
- Derive it step-by-step where possible (derivations are frequently asked in boards)
- State the conditions under which it applies
- State when it does NOT apply
- Give one solved numerical using each formula

---

## 4. 🔢 Solved Examples (Minimum 5)
Pick examples ranging from easy to board-exam level:
- State the problem clearly
- Identify what is given and what is asked
- Write the complete step-by-step solution
- Highlight the key step where most students make errors
- State the final answer with correct units

---

## 5. 🎯 Exam-Pattern Questions with Model Answers
Include ALL question types the CBSE board asks from this chapter:
- 5 × 1-mark questions (with answers)
- 4 × 2-mark questions (with answers)
- 3 × 3-mark questions (with answers)
- 2 × 5-mark questions (with answers)
For each, write a complete model answer as a CBSE examiner would expect it.

---

## 6. ⚡ Quick Revision — Chapter at a Glance
- All definitions in one line each
- All formulas listed together
- All laws/rules in one line each
- Key relationships between concepts (e.g. "If X increases, Y decreases because...")
- The 5 most important facts to remember before the exam

---

## 7. ⚠️ Common Mistakes & How to Avoid Them
List at least 8 specific mistakes students make in this chapter in exams.
For each: describe the mistake, explain why it is wrong, show the correct approach.

---

## 8. 📅 Previous Year CBSE Question Patterns
- Which sub-topics are asked most frequently (last 5 years trend)
- Which sub-topics carry the most marks
- Which sub-topics are likely to appear this year
- Specific previous year questions (2019-2024) from this chapter with answers

---

## 9. 🔗 Connections to Other Chapters
- Which previous chapters are prerequisites for understanding this chapter
- Which future chapters build on what you learn here
- How this chapter connects to real-world problems or other subjects

---

FINAL REMINDER: You must write AT LEAST 3500 words. Every section above must be fully populated with real, detailed, exam-relevant content. Do not write placeholder text or headings without content.`



  useEffect(() => {
    if (!prefill) return
    if (prefill.subject) setSubject(prefill.subject)
    if (prefill.chapter) { setChapter(prefill.chapter); setCustomCh('') }
    onClearPrefill?.()
    // Try to load previously saved note
    loadSavedContent('notes', prefill.subject, prefill.chapter, []).then(content => {
      if (content) { setResult(content); setSaved(true) }
    })
  }, [])

  async function generate() {
    if(!finalChapter) return; setErr(''); setLoading(true); setSaved(false)
    try{ const r=await api.post('/api/ai/notes',{messages:[{role:'user',content:buildPrompt()}],subject,chapter:finalChapter}); setResult(r.content)   
    saveSessionContent({ tool:'notes', subject, chapter:finalChapter, classLevel:cls, content:r.content })}
    catch(e){ if(e.status===402){setErr('Free trial ended. Please subscribe.')}else{setErr(e.message)} }
    setLoading(false)
  }
  async function saveNote() { try{await api.post('/api/user/notes',{subject,classLevel:cls,chapter:finalChapter,style:style_,content:result});setSaved(true)}catch(e){alert(e.message)} }

  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <PageHeader icon="📖" title="Chapter Notes Maker" subtitle="Textbook-quality comprehensive notes — download or print as PDF" color="#10B981"/>
      <Card style={{ marginBottom:18 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:4 }}>
          <Field label="Subject"><BSSelect value={subject} onChange={v=>{setSubject(v);setChapter('')}} options={SUBJECTS}/></Field>
          <Field label="Class"><BSSelect value={cls} onChange={setCls} options={CLASSES}/></Field>
        </div>
        <Field label="Chapter">
          <BSSelect value={chapter} onChange={setChapter} options={[{value:'',label:'-- Select Chapter --'},...chapters.map(c=>({value:c,label:c}))]}/>
        </Field>
        {!chapter&&<Field label="Or enter chapter name manually"><BSInput value={customCh} onChange={setCustomCh} placeholder="e.g. Gravitation, Mughal Empire"/></Field>}
        <Field label="Notes Style"><BSSelect value={style_} onChange={setStyle_} options={['Detailed','Concise','Bullet Points','Q&A Format','Mind Map Style']}/></Field>
        <PrimaryBtn onClick={generate} disabled={loading||(!chapter&&!customCh)} color="#10B981">{loading?<><Spinner/> Generating notes...</>:'📖 Generate Comprehensive Notes'}</PrimaryBtn>
      </Card>
      <ErrMsg msg={err}/>
      {result&&<>
  <NotesDocument
    content={result}
    title={`${finalChapter} Notes — ${subject} ${cls}`}
    onDownload={()=>downloadText(result,`${finalChapter}-notes.txt`)}
  />
  <div style={{ display:'flex', gap:8, marginTop:12 }}>
    {!saved?<GhostBtn small onClick={saveNote}>💾 Save to Library</GhostBtn>:<SuccessMsg msg="Saved to Library!"/>}
  </div>
</>}
      <XPBadge amount={20} label="per notes generated"/>
    </div>
  )
}
