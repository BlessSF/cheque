import { useState } from 'react'
import { amountWords } from '../lib/words.js'
import { parseRows } from '../lib/parse.js'

const Num = ({ label, value, onChange, step = 0.5, ...rest }) => (
  <div>
    <label>{label}</label>
    <input type="number" step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} {...rest} />
  </div>
)

export function BankPanel({ profiles, bankIdx, setBankIdx, profile, patchProfile, resetBank, addBank, deleteBank }) {
  return (
    <div className="card">
      <h2>Bank layout</h2>
      <select value={bankIdx} onChange={(e) => setBankIdx(Number(e.target.value))}>
        {profiles.map((b, i) => <option key={i} value={i}>{b.name}</option>)}
      </select>
      <label>Page</label>
      <select value={profile.mode} onChange={(e) => patchProfile({ mode: e.target.value })}>
        <option value="a4">A4 landscape (same as your Excel)</option>
        <option value="custom">Custom size (mm)</option>
      </select>
      {profile.mode === 'custom' && (
        <div className="row">
          <Num label="Width mm" value={profile.pw} onChange={(v) => patchProfile({ pw: v })} />
          <Num label="Height mm" value={profile.ph} onChange={(v) => patchProfile({ ph: v })} />
        </div>
      )}
      <div className="row">
        <Num label="Printer nudge X (mm)" value={profile.nx} onChange={(v) => patchProfile({ nx: v })} />
        <Num label="Printer nudge Y (mm)" value={profile.ny} onChange={(v) => patchProfile({ ny: v })} />
      </div>
      <p className="hint">
        Each bank starts from your Excel layout. Print a test on plain paper, hold it against a real cheque, then drag
        the fields until they line up. Nudge X/Y fixes printer feed offset for this bank without moving the fields.
      </p>
      <div className="row wrap">
        <button onClick={resetBank}>Reset layout</button>
        <button onClick={addBank}>Copy as new bank…</button>
        <button onClick={deleteBank} disabled={profiles.length < 2}>Delete bank</button>
      </div>
    </div>
  )
}

export function ChequeForm({ entry, patch, currency, onNew, onPrintOne, onCalibrate }) {
  return (
    <div className="card">
      <h2>Cheque details</h2>
      <label>Payee</label>
      <input type="text" value={entry.payee} onChange={(e) => patch({ payee: e.target.value })} placeholder="Pay to the order of" />
      <div className="row">
        <div>
          <label>Amount</label>
          <input type="number" step="0.01" min="0" value={entry.amount} onChange={(e) => patch({ amount: parseFloat(e.target.value) || 0 })} />
        </div>
        <div>
          <label>Date</label>
          <input type="date" value={entry.date} onChange={(e) => patch({ date: e.target.value })} />
        </div>
      </div>
      <div className="row">
        <div><label>Cheque no.</label><input type="text" value={entry.no} onChange={(e) => patch({ no: e.target.value })} /></div>
        <div><label>Memo (optional)</label><input type="text" value={entry.memo} onChange={(e) => patch({ memo: e.target.value })} /></div>
      </div>
      <label>Amount in words (automatic)</label>
      <input type="text" readOnly value={amountWords(entry.amount, currency)} />
      <div className="row wrap" style={{ marginTop: 10 }}>
        <button onClick={onNew}>+ New cheque</button>
        <button className="pri" onClick={onPrintOne}>Print this one</button>
        <button onClick={onCalibrate} title="Prints rulers and field boxes on plain paper">Print test page</button>
      </div>
    </div>
  )
}

export function ChequeList({ entries, sel, setSel, toggle, setAll, remove, importRows, nextNo, setNextNo, clearAll }) {
  const [text, setText] = useState('')

  const onFile = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    importRows(parseRows(await f.text()))
    e.target.value = ''
  }
  return (
    <div className="card">
      <h2>Cheque list <span className="count">{entries.filter((x) => x.on).length}/{entries.length} ticked</span></h2>
      <div className="list">
        {entries.map((e, i) => (
          <div key={e.id} className={`item${i === sel ? ' sel' : ''}`} onClick={() => setSel(i)}>
            <input type="checkbox" checked={e.on} onClick={(ev) => ev.stopPropagation()} onChange={() => toggle(i)} />
            <span className="n">{e.payee || '(no payee)'}</span>
            <span className="a">{(Number(e.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        ))}
      </div>
      <div className="row wrap" style={{ marginTop: 8 }}>
        <button className="sm" onClick={() => setAll(true)}>Tick all</button>
        <button className="sm" onClick={() => setAll(false)}>Untick all</button>
        <button className="sm" onClick={remove}>Delete selected</button>
        <button className="sm" onClick={clearAll}>Clear list</button>
      </div>
      <label>Paste from Excel (Payee ⇥ Amount ⇥ optional Date)</label>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={'CARE 4 LIFE TRADING CORP.\t10000'} />
      <div className="row" style={{ marginTop: 6 }}>
        <button onClick={() => { importRows(parseRows(text)); setText('') }}>Add rows</button>
        <label className="filebtn">Load CSV…<input type="file" accept=".csv,.txt" onChange={onFile} hidden /></label>
      </div>
      <label>Next cheque number</label>
      <input type="text" value={nextNo} onChange={(e) => setNextNo(e.target.value)} />
      <p className="hint">Assigned in order to each new cheque (your Sheet2 series starts at 6941334601).</p>
    </div>
  )
}

const ALIGNS = ['left', 'center', 'right']
const FONTS = ['Arial', 'Calibri', 'Courier New', 'Times New Roman', 'Verdana']

export function FieldsPanel({ profile, activeField, setActiveField, patchField, patchProfile, settings, patchSettings }) {
  const f = profile.fields[activeField]
  return (
    <div className="card">
      <h2>Fields on cheque</h2>
      {Object.entries(profile.fields).map(([k, fld]) => (
        <div className="chk" key={k}>
          <input type="checkbox" checked={fld.on} onChange={(e) => patchField(k, { on: e.target.checked })} />
          <button className={`link${k === activeField ? ' on' : ''}`} onClick={() => setActiveField(k)}>{fld.label}</button>
        </div>
      ))}
      {f && (
        <div className="fieldEd">
          <div className="row">
            <Num label="X mm" value={f.x} onChange={(v) => patchField(activeField, { x: v })} />
            <Num label="Y mm" value={f.y} onChange={(v) => patchField(activeField, { y: v })} />
            <Num label="Width mm" value={f.w} onChange={(v) => patchField(activeField, { w: v })} />
          </div>
          <div className="row">
            <Num label="Font pt" value={f.size} onChange={(v) => patchField(activeField, { size: v })} />
            <div>
              <label>Align</label>
              <select value={f.align} onChange={(e) => patchField(activeField, { align: e.target.value })}>
                {ALIGNS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <Num label="Letter gap mm" value={f.ls || 0} step={0.1} onChange={(v) => patchField(activeField, { ls: v })} />
          </div>
          <div className="row">
            <div>
              <label>Font</label>
              <select value={f.font} onChange={(e) => patchField(activeField, { font: e.target.value })}>
                {FONTS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            {activeField === 'month' && (
              <div>
                <label>Month style</label>
                <select value={profile.mfmt} onChange={(e) => patchProfile({ mfmt: e.target.value })}>
                  <option value="num">11</option>
                  <option value="short">NOV</option>
                  <option value="long">NOVEMBER</option>
                </select>
              </div>
            )}
            {activeField === 'year' && (
              <div>
                <label>Year style</label>
                <select value={profile.yfmt} onChange={(e) => patchProfile({ yfmt: e.target.value })}>
                  <option value="4">2026</option>
                  <option value="2">26</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="chk" style={{ marginTop: 10 }}>
        <input type="checkbox" checked={settings.stars} onChange={(e) => patchSettings({ stars: e.target.checked })} />
        <span>Pad amount with asterisks (**1,250.00**)</span>
      </div>
      <label>Currency word</label>
      <input type="text" value={settings.currency} onChange={(e) => patchSettings({ currency: e.target.value })} />
    </div>
  )
}

export function BackgroundPanel({ bg, setBg, opacity, setOpacity }) {
  const onFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const r = new FileReader()
    r.onload = () => setBg(r.result)
    r.readAsDataURL(file)
  }
  return (
    <div className="card">
      <h2>Preview helper</h2>
      <label>Scan or photo of a blank cheque (preview only, never printed)</label>
      <input type="file" accept="image/*" onChange={onFile} />
      <div className="row" style={{ alignItems: 'end' }}>
        <div><label>Opacity</label><input type="range" min="10" max="100" value={Math.round(opacity * 100)} onChange={(e) => setOpacity(e.target.value / 100)} /></div>
        <button className="sm" onClick={() => setBg(null)}>Remove</button>
      </div>
      <p className="hint">Set Page to the scan's real size (Custom), then drag the fields onto the scan.</p>
    </div>
  )
}