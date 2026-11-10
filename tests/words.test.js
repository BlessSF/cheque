import test from 'node:test'
import assert from 'node:assert/strict'
import { amountWords } from '../src/lib/words.js'
import { parseRows } from '../src/lib/parse.js'
import { incNo } from '../src/lib/layout.js'

test('words match the Excel template', () => {
  assert.equal(amountWords(10000), 'TEN THOUSAND PESOS ONLY')
})
test('centavos and hyphens', () => {
  assert.equal(amountWords(1250.5), 'ONE THOUSAND TWO HUNDRED FIFTY PESOS AND 50/100 ONLY')
  assert.equal(amountWords(21.07), 'TWENTY-ONE PESOS AND 07/100 ONLY')
  assert.equal(amountWords(1000000), 'ONE MILLION PESOS ONLY')
  assert.equal(amountWords(0), 'ZERO PESOS ONLY')
  assert.equal(amountWords(0.1 + 0.2), 'ZERO PESOS AND 30/100 ONLY')
  assert.equal(amountWords(100100.01), 'ONE HUNDRED THOUSAND ONE HUNDRED PESOS AND 01/100 ONLY')
})
test('paste parsing', () => {
  const r = parseRows('Payee\tAmount\nCARE 4 LIFE TRADING CORP.\t10,000.00\n"DOE, JOHN",1250.5')
  assert.equal(r.length, 2)
  assert.equal(r[0].amount, 10000)
  assert.equal(r[1].payee, 'DOE, JOHN')
})
test('cheque numbers keep length', () => {
  assert.equal(incNo('6941334609'), '6941334610')
  assert.equal(incNo('00099'), '00100')
})
