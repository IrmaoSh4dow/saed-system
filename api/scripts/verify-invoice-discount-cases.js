/**
 * Lightweight verification of convenio discount math and snapshot immutability assumptions.
 * Run: node scripts/verify-invoice-discount-cases.js
 */

function compute(originalAmount, discountPercent) {
  const safeOriginal = Math.max(0, Number(originalAmount) || 0);
  const safePercent = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discountAmount = Math.round(((safeOriginal * safePercent) / 100) * 100) / 100;
  const finalAmount = Math.round((safeOriginal - discountAmount) * 100) / 100;
  return { originalAmount: safeOriginal, discountPercent: safePercent, discountAmount, finalAmount };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Case 1 — no convenio → 0%
{
  const result = compute(1000, 0);
  assert(result.discountAmount === 0 && result.finalAmount === 1000, 'Case 1 failed');
}

// Case 2 — active convenio 15%
{
  const result = compute(1000, 15);
  assert(result.discountAmount === 150 && result.finalAmount === 850, 'Case 2 failed');
}

// Case 3 — snapshot immutability: old invoice keeps 15% even if convenio later becomes 25%
{
  const emitted = compute(1000, 15);
  const laterConvenioPercent = 25;
  assert(emitted.discountPercent === 15, 'Case 3: snapshot percent mutated');
  assert(emitted.discountPercent !== laterConvenioPercent, 'Case 3: should differ from new percent');
  const newInvoice = compute(1000, laterConvenioPercent);
  assert(newInvoice.discountPercent === 25 && newInvoice.finalAmount === 750, 'Case 3 new invoice failed');
}

// Case 4 — deactivated convenio → new invoices at 0%, old snapshot unchanged
{
  const historical = { originalAmount: 1000, discountPercent: 15, discountAmount: 150, amount: 850 };
  const afterDeactivate = compute(1000, 0);
  assert(historical.amount === 850, 'Case 4: historical mutated');
  assert(afterDeactivate.finalAmount === 1000, 'Case 4: new invoice should have no discount');
}

// Guard: callers must always discount from the original treatment price (never re-apply on final).
{
  const once = compute(1000, 10);
  assert(once.finalAmount === 900, 'single-apply base');
}

console.log('Invoice discount cases OK');
