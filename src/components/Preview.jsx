import { useRef } from 'react'
import ChequeView from './ChequeView.jsx'

export const PX_PER_MM = 2.6

export default function Preview({
  entry, profile, settings, locked, activeField, setActiveField, patchField, bg, bgOpacity, guides, nav,
}) {
  const drag = useRef(null)
  const stage = useRef(null)

  const onFieldDown = (e, key) => {
    setActiveField(key)
    stage.current?.focus()
    if (locked) return // locked: selecting a field is fine, moving it is not
    const f = profile.fields[key]
    drag.current = { key, sx: e.clientX, sy: e.clientY, ox: Number(f.x), oy: Number(f.y) }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
    stage.current?.focus() // so arrow keys nudge the field right after a click
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    patchField(d.key, {
      x: Math.round((d.ox + (e.clientX - d.sx) / PX_PER_MM) * 2) / 2,
      y: Math.round((d.oy + (e.clientY - d.sy) / PX_PER_MM) * 2) / 2,
    })
  }
  const onUp = () => { drag.current = null }

  // arrow keys nudge the active field: 0.5 mm, Shift = 0.1 mm, Alt = 5 mm
  const onKeyDown = (e) => {
    if (locked) return
    const step = e.shiftKey ? 0.1 : e.altKey ? 5 : 0.5
    const f = profile.fields[activeField]
    if (!f) return
    const r = (v) => Math.round(v * 10) / 10
    if (e.key === 'ArrowLeft') patchField(activeField, { x: r(f.x - step) })
    else if (e.key === 'ArrowRight') patchField(activeField, { x: r(f.x + step) })
    else if (e.key === 'ArrowUp') patchField(activeField, { y: r(f.y - step) })
    else if (e.key === 'ArrowDown') patchField(activeField, { y: r(f.y + step) })
    else return
    e.preventDefault()
  }

  return (
    <div>
      <div className="toolbar">{nav}</div>
      <div className="stage" ref={stage} tabIndex={0} onKeyDown={onKeyDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <ChequeView
          entry={entry} profile={profile} settings={settings} unit={PX_PER_MM}
          editable locked={locked} activeField={activeField} onFieldDown={onFieldDown}
          bg={bg} bgOpacity={bgOpacity} guides={guides}
        />
      </div>
      <p className="hint">
        {locked
          ? 'Layout is locked, so fields cannot be moved by accident. Press Unlock to adjust positions.'
          : 'Drag a field to move it, or click the preview and use the arrow keys (Shift = 0.1 mm, Alt = 5 mm).'}
        {' '}The dashed outline is the paper edge and is not printed.
      </p>
    </div>
  )
}