// server/routes/messages.js
const { register } = require('../router');
const db = require('../db');
const {
  uuid,
  badRequest,
  notFound,
  requireUser,
  requireRole,
  getOwnerId,
  getSitterId,
} = require('../lib/helpers');

async function getOrCreateConversation(bookingID) {
  const [[existing]] = await db.query('SELECT conversationID FROM CONVERSATION WHERE bookingID = ?', [bookingID]);
  if (existing) return existing.conversationID;
  const conversationID = uuid();
  await db.query('INSERT INTO CONVERSATION (conversationID, bookingID) VALUES (?, ?)', [conversationID, bookingID]);
  return conversationID;
}

async function getBooking(bookingID) {
  const [[b]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  return b || null;
}

async function getUserIdForOwner(ownerID) {
  const [[row]] = await db.query('SELECT userID FROM PET_OWNER WHERE ownerID = ?', [ownerID]);
  return row?.userID || null;
}

async function getUserIdForSitter(sitterID) {
  const [[row]] = await db.query('SELECT userID FROM PET_MINDER WHERE sitterID = ?', [sitterID]);
  return row?.userID || null;
}

// 26) POST /api/messages (Owner/Minder) — send a message on booking thread
register('POST', '/api/messages', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, ['owner', 'minder'])) return;

  const body = await req.parseBody();
  const { bookingID, content } = body;
  if (!bookingID || !content) return badRequest(send, res, 'bookingID and content are required');

  const booking = await getBooking(bookingID);
  if (!booking) return notFound(send, res, 'Booking not found');

  const role = String(req.userRole || '').toLowerCase();
  const ownerID = role === 'owner' ? await getOwnerId(db, req.userId) : null;
  const sitterID = role === 'minder' ? await getSitterId(db, req.userId) : null;
  const allowed = (ownerID && booking.ownerID === ownerID) || (sitterID && booking.sitterID === sitterID);
  if (!allowed) return send(res, 403, { error: 'Forbidden' });

  const conversationID = await getOrCreateConversation(bookingID);
  const senderUserID = String(req.userId);

  const ownerUserID = await getUserIdForOwner(booking.ownerID);
  const sitterUserID = await getUserIdForSitter(booking.sitterID);
  const receiverUserID = senderUserID === ownerUserID ? sitterUserID : ownerUserID;
  if (!receiverUserID) return send(res, 500, { error: 'Unable to resolve receiver' });

  const messageID = uuid();
  await db.query(
    'INSERT INTO MESSAGE (messageID, conversationID, senderUserID, receiverUserID, content) VALUES (?, ?, ?, ?, ?)',
    [messageID, conversationID, senderUserID, receiverUserID, content]
  );

  const [[row]] = await db.query('SELECT * FROM MESSAGE WHERE messageID = ?', [messageID]);
  send(res, 201, row);
});

// 27) GET /api/messages/:booking_id (Owner/Minder) — get the full message thread
register('GET', '/api/messages/:booking_id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, ['owner', 'minder'])) return;

  const bookingID = req.params.booking_id;
  const booking = await getBooking(bookingID);
  if (!booking) return notFound(send, res, 'Booking not found');

  const role = String(req.userRole || '').toLowerCase();
  const ownerID = role === 'owner' ? await getOwnerId(db, req.userId) : null;
  const sitterID = role === 'minder' ? await getSitterId(db, req.userId) : null;
  const allowed = (ownerID && booking.ownerID === ownerID) || (sitterID && booking.sitterID === sitterID);
  if (!allowed) return send(res, 403, { error: 'Forbidden' });

  const [[conv]] = await db.query('SELECT conversationID FROM CONVERSATION WHERE bookingID = ?', [bookingID]);
  if (!conv) return send(res, 200, []);

  const [rows] = await db.query(
    'SELECT * FROM MESSAGE WHERE conversationID = ? ORDER BY timestamp ASC',
    [conv.conversationID]
  );
  send(res, 200, rows);
});