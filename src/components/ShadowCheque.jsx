import { pageSize } from '../lib/layout.js'

const LINE = '#A9B6C5'
const LABEL = '#8896A9'
const PT_TO_MM = 0.3528

/**
 * A faint, generic cheque drawn behind the fields so the preview reads as a cheque.
 * It follows the real field positions (underline under the payee, box around the amount, one box per date part),
 * so it stays right wherever you move things. Preview only: it is never printed and carries no bank branding.
 */
export default function ShadowCheque({ profile, unit }) {
  const s = profile.shadow
  if (!s?.on) return null
  const [W, H] = pageSize(profile)
  const F = profile.fields
  const h = (f) => f.size * PT_TO_MM * 1.2 // height of one line of text in mm
  const label = (x, y, text, anchor = 'start') => (
    <text key={`${text}-${x}-${y}`} x={x} y={y} fontSize="2.2" fill={LABEL} textAnchor={anchor}>{text}</text>
  )
  const parts = []

  if (F.payee?.on) {
    const f = F.payee
    parts.push(label(f.x, f.y - 1.4, 'Pay to the order of'))
    parts.push(<line key="payee-line" x1={f.x} x2={f.x + f.w} y1={f.y + h(f) + 0.7} y2={f.y + h(f) + 0.7} stroke={LINE} strokeWidth=".3" />)
  }
  if (F.amount?.on) {
    const f = F.amount
    parts.push(<rect key="amount-box" x={f.x - 1.5} y={f.y - 1.6} width={f.w + 3} height={h(f) + 3.2} rx=".8" fill="#fff" stroke={LINE} strokeWidth=".3" />)
    parts.push(label(f.x - 1.5, f.y - 2.6, 'Amount'))
  }
  if (F.words?.on) {
    const f = F.words
    const y = f.y + h(f) + 0.7
    parts.push(<line key="words-line" x1={f.x} x2={f.x + f.w} y1={y} y2={y} stroke={LINE} strokeWidth=".3" />)
    parts.push(label(f.x, y + 3.2, 'Amount in words'))
  }
  ;[['day', 'Day'], ['month', 'Month'], ['year', 'Year']].forEach(([k, name]) => {
    const f = F[k]
    if (!f?.on) return
    parts.push(<rect key={`${k}-box`} x={f.x - 0.8} y={f.y - 1.2} width={f.w + 1.6} height={h(f) + 2.4} rx=".6" fill="#fff" stroke={LINE} strokeWidth=".3" />)
    parts.push(label(f.x + f.w / 2, f.y - 2.2, name, 'middle'))
  })

  const bottom = s.y + s.h
  return (
    <svg
      className="shadow-cheque" width={W * unit} height={H * unit} viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true" style={{ fontFamily: 'var(--font)' }}
    >
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="2" fill="#F2F5F8" stroke="#B7C2CF" strokeWidth=".35" />
      <rect x={s.x + 6} y={s.y + 6} width="42" height="5" rx="1" fill="#DDE4EC" />
      <rect x={s.x + 6} y={s.y + 13} width="26" height="2.6" rx="1" fill="#E6EBF1" />
      {parts}
      {/* memo and signature lines, bottom of the cheque */}
      <line x1={s.x + 8} x2={s.x + 80} y1={bottom - 15} y2={bottom - 15} stroke={LINE} strokeWidth=".3" />
      {label(s.x + 8, bottom - 11.6, 'Memo')}
      <line x1={s.x + s.w - 84} x2={s.x + s.w - 8} y1={bottom - 15} y2={bottom - 15} stroke={LINE} strokeWidth=".3" />
      {label(s.x + s.w - 84, bottom - 11.6, 'Authorized signature')}
      {/* account number band */}
      <rect x={s.x + 4} y={bottom - 8} width={s.w - 8} height="5" rx=".8" fill="#E3E8EE" />
      <line x1={s.x + 7} x2={s.x + s.w - 7} y1={bottom - 5.5} y2={bottom - 5.5} stroke="#C4CDD8" strokeWidth=".5" strokeDasharray="1.2 1.2" />
    </svg>
  )
}