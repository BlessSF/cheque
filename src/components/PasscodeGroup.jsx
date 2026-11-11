import { useState } from 'react'
import { Field } from './ui.jsx'
import { IconLock } from './icons.jsx'
import { MIN_LEN } from '../lib/passcode.js'

const IDLE = [[0, 'Never'], [5, 'After 5 minutes'], [10, 'After 10 minutes'], [30, 'After 30 minutes'], [60, 'After 1 hour']]

/** Options > Passcode. Set, change or remove the passcode, lock now, and pick the auto-lock time. */
export default function PasscodeGroup({ security }) {
  const { enabled, site, idle, setIdle, lockNow, verify, setPasscode, removePasscode } = security
  const [mode, setMode] = useState(null) // 'set' | 'change' | 'remove'
  const [cur, setCur] = useState('')
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [msg, setMsg] = useState({ t: '', ok: false })
  const close = () => { setMode(null); setCur(''); setA(''); setB('') }

  async function save(e) {
    e.preventDefault()
    setMsg({ t: '', ok: false })
    try {
      if (mode !== 'set' && !(await verify(cur))) return setMsg({ t: 'The current passcode is wrong.', ok: false })
      if (mode === 'remove') { removePasscode(); close(); return }
      if (a.length < MIN_LEN) return setMsg({ t: `Use at least ${MIN_LEN} characters.`, ok: false })
      if (a !== b) return setMsg({ t: 'The two passcodes do not match.', ok: false })
      await setPasscode(a); close(); setMsg({ t: 'Passcode saved.', ok: true })
    } catch (x) { setMsg({ t: x.message, ok: false }) }
  }

  return (
    <section className="group">
      <h3>Passcode</h3>
      {site && <p className="help">The passcode for this site is set by the person who runs it, so it can't be changed here.</p>}
      {!site && !enabled && mode !== 'set' && <p className="help">No passcode. Anyone who opens Cheque Maker on this computer can use it.</p>}
      {enabled && (
        <>
          <Field label="Lock automatically">
            <select value={idle} onChange={(e) => setIdle(Number(e.target.value))}>
              {IDLE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <button className="btn" onClick={lockNow}><IconLock /> Lock now</button>
        </>
      )}
      {!site && mode === null && (
        <div className="btn-row">
          {!enabled && <button className="btn" onClick={() => setMode('set')}>Set passcode</button>}
          {enabled && <button className="btn" onClick={() => setMode('change')}>Change passcode</button>}
          {enabled && <button className="btn danger-outline" onClick={() => setMode('remove')}>Remove</button>}
        </div>
      )}
      {!site && mode && (
        <form className="stack tight" onSubmit={save} autoComplete="off">
          {mode !== 'set' && (
            <Field label="Current passcode"><input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="off" /></Field>
          )}
          {mode !== 'remove' && (
            <>
              <Field label="New passcode"><input type="password" value={a} onChange={(e) => setA(e.target.value)} autoComplete="new-password" /></Field>
              <Field label="Type it again"><input type="password" value={b} onChange={(e) => setB(e.target.value)} autoComplete="new-password" /></Field>
            </>
          )}
          <div className="btn-row">
            <button className={`btn ${mode === 'remove' ? 'danger' : 'primary'}`} type="submit">
              {mode === 'remove' ? 'Remove passcode' : 'Save passcode'}
            </button>
            <button className="btn" type="button" onClick={() => { close(); setMsg({ t: '', ok: false }) }}>Cancel</button>
          </div>
        </form>
      )}
      {msg.t && <p className={msg.ok ? 'help ok-text' : 'help err-text'} role="status">{msg.t}</p>}
      {!site && <p className="help">Stored only in this browser, as a scrambled code. This keeps other people at this computer out; it is not bank-grade security.</p>}
    </section>
  )
}