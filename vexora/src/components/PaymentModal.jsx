import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Check, LockKeyhole, ScanLine, Smartphone, X } from 'lucide-react'

const UPI_ID = 'vishalvijay135-1@oksbi'
const EMPTY_REPORT = { name: '', email: '', phone: '', upiId: '', amount: '' }

export default function PaymentModal({ plan, onClose }) {
  const [report, setReport] = useState(EMPTY_REPORT)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!plan) {
      setReport(EMPTY_REPORT)
      setStatus('idle')
      setError('')
      return
    }
    setReport({ ...EMPTY_REPORT, amount: String(Number(plan.price.replace(/[^\d]/g, ''))) })
    setStatus('idle')
    setError('')
  }, [plan?.name])

  useEffect(() => {
    if (!plan) return
    const onKeyDown = event => event.key === 'Escape' && onClose()
    addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [plan, onClose])

  const amount = Number(plan?.price?.replace(/[^\d]/g, ''))
  const paymentUrl = plan && `upi://pay?${new URLSearchParams({
    pa: UPI_ID,
    pn: 'Vishal Vijay',
    am: amount.toFixed(2),
    cu: 'INR',
    tn: `VEXORA ${plan.name} plan`
  })}`

  const setField = key => event => setReport(current => ({ ...current, [key]: event.target.value }))

  async function submitPaymentReport(event) {
    event.preventDefault()
    setStatus('sending')
    setError('')
    try {
      const response = await fetch('/api/payment-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...report, plan: plan.name })
      })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || 'Could not submit payment details.')
      }
      setStatus('done')
    } catch (submissionError) {
      setStatus('idle')
      setError(submissionError.message)
    }
  }

  return <AnimatePresence>
    {plan && <motion.div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-[#020812]/80 p-4 backdrop-blur-xl"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div role="dialog" aria-modal="true" aria-labelledby="payment-title" onClick={event => event.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: .98 }}
        className="relative my-auto w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#071522] shadow-[0_30px_120px_-35px_rgba(61,190,255,.42)]">
        <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-cyan/10 blur-[90px]" />
        <button type="button" onClick={onClose} aria-label="Close payment dialog"
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>

        <div className="relative grid md:grid-cols-[1fr_1.05fr]">
          <div className="flex flex-col justify-center p-7 sm:p-10">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.2em] text-cyan">
              <LockKeyhole size={12} /> Secure UPI payment
            </span>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[.25em] text-slate-500">Selected plan</p>
            <h2 id="payment-title" className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{plan.name}</h2>
            <p className="mt-5 text-sm text-slate-400">Starting from</p>
            <p className="mt-1 bg-gradient-to-r from-cyan via-sky-200 to-white bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">{plan.price}</p>

            <div className="mt-7 space-y-3 text-sm text-slate-300">
              <p className="flex items-start gap-3"><Check size={17} className="mt-0.5 shrink-0 text-cyan" /> Scan with Google Pay or any UPI app</p>
              <p className="flex items-start gap-3"><Check size={17} className="mt-0.5 shrink-0 text-cyan" /> Confirm the recipient before approving</p>
            </div>

            <a href={paymentUrl} className="btn btn-primary mt-8 w-full">
              <Smartphone size={17} /> Pay {plan.price} in a UPI app <ArrowUpRight size={16} />
            </a>
            <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">
              On your phone, choose from the UPI apps installed on your device. On a computer, scan the QR code with any UPI app.
            </p>
            <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
              This is a starting price. Please confirm the final project scope and amount before paying.
            </p>
            <div className="my-6 h-px w-full bg-white/10" />
            {status === 'done' ? <div role="status" className="w-full rounded-2xl border border-cyan/20 bg-cyan/5 p-4 text-sm">
              <p className="font-semibold text-cyan">Payment details submitted</p>
              <p className="mt-2 leading-relaxed text-slate-300">We received your report. Your payment is not verified yet; VEXORA will check the transfer against its bank statement.</p>
            </div> : <form onSubmit={submitPaymentReport} className="w-full space-y-3" aria-label="Payment confirmation details">
              <h3 className="text-sm font-semibold text-white">Already paid? Send payment details</h3>
              <p className="text-xs leading-relaxed text-slate-400">Enter the details used in your UPI app so VEXORA can identify and verify the transfer.</p>
              <input className="input" required maxLength={100} placeholder="Payer name" aria-label="Payer name" autoComplete="name" value={report.name} onChange={setField('name')} />
              <input className="input" required type="email" maxLength={200} placeholder="Your email" aria-label="Your email" autoComplete="email" value={report.email} onChange={setField('email')} />
              <input className="input" type="tel" maxLength={30} placeholder="Phone number (optional)" aria-label="Phone number" autoComplete="tel" value={report.phone} onChange={setField('phone')} />
              <input className="input" maxLength={100} placeholder="Payer UPI ID (optional)" aria-label="Payer UPI ID" value={report.upiId} onChange={setField('upiId')} />
              <input className="input" required type="number" min="1" max="10000000" step="1" placeholder="Amount paid (INR)" aria-label="Amount paid in rupees" value={report.amount} onChange={setField('amount')} />
              {error && <p role="alert" className="text-sm leading-relaxed text-red-400">{error}</p>}
              <button type="submit" className="btn btn-primary w-full disabled:cursor-wait disabled:opacity-50" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending details…' : 'Submit payment details'}
              </button>
              <p className="text-center text-[11px] leading-relaxed text-slate-500">Submitting this form reports a payment; it does not confirm or automatically verify the transfer.</p>
            </form>}
          </div>

          <div className="flex flex-col items-center justify-center border-t border-white/10 bg-white/[0.025] p-6 sm:p-9 md:border-l md:border-t-0">
            {status === 'done' ? <>
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
                <ScanLine size={17} className="text-cyan" /> Scan to pay
              </div>
              <div className="w-full max-w-[290px] rounded-[1.6rem] bg-white p-3 shadow-[0_12px_55px_-20px_rgba(110,215,255,.65)]">
                <img src="/payment-qr.png" alt="Google Pay UPI QR code for VISHAL VIJAY" className="block h-auto w-full rounded-xl" />
              </div>
              <p className="mt-4 text-sm font-semibold text-white">VISHAL VIJAY</p>
              <p className="mt-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">{UPI_ID}</p>
              <p className="mt-4 text-center text-xs text-slate-500">Open your UPI app, scan this code and enter the amount shown above.</p>
            </> : <div className="max-w-xs text-center">
              <ScanLine size={28} className="mx-auto text-cyan/70" />
              <p className="mt-4 text-sm font-semibold text-white">Your QR code will appear here</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">Submit your payment details to reveal the QR code.</p>
            </div>}
          </div>
        </div>
      </motion.div>
    </motion.div>}
  </AnimatePresence>
}
