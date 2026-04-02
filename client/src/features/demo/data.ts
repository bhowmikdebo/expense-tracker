export const expenseCategories = ['Housing', 'Food & Dining', 'Shopping', 'Transport', 'Subscriptions', 'Other'] as const
export const incomeCategories = ['Salary', 'Freelance', 'Other'] as const
export const accounts = ['Primary bank', 'Digital wallet', 'Cash'] as const

export type Flow = 'income' | 'expense'
export type Account = typeof accounts[number]
export type Category = typeof expenseCategories[number] | typeof incomeCategories[number]
export type Transaction = {
  id: string
  name: string
  type: Flow
  amount: number
  category: Category
  account: Account
  date: string
}

export const budgetLimit = 4_500_000
export const palette = ['#a888ff', '#ccbaff', '#6ca9f5', '#59cdb8', '#eda1d9', '#7c7195']

export function dateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function daysAgo(days: number, now = new Date()) {
  const date = new Date(now)
  date.setDate(date.getDate() - days)
  return dateKey(date)
}

export function dateLabel(key: string, format: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  return new Date(`${key}T12:00:00`).toLocaleDateString('en-IN', format)
}

export const periods = [
  { value: 'month', label: 'This month' },
  { value: 'previous', label: 'Last month' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'quarter', label: 'Last 90 days' },
] as const
export type Period = typeof periods[number]['value']

export function getPeriod(period: Period, now = new Date()) {
  const month = now.getMonth()
  const year = now.getFullYear()
  if (period === 'week') return { start: daysAgo(6, now), end: dateKey(now), previousStart: daysAgo(13, now), previousEnd: daysAgo(7, now) }
  if (period === 'quarter') return { start: daysAgo(89, now), end: dateKey(now), previousStart: daysAgo(179, now), previousEnd: daysAgo(90, now) }
  const offset = period === 'previous' ? 1 : 0
  const lastDayOfPrevious = new Date(year, month - offset, 0)
  const previousEnd = offset ? lastDayOfPrevious : new Date(year, month - 1, Math.min(now.getDate(), lastDayOfPrevious.getDate()))
  return {
    start: dateKey(new Date(year, month - offset, 1)),
    end: offset ? dateKey(new Date(year, month, 0)) : dateKey(now),
    previousStart: dateKey(new Date(year, month - offset - 1, 1)),
    previousEnd: dateKey(previousEnd),
  }
}

const samples: Array<[string, number, Category, Account, number, Flow?]> = [
  ['Blue Bottle Coffee', 545, 'Food & Dining', 'Digital wallet', 0],
  ['Urban Grocer', 1850, 'Food & Dining', 'Primary bank', 1],
  ['Monthly salary', 95000, 'Salary', 'Primary bank', 2, 'income'],
  ['Metro recharge', 600, 'Transport', 'Digital wallet', 3],
  ['Spotify Premium', 119, 'Subscriptions', 'Primary bank', 4],
  ['Apartment rent', 21800, 'Housing', 'Primary bank', 5],
  ['Bookshop', 2790, 'Shopping', 'Primary bank', 7],
  ['Workshop payment', 6500, 'Freelance', 'Cash', 8, 'income'],
  ['Studio project', 18500, 'Freelance', 'Primary bank', 9, 'income'],
  ['Weekend dinner', 2240, 'Food & Dining', 'Primary bank', 10],
  ['Uber ride', 485, 'Transport', 'Digital wallet', 12],
  ['Internet bill', 999, 'Other', 'Primary bank', 13],
  ['Farmers market', 1250, 'Food & Dining', 'Cash', 15],
  ['Clothing store', 3860, 'Shopping', 'Primary bank', 17],
  ['Gym membership', 1699, 'Subscriptions', 'Primary bank', 19],
  ['Fuel', 2300, 'Transport', 'Primary bank', 21],
  ['Freelance editing', 8000, 'Freelance', 'Primary bank', 23, 'income'],
  ['Local pharmacy', 650, 'Other', 'Cash', 24],
  ['Swiggy order', 790, 'Food & Dining', 'Digital wallet', 26],
  ['Movie tickets', 1380, 'Other', 'Digital wallet', 28],
]

export function seedTransactions(): Transaction[] {
  return [0, 30, 60, 90, 120, 150].flatMap((offset, batch) => samples.map(([name, amount, category, account, days, type = 'expense'], index) => ({
    id: `sample-${batch}-${index}`,
    name, type, category, account,
    amount: amount * (batch === 0 ? 100 : 92 + (index + batch * 3) % 15),
    date: daysAgo(days + offset),
  })))
}

export function parseMinorUnits(value: string) {
  const [whole, fraction = ''] = value.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}

export function money(minor: number, compact = false) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    ...(compact ? { notation: 'compact', maximumFractionDigits: 1 } : { minimumFractionDigits: minor % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 }),
  }).format(minor / 100)
}

export function totals(transactions: Transaction[]) {
  return transactions.reduce((total, { type, amount }) => {
    total[type] += amount
    return total
  }, { income: 0, expense: 0 })
}

export function ledgerFor(transactions: Transaction[], period: Period) {
  const range = getPeriod(period)
  const current = transactions.filter(({ date }) => date >= range.start && date <= range.end)
  const previous = transactions.filter(({ date }) => date >= range.previousStart && date <= range.previousEnd)
  const groups = expenseCategories.map((category, index) => ({
    name: category, color: palette[index],
    value: current.reduce((sum, row) => row.type === 'expense' && row.category === category ? sum + row.amount : sum, 0),
  })).filter((group) => group.value > 0).sort((a, b) => b.value - a.value)
  return { ...range, current, previous, groups, ...totals(current), previousTotals: totals(previous) }
}

export function trend(rows: Transaction[], start: string, end: string) {
  const cursor = new Date(`${start}T12:00:00`)
  const interval = (Date.parse(end) - Date.parse(start)) / 86_400_000 > 39 ? 14 : 5
  const groups: Array<{ name: string; income: number; expense: number; net: number }> = []
  while (dateKey(cursor) <= end) {
    const first = dateKey(cursor)
    cursor.setDate(cursor.getDate() + interval)
    const last = dateKey(cursor)
    const sum = totals(rows.filter(({ date }) => date >= first && date < last))
    groups.push({ name: dateLabel(first), ...sum, net: sum.income - sum.expense })
  }
  return groups
}

export function comparison(current: number, previous: number) {
  if (previous <= 0) return null
  return Math.round((current - previous) / previous * 100)
}
