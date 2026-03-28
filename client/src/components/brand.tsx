import { Moon, Sun } from 'lucide-react'
import { Link } from 'react-router'
import { useTheme } from '@/app/theme'
import { Button } from './ui/button'

export function Brand({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="brand" aria-label="LumaLedger AI">
      <img src="/luma.svg" alt="" width="34" height="34" />
      <span>LumaLedger<span className="brand-ai"> AI</span></span>
    </Link>
  )
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
  return <Button variant="ghost" size="icon" onClick={toggle} aria-label={label} title={label}>
    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
  </Button>
}
