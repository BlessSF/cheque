import { useEffect, useRef, useState } from 'react'
import { ColorField, Field, NumberBox, NumInput, Switch, Tabs } from './ui.jsx'
import { IconCopy, IconPlus, IconPrint, IconWarn } from './icons.jsx'
import { amountWords } from '../lib/words.js'
import PasscodeGroup from './PasscodeGroup.jsx'
import BackupGroup from './BackupGroup.jsx'
import AmountInput from './AmountInput.jsx'
import { AUTHOR, COPYRIGHT } from '../lib/credit.js'

const round1 = (v) => Math.round(v * 10) / 10
const FONTS = ['Arial', 'Calibri', 'Courier New', 'Times New Roman', 'Verdana']

function Segmented({ value, options, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o} className={`seg-btn${value === o ? ' on' : ''}`} aria-pressed={value === o} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ Cheque */
function ChequeTab({ entry, patch, currency, onAdd, onDuplicate, profile, patchField }) {
  const dateOn = ['day', 'month', 'year'].every((k) => profile.fields[k].on)
  const setDateOn = (v) => ['day', 'month', 'year'].forEach((k) => patchField(k, { on: v }))
  const payeeRef = useRef(null)
  // an empty new cheque puts the cursor straight into Payee
  useEffect(() => { if (!entry.payee) payeeRef.current?.focus() }, [entry.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const issues = []
  if (!entry.payee.trim()) issues.push('a payee')
  if (!(Number(entry.amount) > 0)) issues.push('an amount')

  return (
    <div className="stack">
      <Field label="Pay to the order of">
        <input ref={payeeRef} type="text" className="payee-input" value={entry.payee}
          onChange={(e) => patch({ payee: e.target.value })} placeholder="Payee name" autoComplete="off" />
      </Field>
      <div className="two">
        <Field label="Amount">
          <span className="num big">
            <AmountInput value={entry.amount} onChange={(v) => patch({ amount: v })} />
          </span>
        </Field>
        <div className={`field${dateOn ? '' : ' is-off'}`}>
          <div className="label-row">
            <span className="field-label">Date</span>
            <Switch checked={dateOn} onChange={setDateOn} label="Print" />
          </div>
          <input type="date" aria-label="Date" value={entry.date} onChange={(e) => patch({ date: e.target.value })} />
          {!dateOn && <span className="field-hint">Not printed on the cheque</span>}
        </div>
      </div>
      <div className="two">
        <Field label="Cheque number"><input type="text" value={entry.no} onChange={(e) => patch({ no: e.target.value })} /></Field>
        <Field label="Memo (optional)"><input type="text" value={entry.memo} onChange={(e) => patch({ memo: e.target.value })} /></Field>
      </div>

      <div className="words">
        <span className="field-label">Amount in words</span>
        <p>{amountWords(entry.amount, currency)}</p>
      </div>

      {issues.length > 0 && (
        <div className="notice warn"><IconWarn /><div>This cheque still needs {issues.join(' and ')}.</div></div>
      )}

      <div className="btn-row">
        <button className="btn" onClick={onAdd}><IconPlus /> Add cheque</button>
        <button className="btn" onClick={onDuplicate}><IconCopy /> Duplicate</button>
      </div>
      <p className="help">Add cheque keeps this date and uses the next cheque number. Shortcut: Ctrl + Enter.</p>
    </div>
  )
}

/* ------------------------------------------------------------------ Layout */
function LayoutTab({
  profile, patchProfile, locked, setLocked, activeField, setActiveField, patchField,
  bg, setBg, bgOpacity, setBgOpacity, onCalibrate, onReset, onCopyBank, onApplyAll, onDeleteBank, canDelete, linked, onToggleLink,
}) {
  const f = profile.fields[activeField]
  const setShadow = (p) => patchProfile({ shadow: { ...profile.shadow, ...p } })
  const onFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const r = new FileReader()
    r.onload = () => setBg(r.result)
    r.readAsDataURL(file)
  }
  return (
    <div className="stack">
      <section className="group">
        <h3>All banks</h3>
        <Switch checked={linked} onChange={onToggleLink} label="Keep all banks the same" />
        <p className="help">
          {linked
            ? 'On. Every change to positions, sizes, colours or date settings is applied to all banks.'
            : 'Off. Each bank has its own layout. Turn this on to set the layout once for every bank, or copy it just once:'}
        </p>
        {!linked && <button className="btn" onClick={onApplyAll}>Apply this layout to all banks</button>}
      </section>

      <section className="group">
        <h3>Paper</h3>
        <Field label="Page size">
          <select value={profile.mode} onChange={(e) => patchProfile({ mode: e.target.value })}>
            <option value="a4">A4 landscape (same as your Excel)</option>
            <option value="custom">Custom size</option>
          </select>
        </Field>
        {profile.mode === 'custom' && (
          <div className="two">
            <NumInput label="Width" unit="mm" value={profile.pw} onChange={(v) => patchProfile({ pw: v })} />
            <NumInput label="Height" unit="mm" value={profile.ph} onChange={(v) => patchProfile({ ph: v })} />
          </div>
        )}
        <div className="two">
          <NumInput label="Printer offset, across" unit="mm" value={profile.nx} onChange={(v) => patchProfile({ nx: v })} />
          <NumInput label="Printer offset, down" unit="mm" value={profile.ny} onChange={(v) => patchProfile({ ny: v })} />
        </div>
        <p className="help">The offset shifts everything on paper by the same amount, so one printer's feed error doesn't mean moving each field.</p>
        <button className="btn" onClick={onCalibrate}><IconPrint /> Print test page</button>
      </section>

      <section className="group">
        <div className="group-head">
          <h3>Cheque outline</h3>
          <Switch checked={!!profile.shadow?.on} onChange={(v) => setShadow({ on: v })} label="Show" />
        </div>
        {profile.shadow?.on && (
          <>
            <div className="two">
              <NumInput label="Left" unit="mm" value={profile.shadow.x} onChange={(v) => setShadow({ x: v })} />
              <NumInput label="Top" unit="mm" value={profile.shadow.y} onChange={(v) => setShadow({ y: v })} />
              <NumInput label="Width" unit="mm" value={profile.shadow.w} onChange={(v) => setShadow({ w: v })} />
              <NumInput label="Height" unit="mm" value={profile.shadow.h} onChange={(v) => setShadow({ h: v })} />
            </div>
            <p className="help">A faint cheque drawn behind the fields so the preview reads like a cheque. Set the size of your real cheque. It is for orientation only and is never printed.</p>
          </>
        )}
      </section>

      <section className="group">
        <div className="group-head">
          <h3>Fields</h3>
          <Switch checked={locked} onChange={setLocked} label="Lock positions" />
        </div>
        <ul className="fieldlist">
          <li className="head" aria-hidden="true"><span>Field</span><span>Across</span><span>Down</span></li>
          {Object.entries(profile.fields).map(([k, fld]) => (
            <li key={k} className={k === activeField ? 'on' : ''}>
              <Switch checked={fld.on} onChange={(v) => patchField(k, { on: v })} label={<span className="visually-hidden">Show {fld.label}</span>} />
              <button className="fieldname" onClick={() => setActiveField(k)}>{fld.label}</button>
              <NumberBox
                className="coord" aria-label={`${fld.label}, across in mm`} value={fld.x} disabled={locked}
                onFocus={() => setActiveField(k)} onChange={(v) => patchField(k, { x: v })}
              />
              <NumberBox
                className="coord" aria-label={`${fld.label}, down in mm`} value={fld.y} disabled={locked}
                onFocus={() => setActiveField(k)} onChange={(v) => patchField(k, { y: v })}
              />
            </li>
          ))}
        </ul>
        <p className="help">
          {locked
            ? 'Positions are locked. Turn off Lock positions to type or drag them. Numbers are millimetres from the top-left corner of the page.'
            : 'Type a number, or press the up and down arrow keys to step it (Shift 0.1 mm, Alt 5 mm). Numbers are millimetres from the top-left corner of the page.'}
        </p>

        {f && (
          <div className="editor">
            <h4>{f.label}</h4>
            <div className="three">
              <NumInput label="Across" unit="mm" value={f.x} disabled={locked} onChange={(v) => patchField(activeField, { x: v })} />
              <NumInput label="Down" unit="mm" value={f.y} disabled={locked} onChange={(v) => patchField(activeField, { y: v })} />
              <NumInput label="Width" unit="mm" value={f.w} disabled={locked} onChange={(v) => patchField(activeField, { w: v })} />
            </div>
            <div className="two">
              <NumInput label="Font size" unit="pt" value={f.size} onChange={(v) => patchField(activeField, { size: v })} />
              <NumInput label="Letter gap" unit="mm" step={0.1} value={f.ls || 0} onChange={(v) => patchField(activeField, { ls: v })} />
            </div>
            <Field label="Alignment">
              <Segmented value={f.align} options={['left', 'center', 'right']} onChange={(v) => patchField(activeField, { align: v })} label="Alignment" />
            </Field>
            <Field label="Font">
              <select value={f.font} onChange={(e) => patchField(activeField, { font: e.target.value })}>
                {FONTS.map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <ColorField label="Text colour" value={f.color} onChange={(c) => patchField(activeField, { color: c })} />
            <button className="btn sm" onClick={() => Object.keys(profile.fields).forEach((k) => patchField(k, { color: f.color || '#000000' }))}>
              Use this colour for all fields
            </button>
            {locked && <p className="help">Positions are locked. Turn off Lock positions to move this field.</p>}
          </div>
        )}
      </section>

      <section className="group">
        <h3>Scan of a blank cheque</h3>
        <p className="help">Shown behind the preview only, never printed. Set the page size to the scan's real size, then place the fields on it.</p>
        <input type="file" accept="image/*" onChange={onFile} />
        {bg && (
          <div className="two" style={{ alignItems: 'end' }}>
            <Field label="Opacity"><input type="range" min="10" max="100" value={Math.round(bgOpacity * 100)} onChange={(e) => setBgOpacity(e.target.value / 100)} /></Field>
            <button className="btn sm" onClick={() => setBg(null)}>Remove scan</button>
          </div>
        )}
      </section>

      <section className="group">
        <h3>{profile.name} layout</h3>
        <div className="btn-col">
          <button className="btn" onClick={onCopyBank}>Save as a new bank</button>
          <button className="btn" onClick={onReset}>Reset to the Excel positions</button>
          <button className="btn danger-outline" onClick={onDeleteBank} disabled={!canDelete}>Delete this bank</button>
        </div>
      </section>
    </div>
  )
}

/* -------------------------------------------------------------------- Date */
function DateTab({ profile, locked, patchField, patchProfile }) {
  const { day, month, year } = profile.fields
  const gap1 = round1(month.x - day.x)
  const gap2 = round1(year.x - month.x)
  const setGap1 = (v) => {
    const delta = v - gap1
    patchField('month', { x: round1(day.x + v) })
    patchField('year', { x: round1(year.x + delta) }) // keeps the month to year gap as it was
  }
  const setGap2 = (v) => patchField('year', { x: round1(month.x + v) })
  const all = (p) => ['day', 'month', 'year'].forEach((k) => patchField(k, p))
  return (
    <div className="stack">
      <Switch checked={day.on && month.on && year.on} onChange={(v) => all({ on: v })} label="Print the date" />
      <section className="group">
        <h3>Spacing</h3>
        <div className="two">
          <NumInput label="Day to month" unit="mm" value={gap1} disabled={locked} onChange={setGap1} />
          <NumInput label="Month to year" unit="mm" value={gap2} disabled={locked} onChange={setGap2} />
        </div>
        <p className="help">
          Measured from the left edge of one part to the next. Moving the month also moves the year.
          {locked ? ' Turn off Lock positions in the Layout tab to change the gaps.' : ''}
        </p>
        <div className="two">
          <NumInput label="Letter gap" unit="mm" step={0.1} value={month.ls || 0} onChange={(v) => all({ ls: v })} />
          <NumInput label="Font size" unit="pt" value={month.size} onChange={(v) => all({ size: v })} />
        </div>
        <p className="help">Use a letter gap when the cheque has a separate box for every digit.</p>
        <ColorField label="Text colour" value={month.color} onChange={(c) => all({ color: c })} />
      </section>
      <section className="group">
        <h3>Style</h3>
        <div className="two">
          <Field label="Month">
            <select value={profile.mfmt} onChange={(e) => patchProfile({ mfmt: e.target.value })}>
              <option value="num">11</option><option value="short">NOV</option><option value="long">NOVEMBER</option>
            </select>
          </Field>
          <Field label="Year">
            <select value={profile.yfmt} onChange={(e) => patchProfile({ yfmt: e.target.value })}>
              <option value="4">2026</option><option value="2">26</option>
            </select>
          </Field>
        </div>
        <p className="help">To place the day, month or year on its own, select it under Fields in the Layout tab.</p>
      </section>
    </div>
  )
}

/* ----------------------------------------------------------------- Options */
function OptionsTab({ settings, patchSettings, onResetData, security, onExportBackup, onImportBackup, onPublishLayout }) {
  return (
    <div className="stack">
      <section className="group">
        <h3>Amount</h3>
        <Switch checked={settings.stars} onChange={(v) => patchSettings({ stars: v })} label="Fill the amount with asterisks, like **1,250.00**" />
        <Field label="Currency word in the amount in words">
          <input type="text" value={settings.currency} onChange={(e) => patchSettings({ currency: e.target.value })} />
        </Field>
      </section>
      <section className="group">
        <h3>Numbering</h3>
        <Field label="Next cheque number" hint="The first cheque uses 6941334601 from your Sheet2. New cheques continue from here.">
          <input type="text" value={settings.nextNo} onChange={(e) => patchSettings({ nextNo: e.target.value })} />
        </Field>
      </section>
      <BackupGroup onExport={onExportBackup} onImport={onImportBackup} onPublish={onPublishLayout} />
      {security && <PasscodeGroup security={security} />}
      <section className="group">
        <h3>Saved data</h3>
        <p className="help">Cheques, layouts and settings are saved in this browser on this computer only.</p>
        <button className="btn danger-outline" onClick={onResetData}>Erase saved data</button>
      </section>
      <section className="group">
        <h3>About</h3>
        <p className="about-name">Cheque Maker</p>
        <p className="help">Designed and built by <b>{AUTHOR}</b>.</p>
        <p className="help">{COPYRIGHT}. All rights reserved. Please don't copy, resell or share this system without permission.</p>
      </section>
    </div>
  )
}

const TABS = [
  { id: 'cheque', label: 'Cheque' },
  { id: 'layout', label: 'Layout' },
  { id: 'date', label: 'Date' },
  { id: 'options', label: 'Options' },
]

export default function Inspector(props) {
  const [tab, setTab] = useState('cheque')
  return (
    <aside className="inspector" aria-label="Settings">
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <div className="inspector-body" role="tabpanel">
        {tab === 'cheque' && <ChequeTab {...props} />}
        {tab === 'layout' && <LayoutTab {...props} />}
        {tab === 'date' && <DateTab {...props} />}
        {tab === 'options' && <OptionsTab {...props} />}
      </div>
    </aside>
  )
}