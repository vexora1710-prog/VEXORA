import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
const TYPES = ['Website', 'Web App', 'E-Commerce', 'UI/UX', 'Dashboard', 'Other']
const BUDGETS = ['Under ₹10,000', '₹10,000 – ₹25,000', '₹25,000 – ₹50,000', '₹50,000+', 'Not sure yet']
const EMPTY = { name: '', email: '', phone: '', business: '', businessType: '', projectType: '', budget: '', requirements: '', reference: '' }
const TITLES = ['About you', 'Your business', 'Project type', 'Budget', 'Requirements', 'Inspiration']
function Pick({ options, value, onChange, label }) {
  return <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">{options.map(o => (
    <button type="button" key={o} role="radio" aria-checked={value === o} onClick={() => onChange(o)}
      className={`rounded-full px-4 py-2 text-sm border transition ${value === o ? 'bg-violet/30 border-violet text-white' : 'border-white/10 hover:border-white/30'}`}>{o}</button>))}</div>
}
export default function RequestModal({ open, onClose, preset }) {
  const [step, setStep] = useState(0), [f, setF] = useState(EMPTY), [state, setState] = useState('idle'), [err, setErr] = useState('')
  const set = k => v => setF(p => ({ ...p, [k]: v?.target ? v.target.value : v }))
  useEffect(() => { if (open) { setStep(0); setState('idle'); setErr(''); setF({ ...EMPTY, ...(preset ? { requirements: preset } : {}) }) } }, [open])
  useEffect(() => { if (!open) return; const k = e => e.key === 'Escape' && onClose(); addEventListener('keydown', k); document.body.style.overflow = 'hidden'; return () => { removeEventListener('keydown', k); document.body.style.overflow = '' } }, [open])
  const valid = [f.name.trim() && /^\S+@\S+\.\S+$/.test(f.email), true, f.projectType, true, f.requirements.trim().length > 9, true][step]
  async function send() {
    setState('sending'); setErr('')
    try {
      const r = await fetch('/api/project-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Request failed')
      setState('done')
    } catch (e) { setState('idle'); setErr(e.message || 'Something went wrong. Please email vexora1710@gmail.com directly.') }
  }
  return <AnimatePresence>{open && (
    <motion.div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div role="dialog" aria-modal="true" aria-label="Start your project" onClick={e => e.stopPropagation()} initial={{ scale: .96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .96, y: 20 }}
        className="glass bg-navy/90 rounded-3xl w-full max-w-xl p-6 sm:p-8 relative max-h-[92vh] overflow-y-auto">
        <button onClick={onClose} aria-label="Close form" className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10"><X /></button>
        {state === 'done' ? (
          <div className="text-center py-10"><CheckCircle2 className="mx-auto text-cyan" size={48} />
            <h3 className="text-2xl text-white font-bold mt-4">Request received</h3>
            <p className="mt-2 text-slate-300">Your project request has been received. VEXORA will contact you soon.</p>
            <button className="btn btn-ghost mt-6" onClick={onClose}>Close</button></div>
        ) : (<>
          <p className="eyebrow">Step {step + 1} of 6</p>
          <div className="h-1 rounded bg-white/10 mt-2 overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-violet to-cyan" animate={{ width: `${((step + 1) / 6) * 100}%` }} /></div>
          <h3 className="text-2xl text-white font-bold mt-5 mb-4">{TITLES[step]}</h3>
          <div className="space-y-3 min-h-[190px]">
            {step === 0 && <>
              <input className="input" placeholder="Full name *" aria-label="Full name" value={f.name} onChange={set('name')} autoComplete="name" />
              <input className="input" type="email" placeholder="Email *" aria-label="Email" value={f.email} onChange={set('email')} autoComplete="email" />
              <input className="input" type="tel" placeholder="Phone (optional)" aria-label="Phone" value={f.phone} onChange={set('phone')} autoComplete="tel" /></>}
            {step === 1 && <>
              <input className="input" placeholder="Business name" aria-label="Business name" value={f.business} onChange={set('business')} />
              <input className="input" placeholder="Business type (e.g. restaurant, school, shop)" aria-label="Business type" value={f.businessType} onChange={set('businessType')} /></>}
            {step === 2 && <Pick label="Project type" options={TYPES} value={f.projectType} onChange={set('projectType')} />}
            {step === 3 && <Pick label="Budget" options={BUDGETS} value={f.budget} onChange={set('budget')} />}
            {step === 4 && <textarea className="input min-h-[150px]" placeholder="Tell us what you want to build (min 10 characters) *" aria-label="Project requirements" value={f.requirements} onChange={set('requirements')} />}
            {step === 5 && <input className="input" placeholder="Reference website or inspiration (optional)" aria-label="Reference website" value={f.reference} onChange={set('reference')} />}
          </div>
          {err && <p role="alert" className="text-sm text-red-400 mt-3">{err}</p>}
          <div className="flex justify-between mt-6">
            <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> Back</button>
            {step < 5 ? <button className="btn btn-primary disabled:opacity-40" disabled={!valid} onClick={() => setStep(step + 1)}>Next <ArrowRight size={16} /></button>
              : <button className="btn btn-primary disabled:opacity-40" disabled={state === 'sending'} onClick={send}>{state === 'sending' ? 'Sending…' : 'Send Project Request'}</button>}
          </div></>)}
      </motion.div></motion.div>)}</AnimatePresence>
}
