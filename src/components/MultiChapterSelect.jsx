import { useState, useEffect, useRef } from 'react'
import { getChapters } from '../constants/subjects'

export function MultiChapterSelect({ subject, cls, selected = [], onChange, max = 20 }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const chapters = getChapters(subject, cls)

  // Close when clicking outside
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = search.trim()
    ? chapters.filter(c => c.toLowerCase().includes(search.toLowerCase()))
    : chapters

  const toggle = ch => {
    if (selected.includes(ch)) onChange(selected.filter(c => c !== ch))
    else if (selected.length < max) onChange([...selected, ch])
  }

  const selectAll   = () => onChange(chapters.slice(0, max))
  const clearAll    = () => onChange([])

  const triggerLabel = selected.length === 0
    ? '── Select chapters ──'
    : selected.length === 1
    ? selected[0]
    : `${selected.length} chapters selected`

  return (
    <div ref={ref} style={{ position: 'relative' }}>

      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderRadius: 10,
          border: `1.5px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
          background: '#0f0f23', color: selected.length ? '#e2e8f0' : '#64748b',
          fontSize: 14, fontFamily: "'Nunito', sans-serif", cursor: 'pointer',
          transition: 'border-color .2s', textAlign: 'left',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {triggerLabel}
        </span>
        <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
      </button>

      {/* ── Selected pills (shown below trigger) ── */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
          {selected.map(ch => (
            <span key={ch} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
              {ch}
              <span
                onClick={e => { e.stopPropagation(); toggle(ch) }}
                style={{ cursor: 'pointer', fontSize: 13, fontWeight: 900, lineHeight: 1 }}
              >×</span>
            </span>
          ))}
        </div>
      )}

      {/* ── Dropdown panel ── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#0f0f23', border: '1.5px solid var(--accent-border)',
          borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,.5)',
          zIndex: 500, overflow: 'hidden',
        }}>
          {/* Search + bulk actions */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search chapters…"
              style={{
                flex: 1, padding: '6px 10px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'rgba(255,255,255,.05)',
                color: '#e2e8f0', fontSize: 13, fontFamily: "'Nunito', sans-serif", outline: 'none',
              }}
            />
            <button onClick={selectAll} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--accent)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Nunito', sans-serif" }}>All</button>
            <button onClick={clearAll}  style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: '#94a3b8', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>Clear</button>
          </div>

          {/* Chapter list */}
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: '6px 0' }}>
            {filtered.map(ch => {
              const checked = selected.includes(ch)
              const disabled = !checked && selected.length >= max
              return (
                <div
                  key={ch}
                  onClick={() => !disabled && toggle(ch)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 14px', cursor: disabled ? 'not-allowed' : 'pointer',
                    background: checked ? 'var(--accent-bg)' : 'transparent',
                    opacity: disabled ? .4 : 1,
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e => { if (!disabled && !checked) e.currentTarget.style.background = 'rgba(255,255,255,.04)' }}
                  onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent' }}
                >
                  {/* Custom checkbox */}
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${checked ? 'var(--accent)' : '#475569'}`,
                    background: checked ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s',
                  }}>
                    {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13.5, color: checked ? 'var(--accent)' : '#e2e8f0', fontWeight: checked ? 700 : 400, fontFamily: "'Nunito', sans-serif" }}>
                    {ch}
                  </span>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '14px', textAlign: 'center', fontSize: 13, color: '#64748b' }}>No chapters match</div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>{selected.length}/{max} selected</span>
            <button
              onClick={() => setOpen(false)}
              style={{ padding: '5px 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}
            >
              Done ✓
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
