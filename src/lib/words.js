const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
const SCALES = [[1e12, 'Trillion'], [1e9, 'Billion'], [1e6, 'Million'], [1e3, 'Thousand']]

function below1000(n) {
  let s = ''
  if (n >= 100) {
    s += `${ONES[Math.floor(n / 100)]} Hundred`
    n %= 100
    if (n) s += ' '
  }
  if (n >= 20) {
    s += TENS[Math.floor(n / 10)]
    if (n % 10) s += `-${ONES[n % 10]}`
  } else if (n > 0) {
    s += ONES[n]
  }
  return s
}

export function intWords(n) {
  if (n === 0) return 'Zero'
  const out = []
  for (const [value, name] of SCALES) {
    if (n >= value) {
      out.push(`${below1000(Math.floor(n / value))} ${name}`)
      n %= value
    }
  }
  if (n > 0) out.push(below1000(n))
  return out.join(' ')
}

/**
 * 10000    -> "TEN THOUSAND PESOS ONLY"
 * 1250.5   -> "ONE THOUSAND TWO HUNDRED FIFTY PESOS AND 50/100 ONLY"
 */
export function amountWords(amount, currency = 'Pesos') {
  const total = Math.round((Number(amount) || 0) * 100)
  const whole = Math.floor(total / 100)
  const cents = total % 100
  let s = `${intWords(whole)} ${currency}`
  if (cents) s += ` and ${String(cents).padStart(2, '0')}/100`
  return `${s} Only`.toUpperCase()
}

export const fmtMoney = (n) =>
  (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
