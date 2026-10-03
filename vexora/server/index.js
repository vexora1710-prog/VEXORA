import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import nodemailer from 'nodemailer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const { PORT = 5000, CLIENT_ORIGIN = 'http://localhost:5173', MAIL_TO = 'vexora1710@gmail.com', SMTP_HOST, SMTP_PORT = 465, SMTP_USER, SMTP_PASS, RESEND_API_KEY, RESEND_FROM_EMAIL } = process.env
const app = express()
app.set('trust proxy', 1)
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: CLIENT_ORIGIN.split(',') }))
app.use(express.json({ limit: '20kb' }))
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests. Please try again later.' } }))

const looksLikePlaceholder = value => typeof value !== 'string' || !value.trim() || /your-|example|placeholder|replace/i.test(value)
const hasRealSmtpConfig = !looksLikePlaceholder(SMTP_HOST) && !looksLikePlaceholder(SMTP_USER) && !looksLikePlaceholder(SMTP_PASS)
const hasRealResendConfig = !looksLikePlaceholder(RESEND_API_KEY) && !looksLikePlaceholder(RESEND_FROM_EMAIL)
const transporter = hasRealSmtpConfig
  ? nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } }) : null
const clean = (v, n = 2000) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n)
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const saveSubmission = (kind, d) => {
  const line = JSON.stringify({ kind, at: new Date().toISOString(), ...d }) + '\n'
  fs.appendFileSync(path.join(__dirname, 'submissions.jsonl'), line)
}

function handler(kind, fields, subjectOf) {
  return async (req, res) => {
    const d = Object.fromEntries(fields.map(k => [k, clean(req.body?.[k], k === 'requirements' || k === 'message' ? 4000 : 300)]))
    if (!d.name || !/^\S+@\S+\.\S+$/.test(d.email)) return res.status(400).json({ error: 'Please provide a valid name and email.' })
    if (kind === 'contact' && d.message.length < 10) return res.status(400).json({ error: 'Message is too short.' })
    if (kind === 'project' && d.requirements.length < 10) return res.status(400).json({ error: 'Please describe your requirements.' })
    if (kind === 'payment') {
      if (!['STARTER', 'BUSINESS'].includes(d.plan)) return res.status(400).json({ error: 'Please select a valid plan.' })
      if (!/^\d+(?:\.\d{1,2})?$/.test(d.amount) || Number(d.amount) <= 0 || Number(d.amount) > 10000000) {
        return res.status(400).json({ error: 'Please enter a valid payment amount in INR.' })
      }
    }
    const text = `${kind === 'payment' ? 'PAYMENT REPORT — NOT YET VERIFIED\n\n' : ''}${fields.map(k => `${k}: ${d[k] || '-'}`).join('\n')}`
    const heading = kind === 'project' ? 'New project request' : kind === 'payment' ? 'UPI payment reported — verification required' : 'New contact message'
    const html = `<h2>${heading}</h2>${kind === 'payment' ? '<p><strong>Reported only — verify the transfer and amount against the bank statement before confirming payment.</strong></p>' : ''}` + fields.map(k => `<p><b>${k}:</b> ${esc(d[k] || '-')}</p>`).join('')
    try {
      if (transporter) {
        await transporter.sendMail({ from: `"VEXORA Website" <${SMTP_USER}>`, to: MAIL_TO, replyTo: d.email, subject: subjectOf(d), text, html })
      } else if (hasRealResendConfig) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: RESEND_FROM_EMAIL, to: [MAIL_TO], reply_to: d.email, subject: subjectOf(d), text, html })
        })
        if (!response.ok) throw new Error(`Resend email failed with status ${response.status}`)
      } else {
        if (!process.env.VERCEL) {
          saveSubmission(kind, d)
          console.warn('[VEXORA] SMTP not configured — submission saved to server/submissions.jsonl')
        } else {
          console.warn('[VEXORA] SMTP not configured — submission could not be persisted on Vercel')
        }
        const message = kind === 'payment'
          ? process.env.VERCEL
            ? 'Email delivery is not configured, so this payment report could not be saved. Please contact VEXORA directly.'
            : 'Email delivery is not configured. The report was saved locally, but no email was sent.'
          : 'Email delivery is not configured. Please try again later.'
        return res.status(503).json({ error: message })
      }
      res.json({ ok: true })
    } catch (e) {
      console.error('[VEXORA] Mail delivery failed:', e)
      if (!process.env.VERCEL) {
        saveSubmission(kind, d)
        console.warn('[VEXORA] Submission saved to server/submissions.jsonl as fallback')
        res.status(502).json({ error: 'Your request was saved, but email delivery failed. Please try again later.' })
      } else {
        res.status(502).json({ error: 'Email delivery failed. Please try again later.' })
      }
    }
  }
}
app.post('/api/project-request', handler('project', ['name', 'email', 'phone', 'business', 'businessType', 'projectType', 'budget', 'requirements', 'reference'], d => `New project request: ${d.projectType || 'General'} — ${d.name}`))
app.post('/api/contact', handler('contact', ['name', 'email', 'phone', 'projectType', 'message'], d => `New message from ${d.name}`))
app.post('/api/payment-report', handler('payment', ['name', 'email', 'phone', 'upiId', 'plan', 'amount'], d => `UPI payment reported — ${d.name} — ${d.plan}`))
app.get('/api/health', (_, res) => res.json({ ok: true }))

const dist = path.join(__dirname, '../dist')
if (fs.existsSync(dist)) { app.use(express.static(dist)); app.get('*', (_, res) => res.sendFile(path.join(dist, 'index.html'))) }
if (!process.env.VERCEL) app.listen(PORT, () => console.log(`VEXORA API on http://localhost:${PORT}${transporter ? '' : ' (SMTP not configured: dev mode)'}`))

export default app
