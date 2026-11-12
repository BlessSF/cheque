import { migrateProfile } from './layout.js'

export const BACKUP_KIND = 'cheque-maker-backup'

/** Everything needed to set up another computer. Cheques are optional; the passcode is never included. */
export function buildBackup({ profiles, settings, bankIdx, entries }, withCheques) {
  return {
    kind: BACKUP_KIND, version: 1, savedAt: new Date().toISOString(),
    profiles, settings, bankIdx,
    ...(withCheques ? { entries } : {}),
  }
}

/** Reads a backup file's text. Returns { profiles, settings, bankIdx, entries? } or throws a readable Error. */
export function parseBackup(text) {
  let d
  try { d = JSON.parse(text) } catch { throw new Error('That file is not a Cheque Maker backup.') }
  if (d?.kind !== BACKUP_KIND || !Array.isArray(d.profiles) || !d.profiles.length) throw new Error('That file is not a Cheque Maker backup.')
  const out = {
    profiles: d.profiles.map(migrateProfile),
    settings: d.settings && typeof d.settings === 'object' ? d.settings : null,
    bankIdx: Number.isInteger(d.bankIdx) ? Math.max(0, Math.min(d.bankIdx, d.profiles.length - 1)) : 0,
  }
  if (Array.isArray(d.entries) && d.entries.length) out.entries = d.entries
  return out
}

export function downloadText(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}