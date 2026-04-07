// server/routes/payments.js
const { register } = require('../router');
const db = require('../db');
const {
  uuid,
  badRequest,
  notFound,
  requireUser,
  requireRole,
  getOwnerId,
  getEmployeeId,
} = require('../lib/helpers');

async function getBooking(bookingID) {
  const [[b]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  return b || null;
}

async function getPayment(paymentID) {
  const [[p]] = await db.query('SELECT * FROM PAYMENT WHERE paymentID = ?', [paymentID]);
  return p || null;
}

// 33) POST /api/payments (Owner) — record payment, move booking to active
register('POST', '/api/payments', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const body = await req.parseBody();
  // TEST DATA - will be replaced by actual request body in production
  const {
    bookingID       = 'bk-002',
    paymentMethod   = 'card',
    platformFeeRate = 0.05,
  } = body;
  if (!bookingID || !paymentMethod) return badRequest(send, res, 'bookingID and paymentMethod are required');

  const booking = await getBooking(bookingID);
  if (!booking) return notFound(send, res, 'Booking not found');
  if (booking.ownerID !== ownerID) return send(res, 403, { error: 'Forbidden' });

  const status = String(booking.status).toLowerCase();
  if (!['accepted', 'pending'].includes(status)) {
    return send(res, 409, { error: 'Booking is not payable in its current state' });
  }

  const serviceCost = Number(booking.totalCost);
  const platformFee = Math.round(serviceCost * Number(platformFeeRate) * 100) / 100;
  const amount = Math.round((serviceCost + platformFee) * 100) / 100;

  const paymentID = uuid();
  await db.query(
    `INSERT INTO PAYMENT (paymentID, bookingID, serviceCost, platformFee, amount, paymentMethod, paymentStatus, escrowStatus)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [paymentID, bookingID, serviceCost, platformFee, amount, paymentMethod, 'Paid', 'Holding']
  );

  await db.query('UPDATE BOOKING SET status = ? WHERE bookingID = ?', ['active', bookingID]);

  const payment = await getPayment(paymentID);
  send(res, 201, payment);
});

// 34) PATCH /api/payments/:id/release (Support) — release payment, move booking to completed
register('PATCH', '/api/payments/:id/release', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const paymentID = req.params.id;
  const payment = await getPayment(paymentID);
  if (!payment) return notFound(send, res, 'Payment not found');

  if (payment.escrowStatus !== 'Holding') {
    return send(res, 409, { error: 'Payment is not in Holding escrow state' });
  }

  await db.query('UPDATE PAYMENT SET escrowStatus = ?, paymentStatus = ? WHERE paymentID = ?', [
    'Released',
    'Released',
    paymentID,
  ]);
  await db.query('UPDATE BOOKING SET status = ? WHERE bookingID = ?', ['completed', payment.bookingID]);

  const updated = await getPayment(paymentID);
  send(res, 200, updated);
});

// 35) PATCH /api/payments/:id/refund (Support) — refund a payment
register('PATCH', '/api/payments/:id/refund', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const paymentID = req.params.id;
  const payment = await getPayment(paymentID);
  if (!payment) return notFound(send, res, 'Payment not found');
  if (payment.escrowStatus === 'Refunded') return send(res, 409, { error: 'Already refunded' });

  const body = await req.parseBody();
  // TEST DATA - will be replaced by actual request body in production
  const reason = body?.reason || 'Service not delivered as agreed. Refund approved by support.';

  const refundID = uuid();
  await db.query('INSERT INTO REFUND (refundID, paymentID, amount, reason) VALUES (?, ?, ?, ?)', [
    refundID,
    paymentID,
    payment.amount,
    reason,
  ]);

  await db.query('UPDATE PAYMENT SET escrowStatus = ?, paymentStatus = ? WHERE paymentID = ?', [
    'Refunded',
    'Refunded',
    paymentID,
  ]);
  await db.query('UPDATE BOOKING SET status = ? WHERE bookingID = ?', ['cancelled', payment.bookingID]);

  const updated = await getPayment(paymentID);
  send(res, 200, { payment: updated, refundID });
});