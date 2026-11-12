import { useLayoutEffect, useRef, useState } from 'react'

const group = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
const toNum = (s) => parseFloat(s.replace(/,/g, '')) || 0

/** Cleans what was typed: digits and one decimal point (max 2 decimals), thousands commas added. */
function format(raw) {
  let s = raw.replace(/[^\d.]/g, '')
  const dot = s.indexOf('.')
  let int = dot < 0 ? s : s.slice(0, dot)
  let dec = dot < 0 ? null : s.slice(dot + 1).replace(/\./g, '').slice(0, 2)
  int = int.replace(/^0+(?=\d)/, '')
  return group(int) + (dec === null ? '' : '.' + dec)
}
const tidy = (n) => (n > 0 ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '')

/** Amount box that shows commas as you type: 1,250,000.50. `value` and `onChange` use plain numbers. */
export default function AmountInput({ value, onChange, ...rest }) {
  const [text, setText] = useState(() => tidy(value))
  const ref = useRef(null)
  const caret = useRef(null)
  const [focused, setFocused] = useState(false)

  // Another cheque was picked (or the amount changed elsewhere): show its amount.
  if (toNum(text) !== (value || 0) && !focused) setText(tidy(value))

  useLayoutEffect(() => {
    if (caret.current != null && ref.current) { ref.current.setSelectionRange(caret.current, caret.current); caret.current = null }
  })

  function change(e) {
    const el = e.target
    const before = el.value.slice(0, el.selectionStart)
    const digitsBefore = before.replace(/[^\d.]/g, '').length
    const next = format(el.value)
    // put the caret after the same number of digits as before
    let pos = 0, seen = 0
    while (pos < next.length && seen < digitsBefore) { if (/[\d.]/.test(next[pos])) seen++; pos++ }
    caret.current = pos
    setText(next)
    onChange(toNum(next))
  }

  return (
    <input
      ref={ref} type="text" inputMode="decimal" autoComplete="off" placeholder="0.00" value={text}
      onChange={change} onFocus={() => setFocused(true)}
      onBlur={() => { setFocused(false); setText(tidy(toNum(text))) }}
      {...rest}
    />
  )
}