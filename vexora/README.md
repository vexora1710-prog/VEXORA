# VEXORA Website
React + Vite + Tailwind + Framer Motion + React Three Fiber, with a Node/Express API for enquiries and project payments.

## Run locally
1. `npm install`
2. `cp .env.example .env`  (Windows PowerShell: `copy .env.example .env`)
3. `npm run dev`  → site at http://localhost:5173, API at http://localhost:5000

Project enquiries use SMTP when configured, or Resend with `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. Payment notifications use the same Resend settings. Without either mail provider, local submissions are written to `server/submissions.jsonl`; Vercel requires a configured mail provider because its filesystem is ephemeral.

## Payments
The payment API requires a persistent PostgreSQL database, Razorpay credentials, and an admin password. Until configured, payment routes return an unavailable response; no demo or simulated payment is used.

1. Create a PostgreSQL database and set `DATABASE_URL`. For providers requiring TLS, set `PGSSL=true`.
2. In Razorpay, use **Test Mode** credentials for development. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`; the secret is server-only.
3. Set `VEXORA_UPI_ID` only to VEXORA's real UPI ID. Leave it empty to hide direct UPI.
4. Set an `ADMIN_PASSWORD` of at least 16 characters and a random `ADMIN_SESSION_SECRET` of at least 32 characters before exposing `/admin`.
5. For payment emails, set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to a sender address verified by Resend. `VEXORA_EMAIL` receives admin notifications.
6. Start the app and visit `/admin`. Create a project only after approving its quotation, then share the generated private `/pay/<token>` link. Reissuing a link invalidates the previous token.

Razorpay orders are created on the server. A payment is recorded as paid only after the server validates the Razorpay signature and confirms the captured amount, currency, and order through Razorpay's API. UPI transfer reports stay pending until an authenticated admin verifies the bank reference. PostgreSQL tables are initialized by the API at startup.

The admin dashboard supports per-project advance percentages (50% by default), payment filters, manual UPI reconciliation, and moving development projects to final payment. Delivery links are not exposed until the final payment is verified. Verified payments have downloadable PDF receipts.

Production requires a persistent PostgreSQL service, HTTPS, `NODE_ENV=production`, production Razorpay credentials only after testing, and a Resend-verified sender domain. Keep `.env` private. The customer payment URL is a bearer link: share it only with that customer.

## Production
`npm run build` then `npm start` (Express serves `dist/` and the API on one port). Use a persistent database and configure the platform's HTTPS proxy correctly; payment records are never stored in local JSON files.
