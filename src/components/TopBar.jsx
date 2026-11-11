import { Mark, IconPrint } from './icons.jsx'
import { pageSize } from '../lib/layout.js'

export default function TopBar({ profiles, bankIdx, setBankIdx, profile, tickedCount, onPrint }) {
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
      <span className="page-chip">{profile.mode === 'a4' ? 'A4 landscape' : 'Custom'} · {W} × {H} mm</span>
      <span className="grow" />
      <button className="btn primary lg" onClick={onPrint} disabled={!tickedCount}>
        <IconPrint /> Print {tickedCount} {tickedCount === 1 ? 'cheque' : 'cheques'}
      </button>
    </header>
  )
}