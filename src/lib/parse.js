import { todayISO } from './layout.js'

const toISO = (v) => {
  if (!v) return todayISO()
  const d = new Date(v)
  if (isNaN(d)) return todayISO()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Split one CSV line, honouring "quoted, values". */
function splitCsv(line) {
  const out = []
  let cur = ''
  let q = false
  for (const ch of line) {
    if (ch === '"') q = !q
    else if (ch === ',' && !q) { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out
}

/**
 * Accepts text copied from Excel (tab separated) or a CSV:
 *   Payee <tab|comma> Amount [<tab|comma> Date]
 * A header row (Payee / Name) is skipped. Returns [{payee, amount, date}].
 */
export function parseRows(text) {
  const rows = []
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  lines.forEach((line, i) => {
    let cols = line.includes('\t') ? line.split('\t') : splitCsv(line)
    if (cols.length < 2) {
      // "LASTNAME, FIRSTNAME 1,250.00" style: amount is the trailing number
      const m = line.match(/^(.*?)[\s,]+([\d,]+(?:\.\d+)?)$/)
      cols = m ? [m[1], m[2]] : [line, '0']
    }
    const amount = parseFloat(String(cols[1]).replace(/[^0-9.\-]/g, ''))
    if (Number.isNaN(amount) && i === 0 && /payee|name|pay to/i.test(cols[0])) return
    rows.push({
      payee: cols[0].replace(/^"|"$/g, '').trim(),
      amount: Number.isNaN(amount) ? 0 : amount,
      date: toISO(cols[2]),
    })
  })
  return rows
}
