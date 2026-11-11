import { amountWords, fmtMoney } from './words.js'

/**
 * Starting layout, computed from FOR_CHEQUE.xlsx (Sheet1):
 *   A4 landscape, margins L/R 0.709in, T/B 0.748in
 *   B14  payee            Arial 10
 *   H14  amount           Arial 11, centred, accounting format
 *   B16  amount in words  Calibri 12
 * All values are millimetres from the top-left corner of the page.
 */
export const A4 = [297, 210]

export const baseFields = () => ({
  payee:   { label: 'Payee',           x: 36.1,  y: 90.55, w: 100,  size: 10, align: 'left',   ls: 0, font: 'Arial',   color: '#000000', on: true },
  amount:  { label: 'Amount (number)', x: 145.1, y: 89.9,  w: 27.8, size: 11, align: 'center', ls: 0, font: 'Arial',   color: '#000000', on: true },
  words:   { label: 'Amount in words', x: 36.1,  y: 97.5,  w: 170,  size: 12, align: 'left',   ls: 0, font: 'Calibri', color: '#000000', on: true },
  day:     { label: 'Date: Day',       x: 190.9, y: 90.5,  w: 10,   size: 10, align: 'center', ls: 0, font: 'Arial',   color: '#000000', on: true },
  month:   { label: 'Date: Month',     x: 203,   y: 90.5,  w: 10,   size: 10, align: 'center', ls: 0, font: 'Arial',   color: '#000000', on: true },
  year:    { label: 'Date: Year',      x: 215,   y: 90.5,  w: 16,   size: 10, align: 'center', ls: 0, font: 'Arial',   color: '#000000', on: true },
  memo:    { label: 'Memo',            x: 36.1,  y: 110,   w: 90,   size: 9,  align: 'left',   ls: 0, font: 'Arial',   color: '#000000', on: false },
  no:      { label: 'Cheque no.',      x: 190.9, y: 80,    w: 40,   size: 9,  align: 'left',   ls: 0, font: 'Arial',   color: '#000000', on: false },
  crossed: { label: 'A/C PAYEE ONLY',  x: 36.1,  y: 78,    w: 60,   size: 9,  align: 'left',   ls: 0, font: 'Arial',   color: '#000000', on: false },
})

export const DEFAULT_BANKS = [
  'Security Bank', 'Metrobank', 'BDO', 'BPI', 'PNB', 'UnionBank', 'Landbank', 'RCBC',
]

export const newProfile = (name) => ({
  name, mode: 'a4', pw: 297, ph: 210, nx: 0, ny: 0, mfmt: 'num', yfmt: '4', locked: true, fields: baseFields(),
})

export const pageSize = (p) =>
  p.mode === 'a4' ? A4 : [Number(p.pw) || 200, Number(p.ph) || 90]

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** iso "2026-11-10" -> { day: '10', month: '11', year: '2026' } formatted per profile styles */
export function dateParts(iso, profile) {
  if (!iso) return { day: '', month: '', year: '' }
  const [y, m, d] = iso.split('-')
  const name = MONTHS[Number(m) - 1] || ''
  const month = profile.mfmt === 'short' ? name.slice(0, 3).toUpperCase()
    : profile.mfmt === 'long' ? name.toUpperCase() : m
  return { day: d, month, year: profile.yfmt === '2' ? y.slice(2) : y }
}

export function fieldText(key, entry, profile, settings) {
  switch (key) {
    case 'payee':   return (entry.payee || '').toUpperCase()
    case 'amount': {
      const t = fmtMoney(entry.amount)
      return settings.stars ? `**${t}**` : t
    }
    case 'words':   return amountWords(entry.amount, settings.currency)
    case 'memo':    return entry.memo || ''
    case 'no':      return entry.no || ''
    case 'crossed': return 'A/C PAYEE ONLY'
    case 'day':     return dateParts(entry.date, profile).day
    case 'month':   return dateParts(entry.date, profile).month
    case 'year':    return dateParts(entry.date, profile).year
    default:        return ''
  }
}

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "6941334601" -> "6941334602" (keeps leading zeros / prefix) */
export function incNo(s) {
  const m = String(s).match(/^(.*?)(\d+)$/)
  if (!m) return s
  return m[1] + String(Number(m[2]) + 1).padStart(m[2].length, '0')
}

/**
 * Bring a saved profile up to date: any field that is missing is added from the defaults.
 * A saved single "date" field becomes Day / Month / Year starting at the same spot, 12 mm apart.
 */
export function migrateProfile(b) {
  const base = baseFields()
  const old = b.fields || {}
  const d = old.date
  const fields = {}
  Object.keys(base).forEach((key, i) => {
    if (old[key]) { fields[key] = { color: '#000000', ...old[key] }; return } // saved layouts get the default print colour
    if (d && (key === 'day' || key === 'month' || key === 'year')) {
      const off = { day: 0, month: 12, year: 24 }[key]
      fields[key] = { ...base[key], x: d.x + off, y: d.y, size: d.size, font: d.font, on: true }
    } else {
      fields[key] = base[key]
    }
  })
  const { dfmt, ...rest } = b
  return { mfmt: 'num', yfmt: '4', locked: true, ...rest, fields }
}