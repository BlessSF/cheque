import { useEffect, useRef, useState } from 'react'
import { IconClose } from './icons.jsx'

/** Label above a control, with an optional hint line below it. */
export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`field ${className}`}>
      {label && <span className="field-label">{label}</span>}
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

/**
 * A number box you can type in freely: clear it, retype it, use decimals. The value is applied as soon as the
 * text is a valid number. Arrow Up / Down step it (Shift 0.1, Alt 5). Enter or leaving the box tidies it up.
 */
export function NumberBox({ value, onChange, step = 0.5, disabled, className, ...rest }) {
  const [draft, setDraft] = useState(null)
  const text = draft ?? String(value)
  const apply = (t) => { const n = Number(t); if (t.trim() !== '' && Number.isFinite(n)) onChange(n) }
  return (
    <input
      {...rest} type="text" inputMode="decimal" autoComplete="off" className={className} value={text} disabled={disabled}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const t = e.target.value
        if (/^-?\d*\.?\d*$/.test(t)) { setDraft(t); apply(t) }
      }}
      onBlur={() => setDraft(null)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault()
          const st = e.shiftKey ? 0.1 : e.altKey ? 5 : step
          const base = Number(draft ?? value) || 0
          setDraft(null)
          onChange(Math.round((base + (e.key === 'ArrowUp' ? st : -st)) * 100) / 100)
        } else if (e.key === 'Enter') e.currentTarget.blur()
      }}
    />
  )
}

/** Number input with a unit suffix. Greyed out when `disabled`. */
export function NumInput({ label, value, onChange, step = 0.5, unit, disabled, hint }) {
  return (
    <Field label={label} hint={hint}>
      <span className={`num${disabled ? ' is-disabled' : ''}`}>
        <NumberBox value={value} onChange={onChange} step={step} disabled={disabled} />
        {unit && <span className="unit">{unit}</span>}
      </span>
    </Field>
  )
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <label className={`switch${disabled ? ' is-disabled' : ''}`}>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="track"><span className="thumb" /></span>
      {label && <span className="switch-label">{label}</span>}
    </label>
  )
}

export function Tabs({ tabs, value, onChange }) {
  const onKey = (e) => {
    const i = tabs.findIndex((t) => t.id === value)
    if (e.key === 'ArrowRight') onChange(tabs[(i + 1) % tabs.length].id)
    else if (e.key === 'ArrowLeft') onChange(tabs[(i - 1 + tabs.length) % tabs.length].id)
  }
  return (
    <div className="tabs" role="tablist" onKeyDown={onKey}>
      {tabs.map((t) => (
        <button
          key={t.id} role="tab" aria-selected={value === t.id} tabIndex={value === t.id ? 0 : -1}
          className={`tab${value === t.id ? ' on' : ''}`} onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/** Native <dialog>: focus trap, Esc to close and a backdrop come from the browser. */
export function Modal({ title, onClose, children, footer, width = 460 }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
    return () => { if (d?.open) d.close() }
  }, [])
  return (
    <dialog
      ref={ref} className="modal" style={{ width }}
      onCancel={(e) => { e.preventDefault(); onClose() }}
      onMouseDown={(e) => { if (e.target === ref.current) onClose() }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><IconClose /></button>
      </div>
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-foot">{footer}</div>}
    </dialog>
  )
}

export function Toasts({ items }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => <div key={t.id} className="toast">{t.text}</div>)}
    </div>
  )
}