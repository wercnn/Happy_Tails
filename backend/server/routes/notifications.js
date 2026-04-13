// server/routes/notifications.js
const { register } = require('../router');
const db = require('../db');
const { requireUser, requireRole, uuid } = require('../lib/helpers');

// GET /api/notifications
// Returns all notifications for the logged-in user (recipientID = userID), newest first.
register('GET', '/api/notifications', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;

  const [rows] = await db.query(
    `SELECT notificationID, recipientID, channel, title, body, isRead, sentAt
     FROM NOTIFICATION
     WHERE recipientID = ?
     ORDER BY sentAt DESC`,
    [req.userId]
  );
  send(res, 200, rows);
});

// PATCH /api/notifications/:id/read
// Mark a single notification as read. Only the recipient may mark their own notification.
register('PATCH', '/api/notifications/:id/read', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;

  const notificationID = req.params.id;
  const [result] = await db.query(
    'UPDATE NOTIFICATION SET isRead = TRUE WHERE notificationID = ? AND recipientID = ?',
    [notificationID, req.userId]
  );
  if (!result.affectedRows) {
    return send(res, 404, { error: 'Notification not found' });
  }
  send(res, 200, { ok: true });
});

// PATCH /api/notifications/read-all
// Mark all of the logged-in user's notifications as read.
register('PATCH', '/api/notifications/read-all', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;

  await db.query(
    'UPDATE NOTIFICATION SET isRead = TRUE WHERE recipientID = ?',
    [req.userId]
  );
  send(res, 200, { ok: true });
});

// POST /api/notifications
// Create a notification for a pet owner. Called by the minder after accepting a booking.
// Body: { ownerID, title, body, channel }
register('POST', '/api/notifications', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const body = await req.parseBody();
  const { ownerID, title, body: notifBody, channel } = body;

  if (!ownerID || !title) {
    return send(res, 400, { error: 'ownerID and title are required' });
  }

  // Resolve the owner's userID from their ownerID (PET_OWNER profile ID)
  const [[ownerRow]] = await db.query(
    'SELECT userID FROM PET_OWNER WHERE ownerID = ?',
    [ownerID]
  );
  if (!ownerRow) {
    return send(res, 404, { error: 'Owner not found' });
  }

  const notificationID = uuid();
  await db.query(
    `INSERT INTO NOTIFICATION (notificationID, recipientID, channel, title, body)
     VALUES (?, ?, ?, ?, ?)`,
    [notificationID, ownerRow.userID, channel || 'in-app', title, notifBody || null]
  );

  send(res, 201, { notificationID });
});
