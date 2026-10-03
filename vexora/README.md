# VEXORA Website
React + Vite + Tailwind + Framer Motion + React Three Fiber, with a Node/Express API for enquiries.

## Run locally
1. Run these commands from the `vexora/` directory: `npm install`.
2. `cp .env.example .env`  (Windows PowerShell: `copy .env.example .env`)
3. `npm run dev`  → site at http://localhost:5173, API at http://localhost:5000

Project enquiries use SMTP when configured, or Resend with `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. Without either mail provider, local submissions are written to `server/submissions.jsonl`; Vercel requires a configured mail provider because its filesystem is ephemeral.

## Production
`npm run build` then `npm start` (Express serves `dist/` and the API on one port). Configure the platform's HTTPS proxy correctly.

The Starter and Business pricing buttons open a UPI payment dialog with the selected plan price, the QR image in `public/payment-qr.png`, and a UPI-app payment link. After paying, customers can submit their name, email, optional phone and UPI ID, and amount using the payment report form. Reports are emailed to `MAIL_TO` (defaults to `vexora1710@gmail.com`) when SMTP or Resend is configured; local development saves reports to `server/submissions.jsonl` if email is not configured. Set `SMTP_PASS` to a Gmail App Password, or configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL`, in the private `.env` file.

UPI transfers do not notify this website or expose payer details automatically. A submitted report is not proof of payment: verify the transfer and amount against the bank/UPI statement before treating it as paid. Plan prices are starting prices; confirm the final project scope and amount before paying.

## Exact local commands (Windows PowerShell)
From the repository root:

```powershell
cd .\vexora
npm install
notepad .env
npm run dev
```

`npm run dev` starts Vite at http://localhost:5173 and the API at http://localhost:5000. To create a production build and serve it locally, run:

```powershell
npm run build
npm start
```
