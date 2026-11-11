import { useState } from 'react'
import { Modal } from './ui.jsx'
import { IconWarn } from './icons.jsx'
import { fmtMoney } from '../lib/words.js'
import { pageSize } from '../lib/layout.js'
import { parseRows } from '../lib/parse.js'

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) {
  return (
    <Modal
      title={title} onClose={onCancel} width={420}
      footer={<>
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className={`btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm} autoFocus>{confirmLabel}</button>
      </>}
    >
      <p className="modal-text">{message}</p>
    </Modal>
  )
}

export function PromptDialog({ title, label, initial = '', confirmLabel = 'Save', onSubmit, onCancel }) {
  const [value, setValue] = useState(initial)
  const submit = () => { if (value.trim()) onSubmit(value.trim()) }
  return (
    <Modal
      title={title} onClose={onCancel} width={400}
      footer={<>
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn primary" onClick={submit} disabled={!value.trim()}>{confirmLabel}</button>
      </>}
    >
      <label className="field">
        <span className="field-label">{label}</span>
        <input type="text" value={value} autoFocus onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }} />
      </label>
    </Modal>
  )
}

export function ImportDialog({ onImport, onClose }) {
  const [text, setText] = useState('')
  const rows = parseRows(text)
  const onFile = async (e) => {
    const f = e.target.files[0]
    if (f) setText(await f.text())
    e.target.value = ''
  }
  return (
    <Modal
      title="Import cheques" onClose={onClose} width={560}
      footer={<>
        <span className="foot-note">{rows.length ? `${rows.length} ${rows.length === 1 ? 'cheque' : 'cheques'} found` : 'Nothing to import yet'}</span>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" disabled={!rows.length} onClick={() => onImport(rows)}>
          Add {rows.length || ''} {rows.length === 1 ? 'cheque' : 'cheques'}
        </button>
      </>}
    >
      <p className="modal-text">
        Copy rows from Excel with the payee in the first column, the amount in the second and an optional date in the third, then paste them here.
        Each row becomes one cheque with the next cheque number.
      </p>
      <textarea
        className="import-area" value={text} autoFocus spellCheck={false}
        onChange={(e) => setText(e.target.value)}
        placeholder={'CARE 4 LIFE TRADING CORP.\t10000\nDELA CRUZ, JUAN\t1,250.50'}
      />
      <div className="import-tools">
        <label className="btn sm file">Load a CSV file<input type="file" accept=".csv,.txt" onChange={onFile} hidden /></label>
        {rows.length > 0 && (
          <span className="foot-note">First row: {rows[0].payee || '(no payee)'}, {fmtMoney(rows[0].amount)}</span>
        )}
      </div>
    </Modal>
  )
}

/** Summary shown before printing: what is about to go to the printer, and anything that looks unfinished. */
export function PrintDialog({ entries, profile, onPrint, onClose }) {
  const [W, H] = pageSize(profile)
  const total = entries.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const issues = entries
    .map((e, i) => ({ i, e, why: [!e.payee.trim() && 'no payee', !(Number(e.amount) > 0) && 'amount is 0'].filter(Boolean) }))
    .filter((x) => x.why.length)
  const n = entries.length
  return (
    <Modal
      title={`Print ${n} ${n === 1 ? 'cheque' : 'cheques'}`} onClose={onClose} width={500}
      footer={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={onPrint} autoFocus>{issues.length ? 'Print anyway' : 'Print'}</button>
      </>}
    >
      <dl className="summary">
        <div><dt>Bank layout</dt><dd>{profile.name}</dd></div>
        <div><dt>Total amount</dt><dd className="strong">{fmtMoney(total)}</dd></div>
        <div><dt>Cheque numbers</dt><dd>{entries[0].no}{n > 1 ? ` to ${entries[n - 1].no}` : ''}</dd></div>
        <div><dt>Paper</dt><dd>{profile.mode === 'a4' ? 'A4 landscape' : 'Custom'}, {W} × {H} mm</dd></div>
      </dl>
      {issues.length > 0 && (
        <div className="notice warn">
          <IconWarn />
          <div>
            <strong>{issues.length} {issues.length === 1 ? 'cheque looks' : 'cheques look'} unfinished</strong>
            <ul>
              {issues.slice(0, 5).map(({ e, why }) => (
                <li key={e.id}>{e.payee.trim() || '(no payee)'}: {why.join(', ')}</li>
              ))}
              {issues.length > 5 && <li>and {issues.length - 5} more</li>}
            </ul>
          </div>
        </div>
      )}
      <p className="print-tip">
        In the print window choose <b>A4 landscape</b>, scale <b>100%</b>, margins <b>None</b>, and turn headers and footers off.
        Load the cheque the way your test print was loaded.
      </p>
    </Modal>
  )
}