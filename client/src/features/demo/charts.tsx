import { ChartNoAxesCombined } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { money, trend, type ledgerFor } from './data'

type Ledger = ReturnType<typeof ledgerFor>

const tick = { fill: 'var(--quiet)', fontSize: 12 }
const tooltip = { background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }
const format = (value: unknown) => typeof value === 'number' ? money(value) : String(value)

export function CashFlowChart({ ledger, line = false }: { ledger: Ledger; line?: boolean }) {
  const reduce = useReducedMotion()
  const data = trend(ledger.current, ledger.start, ledger.end)
  return (
    <section className="dash-panel flow-panel">
      <div className="panel-heading"><div><h2>{line ? 'Net cash flow' : 'Income & expenses'}</h2><p>{line ? 'Income minus expenses by interval' : 'Cash flow across the selected period'}</p></div>
        {!line && <div className="chart-legend"><span><i />Income</span><span><i />Expenses</span></div>}
      </div>
      {ledger.current.length === 0 ? <EmptyChart /> :
        <div className="chart-canvas" aria-label={line ? 'Net cash flow line chart' : 'Income and expenses bar chart'}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            {line ? <LineChart data={data} margin={{ top: 8, right: 10, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={tick} minTickGap={20} tickMargin={10} />
              <YAxis tickFormatter={(value: number) => money(value, true)} axisLine={false} tickLine={false} tick={tick} width={62} />
              <Tooltip formatter={format} contentStyle={tooltip} />
              <Line dataKey="net" name="Net cash flow" type="monotone" stroke="var(--chart-primary)" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={!reduce} />
            </LineChart> :
              <BarChart data={data} margin={{ top: 8, right: 10, left: 8, bottom: 0 }} barGap={4} maxBarSize={22}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={tick} minTickGap={20} tickMargin={10} />
                <YAxis tickFormatter={(value: number) => money(value, true)} axisLine={false} tickLine={false} tick={tick} width={62} />
                <Tooltip formatter={format} contentStyle={tooltip} cursor={{ fill: 'var(--outline-hover)' }} />
                <Bar dataKey="income" name="Income" fill="var(--chart-primary)" radius={[5, 5, 0, 0]} isAnimationActive={!reduce} />
                <Bar dataKey="expense" name="Expenses" fill="var(--chart-secondary)" radius={[5, 5, 0, 0]} isAnimationActive={!reduce} />
              </BarChart>}
          </ResponsiveContainer>
        </div>}
    </section>
  )
}

export function CategoryChart({ ledger }: { ledger: Ledger }) {
  const reduce = useReducedMotion()
  return (
    <section className="dash-panel category-panel">
      <div className="panel-heading"><div><h2>Spending breakdown</h2><p>Expenses by category</p></div></div>
      {ledger.groups.length === 0 ? <EmptyChart /> : <>
        <div className="donut-chart">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie data={ledger.groups} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="92%" paddingAngle={3} cornerRadius={4} stroke="none" isAnimationActive={!reduce}>
                {ledger.groups.map((group) => <Cell key={group.name} fill={group.color} />)}
              </Pie>
              <Tooltip formatter={format} contentStyle={tooltip} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-label"><strong>{money(ledger.expense)}</strong><span>Total expenses</span></div>
        </div>
        <div className="category-legend">
          {ledger.groups.slice(0, 4).map((group) => <div key={group.name}><span><i style={{ background: group.color }} />{group.name}</span><strong>{Math.round(group.value / ledger.expense * 100)}%</strong></div>)}
        </div>
      </>}
    </section>
  )
}

function EmptyChart() {
  return <div className="empty-state"><ChartNoAxesCombined size={25} /><p>No transactions in this period.</p></div>
}
