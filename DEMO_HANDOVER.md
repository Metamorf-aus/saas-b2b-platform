# PG B2B Platform — Stakeholder Demo Handover

## Live URLs

| Service | URL |
|---------|-----|
| Storefront | https://saas-b2b-platform.netlify.app |
| Admin Panel | https://\<your-railway-backend-url\>/app |

> **Storefront password:** `precision-demo-2026`

---

## Admin Credentials

| User | Email | Password | Role |
|------|-------|----------|------|
| Billy (Primary Admin) | Billy@thepg.com.au | Precision3062 | Admin |
| Cory (Approver) | cory@thepg.com.au | Precision3062 | Admin |

---

## End-to-End Demo Script

### Setup (before the meeting)
1. Log in to the admin panel as **Billy** — confirm at least 1–2 products are visible in the catalogue.
2. Open the storefront in a second window / incognito tab — confirm the homepage loads and products are visible.
3. Have the admin panel open on the **Approvals** page and the **Warehouse** page in separate tabs.

---

### Scene 1 — Customer Browsing & Cart (≈ 3 min)

1. Open the storefront: `https://saas-b2b-platform.netlify.app`
2. Browse the product catalogue — show the **AUD pricing** and **Excl. GST** labelling.
3. Add 2–3 products to the cart.
4. Proceed to checkout.

---

### Scene 2 — B2B Checkout with Cost Centre Approval (≈ 4 min)

1. At checkout, complete the **Shipping** step (use any address).
2. In the **Department** section:
   - Show the **Cost Centre** dropdown.
   - Select **CC-101 — Executive & Administration** — notice the green badge: *"This cost centre does not require approval."*
   - Then switch to **CC-430 — Procurement & Warehouse** — notice the amber badge: *"This cost centre requires manager approval before the order proceeds."*
   - Leave it on CC-430 to demonstrate the approval flow.
3. Complete payment (use a test card if Stripe test mode is enabled).
4. The **Order Confirmation** page shows the cost centre selected.

> **Key talking point:** In the full build, 197 cost centres will be pulled from the ERP. Certain cost centres (e.g. high-spend departments) can be flagged to require dual-sign-off. This is configurable without code changes.

---

### Scene 3 — Admin Approval Queue (≈ 4 min)

1. Switch to the admin panel tab → **Approvals** page.
2. Show the new order in the queue with:
   - Company / department name
   - **Cost Centre** column (CC-430)
   - Status: **Pending**
3. Log in as **Cory** (`cory@thepg.com.au`) in a second admin tab — show that Cory can also see the pending order.
4. As Cory, click the **✓ Approve** button → confirm the prompt.
5. Status updates to **Approved** in real time.

> **Key talking point:** The full build supports a configurable approver hierarchy — team leader → department manager → finance. Each threshold (e.g. orders over $5,000) can trigger the next level.

---

### Scene 4 — Warehouse Pick Flow (≈ 3 min)

1. Navigate to the **Warehouse** page in the admin panel.
2. Show the approved order sitting in the **Pending Pick** column.
3. Click **Start Picking** → order moves to **Picking**.
4. Click **Mark Packed** → order moves to **Packed**.
5. Click **Dispatch** → order moves to **Dispatched**.

> **Key talking point:** This is a simplified simulation. The full build connects to the warehouse PWA where pickers scan barcodes on a handheld device. Each status change is timestamped and visible to the ordering team in real time.

---

### Scene 5 — Summary & Phase 1 Roadmap (≈ 5 min)

Walk through the proposal phases:

| Phase | Scope | Timeline |
|-------|-------|----------|
| 0 (this demo) | Core B2B ordering, cost centre approval, simulated WMS | Complete |
| 1 | Azure hosting, 3,000 SKUs, 197 cost centres, 550 users | Months 1–3 |
| 2 | Warehouse PWA (barcode scanning), ERP integration | Months 4–6 |
| 3 | Analytics dashboard, reorder automation, supplier portal | Months 7–9 |

---

## Cost Centre Reference

| Code | Department | Approval Required |
|------|-----------|-------------------|
| CC-101 | Executive & Administration | No |
| CC-210 | Sales & Business Development | No |
| CC-320 | Marketing & Communications | No |
| CC-430 | Procurement & Warehouse | Yes |
| CC-540 | Finance & Compliance | Yes |

---

## Technical Stack (for technical stakeholders)

- **Backend:** Medusa v2 (Node.js) — hosted on Railway
- **Storefront:** Next.js 14 — hosted on Netlify
- **Database:** PostgreSQL on Railway
- **Full build target:** Azure (App Service + Azure Database for PostgreSQL)
- **Estimated users:** 550 staff across all departments
- **SKU volume:** ~3,000 products

---

## Known Demo Limitations

- Cost centre list is hard-coded (5 entries). Full build fetches from ERP/database.
- Approval workflow is single-level. Full build supports configurable multi-level hierarchy.
- WMS pick flow stores state in order metadata. Full build uses a dedicated WMS module with barcode scanning PWA.
- Payment is test-mode only. Full build will use PO/invoice terms, not card payment.
