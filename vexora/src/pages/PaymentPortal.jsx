import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import QRCode from 'qrcode'
import { ArrowLeft, Check, CheckCircle2, Copy, Download, ExternalLink, KeyRound, LoaderCircle, LockKeyhole, LogOut, Plus, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react'

const money = paise => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format((paise || 0) / 100)
const date = value => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const api = async (url, options = {}) => {
  const response = await fetch(url, { ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'Request failed. Please try again.')
  return result
}
const Panel = ({ children, className = '' }) => <section className={`glass rounded-2xl border-white/10 ${className}`}>{children}</section>
const Header = ({ label = 'PROJECT PAYMENT' }) => <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6"><a href="/" className="font-display text-lg font-bold tracking-[.22em] text-white">VEXORA<span className="text-cyan">.</span></a><span className="eyebrow !text-[10px]">{label}</span></header>
const Alert = ({ children, error = false }) => children ? <div role="alert" className={`mt-4 flex gap-2 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-300/20 bg-red-400/10 text-red-200' : 'border-cyan/20 bg-cyan/10 text-cyan-100'}`}>{error ? <TriangleAlert size={17} className="shrink-0" /> : <CheckCircle2 size={17} className="shrink-0" />}{children}</div> : null

export default function PaymentPortal({ mode, token }) {
  return mode === 'admin' ? <AdminDashboard /> : <CustomerPayment token={token} />
}

function CustomerPayment({ token }) {
  const [project, setProject] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState(null)
  const [upiReference, setUpiReference] = useState('')
  const [upiNotice, setUpiNotice] = useState('')
  const [upiUrl, setUpiUrl] = useState('')
  const [qrImage, setQrImage] = useState('')

  async function reload() {
    const result = await api(`/api/public/projects/${encodeURIComponent(token)}`)
    setProject(result)
    return result
  }
  useEffect(() => { reload().catch(reason => setError(reason.message)) }, [token])
  useEffect(() => {
    if (!project?.upiId) return
    const due = project.status === 'ADVANCE_DUE' ? project.advancePaise : project.finalPaise
    const params = new URLSearchParams({ pa: project.upiId, pn: 'VEXORA', tn: 'Project Payment', am: (due / 100).toFixed(2), cu: 'INR', tr: project.id })
    const link = `upi://pay?${params}`
    setUpiUrl(link)
    QRCode.toDataURL(link, { width: 220, margin: 1, color: { dark: '#07151f', light: '#ffffff' } }).then(setQrImage).catch(() => setQrImage(''))
  }, [project])

  const currentType = project?.status === 'ADVANCE_DUE' ? 'ADVANCE' : project?.status === 'FINAL_DUE' ? 'FINAL' : null
  const dueAmount = currentType === 'ADVANCE' ? project?.advancePaise : project?.finalPaise
  const verifiedPayments = project?.payments?.filter(payment => payment.status === 'SUCCESS') || []
  const remaining = Math.max(0, (project?.totalPaise || 0) - verifiedPayments.reduce((sum, payment) => sum + payment.amountPaise, 0))
  const pendingUpi = project?.payments?.some(payment => payment.provider === 'UPI' && payment.status === 'PENDING')

  async function payWithRazorpay() {
    setBusy(true); setError(''); setOutcome(null)
    try {
      const order = await api(`/api/public/projects/${encodeURIComponent(token)}/order`, { method: 'POST' })
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload = resolve
          script.onerror = () => reject(new Error('Razorpay Checkout could not be loaded.'))
          document.body.appendChild(script)
        })
      }
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'VEXORA',
        description: `${order.paymentType === 'ADVANCE' ? 'Advance' : 'Final'} payment · ${order.projectName}`,
        order_id: order.orderId,
        prefill: { name: order.customerName, email: order.customerEmail },
        theme: { color: '#69d7f2' },
        handler: async response => {
          try {
            const verified = await api(`/api/public/projects/${encodeURIComponent(token)}/verify`, { method: 'POST', body: JSON.stringify(response) })
            setOutcome({ type: 'success', paymentId: verified.paymentId, amount: dueAmount })
            setProject(verified.project)
          } catch (reason) {
            setOutcome({ type: 'failure', message: reason.message })
          } finally { setBusy(false) }
        },
        modal: { ondismiss: () => setBusy(false) }
      })
      checkout.on('payment.failed', event => {
        const metadata = event.error?.metadata || {}
        if (metadata.payment_id && metadata.order_id) api(`/api/public/projects/${encodeURIComponent(token)}/failure`, { method: 'POST', body: JSON.stringify({ paymentId: metadata.payment_id, orderId: metadata.order_id }) }).catch(() => {})
        setOutcome({ type: 'failure' }); setBusy(false)
      })
      checkout.open()
    } catch (reason) { setError(reason.message); setBusy(false) }
  }

  async function reportUpi() {
    setBusy(true); setError(''); setUpiNotice('')
    try {
      const result = await api(`/api/public/projects/${encodeURIComponent(token)}/upi-notice`, { method: 'POST', body: JSON.stringify({ reference: upiReference }) })
      setUpiNotice(result.message)
      setUpiReference('')
      await reload()
    } catch (reason) { setError(reason.message) }
    finally { setBusy(false) }
  }

  async function copyUpi() {
    try { await navigator.clipboard.writeText(project.upiId); setUpiNotice('UPI ID copied.') }
    catch { setError('Clipboard access is unavailable. You can select and copy the UPI ID.') }
  }

  if (!project && !error) return <main className="min-h-screen"><Header /><div className="mx-auto mt-24 max-w-xl px-5 text-center text-slate-400"><LoaderCircle className="mx-auto animate-spin text-cyan" />Loading project payment…</div></main>
  if (!project) return <main className="min-h-screen"><Header /><div className="mx-auto mt-16 max-w-xl px-5"><Panel className="p-8 text-center"><h1 className="text-2xl font-bold text-white">Payment link unavailable</h1><p className="mt-3 text-slate-400">{error}</p><a href="mailto:vexora1710@gmail.com" className="btn btn-primary mt-6">Contact VEXORA</a></Panel></div></main>

  return <main className="payment-shell min-h-screen pb-16 text-slate-200">
    <Header />
    <div className="mx-auto grid max-w-6xl gap-8 px-5 pb-10 pt-5 lg:grid-cols-[1fr_.82fr] lg:items-start">
      <div className="pt-2">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16} /> VEXORA</a>
        <p className="eyebrow mt-10">{project.status.replaceAll('_', ' ')}</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">SECURE PROJECT PAYMENT</h1>
        <p className="mt-4 max-w-xl text-slate-400">A clear payment schedule for your project, with every payment verified before its status changes.</p>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }}>
          <Panel className="payment-glow mt-8 overflow-hidden p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">VEXORA · PROJECT PAYMENT</p><h2 className="mt-3 text-2xl font-semibold text-white">{project.projectName}</h2><p className="mt-1 text-sm text-slate-400">Prepared for {project.customerName}</p></div><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-cyan/20 bg-cyan/10 text-cyan"><ShieldCheck size={23} /></span></div>
            <div className="mt-8 grid gap-4 border-y border-white/10 py-5 sm:grid-cols-3">
              <div><p className="text-xs uppercase tracking-widest text-slate-500">Total project cost</p><p className="mt-1 font-display text-xl font-bold text-white">{money(project.totalPaise)}</p></div>
              <div><p className="text-xs uppercase tracking-widest text-slate-500">Advance · {project.advancePercent}%</p><p className="mt-1 font-display text-lg font-semibold text-white">{money(project.advancePaise)}</p></div>
              <div><p className="text-xs uppercase tracking-widest text-slate-500">Remaining</p><p className="mt-1 font-display text-lg font-semibold text-white">{money(remaining)}</p></div>
            </div>
            <div className="mt-5 space-y-3">
              {['ADVANCE', 'FINAL'].map((type, index) => {
                const payment = verifiedPayments.find(item => item.payment_type === type)
                const due = type === 'ADVANCE' ? project.advancePaise : project.finalPaise
                return <div key={type} className="flex items-center justify-between rounded-xl bg-white/[.035] px-4 py-3"><div className="flex items-center gap-3"><span className={`grid h-6 w-6 place-items-center rounded-full border ${payment ? 'border-cyan bg-cyan text-ink' : 'border-white/20 text-slate-500'}`}>{payment ? <Check size={14} /> : <span className="text-[10px]">0{index + 1}</span>}</span><div><p className="text-sm font-medium text-white">{type === 'ADVANCE' ? 'Advance Payment' : 'Final Payment'}</p><p className="text-xs text-slate-500">{payment ? `PAID · ${date(payment.verifiedAt)}` : type === 'FINAL' && project.status !== 'FINAL_DUE' ? 'PENDING' : 'DUE'}</p></div></div><p className="text-sm font-semibold text-white">{money(due)}</p></div>
              })}
            </div>
            {project.status === 'DELIVERED' && project.deliveryUrl && <a href={project.deliveryUrl} target="_blank" rel="noreferrer" className="btn btn-primary mt-6 w-full">Access project delivery <ExternalLink size={16} /></a>}
          </Panel>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .08 }}>
        <Panel className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan/10 blur-3xl" aria-hidden="true" />
          {outcome?.type === 'success' ? <div className="relative py-5 text-center">
            <CheckCircle2 size={48} className="mx-auto text-cyan" /><p className="eyebrow mt-5">PAYMENT CONFIRMED</p><h2 className="mt-2 text-3xl font-bold text-white">Payment Successful</h2>
            <p className="mt-4 text-slate-300">Thank you for choosing VEXORA. Your payment of {money(outcome.amount)} has been received successfully.</p>
            <div className="mt-5 rounded-xl bg-white/[.04] p-4 text-left text-sm"><p className="text-slate-500">Payment ID</p><p className="mt-1 break-all text-white">{outcome.paymentId}</p><p className="mt-4 text-slate-500">Project</p><p className="mt-1 text-white">{project.projectName}</p><p className="mt-4 text-slate-500">Remaining amount</p><p className="mt-1 text-white">{money(remaining)}</p></div>
            <a className="btn btn-primary mt-5 w-full" href={`/api/public/projects/${encodeURIComponent(token)}/receipts/${encodeURIComponent(outcome.paymentId)}`}><Download size={16} /> Download Payment Receipt</a>
          </div> : outcome?.type === 'failure' ? <div className="relative py-5 text-center">
            <TriangleAlert size={44} className="mx-auto text-amber-300" /><h2 className="mt-4 text-2xl font-bold text-white">Payment Unsuccessful</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">Your payment could not be completed. No project payment has been confirmed. Please try again.</p>
            {outcome.message && <p className="mt-2 text-xs text-amber-100/70">{outcome.message}</p>}
            <button className="btn btn-primary mt-6 w-full" onClick={() => setOutcome(null)}>Try Again</button>
            <a href="mailto:vexora1710@gmail.com" className="btn btn-ghost mt-3 w-full">Contact VEXORA</a>
          </div> : <div className="relative">
            <p className="eyebrow">{currentType ? `${currentType} PAYMENT` : 'PAYMENT SCHEDULE'}</p>
            <h2 className="mt-2 text-3xl font-bold text-white">{currentType ? money(dueAmount) : project.status === 'DEVELOPMENT' ? 'In development' : 'Project delivered'}</h2>
            {currentType ? <>
              <p className="mt-2 text-sm text-slate-400">{currentType === 'ADVANCE' ? 'Advance Payment' : 'Final Payment'} · {project.projectName}</p>
              <button onClick={payWithRazorpay} disabled={busy || !!pendingUpi} className="btn btn-primary mt-6 w-full disabled:cursor-wait disabled:opacity-60"><LockKeyhole size={16} />{busy ? 'Connecting to Razorpay…' : `PAY ${money(dueAmount)}`}</button>
              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck size={14} className="text-cyan" /> Secure payment powered by Razorpay</p>
              {pendingUpi && <p className="mt-3 text-center text-xs text-amber-100/80">A reported UPI payment is awaiting VEXORA verification.</p>}
              {project.upiId && <>
                <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[.2em] text-slate-600"><span className="h-px flex-1 bg-white/10" />OR PAY VIA UPI<span className="h-px flex-1 bg-white/10" /></div>
                <div className="rounded-xl border border-white/10 bg-ink/50 p-4">
                  <div className="flex items-center justify-between gap-3"><div><p className="text-xs text-slate-500">UPI ID</p><p className="mt-1 break-all text-sm font-semibold text-white">{project.upiId}</p></div><button type="button" onClick={copyUpi} aria-label="Copy UPI ID" title="Copy UPI ID" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-cyan hover:bg-white/5"><Copy size={16} /></button></div>
                  <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
                    {qrImage && <img src={qrImage} alt="UPI payment QR code" className="h-28 w-28 rounded-lg bg-white p-2" />}
                    <div className="w-full flex-1"><p className="text-xs leading-5 text-slate-400">VEXORA · Project Payment<br />Amount: <span className="text-white">{money(dueAmount)}</span></p><a href={upiUrl} className="btn btn-ghost mt-3 w-full">Pay via UPI <ExternalLink size={15} /></a></div>
                  </div>
                  <form className="mt-4 border-t border-white/10 pt-4" onSubmit={event => { event.preventDefault(); reportUpi() }}>
                    <label htmlFor="upi-reference" className="text-xs text-slate-400">After paying, enter your bank transfer reference for verification</label>
                    <div className="mt-2 flex gap-2"><input id="upi-reference" value={upiReference} onChange={event => setUpiReference(event.target.value)} className="input min-w-0" placeholder="UPI / bank reference" required minLength={6} maxLength={80} /><button className="btn btn-ghost shrink-0 px-4" disabled={busy || !!pendingUpi}>Submit</button></div>
                  </form>
                </div>
              </>}
            </> : <p className="mt-3 text-sm text-slate-400">{project.status === 'DEVELOPMENT' ? 'VEXORA will notify you when the final payment is due.' : 'All verified project payments are complete.'}</p>}
            <Alert error>{error}</Alert><Alert>{upiNotice}</Alert>
            {project.payments?.filter(payment => payment.status === 'SUCCESS').map(payment => <a key={payment.payment_id} className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400 hover:text-white" href={`/api/public/projects/${encodeURIComponent(token)}/receipts/${encodeURIComponent(payment.payment_id)}`}><span>Receipt · {payment.payment_type} · {payment.payment_id}</span><Download size={15} /></a>)}
          </div>}
        </Panel>
      </motion.div>
    </div>
    <footer className="mx-auto flex max-w-6xl items-center justify-between border-t border-white/5 px-5 pt-5 text-xs text-slate-600"><span>VEXORA · Project payment</span><span className="inline-flex items-center gap-1"><LockKeyhole size={12} /> Your payment is verified before confirmation</span></footer>
  </main>
}

function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState('All')
  const [form, setForm] = useState({ customerName: '', customerEmail: '', projectName: '', totalAmount: '', advancePercent: 50 })
  const [paymentLink, setPaymentLink] = useState('')
  const [busy, setBusy] = useState(false)
  const [reference, setReference] = useState({})

  async function load() { setData(await api('/api/admin/overview')) }
  useEffect(() => {
    api('/api/admin/session').then(() => { setAuthenticated(true); return load() }).catch(() => {}).finally(() => setChecking(false))
  }, [])

  async function login(event) {
    event.preventDefault(); setError(''); setBusy(true)
    try { await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) }); setAuthenticated(true); await load() }
    catch (reason) { setError(reason.message) }
    finally { setBusy(false) }
  }
  async function createProject(event) {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true)
    try {
      const result = await api('/api/admin/projects', { method: 'POST', body: JSON.stringify(form) })
      setPaymentLink(`${window.location.origin}${result.paymentPath}`)
      setNotice('Approved project and payment link created.')
      setForm({ customerName: '', customerEmail: '', projectName: '', totalAmount: '', advancePercent: 50 })
      await load()
    } catch (reason) { setError(reason.message) }
    finally { setBusy(false) }
  }
  async function action(url, body = {}) {
    setError(''); setNotice(''); setBusy(true)
    try { const result = await api(url, { method: 'POST', body: JSON.stringify(body) }); if (result.paymentPath) setPaymentLink(`${window.location.origin}${result.paymentPath}`); await load(); setNotice('Payment dashboard updated.') }
    catch (reason) { setError(reason.message) }
    finally { setBusy(false) }
  }
  async function logout() {
    await api('/api/admin/logout', { method: 'POST' }).catch(() => {})
    setAuthenticated(false); setData(null)
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(paymentLink); setNotice('Payment link copied.') }
    catch { setError('Clipboard access is unavailable. Select and copy the link.') }
  }

  if (checking) return <main className="min-h-screen"><Header label="ADMIN" /><div className="mx-auto mt-24 max-w-xl text-center text-slate-400">Checking admin session…</div></main>
  if (!authenticated) return <main className="payment-shell min-h-screen"><Header label="ADMIN ACCESS" /><div className="mx-auto max-w-md px-5 pt-16"><Panel className="p-8"><span className="grid h-12 w-12 place-items-center rounded-full border border-cyan/20 bg-cyan/10 text-cyan"><KeyRound /></span><p className="eyebrow mt-6">VEXORA · INTERNAL</p><h1 className="mt-2 text-3xl font-bold text-white">Admin sign in</h1><form className="mt-6" onSubmit={login}><label className="text-sm text-slate-400" htmlFor="admin-password">Admin password</label><input className="input mt-2" id="admin-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /><button className="btn btn-primary mt-4 w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form><Alert error>{error}</Alert></Panel></div></main>

  const totals = data?.totals || {}
  const filters = ['All', 'Pending', 'Successful', 'Failed', 'Advance', 'Final']
  const rows = (data?.payments || []).filter(payment => filter === 'All' || (filter === 'Pending' && payment.status === 'PENDING') || (filter === 'Successful' && payment.status === 'SUCCESS') || (filter === 'Failed' && payment.status === 'FAILED') || (filter === 'Advance' && payment.payment_type === 'ADVANCE') || (filter === 'Final' && payment.payment_type === 'FINAL'))
  return <main className="payment-shell min-h-screen pb-16">
    <Header label="PAYMENT ADMIN" />
    <div className="mx-auto max-w-6xl px-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6"><div><p className="eyebrow">VEXORA · FINANCE</p><h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Payment dashboard</h1></div><button className="btn btn-ghost" onClick={logout}><LogOut size={16} /> Sign out</button></div>
      <Alert error>{error}</Alert><Alert>{notice}</Alert>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Total Projects', totals.projects || 0], ['Total Revenue', money(totals.revenuePaise)], ['Pending Payments', totals.pending || 0], ['Advance Payments', money(totals.advancePaise)], ['Final Payments', money(totals.finalPaise)]
        ].map(([label, value]) => <Panel key={label} className="p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p><p className="mt-2 font-display text-lg font-bold text-white">{value}</p></Panel>)}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[.78fr_1.22fr]">
        <Panel className="h-fit p-5 sm:p-6"><div className="flex items-center gap-2"><Plus size={17} className="text-cyan" /><h2 className="text-lg font-semibold text-white">Approve a project</h2></div><p className="mt-1 text-xs text-slate-500">Create a payment record after quotation approval.</p>
          <form className="mt-5 space-y-3" onSubmit={createProject}>
            <input className="input" placeholder="Customer name" aria-label="Customer name" value={form.customerName} onChange={event => setForm({ ...form, customerName: event.target.value })} required />
            <input className="input" type="email" placeholder="Customer email" aria-label="Customer email" value={form.customerEmail} onChange={event => setForm({ ...form, customerEmail: event.target.value })} required />
            <input className="input" placeholder="Project name" aria-label="Project name" value={form.projectName} onChange={event => setForm({ ...form, projectName: event.target.value })} required />
            <div className="grid grid-cols-[1fr_130px] gap-3"><label className="text-xs text-slate-500">Total cost (₹)<input className="input mt-1" type="number" min="1" step="0.01" value={form.totalAmount} onChange={event => setForm({ ...form, totalAmount: event.target.value })} required /></label><label className="text-xs text-slate-500">Advance %<input className="input mt-1" type="number" min="1" max="99" value={form.advancePercent} onChange={event => setForm({ ...form, advancePercent: event.target.value })} required /></label></div>
            <button className="btn btn-primary w-full" disabled={busy}>Create project & payment link</button>
          </form>
          {paymentLink && <div className="mt-4 rounded-xl border border-cyan/20 bg-cyan/5 p-3"><p className="text-xs text-cyan">Private customer payment link</p><p className="mt-1 break-all text-xs text-slate-300">{paymentLink}</p><button className="btn btn-ghost mt-2 w-full" onClick={copyLink}><Copy size={15} /> Copy link</button></div>}
        </Panel>
        <Panel className="overflow-hidden"><div className="border-b border-white/10 p-5"><h2 className="text-lg font-semibold text-white">Projects</h2><p className="mt-1 text-xs text-slate-500">Issue links, move completed projects to final payment, and reconcile UPI references.</p></div>
          <div className="divide-y divide-white/5">{data?.projects?.length ? data.projects.map(project => {
            const expectedAdvance = Math.round(project.totalPaise * project.advancePercent / 100)
            const nextAmount = project.status === 'ADVANCE_DUE' ? expectedAdvance : project.totalPaise - expectedAdvance
            return <div className="p-5" key={project.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-white">{project.project_name}</h3><p className="mt-1 text-xs text-slate-500">{project.customer_name} · {project.customer_email}</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] tracking-wider text-cyan">{project.status.replaceAll('_', ' ')}</span></div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm"><span className="text-slate-400">Total <b className="text-white">{money(project.totalPaise)}</b> · {project.advancePercent}/{100 - project.advancePercent} split</span><span className="flex flex-wrap gap-2">
                <button className="btn btn-ghost min-h-9 px-3 py-2 text-xs" disabled={busy} onClick={() => action(`/api/admin/projects/${project.id}/payment-link`)}><RefreshCw size={14} /> New payment link</button>
                {project.status === 'DEVELOPMENT' && <><input aria-label={`Delivery URL for ${project.project_name}`} className="input min-h-9 max-w-56 px-3 py-2 text-xs" placeholder="Final delivery URL (optional)" value={project.delivery_url || ''} onChange={event => setData({ ...data, projects: data.projects.map(item => item.id === project.id ? { ...item, delivery_url: event.target.value } : item) })} /><button className="btn btn-primary min-h-9 px-3 py-2 text-xs" disabled={busy} onClick={() => action(`/api/admin/projects/${project.id}/final-due`, { deliveryUrl: project.delivery_url || '' })}>Final payment due · {money(nextAmount)}</button></>}
              </span></div>
              {data.payments.filter(payment => payment.project_id === project.id && payment.provider === 'UPI' && payment.status === 'PENDING').map(payment => <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200/10 bg-amber-100/5 p-3" key={payment.id}><p className="text-xs text-amber-100">UPI reference: {payment.external_reference} · {money(payment.amountPaise)} · {payment.payment_type}</p><span className="flex gap-2"><button className="btn btn-ghost min-h-9 px-3 py-2 text-xs" disabled={busy} onClick={() => action(`/api/admin/projects/${project.id}/upi-payment`, { reference: payment.external_reference })}>Confirm bank receipt</button><button className="btn btn-ghost min-h-9 px-3 py-2 text-xs" disabled={busy} onClick={() => action(`/api/admin/projects/${project.id}/upi-reject`, { reference: payment.external_reference })}>Reject report</button></span></div>)}
            </div>
          }) : <p className="p-6 text-sm text-slate-500">No approved projects yet.</p>}</div>
        </Panel>
      </div>
      <Panel className="mt-8 overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-5"><div><h2 className="text-lg font-semibold text-white">Payments</h2><p className="mt-1 text-xs text-slate-500">Verified payment activity across projects.</p></div><div className="flex max-w-full gap-1 overflow-x-auto">{filters.map(item => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-2 text-xs transition ${filter === item ? 'bg-cyan text-ink' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>{item}</button>)}</div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-xs"><thead className="text-[10px] uppercase tracking-wider text-slate-500"><tr>{['Customer', 'Project', 'Amount', 'Type', 'Status', 'Payment ID / Reference', 'Date'].map(label => <th className="px-4 py-3 font-medium" key={label}>{label}</th>)}</tr></thead><tbody className="divide-y divide-white/5">{rows.map(payment => <tr key={payment.id} className="text-slate-300"><td className="px-4 py-3">{payment.customer_name}<span className="block text-slate-600">{payment.customer_email}</span></td><td className="px-4 py-3">{payment.project_name}</td><td className="px-4 py-3">{money(payment.amountPaise)}</td><td className="px-4 py-3">{payment.payment_type}</td><td className="px-4 py-3">{payment.status}</td><td className="max-w-48 break-all px-4 py-3">{payment.payment_id || payment.external_reference || payment.order_id || '—'}</td><td className="px-4 py-3">{date(payment.created_at)}</td></tr>)}</tbody></table>{!rows.length && <p className="p-6 text-sm text-slate-500">No payments match this filter.</p>}</div>
      </Panel>
      <p className="mt-5 text-center text-xs text-slate-600">UPI reports stay pending until you verify the transfer with your bank.</p>
    </div>
  </main>
}
