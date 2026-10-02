import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
const EMPTY = { name: '', email: '', phone: '', projectType: 'Website', message: '' }
export default function ContactForm() {
  const [f, setF] = useState(EMPTY), [s, setS] = useState('idle'), [err, setErr] = useState('')
  const set = k => e => setF({ ...f, [k]: e.target.value })
  async function submit(e) {
    e.preventDefault(); setS('sending'); setErr('')
    try { const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Request failed'); setS('done'); setF(EMPTY)
    } catch (x) { setS('idle'); setErr(x.message) }
  }
  if (s === 'done') return <div className="glass rounded-2xl p-8 text-center" role="status"><h3 className="text-xl text-white font-bold">Message sent</h3><p className="mt-2 text-slate-400">Thanks! VEXORA will get back to you soon.</p></div>
  return <form onSubmit={submit} className="glass rounded-2xl p-6 sm:p-8 space-y-3" aria-label="Contact form">
    <div className="grid sm:grid-cols-2 gap-3">
      <input className="input" required placeholder="Name" aria-label="Name" value={f.name} onChange={set('name')} autoComplete="name" />
      <input className="input" required type="email" placeholder="Email" aria-label="Email" value={f.email} onChange={set('email')} autoComplete="email" /></div>
    <div className="grid sm:grid-cols-2 gap-3">
      <input className="input" type="tel" placeholder="Phone (optional)" aria-label="Phone" value={f.phone} onChange={set('phone')} autoComplete="tel" />
      <select className="input" aria-label="Project type" value={f.projectType} onChange={set('projectType')}>{['Website', 'Web App', 'E-Commerce', 'UI/UX', 'Dashboard', 'Other'].map(o => <option key={o} className="bg-navy">{o}</option>)}</select></div>
    <textarea className="input min-h-[130px]" required minLength={10} placeholder="Message" aria-label="Message" value={f.message} onChange={set('message')} />
    {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
    <button className="btn btn-primary disabled:opacity-50" disabled={s === 'sending'}>{s === 'sending' ? 'Sending…' : 'Send Message'} <ArrowRight size={16} /></button></form>
}
