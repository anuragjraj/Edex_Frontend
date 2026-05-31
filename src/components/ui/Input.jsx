import { useState } from 'react'
import { T } from '../../theme/tokens'

export function BSInput({ value, onChange, placeholder, type='text', required, disabled, style={} }) {
  const [focused, setFocused] = useState(false)
  return (
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type}
      required={required} disabled={disabled}
      style={{ ...T.input, borderColor:focused?'var(--accent)':'var(--border)', ...style }}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}/>
  )
}

export function BSSelect({ value, onChange, options, style = {} }) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%',
        padding: '10px 14px',
        borderRadius: '10px',
        border: `1.5px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
        background: '#0f0f23',           // ← solid dark, never transparent
        color: '#e2e8f0',                // ← always light text
        fontSize: '14px',
        fontFamily: "'Nunito', sans-serif",
        appearance: 'auto',
        outline: 'none',
        cursor: 'pointer',
        transition: 'border-color .2s',
        ...style,
      }}
    >
      {options.map(o => (
        <option
          key={o.value ?? o}
          value={o.value ?? o}
          style={{ background: '#0f0f23', color: '#e2e8f0' }}   // ← fixes option visibility
        >
          {o.label ?? o}
        </option>
      ))}
    </select>
  )
}

export function BSTextarea({ value, onChange, placeholder, rows=4, style={} }) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ ...T.input, resize:'vertical', lineHeight:1.6, borderColor:focused?'var(--accent)':'var(--border)', ...style }}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}/>
  )
}
