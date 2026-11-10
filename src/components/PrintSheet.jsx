import { useEffect } from 'react'
import ChequeView from './ChequeView.jsx'
import { pageSize } from '../lib/layout.js'

const MM = 96 / 25.4 // CSS px per mm at print time

/** Calibration page: ruler + a box and label for every enabled field. */
function Calibration({ profile }) {
  const [W, H] = pageSize(profile)
  const ticks = []
  for (let mm = 0; mm <= W; mm += 10) ticks.push(['x', mm])
  for (let mm = 0; mm <= H; mm += 10) ticks.push(['y', mm])
  return (
    <div className="sheet" style={{ width: W * MM, height: H * MM }}>
      {ticks.map(([ax, mm]) => (
        <div key={ax + mm} className="tick" style={ax === 'x'
          ? { left: mm * MM, top: 0, width: 0, height: (mm % 50 === 0 ? 8 : 4) * MM, borderLeft: '0.2mm solid #000' }
          : { top: mm * MM, left: 0, height: 0, width: (mm % 50 === 0 ? 8 : 4) * MM, borderTop: '0.2mm solid #000' }}>
          {mm % 50 === 0 && mm > 0 && (
            <span style={ax === 'x' ? { left: 1, top: 8 * MM } : { top: 1, left: 8 * MM }}>{mm}</span>
          )}
        </div>
      ))}
      {Object.entries(profile.fields).filter(([, f]) => f.on).map(([k, f]) => (
        <div key={k} className="calbox" style={{
          left: (f.x + (profile.nx || 0)) * MM, top: (f.y + (profile.ny || 0)) * MM,
          width: f.w * MM, height: f.size * 0.3528 * 1.25 * MM,
        }}>
          <span>{f.label} ({f.x}, {f.y})</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Hidden on screen; shown only by @media print. `job` = { entries } or { calibration: true }.
 * Calls window.print() once rendered, then onDone() when the dialog closes.
 */
export default function PrintSheet({ job, profile, settings, onDone }) {
  const [W, H] = pageSize(profile)

  useEffect(() => {
    if (!job) return undefined
    const done = () => onDone()
    window.addEventListener('afterprint', done)
    const t = setTimeout(() => window.print(), 80)
    return () => { clearTimeout(t); window.removeEventListener('afterprint', done) }
  }, [job, onDone])

  if (!job) return null
  return (
    <div id="printArea">
      <style>{`@page{size:${W}mm ${H}mm;margin:0}`}</style>
      {job.calibration
        ? <div className="pg"><Calibration profile={profile} /></div>
        : job.entries.map((e) => (
          <div className="pg" key={e.id} style={{ width: `${W}mm`, height: `${H}mm` }}>
            <ChequeView entry={e} profile={profile} settings={settings} unit={MM} />
          </div>
        ))}
    </div>
  )
}
