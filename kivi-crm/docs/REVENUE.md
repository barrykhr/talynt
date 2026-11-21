# Revenue model (operational reporting — not accounting)

All amounts keep their original currency, INR by default. Nothing is converted:
every total is shown per currency. If cross-currency reporting is needed later,
add stored exchange rates with their date and source, and keep the original
values.

## Source records

| Record | What it captures |
|---|---|
| Opportunity | Estimated value, currency, an optional probability override |
| Requirement | Fee basis (% of first-year compensation, fixed fee, retainer/milestone, contract margin, other), fee %, expected compensation, fee per hire, an optional total override, probability, forecast placement date, client acceptance, terms agreed |
| Placement | One hire, with no candidate personal data: offer-accepted date, joining date, status, fee |
| Revenue event | What is earned. Placement fees are created automatically; retainer and margin milestones are added by hand |
| Invoice | Number (unique), issue date, due date, amount, currency. Cancelled, never deleted |
| Payment | Received date, amount, reference. Partial payments are allowed, overpayment is refused, and a payment is reversed rather than edited |
| Credit adjustment | A rebate or credit note against an invoice. Reduces the balance; never counts as cash |

**Estimated fee** = the override, or fee per hire × volume, or fee % × compensation × volume.

## The six measures

| Measure | Definition | Date filter |
|---|---|---|
| Pipeline | Open opportunities' value; weighted = value × stage probability (admin-set) or the deal's override | Current open deals |
| Booked | Estimated fee of live requirements that are client-accepted, have agreed terms, and belong to a company with a signed MSA. Each condition is an admin setting. An MSA with no valued live requirement is **not** booked. | Acceptance or terms date |
| Earned | Revenue events whose milestone is met. Placement fees are earned on joining by default, or on offer acceptance (admin setting) | Earned date |
| Invoiced | Issued (not cancelled) invoices | Issue date |
| Realized (cash collected) | Payments received, not reversed. **Never** an invoice or placement on its own | Received date |
| Outstanding | Invoice amount − payments − credits, with due date, overdue state and aging bucket | Always as of today |

**Won.** An opportunity can be marked Won only when the company's MSA is
signed **and** at least one live, client-accepted requirement is linked to it.
The database enforces this, and the opportunity page shows both conditions.
Winning doesn't make anything booked, earned or paid.

**MSA status** comes from the company's agreement records (`commercial_agreements`).
An expired MSA stops counting as signed; a daily job refreshes this.

## Integrity

- **Rollups:** every total comes from views and functions (`requirement_revenue`,
  `invoice_balances`, `opportunity_pipeline`, `revenue_summary`,
  `revenue_by_month`). No rollup is stored.
- **Guards:** invoice and payment currencies must match. Placements must fit the
  hiring volume. An invoice can't be cancelled with payments on it, and an
  invoice amount can't drop below what has been paid.
- **Audit trail:** every change to placements, revenue events, invoices,
  payments and credits is written to record history, and invoice, payment and
  credit changes also go to the admin audit log.
- **No hard deletes:** members cannot hard-delete any financial record.
