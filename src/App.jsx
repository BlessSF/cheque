import { useCallback, useState } from 'react'
import Preview from './components/Preview.jsx'
import PrintSheet from './components/PrintSheet.jsx'
import { BankPanel, ChequeForm, ChequeList, FieldsPanel, BackgroundPanel } from './components/Panels.jsx'
import { DEFAULT_BANKS, incNo, newProfile, todayISO } from './lib/layout.js'
import { useLocalStorage } from './lib/useLocalStorage.js'

const blank = (id, no) => ({ id, payee: '', amount: 0, date: todayISO(), memo: '', no, on: true })

export default function App() {
  const [profiles, setProfiles] = useLocalStorage('cm3_profiles', () => DEFAULT_BANKS.map(newProfile))
  const [bankIdx, setBankIdx] = useLocalStorage('cm3_bank', 0)
  const [settings, setSettings] = useLocalStorage('cm3_settings', { stars: false, currency: 'Pesos', nextNo: '6941334601' })
  const [entries, setEntries] = useLocalStorage('cm3_entries', () => [
    { id: 1, payee: 'CARE 4 LIFE TRADING CORP.', amount: 10000, date: todayISO(), memo: '', no: '6941334601', on: true },
  ])
  const [sel, setSel] = useLocalStorage('cm3_sel', 0)
  const [activeField, setActiveField] = useState('payee')
  const [bg, setBg] = useState(null)
  const [bgOpacity, setBgOpacity] = useState(0.6)
  const [guides, setGuides] = useState(true)
  const [job, setJob] = useState(null)

  const bi = Math.min(bankIdx, profiles.length - 1)
  const profile = profiles[bi]
  const si = Math.min(sel, entries.length - 1)
  const entry = entries[si]
  const nextId = () => Math.max(0, ...entries.map((e) => e.id)) + 1

  /* ---- profile / fields ---- */
  const patchProfile = (p) => setProfiles((all) => all.map((b, i) => (i === bi ? { ...b, ...p } : b)))
  const patchField = (key, p) =>
    setProfiles((all) => all.map((b, i) => (i === bi ? { ...b, fields: { ...b.fields, [key]: { ...b.fields[key], ...p } } } : b)))
  const patchSettings = (p) => setSettings((s) => ({ ...s, ...p }))

  const resetBank = () => {
    if (window.confirm(`Reset the layout for ${profile.name} to the Excel starting positions?`)) {
      setProfiles((all) => all.map((b, i) => (i === bi ? newProfile(b.name) : b)))
    }
  }
  const addBank = () => {
    const name = (window.prompt('Name for the new bank?') || '').trim()
    if (!name) return
    setProfiles((all) => [...all, { ...JSON.parse(JSON.stringify(profile)), name }])
    setBankIdx(profiles.length)
  }
  const deleteBank = () => {
    if (profiles.length < 2 || !window.confirm(`Delete ${profile.name}?`)) return
    setProfiles((all) => all.filter((_, i) => i !== bi))
    setBankIdx(0)
  }

  /* ---- entries ---- */
  const takeNo = () => {
    const no = settings.nextNo
    patchSettings({ nextNo: incNo(no) })
    return no
  }
  const patchEntry = (p) => setEntries((all) => all.map((e, i) => (i === si ? { ...e, ...p } : e)))
  const newEntry = () => {
    setEntries((all) => [...all, blank(nextId(), takeNo())])
    setSel(entries.length)
  }
  const importRows = (rows) => {
    if (!rows.length) return
    let no = settings.nextNo
    const fresh = rows.map((r, i) => {
      const e = { ...blank(nextId() + i, no), ...r }
      no = incNo(no)
      return e
    })
    patchSettings({ nextNo: no })
    const starter = entries.length === 1 && !entries[0].payee
    setEntries(starter ? fresh : [...entries, ...fresh])
    setSel(starter ? 0 : entries.length)
  }
  const removeSel = () => {
    if (entries.length === 1) { patchEntry({ payee: '', amount: 0, memo: '' }); return }
    setEntries((all) => all.filter((_, i) => i !== si))
    setSel(Math.max(0, si - 1))
  }
  const clearAll = () => {
    if (!window.confirm('Remove every cheque from the list?')) return
    setEntries([blank(1, settings.nextNo)])
    setSel(0)
  }

  /* ---- printing ---- */
  const printTicked = () => {
    const list = entries.filter((e) => e.on)
    if (!list.length) { window.alert('Tick at least one cheque to print.'); return }
    setJob({ entries: list })
  }
  const onPrintDone = useCallback(() => setJob(null), [])

  const nav = (
    <>
      <button onClick={() => setSel((si - 1 + entries.length) % entries.length)}>◀</button>
      <button onClick={() => setSel((si + 1) % entries.length)}>▶</button>
      <span className="hint">Cheque {si + 1} of {entries.length}</span>
      <span className="grow" />
      <label className="inline"><input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} /> Show field boxes</label>
    </>
  )

  return (
    <>
      <div className="app">
        <header>
          <h1>Cheque Maker</h1>
          <span className="hint">Fill in the details, pick the bank, print onto your pre-printed cheques.</span>
          <span className="grow" />
          <button className="pri" onClick={printTicked}>Print ticked cheques</button>
        </header>
        <main>
          <section className="side">
            <BankPanel
              profiles={profiles} bankIdx={bi} setBankIdx={setBankIdx} profile={profile}
              patchProfile={patchProfile} resetBank={resetBank} addBank={addBank} deleteBank={deleteBank}
            />
            <ChequeForm
              entry={entry} patch={patchEntry} currency={settings.currency}
              onNew={newEntry} onPrintOne={() => setJob({ entries: [entry] })} onCalibrate={() => setJob({ calibration: true })}
            />
            <ChequeList
              entries={entries} sel={si} setSel={setSel}
              toggle={(i) => setEntries((all) => all.map((e, j) => (j === i ? { ...e, on: !e.on } : e)))}
              setAll={(on) => setEntries((all) => all.map((e) => ({ ...e, on })))}
              remove={removeSel} importRows={importRows} clearAll={clearAll}
              nextNo={settings.nextNo} setNextNo={(v) => patchSettings({ nextNo: v })}
            />
            <FieldsPanel
              profile={profile} activeField={activeField} setActiveField={setActiveField}
              patchField={patchField} patchProfile={patchProfile} settings={settings} patchSettings={patchSettings}
            />
            <BackgroundPanel bg={bg} setBg={setBg} opacity={bgOpacity} setOpacity={setBgOpacity} />
          </section>
          <section>
            <Preview
              entry={entry} profile={profile} settings={settings} activeField={activeField}
              setActiveField={setActiveField} patchField={patchField} bg={bg} bgOpacity={bgOpacity}
              guides={guides} nav={nav}
            />
          </section>
        </main>
      </div>
      <PrintSheet job={job} profile={profile} settings={settings} onDone={onPrintDone} />
    </>
  )
}
