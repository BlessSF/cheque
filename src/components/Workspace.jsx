import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import ChequeView from './ChequeView.jsx'
import { Switch } from './ui.jsx'
import { IconChevronLeft, IconChevronRight, IconLock, IconUnlock } from './icons.jsx'
import { pageSize } from '../lib/layout.js'

const MM_100 = 96 / 25.4 // px per mm at 100% (true size on a 96 dpi screen)
const ZOOMS = ['fit', 75, 100, 125, 150, 200]
const RULER_X = 30 // width of the left ruler, px
const RULER_Y = 20 // height of the top ruler, px

/** A ruler along one edge of the paper, in millimetres, aligned to the paper's own scale. */
function Ruler({ axis, mm, unit, markerRef }) {
  const major = unit >= 2 ? 10 : 20
  const ticks = []
  for (let v = 0; v <= mm; v += 5) {
    const isMajor = v % major === 0
    if (!isMajor && v % 10 !== 0 && unit < 2) continue
    const len = isMajor ? 7 : v % 10 === 0 ? 5 : 3
    ticks.push({ v, len, isMajor })
  }
  const long = mm * unit
  return (
    <svg className={`ruler ruler-${axis}`} width={axis === 'x' ? long : RULER_X} height={axis === 'x' ? RULER_Y : long} aria-hidden="true">
      {ticks.map(({ v, len, isMajor }) => {
        const p = v * unit
        return axis === 'x' ? (
          <g key={v}>
            <line x1={p} x2={p} y1={RULER_Y} y2={RULER_Y - len} />
            {isMajor && <text x={p + 3} y={9}>{v}</text>}
          </g>
        ) : (
          <g key={v}>
            <line x1={RULER_X} x2={RULER_X - len} y1={p} y2={p} />
            {isMajor && <text x={RULER_X - 11} y={p + 10} textAnchor="end">{v}</text>}
          </g>
        )
      })}
      <line ref={markerRef} className="marker" {...(axis === 'x'
        ? { x1: -10, x2: -10, y1: 0, y2: RULER_Y }
        : { y1: -10, y2: -10, x1: 0, x2: RULER_X })} />
    </svg>
  )
}

export default function Workspace({
  entry, profile, settings, locked, setLocked, activeField, setActiveField, patchField, patchProfile,
  bg, bgOpacity, guides, setGuides, pos, count, onPrev, onNext,
}) {
  const [W, H] = pageSize(profile)
  const [zoom, setZoom] = useState('fit')
  const bedRef = useRef(null)
  const paperRef = useRef(null)
  const readoutRef = useRef(null)
  const mkX = useRef(null)
  const mkY = useRef(null)
  const drag = useRef(null)
  const [avail, setAvail] = useState({ w: 800, h: 500 })

  useLayoutEffect(() => {
    const el = bedRef.current
    if (!el) return undefined
    const measure = () => setAvail({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const PAD = 36
  const fit = Math.min((avail.w - RULER_X - PAD * 2) / W, (avail.h - RULER_Y - PAD * 2) / H)
  const unit = zoom === 'fit' ? Math.max(1, Math.min(fit, 6)) : (zoom / 100) * MM_100
  const f = profile.fields[activeField]

  /* ---- cursor readout and ruler markers (written straight to the DOM: no re-render per mouse move) ---- */
  const setCursor = useCallback((mmX, mmY) => {
    if (readoutRef.current) readoutRef.current.textContent = mmX == null ? 'Move over the cheque' : `X ${mmX.toFixed(1)}   Y ${mmY.toFixed(1)} mm`
    if (mkX.current) { const v = mmX == null ? -10 : mmX * unit; mkX.current.setAttribute('x1', v); mkX.current.setAttribute('x2', v) }
    if (mkY.current) { const v = mmY == null ? -10 : mmY * unit; mkY.current.setAttribute('y1', v); mkY.current.setAttribute('y2', v) }
  }, [unit])

  const onPaperMove = (e) => {
    const r = paperRef.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / unit
    const y = (e.clientY - r.top) / unit
    if (x < 0 || y < 0 || x > W || y > H) { setCursor(null, null); return }
    setCursor(x, y)
    const d = drag.current
    if (d) {
      const step = e.shiftKey ? 0.1 : 0.5
      const snap = (v) => Math.round(v / step) * step
      patchField(d.key, {
        x: Math.round(snap(d.ox + (e.clientX - d.sx) / d.unit) * 10) / 10,
        y: Math.round(snap(d.oy + (e.clientY - d.sy) / d.unit) * 10) / 10,
      })
    }
  }

  const onFieldDown = (e, key) => {
    setActiveField(key)
    bedRef.current?.focus()
    if (locked) return // a locked layout can be inspected, never moved
    const fld = profile.fields[key]
    drag.current = { key, sx: e.clientX, sy: e.clientY, ox: Number(fld.x), oy: Number(fld.y), unit }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }
  const endDrag = () => { drag.current = null }

  // arrow keys nudge the selected field: 0.5 mm, Shift 0.1 mm, Alt 5 mm
  const onKeyDown = (e) => {
    if (locked || !f) return
    const step = e.shiftKey ? 0.1 : e.altKey ? 5 : 0.5
    const r = (v) => Math.round(v * 10) / 10
    if (e.key === 'ArrowLeft') patchField(activeField, { x: r(f.x - step) })
    else if (e.key === 'ArrowRight') patchField(activeField, { x: r(f.x + step) })
    else if (e.key === 'ArrowUp') patchField(activeField, { y: r(f.y - step) })
    else if (e.key === 'ArrowDown') patchField(activeField, { y: r(f.y + step) })
    else return
    e.preventDefault()
  }

  useEffect(() => { setCursor(null, null) }, [setCursor])

  return (
    <section className="workspace" aria-label="Cheque preview">
      <div className="ws-toolbar">
        <div className="seg-nav">
          <button className="icon-btn" onClick={onPrev} aria-label="Previous cheque"><IconChevronLeft /></button>
          <span className="seg-nav-label">Cheque {pos} of {count}</span>
          <button className="icon-btn" onClick={onNext} aria-label="Next cheque"><IconChevronRight /></button>
        </div>
        <span className="grow" />
        <Switch checked={!!profile.shadow?.on} onChange={(v) => patchProfile({ shadow: { ...profile.shadow, on: v } })} label="Cheque outline" />
        <Switch checked={guides} onChange={setGuides} label="Field boxes" />
        <label className="zoom">
          <span className="visually-hidden">Zoom</span>
          <select value={zoom} onChange={(e) => setZoom(e.target.value === 'fit' ? 'fit' : Number(e.target.value))} aria-label="Zoom">
            {ZOOMS.map((z) => <option key={z} value={z}>{z === 'fit' ? 'Fit to window' : `${z}%`}</option>)}
          </select>
        </label>
        <button className={`btn lock-btn${locked ? ' on' : ''}`} onClick={() => setLocked(!locked)} aria-pressed={locked}>
          {locked ? <IconLock /> : <IconUnlock />} {locked ? 'Layout locked' : 'Layout unlocked'}
        </button>
      </div>

      <div className="bed" ref={bedRef} tabIndex={0} onKeyDown={onKeyDown} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <div className="plate" style={{ gridTemplateColumns: `${RULER_X}px auto`, gridTemplateRows: `${RULER_Y}px auto` }}>
          <div className="corner" />
          <Ruler axis="x" mm={W} unit={unit} markerRef={mkX} />
          <Ruler axis="y" mm={H} unit={unit} markerRef={mkY} />
          <div
            className="paper" ref={paperRef}
            onPointerMove={onPaperMove} onPointerLeave={() => setCursor(null, null)}
          >
            <ChequeView
              entry={entry} profile={profile} settings={settings} unit={unit}
              editable locked={locked} activeField={activeField} onFieldDown={onFieldDown}
              bg={bg} bgOpacity={bgOpacity} guides={guides}
            />
          </div>
        </div>
      </div>

      <div className="statusbar">
        <span className="cell cursor" ref={readoutRef} />
        <span className="cell">
          {f ? <><b>{f.label}</b> at X {f.x}  Y {f.y} mm</> : 'No field selected'}
        </span>
        <span className="cell grow" />
        <span className="cell">{locked ? 'Positions locked' : 'Drag a field, or use the arrow keys (Shift 0.1 mm, Alt 5 mm)'}</span>
      </div>
    </section>
  )
}