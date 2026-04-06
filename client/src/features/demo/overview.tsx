import { ArrowDownLeft, ArrowDownRight, ArrowUpRight, CircleGauge, Landmark, PiggyBank, Sparkles, Wallet } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { CashFlowChart, CategoryChart } from './charts'
import { accounts, budgetLimit, comparison, money, totals, type ledgerFor, type Transaction } from './data'
import { TransactionTable } from './transactions'

type Ledger = ReturnType<typeof ledgerFor>

export function BudgetMeter({ expense }: { expense: number }) {
  const percent = Math.round(expense / budgetLimit * 100)
  const status = expense >= budgetLimit ? 'Limit reached' : expense >= budgetLimit * .8 ? 'Near limit' : 'On track'
  return <section className="dash-panel planning-panel">
    <div className="panel-heading"><div><h2>Monthly budget</h2><p>Spending this calendar month</p></div><span className="category-tag">{status}</span></div>
    <div className="budget-total"><strong>{money(Math.max(0, budgetLimit - expense))}</strong><span> left of {money(budgetLimit)}</span></div>
    <div className="meter" role="progressbar" aria-label="Monthly budget used" aria-valuenow={Math.min(100, percent)} aria-valuetext={`${percent}%`}><i style={{ width: `${Math.min(100, percent)}%` }} /></div>
    <p className="panel-footnote">{money(expense)} spent · {percent}% used</p>
  </section>
}

export function Insight({ ledger }: { ledger: Ledger }) {
  const highest = ledger.groups[0]
  const change = comparison(ledger.expense, ledger.previousTotals.expense)
  return <section className="dash-panel planning-panel insight-panel">
    <div className="panel-heading"><div><h2><Sparkles size={17} /> Spending insight</h2><p>Calculated from your sample transactions</p></div></div>
    {highest ? <>
      <strong>{highest.name} is your largest expense category.</strong>
      <p>{money(highest.value)} accounts for {Math.round(highest.value / ledger.expense * 100)}% of spending. {change === null ? '' : change === 0 ? 'Spending matched the previous period.' : `Total spending is ${Math.abs(change)}% ${change > 0 ? 'higher' : 'lower'} than the previous period.`}</p>
    </> : <p>Record an expense in this period to see a category breakdown.</p>}
  </section>
}

export function AccountList({ transactions }: { transactions: Transaction[] }) {
  return <div className="account-grid">
    {accounts.map((name) => {
      const sum = totals(transactions.filter((row) => row.account === name))
      return <section className="dash-panel account-card" key={name}>
        <span className="feature-icon"><Landmark size={20} /></span><h2>{name}</h2>
        <strong>{money(sum.income - sum.expense)}</strong><p>Sample ledger balance</p>
      </section>
    })}
  </div>
}

export function Overview({ ledger, monthly, transactions, onSelect }: { ledger: Ledger; monthly: Ledger; transactions: Transaction[]; onSelect: (row: Transaction) => void }) {
  const balance = totals(transactions)
  const savings = monthly.income - monthly.expense
  const kpis = [
    { label: 'Total balance', amount: balance.income - balance.expense, Icon: Wallet, note: 'Across all sample accounts', style: 'balance' },
    { label: 'Total income', amount: ledger.income, Icon: ArrowDownLeft, delta: comparison(ledger.income, ledger.previousTotals.income), style: 'income' },
    { label: 'Total expenses', amount: ledger.expense, Icon: ArrowUpRight, delta: comparison(ledger.expense, ledger.previousTotals.expense), style: 'expense' },
    { label: 'Monthly savings', amount: savings, Icon: PiggyBank, note: 'Income less expenses this month', style: 'savings' },
  ]
  return <>
    <div className="kpi-grid">
      {kpis.map(({ label, amount, Icon, note, delta, style }) => <article className={`kpi-card kpi-${style}`} key={label}>
        <div className="kpi-label"><span>{label}</span><span className="kpi-icon"><Icon size={17} /></span></div>
        <strong>{money(amount)}</strong>
        <div className="kpi-note">
          {delta != null && <span className={`delta ${(style === 'expense' ? delta < 0 : delta > 0) ? 'is-positive' : ''}`}>
            {delta < 0 ? <ArrowDownRight size={13} /> : delta > 0 ? <ArrowUpRight size={13} /> : null}{Math.abs(delta)}%
          </span>}
          <span>{note ?? (delta == null ? 'No prior-period comparison' : 'vs. previous period')}</span>
        </div>
      </article>)}
    </div>
    <div className="dashboard-grid"><CashFlowChart ledger={ledger} /><CategoryChart ledger={ledger} /></div>
    <div className="dashboard-grid lower-grid">
      <section className="dash-panel recent-panel">
        <div className="panel-heading"><div><h2>Recent transactions</h2><p>Activity in the selected period</p></div><Button asChild variant="outline" size="sm"><Link to="/demo/transactions">View all</Link></Button></div>
        <TransactionTable rows={ledger.current.slice(0, 5)} onSelect={onSelect} />
      </section>
      <div className="planning-stack">
        <BudgetMeter expense={monthly.expense} />
        <Insight ledger={ledger} />
        <section className="dash-panel planning-panel">
          <div className="panel-heading"><div><h2><CircleGauge size={18} /> Savings rate</h2><p>Share of income saved this month</p></div></div>
          <strong className="budget-total">{monthly.income > 0 ? `${Math.round(savings / monthly.income * 100)}%` : '—'}</strong>
        </section>
      </div>
    </div>
  </>
}
