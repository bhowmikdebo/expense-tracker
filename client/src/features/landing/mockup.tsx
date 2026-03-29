import {
  ArrowDownLeft, ArrowUpRight, ChartNoAxesCombined, ChevronDown, CircleGauge,
  LayoutGrid, List, Plus, ScanLine, Sparkles, Wallet,
} from 'lucide-react'

const bars = [[40, 26], [59, 37], [51, 29], [72, 48], [62, 39], [89, 53], [76, 43], [97, 61]]
const miniNavigation = [[LayoutGrid, 'Overview'], [List, 'Transactions'], [Wallet, 'Budgets'], [ChartNoAxesCombined, 'Reports'], [Sparkles, 'Insights']] as const

export function DashboardMockup() {
  return (
    <div className="mock-stage" aria-hidden="true">
      <div className="mock-window">
        <div className="mock-chrome">
          <div className="mock-dots"><i /><i /><i /></div>
          <span>Dashboard preview</span>
          <span className="mock-sample">Sample data</span>
        </div>
        <div className="mock-app">
          <div className="mock-sidebar">
            <div className="mock-brand"><img src="/luma.svg" alt="" /> LumaLedger <span>AI</span></div>
            <small>WORKSPACE</small>
            {miniNavigation.map(([Icon, label], index) => <div key={label} className={index === 0 ? 'mock-active' : ''}><Icon />{label}</div>)}
          </div>
          <div className="mock-main">
            <div className="mock-heading">
              <div><strong>Your financial overview</strong><p>Here’s what’s happening with your money.</p></div>
              <span className="mock-action"><Plus /> Add transaction</span>
            </div>
            <div className="mock-kpis">
              <div><span><Wallet />Total balance</span><strong>₹84,250</strong><small>Across all accounts</small></div>
              <div><span><ArrowDownLeft />Income</span><strong>₹96,000</strong><small>This month</small></div>
              <div><span><ArrowUpRight />Expenses</span><strong>₹37,420</strong><small>This month</small></div>
            </div>
            <div className="mock-charts">
              <div className="mock-chart">
                <div className="mock-chart-head">
                  <div><strong>Cash flow</strong><small>Income and expenses over time</small></div>
                  <span>This month <ChevronDown /></span>
                </div>
                <div className="mock-plot">
                  <div className="mock-grid"><i /><i /><i /><i /></div>
                  {bars.map(([income, expenses], index) => <div key={index}><i style={{ height: `${income}%` }} /><i style={{ height: `${expenses}%` }} /></div>)}
                </div>
              </div>
              <div className="mock-chart mock-categories">
                <div className="mock-chart-head"><div><strong>Spending by category</strong><small>Top expenses this month</small></div></div>
                <div className="mock-ring"><div><strong>₹37,420</strong><small>Total spent</small></div></div>
                <div className="mock-key"><span><i /> Housing</span><span><i /> Food</span><span><i /> Other</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FeaturePreview({ kind }: { kind: 'budget' | 'receipt' | 'insight' }) {
  if (kind === 'budget') return (
    <div className="feature-illustration budget-illustration" aria-hidden="true">
      <div><span className="feature-mini-icon"><CircleGauge size={18} /></span><strong>Monthly budget</strong><b>72%</b></div>
      <div className="meter"><i style={{ width: '72%' }} /></div>
      <small>₹28,800 spent of ₹40,000</small>
    </div>
  )
  if (kind === 'receipt') return (
    <div className="feature-illustration receipt-illustration" aria-hidden="true">
      <ScanLine size={25} /><div><strong>Weekend groceries</strong><small>Merchant and total extracted</small></div><b>₹1,240</b>
    </div>
  )
  return (
    <div className="feature-illustration insight-illustration" aria-hidden="true">
      <Sparkles size={23} />
      <div><strong>Dining spending is up 18%</strong><small>Compared with last month</small></div>
    </div>
  )
}
