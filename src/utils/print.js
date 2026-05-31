export function printQPaper(paper, opts = {}) {
  const clean = s => (s || '').replace(/[^\x00-\x7F]/g, '').replace(/\*\*/g, '').trim()
  const h = paper.header || {}
  const school = opts.schoolName || 'CBSE Affiliated School'

  let sectionsHTML = ''
  for (const sec of (paper.sections || [])) {
    let qs = ''
    for (const q of (sec.questions || [])) {
      const opts2 = q.options?.length
        ? `<div class="opts">${q.options.map((o, i) => `<span class="opt">${clean(o)}</span>`).join('')}</div>`
        : ''
      const lines = sec.type === 'long' || q.marks >= 5
        ? `<div class="lines">${Array(Math.min(q.marks, 8)).fill('<div class="line"></div>').join('')}</div>`
        : `<div class="lines">${Array(2).fill('<div class="line"></div>').join('')}</div>`
      qs += `<div class="q"><p class="qtext"><span class="qnum">Q${q.number}.</span> ${clean(q.text)} <span class="marks">[${q.marks} Mark${q.marks > 1 ? 's' : ''}]</span></p>${opts2}${lines}</div>`
    }
    sectionsHTML += `<div class="section"><h3>${clean(sec.name)}</h3><p class="sec-desc">${clean(sec.description || '')}</p>${qs}</div>`
  }

  let answersHTML = ''
  if (opts.includeAnswers) {
    let aks = ''
    for (const sec of (paper.sections || [])) {
      aks += `<h4>${clean(sec.name)}</h4>`
      for (const q of (sec.questions || [])) {
        aks += `<p class="ak-q"><strong>Q${q.number}.</strong> ${clean(q.answer)}${q.solution ? `<br><span class="sol">${clean(q.solution)}</span>` : ''}</p>`
      }
    }
    answersHTML = `<div class="answer-key"><h2>ANSWER KEY</h2>${aks}</div>`
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${clean(h.subject)} Question Paper</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Times New Roman',serif;font-size:12pt;color:#000;background:#fff;padding:0}
  .page{max-width:210mm;margin:0 auto;padding:15mm 20mm}
  .header{border:1px solid #000;padding:12px;text-align:center;margin-bottom:12px}
  .school{font-size:16pt;font-weight:bold;letter-spacing:1px;margin-bottom:4px}
  .exam-line{font-size:11pt;margin-bottom:8px}
  .info-row{display:flex;justify-content:space-between;font-size:11pt;margin:3px 0}
  .instructions{margin:10px 0}
  .instructions h4{font-size:11pt;margin-bottom:4px}
  .instructions ol{padding-left:20px;font-size:10.5pt;line-height:1.7}
  .section h3{font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:4px;margin:14px 0 4px}
  .sec-desc{font-size:10.5pt;color:#444;margin-bottom:8px;font-style:italic}
  .q{margin:10px 0 4px}
  .qtext{font-size:11pt;line-height:1.6}
  .qnum{font-weight:bold}
  .marks{float:right;font-weight:bold;font-size:10.5pt}
  .opts{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:6px 0 4px 20px}
  .opt{font-size:10.5pt}
  .lines{margin:4px 0 8px}
  .line{border-bottom:1px solid #aaa;height:18px;margin:2px 0}
  .answer-key{page-break-before:always;padding-top:10mm}
  .answer-key h2{text-align:center;font-size:14pt;border:1px solid #000;padding:6px;margin-bottom:14px}
  .answer-key h4{font-size:11pt;margin:10px 0 4px;border-bottom:1px dashed #ccc;padding-bottom:2px}
  .ak-q{font-size:10.5pt;margin:4px 0 4px 12px;line-height:1.6}
  .sol{color:#555;font-size:10pt}
  .footer{text-align:center;font-size:9pt;color:#888;margin-top:16px;border-top:1px solid #ccc;padding-top:6px}
  @media print{
    body{padding:0} .page{padding:10mm 15mm}
    @page{margin:0.5in; size:A4}
  }
</style></head><body>
<div class="page">
  <div class="header">
    <div class="school">${school.toUpperCase()}</div>
    <div class="exam-line">${clean(h.board || 'CBSE')} Examination ${clean(h.year || '2024-25')}</div>
    <div class="info-row"><span><strong>Subject:</strong> ${clean(h.subject)}</span><span><strong>Class:</strong> ${clean(h.class_level)}</span></div>
    <div class="info-row"><span><strong>Max. Marks:</strong> ${h.max_marks}</span><span><strong>Time Allowed:</strong> ${clean(h.duration)}</span></div>
  </div>
  <div class="instructions">
    <h4>General Instructions:</h4>
    <ol>${(paper.general_instructions || []).map(i => `<li>${clean(i)}</li>`).join('')}</ol>
  </div>
  ${sectionsHTML}
  ${answersHTML}
</div>
<script>window.addEventListener('load',function(){setTimeout(function(){window.print()},400)})<\/script>
</body></html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) win.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
  else setTimeout(() => URL.revokeObjectURL(url), 30000)
}

// REPLACE the old printContent function with this
export function printContent(content, title = 'BrainSpark AI Notes') {
  // Build HTML string (no DOM touching yet — pure string ops, non-blocking)
  const lines = (content || '').split('\n')
  let body = ''
  for (const line of lines) {
    if (line.startsWith('# '))        body += `<h1>${line.slice(2)}</h1>`
    else if (line.startsWith('## '))  body += `<h2>${line.slice(3)}</h2>`
    else if (line.startsWith('### ')) body += `<h3>${line.slice(4)}</h3>`
    else if (line.startsWith('- ') || line.startsWith('• ')) body += `<li>${line.slice(2)}</li>`
    else if (/^\d+\./.test(line))     body += `<li>${line}</li>`
    else if (line.startsWith('---'))  body += `<hr/>`
    else if (line.startsWith('📝'))   body += `<div class="tip">${line}</div>`
    else if (line.trim() === '')      body += `<div style="height:8px"></div>`
    else body += `<p>${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=Source+Sans+3:wght@400;600;700&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Source Sans 3',Georgia,sans-serif; background:#f0efe9; padding:32px 20px; color:#374151; font-size:14.5px; line-height:1.8; }
    .page { background:#fff; max-width:780px; margin:0 auto; padding:56px 68px; border-radius:6px; box-shadow:0 4px 32px rgba(0,0,0,.10); }
    .hdr  { border-bottom:3px solid #3730a3; padding-bottom:20px; margin-bottom:32px; }
    .hdr-title { font-family:'Lora',Georgia,serif; font-size:30px; font-weight:700; color:#1a1a2e; margin-bottom:8px; }
    .hdr-meta  { font-size:12.5px; color:#64748b; font-weight:600; }
    .hdr-meta span { color:#3730a3; }
    h1 { font-family:'Lora',Georgia,serif; font-size:22px; font-weight:700; color:#1a1a2e; margin:32px 0 10px; padding-bottom:8px; border-bottom:2px solid #e8e6ff; }
    h2 { font-family:'Lora',Georgia,serif; font-size:18px; font-weight:700; color:#3730a3; margin:24px 0 8px; }
    h3 { font-size:15px; font-weight:700; color:#1e293b; margin:18px 0 6px; padding-left:12px; border-left:3px solid #818cf8; }
    p  { margin:0 0 10px; }
    li { margin:4px 0 4px 22px; list-style:disc; }
    strong { color:#1a1a2e; font-weight:700; }
    hr { border:none; border-top:1px solid #e2e8f0; margin:18px 0; }
    .tip { background:#eff6ff; border:1px solid #bfdbfe; border-radius:6px; padding:8px 14px; margin:10px 0; font-size:13px; color:#1d4ed8; font-weight:600; }
    @media print {
      body { background:#fff; padding:0; }
      .page { box-shadow:none; border-radius:0; max-width:100%; padding:0; }
      @page { margin:0.65in; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="hdr">
      <div class="hdr-title">${title.split('—')[0]?.trim() || title}</div>
      <div class="hdr-meta"><span>${title.split('—')[1]?.trim() || ''}</span> · CBSE 2024-25</div>
    </div>
    ${body}
  </div>
  <script>
    // Only print after fonts + content are loaded — never blocks parent
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 400);
    });
  <\/script>
</body>
</html>`

  // ✅ Blob URL approach — zero DOM blocking on the parent window
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const win  = window.open(url, '_blank')

  // Clean up the blob URL after the new window has loaded it
  if (win) {
    win.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
  } else {
    // Popup blocked fallback — revoke after a delay
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  }
}
