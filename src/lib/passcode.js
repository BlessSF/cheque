// Passcode helpers. The passcode is never stored: only a salted PBKDF2 hash of it.
const ITER = 150000
const enc = new TextEncoder()
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

export async function hashPass(pass, salt) {
  if (!globalThis.crypto?.subtle) throw new Error('This browser blocks passcodes on non-secure pages. Open the site with https://.')
  const key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: ITER }, key, 256)
  return hex(bits)
}

export const newSalt = () => hex(crypto.getRandomValues(new Uint8Array(16)))

/** Set at build time when CHEQUE_PASSCODE exists (see vite.config.js); otherwise null. */
export const SITE_LOCK = typeof __SITE_LOCK__ !== 'undefined' ? __SITE_LOCK__ : null

const KEY = 'cm_lock'
/** -> { site } | { salt, hash } | { off: true } | null (never set up on this browser) */
export function readLock() {
  if (SITE_LOCK) return { ...SITE_LOCK, site: true }
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}
export function writeLock(v) { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* ignore */ } }

export const MIN_LEN = 4