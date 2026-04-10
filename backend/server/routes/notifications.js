// server/routes/notifications.js
const { register } = require('../router');
const db = require('../db');
const { requireUser } = require('../lib/helpers');

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
