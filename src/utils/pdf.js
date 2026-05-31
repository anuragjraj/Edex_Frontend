// ══════════════════════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════════════════════

export async function downloadNotesAsPDF(content, title) {
  // jsPDF writes text directly to PDF — no canvas, never blank
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')

  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  const PAGE_W    = 210
  const MARGIN    = 18
  const MAX_W     = PAGE_W - MARGIN * 2   // 174mm usable width
  const PAGE_H    = 297
  const BOT_LIMIT = PAGE_H - 20           // bottom margin

  let y = MARGIN

  // ── helpers ─────────────────────────────────────────────────
  function newPageIfNeeded(needed = 8) {
    if (y + needed > BOT_LIMIT) { doc.addPage(); y = MARGIN }
  }

  function writeLine(text, opts = {}) {
    const {
      size = 11, bold = false, italic = false,
      color = [55, 65, 81],   // #374151
      indent = 0, gap = 4,
    } = opts

    doc.setFontSize(size)
    doc.setFont('helvetica', bold && italic ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'normal')
    doc.setTextColor(...color)

    const lines = doc.splitTextToSize(text, MAX_W - indent)
    for (const line of lines) {
      newPageIfNeeded(size * 0.4 + 2)
      doc.text(line, MARGIN + indent, y)
      y += size * 0.38 + 1.5
    }
    y += gap
  }

  function drawHRule(color = [226, 232, 240], thickness = 0.3) {
    doc.setDrawColor(...color)
    doc.setLineWidth(thickness)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 4
  }

  function writeBoldLine(text, baseOpts = {}) {
    // Handles **bold** inline markers
    const parts = []
    const regex  = /\*\*(.*?)\*\*/g
    let last = 0, m
    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) parts.push({ t: text.slice(last, m.index), bold: false })
      parts.push({ t: m[1], bold: true })
      last = m.index + m[0].length
    }
    if (last < text.length) parts.push({ t: text.slice(last), bold: false })

    if (parts.length <= 1 || parts.every(p => !p.bold)) {
      // No bold — just write normally
      writeLine(text.replace(/\*\*(.*?)\*\*/g, '$1'), baseOpts)
      return
    }

    // Mixed bold — measure and write segment by segment on same line
    const { size = 11, color = [55, 65, 81], indent = 0, gap = 4 } = baseOpts
    doc.setFontSize(size)
    newPageIfNeeded(size * 0.4 + 2)
    let cx = MARGIN + indent
    for (const part of parts) {
      doc.setFont('helvetica', part.bold ? 'bold' : 'normal')
      doc.setTextColor(...(part.bold ? [26, 26, 46] : color))
      doc.text(part.t, cx, y)
      cx += doc.getTextWidth(part.t)
    }
    y += size * 0.38 + 1.5 + gap
  }

  // ── Document header ─────────────────────────────────────────
  const mainTitle  = title.split('—')[0]?.trim() || title
  const subTitle   = title.split('—')[1]?.trim() || ''

  doc.setFillColor(55, 48, 163)  // #3730a3
  doc.rect(MARGIN, y, MAX_W, 0.8, 'F')
  y += 5

  writeLine(mainTitle, { size: 22, bold: true, color: [26, 26, 46], gap: 3 })
  if (subTitle) writeLine(`${subTitle} · CBSE 2024-25`, { size: 10, color: [100, 116, 139], gap: 8 })

  drawHRule([55, 48, 163], 0.8)
  y += 2

  // ── Parse and write content ─────────────────────────────────
  const lines = (content || '').split('\n')

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (line === '' || line === '---' || line.startsWith('═══')) {
      if (line.startsWith('---') || line.startsWith('═══')) {
        drawHRule(); continue
      }
      y += 2; continue
    }

    // H1
    if (line.startsWith('# ')) {
      y += 3
      newPageIfNeeded(14)
      writeLine(line.slice(2), { size: 16, bold: true, color: [26, 26, 46], gap: 2 })
      drawHRule([232, 230, 255], 0.4)
      continue
    }

    // H2
    if (line.startsWith('## ')) {
      y += 2
      newPageIfNeeded(12)
      writeLine(line.slice(3), { size: 13, bold: true, color: [55, 48, 163], gap: 3 })
      continue
    }

    // H3
    if (line.startsWith('### ') || line.startsWith('#### ')) {
      const depth = line.startsWith('#### ') ? 4 : 3
      y += 1
      writeLine(line.slice(depth + 1), { size: 11.5, bold: true, color: [30, 41, 59], gap: 2 })
      continue
    }

    // Bullet
    if (line.startsWith('- ') || line.startsWith('• ')) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(129, 140, 248)  // #818cf8
      newPageIfNeeded(7)
      doc.text('•', MARGIN + 2, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(55, 65, 81)
      const txt   = line.slice(2)
      const wrapped = doc.splitTextToSize(txt, MAX_W - 8)
      for (let i = 0; i < wrapped.length; i++) {
        newPageIfNeeded(6)
        doc.text(wrapped[i], MARGIN + 7, y)
        y += 5.5
      }
      y += 1
      continue
    }

    // Numbered list
    if (/^\d+\./.test(line)) {
      writeLine(line, { indent: 5, gap: 3 })
      continue
    }

    // Exam tip callout
    if (line.startsWith('📝')) {
      newPageIfNeeded(10)
      doc.setFillColor(239, 246, 255)  // #eff6ff
      const tipLines = doc.splitTextToSize(line, MAX_W - 6)
      const boxH = tipLines.length * 5 + 4
      doc.rect(MARGIN, y - 3, MAX_W, boxH, 'F')
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(29, 78, 216)  // #1d4ed8
      for (const tl of tipLines) {
        doc.text(tl, MARGIN + 3, y)
        y += 5
      }
      y += 3
      continue
    }

    // Regular paragraph (with inline bold support)
    writeBoldLine(line, { size: 11, color: [55, 65, 81], gap: 4 })
  }

  // ── Footer on each page ─────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184)  // #94a3b8
    doc.text('BrainSpark AI · CBSE Notes', MARGIN, PAGE_H - 8)
    doc.text(`Page ${i} of ${totalPages}`, PAGE_W - MARGIN - 18, PAGE_H - 8)
  }

  const filename = `${title.replace(/ — |—/g, '-').replace(/[\s/\\:*?"<>|]+/g, '-')}.pdf`
  doc.save(filename)
}

export async function downloadQPaperAsPDF(paper, opts = {}) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const clean = s => (s || '').replace(/[^\x00-\x7F]/g, '').replace(/\*\*/g, '').trim()
  const PAGE_W = 210, MARGIN = 20, MAX_W = 170, PAGE_H = 297, BOT = 277
  let y = MARGIN

  function newPage() { doc.addPage(); y = MARGIN }
  function check(need = 8) { if (y + need > BOT) newPage() }

  function line(text, opts2 = {}) {
    const { size = 11, bold = false, color = [0, 0, 0], indent = 0, gap = 3, center = false } = opts2
    doc.setFontSize(size)
    doc.setFont('times', bold ? 'bold' : 'normal')
    doc.setTextColor(...color)
    const wrapped = doc.splitTextToSize(clean(text), MAX_W - indent)
    for (const l of wrapped) {
      check(size * 0.4 + 2)
      const x = center ? PAGE_W / 2 : MARGIN + indent
      doc.text(l, x, y, center ? { align: 'center' } : {})
      y += size * 0.42 + 1
    }
    y += gap
  }

  function hline(thickness = 0.4, color = 0) {
    doc.setDrawColor(color)
    doc.setLineWidth(thickness)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 3
  }

  const h     = paper.header || {}
  const school = opts.schoolName || 'CBSE Affiliated School'

  // ── Header box ───────────────────────────────────────────────
  doc.setFillColor(245, 245, 245)
  doc.rect(MARGIN, y - 2, MAX_W, 38, 'F')
  doc.setDrawColor(0); doc.setLineWidth(0.6)
  doc.rect(MARGIN, y - 2, MAX_W, 38)

  line(school.toUpperCase(), { size: 15, bold: true, center: true, gap: 2 })
  line(`${clean(h.board || 'CBSE')} Examination — ${clean(h.year || '2024-25')}`, { size: 11, center: true, gap: 3 })

  // Info row
  doc.setFontSize(11); doc.setFont('times', 'normal'); doc.setTextColor(0, 0, 0)
  const half = MAX_W / 2
  doc.text(`Subject: ${clean(h.subject)}`,       MARGIN + 4,        y)
  doc.text(`Class: ${clean(h.class_level)}`,      MARGIN + half + 4, y); y += 6
  doc.text(`Max. Marks: ${h.max_marks || ''}`,    MARGIN + 4,        y)
  doc.text(`Time: ${clean(h.duration)}`,          MARGIN + half + 4, y); y += 5
  hline(0.6); y += 2

  // ── General Instructions ─────────────────────────────────────
  line('General Instructions:', { size: 11, bold: true, gap: 2 })
  for (let i = 0; i < (paper.general_instructions || []).length; i++) {
    line(`${i + 1}. ${clean(paper.general_instructions[i])}`, { size: 10, indent: 5, gap: 1.5 })
  }
  hline(0.5); y += 3

  // ── Sections ─────────────────────────────────────────────────
  for (const sec of (paper.sections || [])) {
    check(16)

    // Section heading bar
    doc.setFillColor(230, 230, 230)
    doc.rect(MARGIN, y - 1, MAX_W, 8, 'F')
    doc.setFontSize(12); doc.setFont('times', 'bold'); doc.setTextColor(0, 0, 0)
    doc.text(clean(sec.name).toUpperCase(), PAGE_W / 2, y + 5, { align: 'center' })
    y += 9

    if (sec.description) {
      doc.setFontSize(10); doc.setFont('times', 'italic'); doc.setTextColor(80, 80, 80)
      doc.text(clean(sec.description), PAGE_W / 2, y, { align: 'center' })
      y += 5
    }
    y += 2

    for (const q of (sec.questions || [])) {
      // Estimate space needed: question lines + options
      const qText    = `Q${q.number}.  ${clean(q.text)}`
      const wrappedQ = doc.splitTextToSize(qText, MAX_W - 18)
      const optLines = q.options?.length ? Math.ceil(q.options.length / 2) : 0
      const needed   = wrappedQ.length * 5.5 + optLines * 5.5 + 8
      check(needed)

      // Thin separator between questions
      doc.setDrawColor(210); doc.setLineWidth(0.15)
      doc.line(MARGIN, y, PAGE_W - MARGIN, y)
      doc.setDrawColor(0)
      y += 3

      // Question text
      doc.setFontSize(11); doc.setFont('times', 'normal'); doc.setTextColor(0, 0, 0)
      for (let wi = 0; wi < wrappedQ.length; wi++) {
        check(6)
        if (wi === wrappedQ.length - 1) {
          // Last line: question text left, marks right
          doc.text(clean(wrappedQ[wi]), MARGIN, y)
          doc.setFont('times', 'bold')
          doc.text(`[${q.marks} Mark${q.marks > 1 ? 's' : ''}]`, PAGE_W - MARGIN, y, { align: 'right' })
          doc.setFont('times', 'normal')
        } else {
          doc.text(clean(wrappedQ[wi]), MARGIN, y)
        }
        y += 5.5
      }

      // MCQ options — 2 per row
      if (q.options?.length) {
        y += 1
        for (let oi = 0; oi < q.options.length; oi += 2) {
          check(6)
          doc.setFontSize(10.5)
          doc.text(clean(q.options[oi]     || ''), MARGIN + 10,      y)
          doc.text(clean(q.options[oi + 1] || ''), MARGIN + 10 + 82, y)
          y += 5.5
        }
      }

      y += 3  // small gap after each question — no answer lines
    }

    y += 5  // gap between sections
  }

  // ── Answer Key ───────────────────────────────────────────────
  if (opts.includeAnswers) {
    newPage()

    doc.setFillColor(230, 230, 230)
    doc.rect(MARGIN, y - 2, MAX_W, 10, 'F')
    doc.setFontSize(14); doc.setFont('times', 'bold'); doc.setTextColor(0, 0, 0)
    doc.text('ANSWER KEY', PAGE_W / 2, y + 5.5, { align: 'center' })
    y += 14
    hline(0.5); y += 2

    for (const sec of (paper.sections || [])) {
      check(10)
      line(sec.name, { size: 11, bold: true, gap: 2 })

      for (const q of (sec.questions || [])) {
        check(12)

        // Q number + answer on same line
        doc.setFontSize(10.5); doc.setFont('times', 'bold'); doc.setTextColor(0, 0, 0)
        doc.text(`Q${q.number}.`, MARGIN + 2, y)
        doc.setFont('times', 'normal')
        const ansText = doc.splitTextToSize(`Ans: ${clean(q.answer)}`, MAX_W - 18)
        for (const al of ansText) {
          check(5); doc.text(al, MARGIN + 12, y); y += 5
        }

        if (q.solution) {
          doc.setTextColor(60, 60, 60); doc.setFontSize(10)
          const solText = doc.splitTextToSize(`Solution: ${clean(q.solution)}`, MAX_W - 22)
          for (const sl of solText) {
            check(5); doc.text(sl, MARGIN + 14, y); y += 4.5
          }
          doc.setTextColor(0, 0, 0)
        }
        y += 3
      }
      y += 4
    }
  }

  // ── Footer on every page ─────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(8.5); doc.setFont('times', 'normal'); doc.setTextColor(140, 140, 140)
    doc.line(MARGIN, PAGE_H - 12, PAGE_W - MARGIN, PAGE_H - 12)
    doc.text(
      `${clean(h.subject)}  |  ${clean(h.class_level)}  |  Page ${p} of ${totalPages}`,
      PAGE_W / 2, PAGE_H - 7, { align: 'center' }
    )
  }

  const fname = `${clean(h.subject)}-${clean(h.class_level)}-${h.max_marks || ''}M-paper.pdf`
  doc.save(fname)
}

export async function loadScript(src) {
  if (document.querySelector(`script[src="${src}"]`)) return
  return new Promise((res, rej) => {
    const s = document.createElement('script')
    s.src = src; s.async = true; s.defer = true
    s.onload = res; s.onerror = rej
    document.head.appendChild(s)
  })
}
