import { useCallback, useEffect, useRef, useState } from 'react'
import App from './../App.jsx'
import LockScreen from './LockScreen.jsx'
import { hashPass, newSalt, readLock, writeLock } from '../lib/passcode.js'
import { useLocalStorage } from '../lib/useLocalStorage.js'

const OK = 'cm_unlocked'
const getOk = () => { try { return sessionStorage.getItem(OK) } catch { return null } }
const setOk = (v) => { try { v ? sessionStorage.setItem(OK, v) : sessionStorage.removeItem(OK) } catch { /* ignore */ } }

/** Wraps the app. Nothing of the app (or your cheques) is rendered until the passcode is entered. */
export default function Gate() {
  const [lock, setLock] = useState(readLock)
  const [open, setOpen] = useState(() => { const l = readLock(); return !!l && (l.off || getOk() === l.hash) })
  const [idle, setIdle] = useLocalStorage('cm_idle', 10) // minutes, 0 = never
  const enabled = !!lock && !lock.off

  const verify = useCallback(async (pass) => !!lock?.hash && (await hashPass(pass, lock.salt)) === lock.hash, [lock])
  const unlock = async (pass) => {
    if (!(await verify(pass))) return false
    setOk(lock.hash); setOpen(true); return true
  }
  const setPasscode = async (pass) => {
    const salt = newSalt(); const hash = await hashPass(pass, salt)
    const next = { salt, hash }; writeLock(next); setLock(next); setOk(hash); setOpen(true)
  }
  const removePasscode = () => { const next = { off: true }; writeLock(next); setLock(next); setOk(null); setOpen(true) }
  const lockNow = () => { setOk(null); setOpen(false) }
  const eraseAll = () => {
    try {
      Object.keys(localStorage).filter((k) => /^cm\d*_/.test(k) || k === 'cm_lock' || k === 'cm_idle').forEach((k) => localStorage.removeItem(k))
    } catch { /* ignore */ }
    setOk(null); setLock(null); setOpen(false); window.location.reload()
  }

  // Lock again after a quiet spell.
  const timer = useRef(0)
  useEffect(() => {
    if (!open || !enabled || !idle) return
    const reset = () => { clearTimeout(timer.current); timer.current = setTimeout(lockNow, idle * 60000) }
    const evts = ['pointerdown', 'keydown', 'wheel', 'touchstart']
    evts.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => { clearTimeout(timer.current); evts.forEach((e) => window.removeEventListener(e, reset)) }
  }, [open, enabled, idle])

  if (!lock) return <LockScreen mode="setup" onSetup={setPasscode} onSkip={removePasscode} />
  if (!open) return <LockScreen mode="unlock" site={!!lock.site} onUnlock={unlock} onForgot={eraseAll} />
  return (
    <App security={{ enabled, site: !!lock.site, idle, setIdle, lockNow, verify, setPasscode, removePasscode }} />
  )
}