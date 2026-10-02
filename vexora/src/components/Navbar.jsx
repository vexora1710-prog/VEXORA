import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, ArrowRight } from 'lucide-react'
import { NAV } from '../data/content'
import useActiveSection from '../hooks/useActiveSection'
import Logo from './Logo'
export default function Navbar({ onStart }) {
  const [scrolled, setScrolled] = useState(false), [open, setOpen] = useState(false)
  const active = useActiveSection(NAV.map(n => n[0]))
  useEffect(() => { const f = () => setScrolled(scrollY > 20); f(); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f) }, [])
  return (
    <header className={`fixed top-0 inset-x-0 z-40 transition ${scrolled ? 'glass bg-ink/70' : 'bg-transparent'}`}>
      <nav aria-label="Primary" className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
        <a href="#home" aria-label="VEXORA home"><Logo /></a>
        <ul className="hidden lg:flex items-center gap-1">
          {NAV.map(([id, label]) => (
            <li key={id}><a href={`#${id}`} aria-current={active === id ? 'page' : undefined}
              className={`relative px-4 py-2 text-sm transition hover:text-white ${active === id ? 'text-white' : 'text-slate-400'}`}>
              {label}{active === id && <motion.span layoutId="nav-dot" className="absolute left-1/2 -translate-x-1/2 bottom-0 h-1 w-6 rounded-full bg-gradient-to-r from-violet to-cyan" />}
            </a></li>))}
        </ul>
        <button onClick={onStart} className="btn btn-primary hidden lg:inline-flex">Start a Project <ArrowRight size={16} /></button>
        <button className="lg:hidden p-2 text-white" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </nav>
      <AnimatePresence>{open && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="lg:hidden glass bg-ink/95 px-5 pb-6">
          <ul className="flex flex-col">{NAV.map(([id, label], i) => (
            <motion.li key={id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .04 }}>
              <a href={`#${id}`} onClick={() => setOpen(false)} className="block py-3 text-lg font-display text-white border-b border-white/5">{label}</a></motion.li>))}</ul>
          <button onClick={() => { setOpen(false); onStart() }} className="btn btn-primary w-full mt-5">Start a Project <ArrowRight size={16} /></button>
        </motion.div>)}</AnimatePresence>
    </header>)
}
