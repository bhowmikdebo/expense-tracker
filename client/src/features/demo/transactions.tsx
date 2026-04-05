import { Banknote, Car, CircleDollarSign, Coffee, House, ReceiptText, ShoppingBag, Tags } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { dateLabel, money, type Transaction } from './data'

const icons = {
  Housing: House, 'Food & Dining': Coffee, Transport: Car, Shopping: ShoppingBag,
  Subscriptions: ReceiptText, Salary: Banknote, Freelance: CircleDollarSign, Other: Tags,
}

export function TransactionIcon({ row }: { row: Transaction }) {
  const Icon = icons[row.category]
  return <span className="transaction-icon" data-category={row.category}><Icon size={17} /></span>
}

export function TransactionTable({ rows, onSelect }: { rows: Transaction[]; onSelect: (row: Transaction) => void }) {
  if (!rows.length) return <div className="empty-state"><ReceiptText size={26} /><p>No transactions match this view.</p></div>
  return <div className="table-scroll">
    <table className="transaction-table">
      <thead><tr><th>Transaction</th><th>Category</th><th>Account</th><th>Date</th><th>Amount</th></tr></thead>
      <tbody>{rows.map((row) => <tr key={row.id}>
        <td><button type="button" className="transaction-name" onClick={() => onSelect(row)}><TransactionIcon row={row} /><span>{row.name}</span></button></td>
        <td><span className="category-tag">{row.category}</span></td><td>{row.account}</td><td>{dateLabel(row.date)}</td>
        <td className={row.type === 'income' ? 'positive' : ''}>{row.type === 'income' ? '+' : '−'}{money(row.amount)}</td>
      </tr>)}</tbody>
    </table>
  </div>
}

export function TransactionList({ rows, onSelect }: { rows: Transaction[]; onSelect: (row: Transaction) => void }) {
  const [search, setSearch] = useState('')
  const [flow, setFlow] = useState('all')
  const [order, setOrder] = useState('recent')
  const [page, setPage] = useState(1)
  const filtered = rows.filter((row) => (flow === 'all' || row.type === flow)
    && `${row.name} ${row.category} ${row.account}`.toLowerCase().includes(search.trim().toLowerCase()))
  if (order === 'amount') filtered.sort((a, b) => b.amount - a.amount)
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10))
  const current = Math.min(page, pageCount)
  const exportCsv = () => {
    const cell = (value: string) => {
      const escaped = /^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(value) ? `'${value}` : value
      return `"${escaped.replace(/"/g, '""')}"`
    }
    const csv = ['Merchant,Type,Category,Account,Date,Amount (INR)', ...filtered.map((row) =>
      [row.name, row.type, row.category, row.account, row.date, (row.amount / 100).toFixed(2)].map(cell).join(','))].join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'lumaledger-preview.csv'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <section className="dash-panel">
    <div className="filter-row">
      <input aria-label="Filter transactions" placeholder="Search transactions…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
      <select aria-label="Transaction type" value={flow} onChange={(event) => { setFlow(event.target.value); setPage(1) }}>
        <option value="all">All types</option><option value="expense">Expenses</option><option value="income">Income</option>
      </select>
      <select aria-label="Sort transactions" value={order} onChange={(event) => { setOrder(event.target.value); setPage(1) }}>
        <option value="recent">Newest first</option><option value="amount">Highest amount</option>
      </select>
      <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>Download CSV</Button>
    </div>
    <TransactionTable rows={filtered.slice((current - 1) * 10, current * 10)} onSelect={onSelect} />
    <div className="pagination"><span>{filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}</span>
      <div><Button size="sm" variant="outline" disabled={current <= 1} onClick={() => setPage(current - 1)}>Previous</Button>
        <span>{current} / {pageCount}</span>
        <Button size="sm" variant="outline" disabled={current >= pageCount} onClick={() => setPage(current + 1)}>Next</Button></div>
    </div>
  </section>
}

export function TransactionDetails({ row, close, returnFocus }: { row: Transaction; close: () => void; returnFocus: () => void }) {
  return <Dialog open onOpenChange={(open) => { if (!open) close() }}>
    <DialogContent returnFocus={returnFocus}>
      <DialogTitle>{row.name}</DialogTitle>
      <DialogDescription>Transaction in the sample ledger</DialogDescription>
      <dl className="detail-grid">
        <dt>Type</dt><dd>{row.type === 'expense' ? 'Expense' : 'Income'}</dd>
        <dt>Amount</dt><dd>{money(row.amount)}</dd>
        <dt>Category</dt><dd>{row.category}</dd>
        <dt>Account</dt><dd>{row.account}</dd>
        <dt>Date</dt><dd>{dateLabel(row.date, { dateStyle: 'long' })}</dd>
      </dl>
    </DialogContent>
  </Dialog>
}
