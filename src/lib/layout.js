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
  payee:   { label: 'Payee',           x: 36.1,  y: 90.55, w: 100,  size: 10, align: 'left',   ls: 0, font: 'Arial',   on: true },
  amount:  { label: 'Amount (number)', x: 145.1, y: 89.9,  w: 27.8, size: 11, align: 'center', ls: 0, font: 'Arial',   on: true },
  words:   { label: 'Amount in words', x: 36.1,  y: 97.5,  w: 170,  size: 12, align: 'left',   ls: 0, font: 'Calibri', on: true },
  date:    { label: 'Date',            x: 190.9, y: 90.5,  w: 40,   size: 10, align: 'left',   ls: 0, font: 'Arial',   on: false },
  memo:    { label: 'Memo',            x: 36.1,  y: 110,   w: 90,   size: 9,  align: 'left',   ls: 0, font: 'Arial',   on: false },
  no:      { label: 'Cheque no.',      x: 190.9, y: 80,    w: 40,   size: 9,  align: 'left',   ls: 0, font: 'Arial',   on: false },
  crossed: { label: 'A/C PAYEE ONLY',  x: 36.1,  y: 78,    w: 60,   size: 9,  align: 'left',   ls: 0, font: 'Arial',   on: false },
})

export const DEFAULT_BANKS = [
  'Security Bank', 'Metrobank', 'BDO', 'BPI', 'PNB', 'UnionBank', 'Landbank', 'RCBC',
]

export const newProfile = (name) => ({
  name, mode: 'a4', pw: 297, ph: 210, nx: 0, ny: 0, dfmt: 'slash', fields: baseFields(),
})

export const pageSize = (p) =>
  p.mode === 'a4' ? A4 : [Number(p.pw) || 200, Number(p.ph) || 90]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatDate(iso, style) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (style === 'spaced') return `${m} ${d} ${y}`
  if (style === 'long') return `${MONTHS[Number(m) - 1]} ${d}, ${y}`
  return `${m}/${d}/${y}`
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
    case 'date':    return formatDate(entry.date, profile.dfmt)
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
