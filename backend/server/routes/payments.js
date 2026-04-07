// server/routes/payments.js
const { randomUUID } = require('crypto');
const { register } = require('../router');
const db = require('../db');

function toText(value) {
  if (value == null) return null;
  return typeof value === 'string' ? value : JSON.stringify(value);
}


// record a payment and move booking to active
register('POST', '/api/payments', async (req, res, send) => {
  if (!req.requireRole('Owner')) return;

  const { bookingID, serviceCost, platformFee, amount, paymentMethod } = await req.parseBody();

  if (!bookingID || !serviceCost || !amount || !paymentMethod) {
    send(res, 400, { error: 'bookingID, serviceCost, amount, and paymentMethod are required' });
    return;
  }

  const [bookingRows] = await db.query('SELECT status FROM BOOKING WHERE bookingID = ?', [bookingID]);
  if (bookingRows.length === 0) {
    send(res, 404, { error: 'Booking not found' });
    return;
  } if (bookingRows[0].status !== 'Pending') {
    send(res, 400, { error: 'Booking is not in pending status' });
    return;
  }

  const paymentID = randomUUID();
  await db.query(
    'INSERT INTO PAYMENT (paymentID, bookingID, serviceCost, platformFee, amount, paymentMethod, paymentStatus, escrowStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [paymentID, bookingID, serviceCost, platformFee || 0, amount, paymentMethod, 'Completed', 'Holding']
  );

  await db.query('UPDATE BOOKING SET status = ? WHERE bookingID = ?', ['Active', bookingID]);

  send(res, 201, { paymentID, bookingID, serviceCost, platformFee, amount, paymentMethod });
});


// release payment and move booking to completed
register('PATCH', '/api/payments/:id/release', async (req, res, send) => {
  if (!req.requireRole('Support')) return;

  const paymentID = req.params.id;

  const [paymentRows] = await db.query('SELECT bookingID, escrowStatus FROM PAYMENT WHERE paymentID = ?', [paymentID]);
  if (paymentRows.length === 0) {
    send(res, 404, { error: 'Payment not found' });
    return;
  }
  if (paymentRows[0].escrowStatus !== 'Holding') {
    send(res, 400, { error: 'Payment is not in holding status' });
    return;
  }

  await db.query('UPDATE PAYMENT SET escrowStatus = ? WHERE paymentID = ?', ['Released', paymentID]);

  const bookingID = paymentRows[0].bookingID;
  await db.query('UPDATE BOOKING SET status = ? WHERE bookingID = ?', ['Completed', bookingID]);

  send(res, 200, { paymentID, message: 'Payment released and booking completed' });
});


// refund a payment
register('PATCH', '/api/payments/:id/refund', async (req, res, send) => {
  if (!req.requireRole('Support')) return;

  const { reason, amount } = await req.parseBody();
  const paymentID = req.params.id;

  if (!reason || !amount) {
    send(res, 400, { error: 'reason and amount are required' });
    return;
  }

  const [paymentRows] = await db.query('SELECT bookingID, escrowStatus, amount FROM PAYMENT WHERE paymentID = ?', [paymentID]);
  if (paymentRows.length === 0) {
    send(res, 404, { error: 'Payment not found' });
    return;
  } if (paymentRows[0].escrowStatus !== 'Holding') {
    send(res, 400, { error: 'Payment is not in holding status' });
    return;
  } if (amount > paymentRows[0].amount) {
    send(res, 400, { error: 'Refund amount cannot exceed payment amount' });
    return;
  }

  const refundID = randomUUID();
  await db.query(
    'INSERT INTO REFUND (refundID, paymentID, amount, reason) VALUES (?, ?, ?, ?)',
    [refundID, paymentID, amount, reason]
  );

  await db.query('UPDATE PAYMENT SET escrowStatus = ? WHERE paymentID = ?', ['Refunded', paymentID]);

  send(res, 200, { refundID, paymentID, amount, reason });
});