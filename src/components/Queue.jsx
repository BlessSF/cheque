import { useEffect, useRef } from 'react'
import { IconPlus, IconImport, IconTrash } from './icons.jsx'
import { fmtMoney } from '../lib/words.js'

const ready = (e) => e.payee.trim() && Number(e.amount) > 0

export default function Queue({ entries, sel, setSel, toggle, setAll, onAdd, onImport, onRemove, onClear }) {
  const ticked = entries.filter((e) => e.on)
  const total = ticked.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const allRef = useRef(null)
  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = ticked.length > 0 && ticked.length < entries.length
  }, [ticked.length, entries.length])

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(Math.min(entries.length - 1, sel + 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel(Math.max(0, sel - 1)) }
  }

  return (
    <aside className="queue" aria-label="Cheque list">
      <div className="pane-head">
        <input
          ref={allRef} type="checkbox" aria-label="Tick all cheques"
          checked={ticked.length === entries.length && entries.length > 0}
          onChange={(e) => setAll(e.target.checked)}
        />
        <h2>Cheques</h2>
        <span className="pane-count">{entries.length}</span>
        <span className="grow" />
        <button className="icon-btn" title="Delete selected cheque" aria-label="Delete selected cheque" onClick={onRemove}><IconTrash /></button>
      </div>

      <div className="rows" role="listbox" tabIndex={0} onKeyDown={onKey} aria-label="Cheques">
        {entries.map((e, i) => (
          <div
            key={e.id} role="option" aria-selected={i === sel}
            className={`row${i === sel ? ' sel' : ''}`} onClick={() => setSel(i)}
          >
            <input
              type="checkbox" checked={e.on} aria-label={`Print ${e.payee || 'cheque'}`}
              onClick={(ev) => ev.stopPropagation()} onChange={() => toggle(i)}
            />
            <div className="row-main">
              <span className="row-payee">{e.payee || 'No payee yet'}</span>
              <span className="row-meta">{e.no}</span>
            </div>
            <div className="row-side">
              <span className="row-amount">{fmtMoney(e.amount)}</span>
              <span className={`dot ${ready(e) ? 'ok' : 'warn'}`} title={ready(e) ? 'Ready to print' : 'Needs a payee and an amount'} />
            </div>
          </div>
        ))}
      </div>

      <div className="queue-foot">
        <div className="totals">
          <span>{ticked.length} of {entries.length} ticked</span>
          <strong>{fmtMoney(total)}</strong>
        </div>
        <div className="foot-actions">
          <button className="btn" onClick={onAdd} title="Ctrl + Enter"><IconPlus /> Add cheque</button>
          <button className="btn" onClick={onImport}><IconImport /> Import</button>
        </div>
        {entries.length > 1 && <button className="link-btn" onClick={onClear}>Clear all cheques</button>}
      </div>
    </aside>
  )
}