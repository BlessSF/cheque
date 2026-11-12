import { useCallback, useEffect, useRef, useState } from 'react'
import TopBar from './components/TopBar.jsx'
import Queue from './components/Queue.jsx'
import Workspace from './components/Workspace.jsx'
import Inspector from './components/Inspector.jsx'
import PrintSheet from './components/PrintSheet.jsx'
import { ConfirmDialog, ImportDialog, PrintDialog, PromptDialog } from './components/Dialogs.jsx'
import { Toasts } from './components/ui.jsx'
import { DEFAULT_BANKS, incNo, migrateProfile, newProfile, todayISO } from './lib/layout.js'
import { useLocalStorage } from './lib/useLocalStorage.js'
import { buildBackup, downloadText, parseBackup } from './lib/backup.js'

/** Reuse layouts saved by earlier versions (positions untouched); date becomes Day / Month / Year. */
function loadProfiles() {
  for (const key of ['cm4_profiles', 'cm3_profiles']) {
    try {
      const old = JSON.parse(localStorage.getItem(key))
      if (Array.isArray(old) && old.length) return old.map(migrateProfile)
    } catch { /* ignore */ }
  }
  return DEFAULT_BANKS.map(newProfile)
}

const blank = (id, no) => ({ id, payee: '', amount: 0, date: todayISO(), memo: '', no, on: true })

export default function App({ security }) {
  const [profiles, setProfiles] = useLocalStorage('cm5_profiles', loadProfiles)
  // Self-heal: whatever is saved (older version, half-updated files) is brought up to date once at start.
  // migrateProfile is safe to run repeatedly: it keeps positions and only adds what is missing.
  useEffect(() => { setProfiles((all) => all.map(migrateProfile)) }, [setProfiles])
  const [bankIdx, setBankIdx] = useLocalStorage('cm3_bank', 0)
  const [settings, setSettings] = useLocalStorage('cm3_settings', { stars: false, currency: 'Pesos', nextNo: '6941334602', linkBanks: false })
  const [entries, setEntries] = useLocalStorage('cm3_entries', () => [
    { id: 1, payee: 'CARE 4 LIFE TRADING CORP.', amount: 10000, date: todayISO(), memo: '', no: '6941334601', on: true },
  ])
  const [sel, setSel] = useLocalStorage('cm3_sel', 0)
  const [activeField, setActiveField] = useState('payee')
  const [bg, setBg] = useState(null)
  const [bgOpacity, setBgOpacity] = useState(0.6)
  const [guides, setGuides] = useState(true)
  const [job, setJob] = useState(null) // what the hidden print sheet renders
  const [dialog, setDialog] = useState(null) // the one open dialog, if any
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  const toast = useCallback((text) => {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])

  const bi = Math.min(bankIdx, profiles.length - 1)
  const profile = profiles[bi]
  const si = Math.min(sel, entries.length - 1)
  const entry = entries[si]
  const nextId = () => Math.max(0, ...entries.map((e) => e.id)) + 1
  const closeDialog = () => setDialog(null)

  /* ---- profile / fields ---- */
  const locked = profile.locked !== false // saved per bank; locked unless explicitly unlocked
  const linked = !!settings.linkBanks // "keep all banks the same": every layout change goes to every bank
  const patchProfile = (p) => setProfiles((all) => all.map((b, i) => (linked || i === bi ? { ...b, ...p } : b)))
  const setLocked = (v) => { patchProfile({ locked: v }); toast(v ? 'Layout locked' : 'Layout unlocked') }
  const patchField = (key, p) => {
    // safety net: while locked, position and width can never change
    if (locked) { const { x, y, w, ...rest } = p; p = rest }
    if (!Object.keys(p).length) return
    setProfiles((all) => all.map((b, i) => (linked || i === bi ? { ...b, fields: { ...b.fields, [key]: { ...b.fields[key], ...p } } } : b)))
  }
  const patchSettings = (p) => setSettings((s) => ({ ...s, ...p }))

  const resetBank = () => setDialog({
    type: 'confirm', title: linked ? 'Reset all banks?' : `Reset ${profile.name}?`, danger: true, confirmLabel: 'Reset layout',
    message: linked
      ? 'All banks are kept the same, so every bank goes back to the positions from your Excel template.'
      : 'Every field on this bank goes back to the positions from your Excel template. Other banks are not changed.',
    onConfirm: () => {
      setProfiles((all) => all.map((b, i) => (linked || i === bi ? newProfile(b.name) : b)))
      closeDialog(); toast('Layout reset')
    },
  })
  const addBank = () => setDialog({
    type: 'prompt', title: 'Save as a new bank', label: 'Bank name', confirmLabel: 'Save bank',
    onSubmit: (name) => {
      setProfiles((all) => [...all, { ...JSON.parse(JSON.stringify(profile)), name }])
      setBankIdx(profiles.length); closeDialog(); toast(`${name} added`)
    },
  })
  const deleteBank = () => setDialog({
    type: 'confirm', title: `Delete ${profile.name}?`, danger: true, confirmLabel: 'Delete bank',
    message: 'The layout for this bank is removed. Your cheques are not affected.',
    onConfirm: () => { setProfiles((all) => all.filter((_, i) => i !== bi)); setBankIdx(0); closeDialog(); toast('Bank deleted') },
  })
  const copyLayoutToAll = () =>
    setProfiles((all) => all.map((b, i) => (i === bi ? b : { ...JSON.parse(JSON.stringify(profile)), name: b.name })))
  const applyToAll = () => setDialog({
    type: 'confirm', title: 'Use this layout for all banks?', confirmLabel: 'Apply to all banks',
    message: `The positions, sizes, colours and date settings of ${profile.name} are copied to all ${profiles.length - 1} other banks. Their names stay the same.`,
    onConfirm: () => { copyLayoutToAll(); closeDialog(); toast('Layout applied to all banks') },
  })
  const toggleLink = (on) => {
    if (!on) { patchSettings({ linkBanks: false }); toast('Banks can differ again'); return }
    setDialog({
      type: 'confirm', title: 'Keep all banks the same?', confirmLabel: 'Keep the same',
      message: `All banks are set to match ${profile.name} now. From then on, any change to positions, sizes, colours or date settings is applied to every bank.`,
      onConfirm: () => { copyLayoutToAll(); patchSettings({ linkBanks: true }); closeDialog(); toast('All banks now match') },
    })
  }
  const exportBackup = (withCheques) => {
    const stamp = new Date().toISOString().slice(0, 10)
    downloadText(`cheque-maker-backup-${stamp}.json`, JSON.stringify(buildBackup({ profiles, settings, bankIdx: bi, entries }, withCheques), null, 2))
    toast('Backup saved. Check your Downloads folder.')
  }
  const importBackup = (text) => {
    let b
    try { b = parseBackup(text) } catch (e) { return toast(e.message) }
    setDialog({
      type: 'confirm', title: 'Open this backup?', confirmLabel: 'Replace my layouts',
      message: `This replaces the ${profiles.length} bank layouts and settings on this computer with the ${b.profiles.length} in the file${b.entries ? ', and the cheque list too' : ''}. Your cheques are kept unless the file includes a cheque list.`,
      onConfirm: () => {
        setProfiles(b.profiles); setBankIdx(b.bankIdx)
        if (b.settings) setSettings((s) => ({ ...s, ...b.settings }))
        if (b.entries) { setEntries(b.entries); setSel(0) }
        closeDialog(); toast('Backup opened')
      },
    })
  }
  const resetData = () => setDialog({
    type: 'confirm', title: 'Erase all saved data?', danger: true, confirmLabel: 'Erase and restart',
    message: 'This removes every cheque, bank layout and setting saved in this browser. It cannot be undone.',
    onConfirm: () => {
      try { Object.keys(localStorage).filter((k) => k.startsWith('cm')).forEach((k) => localStorage.removeItem(k)) } catch { /* ignore */ }
      window.location.reload()
    },
  })

  /* ---- entries ---- */
  const takeNo = () => {
    const no = settings.nextNo
    patchSettings({ nextNo: incNo(no) })
    return no
  }
  const patchEntry = (p) => setEntries((all) => all.map((e, i) => (i === si ? { ...e, ...p } : e)))
  const addEntry = () => {
    setEntries((all) => [...all, { ...blank(nextId(), takeNo()), date: entry.date }]) // same date as the current cheque
    setSel(entries.length)
    toast('Cheque added')
  }
  const duplicateEntry = () => {
    setEntries((all) => [...all, { ...entry, id: nextId(), no: takeNo(), on: true }])
    setSel(entries.length)
    toast('Cheque duplicated')
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
    closeDialog()
    toast(`${fresh.length} ${fresh.length === 1 ? 'cheque' : 'cheques'} imported`)
  }
  const removeSel = () => {
    if (entries.length === 1) { patchEntry({ payee: '', amount: 0, memo: '' }); return }
    setEntries((all) => all.filter((_, i) => i !== si))
    setSel(Math.max(0, si - 1))
    toast('Cheque deleted')
  }
  const clearAll = () => setDialog({
    type: 'confirm', title: 'Clear all cheques?', danger: true, confirmLabel: 'Clear all',
    message: `All ${entries.length} cheques are removed from the list. Bank layouts are kept.`,
    onConfirm: () => { setEntries([blank(1, settings.nextNo)]); setSel(0); closeDialog(); toast('List cleared') },
  })

  /* ---- printing ---- */
  const ticked = entries.filter((e) => e.on)
  const reviewPrint = (list) => { if (list.length) setDialog({ type: 'print', entries: list }) }
  const confirmPrint = () => { setJob({ entries: dialog.entries }); closeDialog() }
  const onPrintDone = useCallback(() => setJob(null), [])

  // Ctrl + Enter anywhere adds the next cheque
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !dialog) { e.preventDefault(); addEntry() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <>
      <div className="app">
        <TopBar
          profiles={profiles} bankIdx={bi} setBankIdx={setBankIdx} profile={profile}
          tickedCount={ticked.length} onPrint={() => reviewPrint(ticked)} onApplyAll={applyToAll} linked={linked}
          onLock={security?.enabled ? security.lockNow : null}
        />
        <div className="shell">
          <Queue
            entries={entries} sel={si} setSel={setSel}
            toggle={(i) => setEntries((all) => all.map((e, j) => (j === i ? { ...e, on: !e.on } : e)))}
            setAll={(on) => setEntries((all) => all.map((e) => ({ ...e, on })))}
            onAdd={addEntry} onImport={() => setDialog({ type: 'import' })} onRemove={removeSel} onClear={clearAll}
          />
          <Workspace
            entry={entry} profile={profile} settings={settings} locked={locked} setLocked={setLocked}
            activeField={activeField} setActiveField={setActiveField} patchField={patchField} patchProfile={patchProfile}
            bg={bg} bgOpacity={bgOpacity} guides={guides} setGuides={setGuides}
            pos={si + 1} count={entries.length}
            onPrev={() => setSel((si - 1 + entries.length) % entries.length)}
            onNext={() => setSel((si + 1) % entries.length)}
          />
          <Inspector
            entry={entry} patch={patchEntry} currency={settings.currency} onAdd={addEntry} onDuplicate={duplicateEntry}
            profile={profile} patchProfile={patchProfile} locked={locked} setLocked={setLocked}
            activeField={activeField} setActiveField={setActiveField} patchField={patchField}
            bg={bg} setBg={setBg} bgOpacity={bgOpacity} setBgOpacity={setBgOpacity}
            onCalibrate={() => setJob({ calibration: true })}
            onReset={resetBank} onCopyBank={addBank} onApplyAll={applyToAll} linked={linked} onToggleLink={toggleLink} onDeleteBank={deleteBank} canDelete={profiles.length > 1}
            settings={settings} patchSettings={patchSettings} onResetData={resetData} security={security} onExportBackup={exportBackup} onImportBackup={importBackup}
          />
        </div>
      </div>

      {dialog?.type === 'confirm' && <ConfirmDialog {...dialog} onCancel={closeDialog} />}
      {dialog?.type === 'prompt' && <PromptDialog {...dialog} onCancel={closeDialog} />}
      {dialog?.type === 'import' && <ImportDialog onImport={importRows} onClose={closeDialog} />}
      {dialog?.type === 'print' && <PrintDialog entries={dialog.entries} profile={profile} onPrint={confirmPrint} onClose={closeDialog} />}
      <Toasts items={toasts} />
      <PrintSheet job={job} profile={profile} settings={settings} onDone={onPrintDone} />
    </>
  )
}