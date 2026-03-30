import { ArrowDownRight, ChartNoAxesCombined, CircleGauge, Fingerprint, ScanLine, Shapes, Sparkles, Wallet } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import { Brand, ThemeToggle } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { DashboardMockup, FeaturePreview } from './mockup'
import '@/styles/landing.css'

const features = [
  { name: 'Make sense of every purchase', text: 'Get a suggested category from the merchant or description. Choose what fits before you save.', Icon: Shapes },
  { name: 'See what changed and why', text: 'Spot spending shifts, repeated expenses, and budget risks in plain language.', Icon: Sparkles, preview: 'insight' },
  { name: 'Know what’s left to spend', text: 'Set monthly and category limits and see how close you are as expenses come in.', Icon: CircleGauge, preview: 'budget' },
  { name: 'Explore the bigger picture', text: 'Compare periods, follow cash flow, and see where your money goes with interactive reports.', Icon: ChartNoAxesCombined },
  { name: 'Turn receipts into entries', text: 'With a configured extraction provider, pull out the merchant, date, and total for review.', Icon: ScanLine, preview: 'receipt' },
] as const

const questions = [
  ['Can I explore LumaLedger without an account?', 'Yes. The dashboard preview uses sample transactions. You can change the reporting period and try quick entry without registering.'],
  ['Does LumaLedger connect to my bank?', 'The initial product is designed for manual entry. It does not ask for bank login credentials or claim to sync accounts.'],
  ['Will AI make changes to my ledger?', 'The planned AI features suggest categories and receipt fields for you to review. You choose what gets saved.'],
  ['Can I use my own currency?', 'The initial account design uses one base currency, with INR as the default. The dashboard preview is shown in INR.'],
  ['Can I create a live account now?', 'This release is a local product preview. Live sign-in and private account storage are part of the next phase.'],
]

export default function Landing() {
  return (
    <div className="landing">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="marketing-header">
        <div className="marketing-container marketing-nav">
          <Brand />
          <nav aria-label="Main navigation" className="marketing-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="marketing-actions">
            <ThemeToggle />
            <Button asChild variant="ghost"><Link to="/login">Sign in</Link></Button>
            <Button asChild className="header-cta"><Link to="/register">Get Started Free</Link></Button>
          </div>
        </div>
      </header>
      <main id="main-content">
        <section className="hero">
          <div className="hero-atmosphere" aria-hidden="true" />
          <motion.div className="marketing-container hero-copy" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
            <div className="hero-kicker"><Sparkles size={15} /> AI-powered personal finance</div>
            <h1>Take Control of Your Money.<br /><span>Powered by AI.</span></h1>
            <p>Track expenses, understand spending patterns, build smarter budgets, and make confident financial decisions.</p>
            <div className="hero-actions">
              <Button asChild size="lg"><Link to="/register">Get Started Free</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/demo"><ChartNoAxesCombined size={17} /> Explore Dashboard</Link></Button>
            </div>
          </motion.div>
          <DashboardMockup />
        </section>

        <section id="features" className="marketing-section marketing-container">
          <div className="section-heading"><span className="section-eyebrow">Features</span><h2>One place for your financial life.</h2><p>See your spending clearly, plan what’s next, and take action from the same workspace.</p></div>
          <div className="feature-grid">
            {features.map((feature) => <article className="feature-card" key={feature.name}>
              <div className="feature-icon"><feature.Icon size={21} /></div>
              <h3>{feature.name}</h3><p>{feature.text}</p>
              {'preview' in feature && <FeaturePreview kind={feature.preview} />}
            </article>)}
          </div>
        </section>

        <section id="how-it-works" className="marketing-section workflow-section">
          <div className="marketing-container">
            <div className="section-heading"><span className="section-eyebrow">How it works</span><h2>From everyday spending to a clearer plan.</h2></div>
            <div className="workflow-grid">
              <article><Wallet /><h3>Log what moves</h3><p>Add income and expenses as they happen and keep each transaction with its account.</p></article>
              <article><ChartNoAxesCombined /><h3>Understand the pattern</h3><p>Review spending by category and compare it with the previous period.</p></article>
              <article><CircleGauge /><h3>Adjust your plan</h3><p>Set a budget, check what’s left, and make room for the goals you care about.</p></article>
            </div>
            <div className="privacy-card">
              <div className="feature-icon"><Fingerprint size={24} /></div>
              <div><h3>Your financial data deserves a clear boundary.</h3><p>The public preview uses sample data. Private accounts are designed around per-user access, and planned AI processing will require consent before sending receipt information to a provider.</p></div>
            </div>
          </div>
        </section>

        <section id="faq" className="marketing-section marketing-container faq-section">
          <div className="section-heading"><span className="section-eyebrow">FAQ</span><h2>Frequently asked questions.</h2></div>
          <div className="faq-list">
            {questions.map(([question, answer]) => <details key={question}><summary>{question}<ArrowDownRight size={19} /></summary><p>{answer}</p></details>)}
          </div>
        </section>

        <section className="conversion marketing-container">
          <div><h2>Bring your money into focus.</h2><p>Explore a sample ledger and see how the dashboard works.</p></div>
          <Button asChild size="lg"><Link to="/demo">Explore Dashboard</Link></Button>
        </section>
      </main>
      <footer className="marketing-container marketing-footer">
        <Brand />
        <nav aria-label="Footer navigation"><a href="#features">Features</a><a href="#faq">FAQ</a><Link to="/demo">Dashboard preview</Link></nav>
        <small>© {new Date().getFullYear()} LumaLedger AI</small>
      </footer>
    </div>
  )
}
