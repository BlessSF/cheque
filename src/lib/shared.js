import shared from '../default-layout.json'
import { migrateProfile } from './layout.js'

/**
 * The shared layout: src/default-layout.json, made with Options > Shared layout > "Save layout for all computers".
 * It ships inside the website, so every computer that opens the link gets the same layout, with no database.
 * It is applied once per published version (its id); small edits made on a computer stay until you publish a new one.
 */
export const SHARED =
  shared && shared.kind === 'cheque-maker-shared-layout' && shared.id && Array.isArray(shared.profiles) && shared.profiles.length ? shared : null

export function applySharedAtBoot() {
  if (!SHARED) return
  try {
    if (localStorage.getItem('cm_shared_id') === String(SHARED.id)) return
    localStorage.setItem('cm5_profiles', JSON.stringify(SHARED.profiles.map(migrateProfile)))
    const old = JSON.parse(localStorage.getItem('cm3_settings') || 'null') || {}
    localStorage.setItem('cm3_settings', JSON.stringify({ stars: false, currency: 'Pesos', nextNo: '6941334602', ...old, linkBanks: true }))
    localStorage.setItem('cm3_bank', '0')
    localStorage.setItem('cm_shared_id', String(SHARED.id))
  } catch { /* storage blocked: the app just uses its built-in layout */ }
}