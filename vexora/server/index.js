import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import nodemailer from 'nodemailer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { installPaymentRoutes } from './payments.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const { PORT = 5000, CLIENT_ORIGIN = 'http://localhost:5173', MAIL_TO = 'vexora1710@gmail.com', SMTP_HOST, SMTP_PORT = 465, SMTP_USER, SMTP_PASS } = process.env
const app = express()
app.set('trust proxy', 1)
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: CLIENT_ORIGIN.split(',') }))
app.use(express.json({ limit: '20kb' }))
app.use('/api/admin/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, skipSuccessfulRequests: true, standardHeaders: true, legacyHeaders: false }))
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests. Please try again later.' } }))

const looksLikePlaceholder = value => typeof value !== 'string' || !value.trim() || /your-|example|placeholder|replace/i.test(value)
const hasRealSmtpConfig = !looksLikePlaceholder(SMTP_HOST) && !looksLikePlaceholder(SMTP_USER) && !looksLikePlaceholder(SMTP_PASS)
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
    const text = fields.map(k => `${k}: ${d[k] || '-'}`).join('\n')
    const html = `<h2>${kind === 'project' ? 'New project request' : 'New contact message'}</h2>` + fields.map(k => `<p><b>${k}:</b> ${esc(d[k] || '-')}</p>`).join('')
    try {
      if (transporter) {
        await transporter.sendMail({ from: `"VEXORA Website" <${SMTP_USER}>`, to: MAIL_TO, replyTo: d.email, subject: subjectOf(d), text, html })
      } else {
        if (!process.env.VERCEL) {
          saveSubmission(kind, d)
          console.warn('[VEXORA] SMTP not configured — submission saved to server/submissions.jsonl')
        } else {
          console.warn('[VEXORA] SMTP not configured — submission could not be persisted on Vercel')
        }
        return res.status(503).json({ error: 'Email delivery is not configured. Please try again later.' })
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
app.get('/api/health', (_, res) => res.json({ ok: true }))
installPaymentRoutes(app)

const dist = path.join(__dirname, '../dist')
if (fs.existsSync(dist)) { app.use(express.static(dist)); app.get('*', (_, res) => res.sendFile(path.join(dist, 'index.html'))) }
if (!process.env.VERCEL) app.listen(PORT, () => console.log(`VEXORA API on http://localhost:${PORT}${transporter ? '' : ' (SMTP not configured: dev mode)'}`))

export default app
