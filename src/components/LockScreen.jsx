import { useEffect, useRef, useState } from 'react'
import { Mark } from './icons.jsx'
import { MIN_LEN } from '../lib/passcode.js'
import { AUTHOR } from '../lib/credit.js'

/** Full-screen gate. mode: 'unlock' (enter passcode) | 'setup' (choose one). */
export default function LockScreen({ mode, site, onUnlock, onSetup, onSkip, onForgot }) {
  const [pass, setPass] = useState('')
  const [again, setAgain] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [fails, setFails] = useState(0)
  const [wait, setWait] = useState(0)
  const [sure, setSure] = useState(false)
  const first = useRef(null)
  useEffect(() => { first.current?.focus() }, [mode])
  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  async function submit(e) {
    e.preventDefault()
    if (busy || wait > 0) return
    setErr('')
    if (mode === 'setup') {
      if (pass.length < MIN_LEN) return setErr(`Use at least ${MIN_LEN} characters.`)
      if (pass !== again) return setErr('The two passcodes do not match.')
    } else if (!pass) return
    setBusy(true)
    try {
      if (mode === 'setup') await onSetup(pass)
      else if (!(await onUnlock(pass))) {
        const n = fails + 1
        setFails(n); setPass('')
        if (n % 5 === 0) { setWait(30); setErr('Too many tries. Wait 30 seconds.') } else setErr('Wrong passcode. Try again.')
        first.current?.focus()
      }
    } catch (x) { setErr(x.message || 'Something went wrong.') }
    setBusy(false)
  }

  return (
    <main className="lock">
      <form className="lock-card" onSubmit={submit} autoComplete="off">
        <div className="lock-brand"><Mark size={30} /><span>Cheque Maker</span></div>
        <h1>{mode === 'setup' ? 'Choose a passcode' : 'Enter your passcode'}</h1>
        <p className="lock-sub">
          {mode === 'setup'
            ? 'You will enter it each time you open Cheque Maker on this computer.'
            : 'Cheque Maker is locked.'}
        </p>
        <label className="field">
          <span className="field-label">{mode === 'setup' ? 'New passcode' : 'Passcode'}</span>
          <input ref={first} type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" spellCheck="false" />
        </label>
        {mode === 'setup' && (
          <label className="field">
            <span className="field-label">Type it again</span>
            <input type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" spellCheck="false" />
          </label>
        )}
        <p className="lock-err" role="alert">{err}</p>
        <button className="btn primary lg" type="submit" disabled={busy || wait > 0}>
          {wait > 0 ? `Wait ${wait}s` : mode === 'setup' ? 'Save passcode' : 'Unlock'}
        </button>
        {mode === 'setup' && onSkip && <button type="button" className="btn lg" onClick={onSkip}>Skip for now</button>}
        {mode === 'unlock' && (
          site
            ? <p className="help lock-foot">Forgot it? Ask the person who runs this site.</p>
            : sure
              ? (
                <div className="lock-foot">
                  <p className="help">This erases every saved cheque, layout and setting in this browser, then lets you choose a new passcode.</p>
                  <div className="btn-row">
                    <button type="button" className="btn danger sm" onClick={onForgot}>Erase and start over</button>
                    <button type="button" className="btn sm" onClick={() => setSure(false)}>Cancel</button>
                  </div>
                </div>
              )
              : <button type="button" className="link-btn lock-foot" onClick={() => setSure(true)}>Forgot your passcode?</button>
        )}
      </form>
      <p className="credit">Made by {AUTHOR}</p>
    </main>
  )
}