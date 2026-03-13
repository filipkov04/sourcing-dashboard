#!/bin/bash
# Seeds tracking data via the running Next.js API
# Requires: dev server on localhost:3000, authenticated session cookie

echo "=== Seed Tracking Data ==="
echo ""
echo "This needs to go through the app's API which requires auth."
echo "Easiest approach: open your browser console on localhost:3000 and paste:"
echo ""
cat <<'JS'
// --- Paste this in browser console at localhost:3000 ---

// Step 1: Get your 2 most recent orders
const res = await fetch('/api/orders');
const data = await res.json();
const orders = data.data.slice(0, 2);

if (orders.length === 0) { console.log('No orders found'); }

// Step 2: Set tracking on order 1 (In Transit through Suez)
if (orders[0]) {
  const r1 = await fetch(`/api/orders/${orders[0].id}/tracking`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trackingNumber: 'MAEU1234567890',
      shippingMethod: 'OCEAN',
    }),
  });
  console.log('Order 1 tracking set:', (await r1.json()));
}

// Step 3: Set tracking on order 2 (Customs hold)
if (orders[1]) {
  const r2 = await fetch(`/api/orders/${orders[1].id}/tracking`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trackingNumber: 'CMAU9876543210',
      shippingMethod: 'OCEAN',
    }),
  });
  console.log('Order 2 tracking set:', (await r2.json()));
}

console.log('✅ Done! Now check the orders table and order detail pages.');
JS
