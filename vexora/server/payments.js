import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import PDFDocument from 'pdfkit'
import { Pool } from 'pg'

const { DATABASE_URL, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, VEXORA_UPI_ID, RESEND_API_KEY, RESEND_FROM_EMAIL, VEXORA_EMAIL = 'vexora1710@gmail.com', ADMIN_PASSWORD, ADMIN_SESSION_SECRET, CLIENT_ORIGIN = 'http://localhost:5173' } = process.env
const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: true } : undefined }) : null
const rupees = paise => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(paise / 100)
const hash = value => createHash('sha256').update(value).digest('hex')
const clean = (value, max = 180) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max)
const adminConfigured = () => Boolean(ADMIN_PASSWORD && ADMIN_PASSWORD.length >= 16 && ADMIN_SESSION_SECRET && ADMIN_SESSION_SECRET.length >= 32)
const razorpayConfigured = () => Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && (process.env.NODE_ENV === 'production' || RAZORPAY_KEY_ID.startsWith('rzp_test_')))
const same = (left, right) => {
  const a = Buffer.from(String(left ?? ''))
  const b = Buffer.from(String(right ?? ''))
  return a.length === b.length && timingSafeEqual(a, b)
}
const dbReady = pool?.query(`
  CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY,
    access_token_hash CHAR(64) NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    project_name TEXT NOT NULL,
    total_paise INTEGER NOT NULL CHECK (total_paise > 0),
    advance_percent INTEGER NOT NULL CHECK (advance_percent BETWEEN 1 AND 99),
    status TEXT NOT NULL CHECK (status IN ('ADVANCE_DUE', 'DEVELOPMENT', 'FINAL_DUE', 'DELIVERED')),
    delivery_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    payment_id TEXT UNIQUE,
    order_id TEXT UNIQUE,
    external_reference TEXT,
    project_id UUID NOT NULL REFERENCES projects(id),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
    currency CHAR(3) NOT NULL CHECK (currency = 'INR'),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('ADVANCE', 'FINAL')),
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    provider TEXT NOT NULL CHECK (provider IN ('RAZORPAY', 'UPI')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ
  );
  CREATE INDEX IF NOT EXISTS payments_project_idx ON payments(project_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status, payment_type);
  ALTER TABLE payments ADD COLUMN IF NOT EXISTS external_reference TEXT;
`).then(() => true).catch(error => {
  console.error('[VEXORA] Payment database initialization failed:', error.message)
  return false
})

function requireDatabase(req, res, next) {
  if (!pool) return res.status(503).json({ error: 'Payments are not configured. Set DATABASE_URL before accepting payments.' })
  return dbReady.then(ready => ready ? next() : res.status(503).json({ error: 'Payment services are temporarily unavailable.' }))
}

const parseCookie = (header, name) => header?.split(';').map(x => x.trim()).find(x => x.startsWith(`${name}=`))?.slice(name.length + 1)
const sessionSignature = expires => createHmac('sha256', ADMIN_SESSION_SECRET || '').update(expires).digest('hex')
function isAdmin(req) {
  if (!adminConfigured()) return false
  const value = parseCookie(req.headers.cookie, 'vexora_admin')
  if (!value) return false
  const [expires, signature] = value.split('.')
  return Number(expires) > Date.now() && same(signature, sessionSignature(expires))
}
function requireAdmin(req, res, next) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Admin authentication required.' })
  next()
}
function setAdminCookie(req, res, value, maxAge) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''
  res.setHeader('Set-Cookie', `vexora_admin=${value}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=${maxAge}${secure}`)
}

async function razorpayRequest(path, options = {}) {
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...options,
    headers: { Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`, 'Content-Type': 'application/json', ...options.headers }
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error?.description || 'Razorpay request failed.')
  return data
}

async function sendPaymentEmails(payment, project) {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) return
  const date = new Date(payment.verified_at || Date.now()).toISOString()
  const text = `Customer: ${payment.customer_name}\nProject: ${project.project_name}\nPayment Type: ${payment.payment_type}\nAmount: ${rupees(payment.amount_paise)}\nPayment ID: ${payment.payment_id}\nDate: ${date}\nStatus: PAID`
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [payment.customer_email, VEXORA_EMAIL],
      subject: 'VEXORA — Payment Received',
      text
    })
  })
  if (!response.ok) throw new Error(`Resend email failed with status ${response.status}`)
}

function expectedPayment(project) {
  const advance = Math.round(project.total_paise * project.advance_percent / 100)
  if (project.status === 'ADVANCE_DUE') return { type: 'ADVANCE', amount: advance }
  if (project.status === 'FINAL_DUE') return { type: 'FINAL', amount: project.total_paise - advance }
  return null
}

async function publicProject(token) {
  const result = await pool.query('SELECT * FROM projects WHERE access_token_hash = $1', [hash(token)])
  if (!result.rowCount) return null
  const project = result.rows[0]
  const payments = await pool.query(`SELECT payment_id, payment_type, amount_paise, currency, status, provider, created_at, verified_at
    FROM payments WHERE project_id = $1 ORDER BY created_at`, [project.id])
  const advance = Math.round(project.total_paise * project.advance_percent / 100)
  return {
    id: project.id,
    customerName: project.customer_name,
    projectName: project.project_name,
    totalPaise: project.total_paise,
    advancePaise: advance,
    finalPaise: project.total_paise - advance,
    advancePercent: project.advance_percent,
    status: project.status,
    deliveryUrl: project.status === 'DELIVERED' ? project.delivery_url : null,
    upiId: VEXORA_UPI_ID || null,
    payments: payments.rows.map(row => ({ ...row, amountPaise: row.amount_paise, createdAt: row.created_at, verifiedAt: row.verified_at }))
  }
}

export function installPaymentRoutes(app) {
  app.post('/api/admin/login', (req, res) => {
    if (!adminConfigured()) return res.status(503).json({ error: 'Set an admin password of at least 16 characters and a session secret of at least 32 characters.' })
    if (!same(req.body?.password, ADMIN_PASSWORD)) return res.status(401).json({ error: 'Invalid admin password.' })
    const expires = String(Date.now() + 8 * 60 * 60 * 1000)
    setAdminCookie(req, res, `${expires}.${sessionSignature(expires)}`, 8 * 60 * 60)
    res.json({ ok: true })
  })
  app.post('/api/admin/logout', (req, res) => {
    setAdminCookie(req, res, '', 0)
    res.json({ ok: true })
  })
  app.get('/api/admin/session', requireAdmin, (_, res) => res.json({ authenticated: true }))

  app.get('/api/admin/overview', requireAdmin, requireDatabase, async (_, res) => {
    try {
      const [projects, payments, totals] = await Promise.all([
        pool.query('SELECT id, customer_name, customer_email, project_name, total_paise, advance_percent, status, delivery_url, created_at FROM projects ORDER BY created_at DESC'),
        pool.query(`SELECT p.id, p.payment_id, p.order_id, p.external_reference, p.project_id, p.customer_name, p.customer_email, p.amount_paise, p.payment_type, p.status, p.provider, p.created_at, pr.project_name
          FROM payments p JOIN projects pr ON pr.id = p.project_id ORDER BY p.created_at DESC`),
        pool.query(`SELECT (SELECT COUNT(*)::int FROM projects) AS projects,
          COALESCE(SUM(amount_paise) FILTER (WHERE status = 'SUCCESS'), 0)::int AS revenue_paise,
          COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending,
          COALESCE(SUM(amount_paise) FILTER (WHERE status = 'SUCCESS' AND payment_type = 'ADVANCE'), 0)::int AS advance_paise,
          COALESCE(SUM(amount_paise) FILTER (WHERE status = 'SUCCESS' AND payment_type = 'FINAL'), 0)::int AS final_paise
          FROM payments`)
      ])
      res.json({
        projects: projects.rows.map(row => ({ ...row, totalPaise: row.total_paise, advancePercent: row.advance_percent })),
        payments: payments.rows.map(row => ({ ...row, amountPaise: row.amount_paise })),
        totals: { ...totals.rows[0], revenuePaise: totals.rows[0].revenue_paise, advancePaise: totals.rows[0].advance_paise, finalPaise: totals.rows[0].final_paise }
      })
    } catch (error) {
      console.error('[VEXORA] Admin overview failed:', error.message)
      res.status(500).json({ error: 'Could not load the payment dashboard.' })
    }
  })

  app.post('/api/admin/projects', requireAdmin, requireDatabase, async (req, res) => {
    const customerName = clean(req.body?.customerName)
    const customerEmail = clean(req.body?.customerEmail, 254).toLowerCase()
    const projectName = clean(req.body?.projectName)
    const amount = Number(req.body?.totalAmount)
    const advancePercent = Number(req.body?.advancePercent ?? 50)
    const totalPaise = Math.round(amount * 100)
    if (!customerName || !/^\S+@\S+\.\S+$/.test(customerEmail) || !projectName || !Number.isFinite(amount) || totalPaise < 100 || totalPaise > 100000000 || !Number.isInteger(advancePercent) || advancePercent < 1 || advancePercent > 99) {
      return res.status(400).json({ error: 'Enter a valid customer, project, total (₹1 to ₹10,00,000), and split percentage (1–99).' })
    }
    const accessToken = randomBytes(32).toString('base64url')
    const id = randomUUID()
    try {
      await pool.query(`INSERT INTO projects (id, access_token_hash, customer_name, customer_email, project_name, total_paise, advance_percent, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'ADVANCE_DUE')`, [id, hash(accessToken), customerName, customerEmail, projectName, totalPaise, advancePercent])
      res.status(201).json({ id, paymentPath: `/pay/${accessToken}` })
    } catch (error) {
      console.error('[VEXORA] Project creation failed:', error.message)
      res.status(500).json({ error: 'Could not create the project payment record.' })
    }
  })

  app.post('/api/admin/projects/:id/final-due', requireAdmin, requireDatabase, async (req, res) => {
    const deliveryUrl = clean(req.body?.deliveryUrl, 1000)
    if (deliveryUrl && (!/^https:\/\//i.test(deliveryUrl) || !URL.canParse(deliveryUrl))) return res.status(400).json({ error: 'Delivery links must use HTTPS.' })
    try {
      const result = await pool.query(`UPDATE projects SET status = 'FINAL_DUE', delivery_url = $2
        WHERE id = $1 AND status = 'DEVELOPMENT'`, [req.params.id, deliveryUrl || null])
      if (!result.rowCount) return res.status(409).json({ error: 'Only projects in development can be moved to final payment.' })
      res.json({ ok: true })
    } catch (error) {
      res.status(500).json({ error: 'Could not update project status.' })
    }
  })

  app.post('/api/admin/projects/:id/upi-payment', requireAdmin, requireDatabase, async (req, res) => {
    const reference = clean(req.body?.reference, 80)
    if (!VEXORA_UPI_ID || !reference) return res.status(400).json({ error: 'Configure the UPI ID and enter a verified bank reference.' })
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const projectResult = await client.query('SELECT * FROM projects WHERE id = $1 FOR UPDATE', [req.params.id])
      const project = projectResult.rows[0]
      const expected = project && expectedPayment(project)
      if (!expected) {
        await client.query('ROLLBACK')
        return res.status(409).json({ error: 'This project is not awaiting payment.' })
      }
      const pending = await client.query(`SELECT * FROM payments WHERE project_id = $1 AND payment_type = $2 AND provider = 'UPI' AND status = 'PENDING' AND external_reference = $3 FOR UPDATE`, [project.id, expected.type, reference])
      if (!pending.rowCount) {
        await client.query('ROLLBACK')
        return res.status(409).json({ error: 'No matching pending UPI report was found for this payment stage.' })
      }
      const inserted = await client.query(`UPDATE payments SET payment_id = $2, status = 'SUCCESS', verified_at = NOW()
        WHERE id = $1 RETURNING *`, [pending.rows[0].id, `UPI-${reference}`])
      const nextStatus = expected.type === 'ADVANCE' ? 'DEVELOPMENT' : 'DELIVERED'
      await client.query('UPDATE projects SET status = $2 WHERE id = $1', [project.id, nextStatus])
      await client.query('COMMIT')
      sendPaymentEmails(inserted.rows[0], project).catch(error => console.error('[VEXORA] Payment email failed:', error.message))
      res.json({ ok: true })
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {})
      console.error('[VEXORA] UPI payment record failed:', error.message)
      res.status(500).json({ error: 'Could not record the verified UPI payment.' })
    } finally {
      client.release()
    }
  })

  app.post('/api/admin/projects/:id/upi-reject', requireAdmin, requireDatabase, async (req, res) => {
    const reference = clean(req.body?.reference, 80)
    if (!reference) return res.status(400).json({ error: 'A bank transfer reference is required.' })
    try {
      const result = await pool.query(`UPDATE payments SET status = 'FAILED' WHERE project_id = $1 AND provider = 'UPI' AND status = 'PENDING' AND external_reference = $2 RETURNING id`, [req.params.id, reference])
      if (!result.rowCount) return res.status(404).json({ error: 'Pending UPI report not found.' })
      res.json({ ok: true })
    } catch (error) {
      res.status(500).json({ error: 'Could not reject the UPI report.' })
    }
  })

  app.post('/api/public/projects/:token/upi-notice', requireDatabase, async (req, res) => {
    if (!VEXORA_UPI_ID) return res.status(503).json({ error: 'Direct UPI payments are not configured.' })
    const reference = clean(req.body?.reference, 80)
    if (!/^[a-zA-Z0-9_-]{6,80}$/.test(reference)) return res.status(400).json({ error: 'Enter the bank transfer reference (6–80 letters or numbers).' })
    try {
      const projectResult = await pool.query('SELECT * FROM projects WHERE access_token_hash = $1', [hash(req.params.token)])
      const project = projectResult.rows[0]
      const expected = project && expectedPayment(project)
      if (!expected) return res.status(409).json({ error: 'No payment is currently due for this project.' })
      const existing = await pool.query(`SELECT id FROM payments WHERE project_id = $1 AND payment_type = $2 AND provider = 'UPI' AND status = 'PENDING'`, [project.id, expected.type])
      if (existing.rowCount) return res.status(409).json({ error: 'A UPI transfer is already awaiting verification for this stage.' })
      await pool.query(`INSERT INTO payments (project_id, customer_name, customer_email, amount_paise, currency, payment_type, status, provider, external_reference)
        VALUES ($1,$2,$3,$4,'INR',$5,'PENDING','UPI',$6)`, [project.id, project.customer_name, project.customer_email, expected.amount, expected.type, reference])
      if (RESEND_API_KEY && RESEND_FROM_EMAIL) {
        fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: RESEND_FROM_EMAIL, to: [VEXORA_EMAIL], subject: 'VEXORA — UPI transfer reported', text: `Project: ${project.project_name}\nCustomer: ${project.customer_name}\nAmount: ${rupees(expected.amount)}\nPayment Type: ${expected.type}\nBank Reference: ${reference}\nStatus: PENDING — verify with bank before confirming.` }) }).catch(error => console.error('[VEXORA] UPI notice email failed:', error.message))
      }
      res.status(202).json({ ok: true, message: 'Transfer reported. VEXORA will verify it before updating your payment status.' })
    } catch (error) {
      console.error('[VEXORA] UPI payment report failed:', error.message)
      res.status(500).json({ error: 'Could not submit the transfer reference.' })
    }
  })

  app.get('/api/public/projects/:token', requireDatabase, async (req, res) => {
    try {
      const project = await publicProject(req.params.token)
      if (!project) return res.status(404).json({ error: 'Payment link not found.' })
      res.json(project)
    } catch (error) {
      res.status(500).json({ error: 'Could not load this project.' })
    }
  })

  app.post('/api/public/projects/:token/order', requireDatabase, async (req, res) => {
    if (!razorpayConfigured()) return res.status(503).json({ error: 'Razorpay is not configured for this environment.' })
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const projectResult = await client.query('SELECT * FROM projects WHERE access_token_hash = $1 FOR UPDATE', [hash(req.params.token)])
      const project = projectResult.rows[0]
      const expected = project && expectedPayment(project)
      if (!expected) {
        await client.query('ROLLBACK')
        return res.status(409).json({ error: 'No payment is currently due for this project.' })
      }
      let paymentResult = await client.query(`SELECT * FROM payments WHERE project_id = $1 AND payment_type = $2 AND provider = 'RAZORPAY' AND status = 'PENDING' LIMIT 1`, [project.id, expected.type])
      let payment = paymentResult.rows[0]
      if (!payment) {
        const order = await razorpayRequest('/orders', { method: 'POST', body: JSON.stringify({ amount: expected.amount, currency: 'INR', receipt: `${project.id.slice(0, 20)}-${expected.type.toLowerCase()}`, notes: { projectId: project.id, paymentType: expected.type } }) })
        paymentResult = await client.query(`INSERT INTO payments (order_id, project_id, customer_name, customer_email, amount_paise, currency, payment_type, status, provider)
          VALUES ($1,$2,$3,$4,$5,'INR',$6,'PENDING','RAZORPAY') RETURNING *`, [order.id, project.id, project.customer_name, project.customer_email, expected.amount, expected.type])
        payment = paymentResult.rows[0]
      }
      await client.query('COMMIT')
      res.json({ keyId: RAZORPAY_KEY_ID, orderId: payment.order_id, amount: payment.amount_paise, currency: payment.currency, projectName: project.project_name, customerName: project.customer_name, customerEmail: project.customer_email, paymentType: payment.payment_type })
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {})
      console.error('[VEXORA] Razorpay order failed:', error.message)
      res.status(502).json({ error: 'Could not create a Razorpay order. Please try again.' })
    } finally {
      client.release()
    }
  })

  app.post('/api/public/projects/:token/verify', requireDatabase, async (req, res) => {
    if (!razorpayConfigured()) return res.status(503).json({ error: 'Razorpay is not configured for this environment.' })
    const orderId = clean(req.body?.razorpay_order_id, 100)
    const paymentId = clean(req.body?.razorpay_payment_id, 100)
    const signature = clean(req.body?.razorpay_signature, 200)
    if (!orderId || !paymentId || !signature) return res.status(400).json({ error: 'Incomplete Razorpay verification details.' })
    const expectedSignature = createHmac('sha256', RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex')
    if (!same(signature, expectedSignature)) return res.status(400).json({ error: 'Payment signature verification failed.' })
    try {
      const [projectResult, paymentResult] = await Promise.all([
        pool.query('SELECT * FROM projects WHERE access_token_hash = $1', [hash(req.params.token)]),
        pool.query('SELECT * FROM payments WHERE order_id = $1', [orderId])
      ])
      const project = projectResult.rows[0]
      const payment = paymentResult.rows[0]
      if (!project || !payment || payment.project_id !== project.id || payment.provider !== 'RAZORPAY') return res.status(400).json({ error: 'Order does not match this project.' })
      if (payment.status === 'SUCCESS' && payment.payment_id === paymentId) return res.json({ ok: true, project: await publicProject(req.params.token), paymentId })
      const providerPayment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`)
      if (providerPayment.order_id !== orderId || providerPayment.amount !== payment.amount_paise || providerPayment.currency !== 'INR' || providerPayment.status !== 'captured') {
        return res.status(400).json({ error: 'Razorpay has not confirmed the expected captured payment.' })
      }
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        const lockedProject = (await client.query('SELECT * FROM projects WHERE id = $1 FOR UPDATE', [project.id])).rows[0]
        const lockedPayment = (await client.query('SELECT * FROM payments WHERE order_id = $1 FOR UPDATE', [orderId])).rows[0]
        const due = expectedPayment(lockedProject)
        if (!due || due.type !== lockedPayment.payment_type || due.amount !== lockedPayment.amount_paise) {
          await client.query('ROLLBACK')
          return res.status(409).json({ error: 'Project payment status changed; contact VEXORA to reconcile this payment.' })
        }
        await client.query(`UPDATE payments SET payment_id = $2, status = 'SUCCESS', verified_at = NOW() WHERE order_id = $1 AND status = 'PENDING'`, [orderId, paymentId])
        await client.query('UPDATE projects SET status = $2 WHERE id = $1', [project.id, lockedPayment.payment_type === 'ADVANCE' ? 'DEVELOPMENT' : 'DELIVERED'])
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {})
        throw error
      } finally {
        client.release()
      }
      const verified = (await pool.query('SELECT * FROM payments WHERE order_id = $1', [orderId])).rows[0]
      sendPaymentEmails(verified, project).catch(error => console.error('[VEXORA] Payment email failed:', error.message))
      res.json({ ok: true, project: await publicProject(req.params.token), paymentId })
    } catch (error) {
      console.error('[VEXORA] Razorpay verification failed:', error.message)
      res.status(502).json({ error: 'Payment verification is temporarily unavailable. Do not retry a completed payment; contact VEXORA.' })
    }
  })

  app.post('/api/public/projects/:token/failure', requireDatabase, async (req, res) => {
    if (!razorpayConfigured()) return res.status(503).json({ error: 'Razorpay is not configured for this environment.' })
    const orderId = clean(req.body?.orderId, 100)
    const paymentId = clean(req.body?.paymentId, 100)
    if (!orderId || !paymentId) return res.status(400).json({ error: 'Incomplete failed-payment details.' })
    try {
      const [projectResult, paymentResult] = await Promise.all([
        pool.query('SELECT * FROM projects WHERE access_token_hash = $1', [hash(req.params.token)]),
        pool.query('SELECT * FROM payments WHERE order_id = $1', [orderId])
      ])
      const project = projectResult.rows[0]
      const payment = paymentResult.rows[0]
      if (!project || !payment || payment.project_id !== project.id || payment.provider !== 'RAZORPAY') return res.status(400).json({ error: 'Order does not match this project.' })
      const providerPayment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`)
      if (providerPayment.order_id !== orderId || providerPayment.amount !== payment.amount_paise || providerPayment.currency !== 'INR' || providerPayment.status !== 'failed') return res.status(400).json({ error: 'Razorpay has not confirmed this failed payment.' })
      await pool.query(`UPDATE payments SET payment_id = $2, status = 'FAILED' WHERE order_id = $1 AND status = 'PENDING'`, [orderId, paymentId])
      res.json({ ok: true })
    } catch (error) {
      console.error('[VEXORA] Failed payment reconciliation failed:', error.message)
      res.status(502).json({ error: 'Could not reconcile failed payment details.' })
    }
  })

  app.get('/api/public/projects/:token/receipts/:paymentId', requireDatabase, async (req, res) => {
    try {
      const result = await pool.query(`SELECT p.*, pr.project_name FROM payments p JOIN projects pr ON pr.id = p.project_id
        WHERE pr.access_token_hash = $1 AND p.payment_id = $2 AND p.status = 'SUCCESS' AND p.verified_at IS NOT NULL`, [hash(req.params.token), clean(req.params.paymentId, 100)])
      const payment = result.rows[0]
      if (!payment) return res.status(404).json({ error: 'Verified payment receipt not found.' })
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="VEXORA-receipt-${payment.payment_id.replace(/[^a-zA-Z0-9_-]/g, '')}.pdf"`)
      const doc = new PDFDocument({ size: 'A4', margin: 56 })
      doc.pipe(res)
      doc.fillColor('#06131d').fontSize(22).font('Helvetica-Bold').text('VEXORA')
      doc.moveDown(0.5).fillColor('#167b95').fontSize(18).text('Payment Receipt')
      doc.moveDown(1.5)
      const fields = [
        ['Customer Name', payment.customer_name], ['Customer Email', payment.customer_email], ['Project Name', payment.project_name],
        ['Payment Type', payment.payment_type === 'ADVANCE' ? 'Advance' : 'Final'], ['Amount Paid', rupees(payment.amount_paise)],
        ['Payment ID', payment.payment_id], ['Date', new Date(payment.verified_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })], ['Payment Status', 'PAID']
      ]
      for (const [label, value] of fields) {
        doc.fillColor('#667783').font('Helvetica').fontSize(10).text(label.toUpperCase())
        doc.fillColor('#071722').font('Helvetica-Bold').fontSize(13).text(value.replace(/^₹/, 'INR '))
        doc.moveDown(0.9)
      }
      doc.end()
    } catch (error) {
      console.error('[VEXORA] Receipt generation failed:', error.message)
      if (!res.headersSent) res.status(500).json({ error: 'Could not generate the receipt.' })
    }
  })

  app.post('/api/admin/projects/:id/payment-link', requireAdmin, requireDatabase, async (req, res) => {
    const accessToken = randomBytes(32).toString('base64url')
    try {
      const result = await pool.query('UPDATE projects SET access_token_hash = $2 WHERE id = $1 RETURNING id', [req.params.id, hash(accessToken)])
      if (!result.rowCount) return res.status(404).json({ error: 'Project not found.' })
      res.json({ paymentPath: `/pay/${accessToken}` })
    } catch (error) {
      res.status(500).json({ error: 'Could not issue a new payment link.' })
    }
  })
}
