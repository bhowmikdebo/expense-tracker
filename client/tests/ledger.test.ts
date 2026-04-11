import assert from 'node:assert/strict'
import test from 'node:test'
import { comparison, getPeriod, parseMinorUnits, totals, trend, type Transaction } from '../src/features/demo/data.ts'

test('decimal inputs are converted into integer minor units', () => {
  assert.equal(parseMinorUnits('0.01'), 1)
  assert.equal(parseMinorUnits('123.4'), 12340)
  assert.equal(parseMinorUnits('9999999.99'), 999999999)
})

test('income and expenses are accumulated separately, including an empty ledger', () => {
  const rows: Transaction[] = [
    { id: 'a', name: 'Pay', date: '2026-11-04', amount: 50000, type: 'income', category: 'Salary', account: 'Primary bank' },
    { id: 'b', name: 'Coffee', date: '2026-11-05', amount: 295, type: 'expense', category: 'Food & Dining', account: 'Cash' },
  ]
  assert.deepEqual(totals([]), { income: 0, expense: 0 })
  assert.deepEqual(totals(rows), { income: 50000, expense: 295 })
  assert.deepEqual(trend(rows, '2026-11-01', '2026-11-10').map(({ net }) => net), [49705, 0])
})

test('rolling weeks and calendar months use inclusive local dates', () => {
  assert.deepEqual(getPeriod('week', new Date(2026, 0, 3)), {
    start: '2025-12-28', end: '2026-01-03', previousStart: '2025-12-21', previousEnd: '2025-12-27',
  })
  assert.deepEqual(getPeriod('month', new Date(2024, 2, 30)), {
    start: '2024-03-01', end: '2024-03-30', previousStart: '2024-02-01', previousEnd: '2024-02-29',
  })
})

test('comparison handles a zero baseline and a complete drop', () => {
  assert.equal(comparison(10, 0), null)
  assert.equal(comparison(0, 10), -100)
  assert.equal(comparison(118, 100), 18)
})
