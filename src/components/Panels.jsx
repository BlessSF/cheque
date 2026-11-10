import { useEffect, useRef, useState } from 'react'
import { amountWords } from '../lib/words.js'
import { parseRows } from '../lib/parse.js'
import { useLocalStorage } from '../lib/useLocalStorage.js'

const round1 = (v) => Math.round(v * 10) / 10

const Num = ({ label, value, onChange, step = 0.5, ...rest }) => (
  <div>
    <label>{label}</label>
    <input type="number" step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} {...rest} />
  </div>
)

/** A card whose body can be folded away; open/closed is remembered. */
export function Card({ id, title, badge, defaultOpen = true, children }) {
  const [open, setOpen] = useLocalStorage(`cm_open_${id}`, defaultOpen)
  return (
    <div className="card">
      <button className="cardhead" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{title}</span>
        {badge && <span className="count">{badge}</span>}
        <span className="grow" />
        <span className="chev">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="cardbody">{children}</div>}
    </div>
  )
}

/* ---------------------------------------------------------------- bank */
export function BankPanel({ profiles, bankIdx, setBankIdx, profile, patchProfile, resetBank, addBank, deleteBank, applyToAll }) {
  return (
    <Card id="bank" title="Bank layout" badge={profile.name} defaultOpen={false}>
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
        Nudge X/Y fixes printer feed offset for this bank without moving the fields. Use "Print test page" to check against a real cheque.
      </p>
      <div className="row wrap">
        <button onClick={resetBank}>Reset layout</button>
        <button onClick={addBank}>Copy as new bank…</button>
        <button onClick={applyToAll} title="Copies every field position and setting of this bank to all other banks">Use for all banks</button>
        <button onClick={deleteBank} disabled={profiles.length < 2}>Delete bank</button>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------- cheque */
export function ChequeForm({ entry, patch, currency, onNew, onDuplicate, onPrintOne, onCalibrate }) {
  const payeeRef = useRef(null)
  // a fresh, empty cheque puts the cursor straight into Payee
  useEffect(() => { if (!entry.payee) payeeRef.current?.focus() }, [entry.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const issues = []
  if (!entry.payee.trim()) issues.push('no payee')
  if (!(Number(entry.amount) > 0)) issues.push('amount is 0')

  return (
    <Card id="details" title="Cheque details">
      <div onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); onNew() } }}>
        <label>Payee</label>
        <input ref={payeeRef} type="text" value={entry.payee} onChange={(e) => patch({ payee: e.target.value })} placeholder="Pay to the order of" />
        <div className="row">
          <div>
            <label>Amount</label>
            <input type="number" step="0.01" min="0" value={entry.amount === 0 ? '' : entry.amount} placeholder="0.00"
              onChange={(e) => patch({ amount: parseFloat(e.target.value) || 0 })} />
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
        {issues.length > 0 && <p className="warn">Check: {issues.join(', ')}.</p>}
        <div className="row wrap" style={{ marginTop: 10 }}>
          <button onClick={onNew} title="Ctrl + Enter">+ Add cheque</button>
          <button onClick={onDuplicate}>Duplicate</button>
          <button className="pri" onClick={onPrintOne}>Print this one</button>
          <button onClick={onCalibrate} title="Prints rulers and field boxes on plain paper">Print test page</button>
        </div>
        <p className="hint">Add cheque keeps the same date and gives the next cheque number. Shortcut: Ctrl + Enter.</p>
      </div>
    </Card>
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
    <Card id="list" title="Cheque list" badge={`${entries.filter((x) => x.on).length}/${entries.length} ticked`}>
      <div className="list">
        {entries.map((e, i) => (
          <div key={e.id} className={`item${i === sel ? ' sel' : ''}`} onClick={() => setSel(i)}>
            <input type="checkbox" checked={e.on} onClick={(ev) => ev.stopPropagation()} onChange={() => toggle(i)} />
            <span className="n">
              {e.payee || '(no payee)'}
              <small>{e.no}</small>
            </span>
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
      <p className="hint">Assigned in order to each new cheque (the first cheque uses 6941334601, from your Sheet2).</p>
    </Card>
  )
}

/* -------------------------------------------------------------- fields */
const ALIGNS = ['left', 'center', 'right']
const FONTS = ['Arial', 'Calibri', 'Courier New', 'Times New Roman', 'Verdana']

export function FieldsPanel({ locked, setLocked, profile, activeField, setActiveField, patchField }) {
  const f = profile.fields[activeField]
  return (
    <Card id="fields" title="Fields on cheque" badge={locked ? '🔒 locked' : '🔓 unlocked'} defaultOpen={false}>
      <button className={`lockbtn${locked ? ' on' : ''}`} onClick={() => setLocked(!locked)}>
        {locked ? '🔒 Layout locked — click to unlock' : '🔓 Unlocked — click to lock'}
      </button>
      {Object.entries(profile.fields).map(([k, fld]) => (
        <div className="chk" key={k}>
          <input type="checkbox" checked={fld.on} onChange={(e) => patchField(k, { on: e.target.checked })} />
          <button className={`link${k === activeField ? ' on' : ''}`} onClick={() => setActiveField(k)}>{fld.label}</button>
          <span className="pos">{fld.x}, {fld.y} mm</span>
        </div>
      ))}
      {f && (
        <div className="fieldEd">
          <label style={{ marginTop: 0, fontWeight: 600, color: 'var(--ink)' }}>{f.label}</label>
          <div className="row">
            <Num label="X mm" value={f.x} disabled={locked} onChange={(v) => patchField(activeField, { x: v })} />
            <Num label="Y mm" value={f.y} disabled={locked} onChange={(v) => patchField(activeField, { y: v })} />
            <Num label="Width mm" value={f.w} disabled={locked} onChange={(v) => patchField(activeField, { w: v })} />
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
          <label>Font</label>
          <select value={f.font} onChange={(e) => patchField(activeField, { font: e.target.value })}>
            {FONTS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
      )}
    </Card>
  )
}

/** Everything about the date in one place: spacing, letter gap, size, month and year style. */
export function DatePanel({ profile, locked, patchField, patchProfile }) {
  const { day, month, year } = profile.fields
  const gap1 = round1(month.x - day.x) // Day -> Month (left edge to left edge)
  const gap2 = round1(year.x - month.x) // Month -> Year
  const setGap1 = (v) => {
    const delta = v - gap1
    patchField('month', { x: round1(day.x + v) })
    patchField('year', { x: round1(year.x + delta) }) // keeps Month -> Year as it was
  }
  const setGap2 = (v) => patchField('year', { x: round1(month.x + v) })
  const all = (p) => ['day', 'month', 'year'].forEach((k) => patchField(k, p))
  const allOn = day.on && month.on && year.on
  return (
    <Card id="date" title="Date settings" defaultOpen={false}>
      <div className="chk">
        <input type="checkbox" checked={allOn} onChange={(e) => all({ on: e.target.checked })} />
        <span>Print the date</span>
      </div>
      <div className="row">
        <Num label="Day → Month mm" value={gap1} disabled={locked} onChange={setGap1} />
        <Num label="Month → Year mm" value={gap2} disabled={locked} onChange={setGap2} />
      </div>
      <div className="row">
        <Num label="Letter gap mm" value={month.ls || 0} step={0.1} onChange={(v) => all({ ls: v })} />
        <Num label="Font pt" value={month.size} onChange={(v) => all({ size: v })} />
      </div>
      <div className="row">
        <div>
          <label>Month style</label>
          <select value={profile.mfmt} onChange={(e) => patchProfile({ mfmt: e.target.value })}>
            <option value="num">11</option>
            <option value="short">NOV</option>
            <option value="long">NOVEMBER</option>
          </select>
        </div>
        <div>
          <label>Year style</label>
          <select value={profile.yfmt} onChange={(e) => patchProfile({ yfmt: e.target.value })}>
            <option value="4">2026</option>
            <option value="2">26</option>
          </select>
        </div>
      </div>
      <p className="hint">
        Gaps run from the left edge of one part to the next{locked ? ' (unlock the layout to change them)' : ''}.
        Letter gap spreads the digits, for cheques with a box per digit. To move one part on its own, pick it in "Fields on cheque".
      </p>
    </Card>
  )
}

export function AmountPanel({ settings, patchSettings }) {
  return (
    <Card id="amount" title="Amount & words" defaultOpen={false}>
      <div className="chk">
        <input type="checkbox" checked={settings.stars} onChange={(e) => patchSettings({ stars: e.target.checked })} />
        <span>Pad amount with asterisks (**1,250.00**)</span>
      </div>
      <label>Currency word</label>
      <input type="text" value={settings.currency} onChange={(e) => patchSettings({ currency: e.target.value })} />
    </Card>
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
    <Card id="helper" title="Preview helper" defaultOpen={false}>
      <label>Scan or photo of a blank cheque (preview only, never printed)</label>
      <input type="file" accept="image/*" onChange={onFile} />
      <div className="row" style={{ alignItems: 'end' }}>
        <div><label>Opacity</label><input type="range" min="10" max="100" value={Math.round(opacity * 100)} onChange={(e) => setOpacity(e.target.value / 100)} /></div>
        <button className="sm" onClick={() => setBg(null)}>Remove</button>
      </div>
      <p className="hint">Set Page to the scan's real size (Custom), then drag the fields onto the scan.</p>
    </Card>
  )
}