import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, ArrowUpRight, Bell, CalendarDays, ChartNoAxesCombined, ChevronDown, CircleGauge,
  House, List, Menu, PanelLeftClose, PanelLeftOpen, Plus, Search, Settings, Sparkles, Wallet,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Brand, ThemeToggle } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { getApiHealth } from '@/lib/api'
import { CashFlowChart, CategoryChart } from './charts'
import { budgetLimit, dateKey, dateLabel, ledgerFor, money, periods, seedTransactions, type Flow, type Period, type Transaction } from './data'
import { AccountList, BudgetMeter, Insight, Overview } from './overview'
import { TransactionDialog } from './transaction-form'
import { TransactionDetails, TransactionIcon, TransactionList } from './transactions'
import '@/styles/demo.css'

const sections = [
  { path: '', label: 'Overview', Icon: House },
  { path: 'transactions', label: 'Transactions', Icon: List },
  { path: 'accounts', label: 'Accounts', Icon: Wallet },
  { path: 'budgets', label: 'Budgets', Icon: CircleGauge },
  { path: 'reports', label: 'Reports', Icon: ChartNoAxesCombined },
  { path: 'insights', label: 'Insights', Icon: Sparkles },
  { path: 'settings', label: 'Settings', Icon: Settings },
] as const

function Navigation({ close }: { close?: () => void }) {
  return <nav className="workspace-nav" aria-label="Workspace navigation">
    {sections.map(({ path, label, Icon }) => <NavLink end to={path ? `/demo/${path}` : '/demo'} key={path} title={label} onClick={close}>
      <Icon size={19} /><span>{label}</span>
    </NavLink>)}
  </nav>
}

function SearchDialog({ open, setOpen, rows, select }: { open: boolean; setOpen: (open: boolean) => void; rows: Transaction[]; select: (row: Transaction) => void }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const key = query.trim().toLowerCase()
  const pages = sections.filter(({ label }) => label.toLowerCase().includes(key))
  const results = key ? rows.filter((row) => `${row.name} ${row.category} ${row.account}`.toLowerCase().includes(key)).slice(0, 6) : []
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button id="workspace-search" variant="ghost" className="search-launch" aria-label="Search sample workspace"><Search size={17} /><span>Search anything…</span><kbd>{/Mac/i.test(navigator.platform) ? '⌘' : 'Ctrl'} K</kbd></Button></DialogTrigger>
    <DialogContent className="search-dialog">
      <DialogTitle>Search workspace</DialogTitle>
      <DialogDescription>Find a page or a sample transaction.</DialogDescription>
      <input className="search-input" type="search" aria-label="Search pages or transactions" placeholder="Search by page, merchant, or category…" value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="search-results">
        {pages.map(({ path, label, Icon }) => <button type="button" key={path} onClick={() => { navigate(path ? `/demo/${path}` : '/demo'); setOpen(false) }}><Icon size={18} /><span>{label}</span></button>)}
        {results.map((row) => <button type="button" key={row.id} onClick={() => { setOpen(false); select(row) }}><TransactionIcon row={row} /><span>{row.name}</span><small>{money(row.amount)}</small></button>)}
        {!pages.length && !results.length && <p className="panel-footnote">No matches found.</p>}
      </div>
    </DialogContent>
  </Dialog>
}

function Notifications({ expense }: { expense: number }) {
  const threshold = expense >= budgetLimit ? 100 : expense >= budgetLimit * .8 ? 80 : 0
  const id = `${dateKey().slice(0, 7)}-${threshold}`
  const [read, setRead] = useState<string[]>([])
  const unread = threshold > 0 && !read.includes(id)
  return <Dialog>
    <DialogTrigger asChild><Button variant="ghost" size="icon" aria-label={unread ? 'Notifications, 1 unread' : 'Notifications'} className="notification-trigger"><Bell size={19} />{unread && <i />}</Button></DialogTrigger>
    <DialogContent>
      <DialogTitle>Notifications</DialogTitle>
      <DialogDescription>Alerts calculated from this sample ledger.</DialogDescription>
      {threshold > 0 ? <div className="notification-item"><CircleGauge size={21} /><div>
        <strong>{threshold === 100 ? 'Monthly budget limit reached' : 'Monthly budget is nearing its limit'}</strong><p>{money(expense)} spent of {money(budgetLimit)}.</p>
        {unread ? <Button variant="outline" size="sm" onClick={() => setRead([...read, id])}>Mark as read</Button> : <span className="category-tag">Read</span>}
      </div></div> : <div className="empty-state"><Bell size={25} /><p>No budget alerts right now.</p></div>}
    </DialogContent>
  </Dialog>
}

function PreviewSettings() {
  const health = useQuery({ queryKey: ['health'], queryFn: ({ signal }) => getApiHealth(signal), retry: false })
  return <section className="dash-panel settings-panel">
    <div><div><h2>Appearance</h2><p>Choose the theme for this browser.</p></div><ThemeToggle /></div>
    <div><div><h2>Preview data</h2><p>Sample entries reset when you reload or leave the preview.</p></div><span className="category-tag">INR</span></div>
    <div><div><h2>Express API</h2><p role="status">{health.isFetching ? 'Checking API connection…' : health.isSuccess ? 'API is responding.' : 'API is currently unavailable.'}</p></div><Button variant="outline" size="sm" onClick={() => health.refetch()} disabled={health.isFetching}>Check again</Button></div>
  </section>
}

export default function Demo() {
  const [transactions, setTransactions] = useState(seedTransactions)
  const [period, setPeriod] = useState<Period>('month')
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [adding, setAdding] = useState<Flow | null>(null)
  const [selected, setSelected] = useState<Transaction | null>(null)
  const dialogOpener = useRef<HTMLElement | null>(null)
  const { pathname } = useLocation()
  const path = pathname.replace(/^\/demo\/?|\/$/g, '')
  const title = sections.find((item) => item.path === path)?.label ?? 'Page not found'
  const rows = [...transactions].sort((a, b) => b.date.localeCompare(a.date))
  const ledger = ledgerFor(rows, period)
  const monthly = period === 'month' ? ledger : ledgerFor(rows, 'month')
  const date = dateLabel(dateKey(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    function openCommand(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (adding || selected) return
        event.preventDefault()
        setMenuOpen(false)
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', openCommand)
    return () => window.removeEventListener('keydown', openCommand)
  }, [adding, selected])

  function add(row: Transaction) {
    setTransactions((current) => [row, ...current])
    toast.success('Added to your sample ledger', { description: `${row.name} · ${money(row.amount)}` })
  }

  function inspect(row: Transaction) {
    dialogOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setSelected(row)
  }

  function openEntry(type: Flow, button: HTMLButtonElement) {
    dialogOpener.current = button
    setAdding(type)
  }

  function returnFocus() {
    const target = dialogOpener.current
    if (target?.isConnected && target !== document.body) target.focus()
    else document.getElementById('workspace-search')?.focus()
  }

  return <div className={`workspace ${collapsed ? 'workspace-collapsed' : ''}`}>
    <a className="skip-link" href="#demo-content">Skip to content</a>
    <aside className="workspace-sidebar">
      <Brand to="/demo" />
      <div className="workspace-nav-label">Workspace</div>
      <Navigation />
      <div className="workspace-sidebar-footer">
        <Link to="/" title="Back to home"><ArrowLeft size={18} /><span>Back to home</span></Link>
      </div>
    </aside>
    <header className="workspace-top">
      <div className="workspace-top-left">
        <Button className="desktop-collapse" variant="ghost" size="icon" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}</Button>
        <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
          <DialogTrigger asChild><Button className="mobile-toggle" variant="ghost" size="icon" aria-label="Open navigation"><Menu size={22} /></Button></DialogTrigger>
          <DialogContent className="mobile-drawer"><DialogTitle>Workspace</DialogTitle><DialogDescription>Sample ledger navigation</DialogDescription><Navigation close={() => setMenuOpen(false)} /><Link className="drawer-home" to="/" onClick={() => setMenuOpen(false)}>Back to home</Link></DialogContent>
        </Dialog>
        <span className="workspace-crumb">{title}</span>
      </div>
      <div className="workspace-top-actions">
        <SearchDialog open={searchOpen} setOpen={setSearchOpen} rows={rows} select={inspect} />
        <Notifications expense={monthly.expense} />
        <ThemeToggle />
        <Dropdown.Root>
          <Dropdown.Trigger asChild><Button variant="ghost" className="profile-trigger" aria-label="Sample profile menu"><span className="avatar">AM</span><ChevronDown size={14} /></Button></Dropdown.Trigger>
          <Dropdown.Portal><Dropdown.Content className="profile-menu" sideOffset={7} align="end">
            <Dropdown.Label className="profile-label"><strong>Alex Morgan</strong><span>Sample profile</span></Dropdown.Label>
            <Dropdown.Separator />
            <Dropdown.Item asChild><Link to="/demo/settings"><Settings size={17} /> Settings</Link></Dropdown.Item>
            <Dropdown.Item asChild><Link to="/"><ArrowLeft size={17} /> Exit preview</Link></Dropdown.Item>
          </Dropdown.Content></Dropdown.Portal>
        </Dropdown.Root>
      </div>
    </header>
    <main id="demo-content" className="workspace-content">
      <div className="workspace-heading">
        <div><span className="demo-label"><i /> Dashboard preview · Sample data</span>
          <h1>{path === '' ? 'Welcome back, Alex' : title}</h1><p>{path === '' ? date : 'LumaLedger sample workspace'}</p>
        </div>
        <div className="heading-actions">
          {(path === '' || path === 'reports' || path === 'insights') && <div className="period-select"><CalendarDays size={16} /><select aria-label="Reporting period" value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
            {periods.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
          </select></div>}
          <Button variant="outline" onClick={(event) => openEntry('income', event.currentTarget)}><ArrowUpRight size={17} /> Add income</Button>
          <Button onClick={(event) => openEntry('expense', event.currentTarget)}><Plus size={17} /> Add expense</Button>
        </div>
      </div>
      <motion.div className="view-content" key={pathname} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }}>
        <Routes>
          <Route index element={<Overview ledger={ledger} monthly={monthly} transactions={rows} onSelect={inspect} />} />
          <Route path="transactions" element={<TransactionList rows={rows} onSelect={inspect} />} />
          <Route path="accounts" element={<AccountList transactions={rows} />} />
          <Route path="budgets" element={<BudgetMeter expense={monthly.expense} />} />
          <Route path="reports" element={<><div className="dashboard-grid"><CashFlowChart ledger={ledger} /><CategoryChart ledger={ledger} /></div><CashFlowChart ledger={ledger} line /></>} />
          <Route path="insights" element={<Insight ledger={ledger} />} />
          <Route path="settings" element={<PreviewSettings />} />
          <Route path="*" element={<div className="dash-panel empty-state"><p>This page does not exist.</p><Button asChild variant="outline"><Link to="/demo">Back to overview</Link></Button></div>} />
        </Routes>
      </motion.div>
    </main>
    {adding && <TransactionDialog type={adding} close={() => setAdding(null)} add={add} returnFocus={returnFocus} />}
    {selected && <TransactionDetails row={selected} close={() => setSelected(null)} returnFocus={returnFocus} />}
  </div>
}
