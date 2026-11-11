import { Mark, IconPrint, IconCopy, IconLock } from './icons.jsx'
import { pageSize } from '../lib/layout.js'

export default function TopBar({ profiles, bankIdx, setBankIdx, profile, tickedCount, onPrint, onApplyAll, linked, onLock }) {
  const [W, H] = pageSize(profile)
  return (
    <header className="topbar">
      <div className="brand">
        <Mark />
        <span className="brand-name">Cheque Maker</span>
      </div>
      <div className="topbar-sep" />
      <label className="bank-pick">
        <span className="visually-hidden">Bank layout</span>
        <select value={bankIdx} onChange={(e) => setBankIdx(Number(e.target.value))} aria-label="Bank layout">
          {profiles.map((b, i) => <option key={i} value={i}>{b.name}</option>)}
        </select>
      </label>
      {linked ? (
        <span className="linked-chip" title="Changes to the layout apply to every bank">All banks match</span>
      ) : (
        <button className="btn" onClick={onApplyAll} title="Copy this bank's layout to every other bank">
          <IconCopy /> <span className="btn-text">Apply to all banks</span>
        </button>
      )}
      <span className="page-chip">{profile.mode === 'a4' ? 'A4 landscape' : 'Custom'} · {W} × {H} mm</span>
      <span className="grow" />
      {onLock && (
        <button className="btn" onClick={onLock} title="Lock Cheque Maker (asks for the passcode again)">
          <IconLock /> <span className="btn-text">Lock</span>
        </button>
      )}
      <button className="btn primary lg" onClick={onPrint} disabled={!tickedCount}>
        <IconPrint /> Print {tickedCount} {tickedCount === 1 ? 'cheque' : 'cheques'}
      </button>
    </header>
  )
}