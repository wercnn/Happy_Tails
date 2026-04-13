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

async function getUserIdForOwner(ownerID) {
  const [[row]] = await db.query(
    'SELECT userID FROM PET_OWNER WHERE ownerID = ?',
    [ownerID]
  );
  return row?.userID || null;
}

async function getUserIdForSitter(sitterID) {
  const [[row]] = await db.query(
    'SELECT userID FROM PET_MINDER WHERE sitterID = ?',
    [sitterID]
  );
  return row?.userID || null;
}

async function getOwnerByUserId(userID) {
  const [[row]] = await db.query(
    'SELECT ownerID, userID FROM PET_OWNER WHERE userID = ?',
    [userID]
  );
  return row || null;
}

async function getSitterByUserId(userID) {
  const [[row]] = await db.query(
    'SELECT sitterID, userID FROM PET_MINDER WHERE userID = ?',
    [userID]
  );
  return row || null;
}

async function getOrCreateDirectConversation(ownerUserID, sitterUserID) {
  const [[existing]] = await db.query(
    `SELECT c.conversationID
     FROM CONVERSATION c
     JOIN MESSAGE m ON m.conversationID = c.conversationID
     WHERE c.bookingID IS NULL
       AND (
         (m.senderUserID = ? AND m.receiverUserID = ?)
         OR
         (m.senderUserID = ? AND m.receiverUserID = ?)
       )
     LIMIT 1`,
    [ownerUserID, sitterUserID, sitterUserID, ownerUserID]
  );

  if (existing) return existing.conversationID;

  const conversationID = uuid();
  await db.query(
    'INSERT INTO CONVERSATION (conversationID, bookingID) VALUES (?, ?)',
    [conversationID, null]
  );

  return conversationID;
}

// POST /api/messages
// direct messages with no booking needed
register('POST', '/api/messages', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, ['owner', 'minder'])) return;

  const body = await req.parseBody();
  const { sitterID, content } = body || {};
  const trimmedContent = String(content || '').trim();
  const role = String(req.userRole || '').toLowerCase();

  if (!sitterID || !trimmedContent) {
    return badRequest(send, res, 'sitterID and content are required');
  }

  const senderUserID = req.userId;

  if (role === 'owner') {
    const owner = await getOwnerByUserId(req.userId);
    if (!owner) return send(res, 403, { error: 'Owner profile not found' });

    const sitterUserID = await getUserIdForSitter(sitterID);
    if (!sitterUserID) return notFound(send, res, 'Minder profile not found');

    const conversationID = await getOrCreateDirectConversation(req.userId, sitterUserID);
    const messageID = uuid();

    await db.query(
      `INSERT INTO MESSAGE
        (messageID, conversationID, senderUserID, receiverUserID, content)
       VALUES (?, ?, ?, ?, ?)`,
      [messageID, conversationID, senderUserID, sitterUserID, trimmedContent]
    );

    const [[row]] = await db.query(
      'SELECT * FROM MESSAGE WHERE messageID = ?',
      [messageID]
    );

    return send(res, 201, row);
  }

  return send(res, 403, { error: 'Only pet owners can start direct chats this way' });
});

// GET /api/messages/direct/:sitterID
register('GET', '/api/messages/direct/:sitterID', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, ['owner', 'minder'])) return;

  const { sitterID } = req.params;
  const role = String(req.userRole || '').toLowerCase();

  if (role === 'owner') {
    const owner = await getOwnerByUserId(req.userId);
    if (!owner) return send(res, 403, { error: 'Owner profile not found' });

    const sitterUserID = await getUserIdForSitter(sitterID);
    if (!sitterUserID) return notFound(send, res, 'Minder profile not found');

    const [[conv]] = await db.query(
      `SELECT c.conversationID
       FROM CONVERSATION c
       JOIN MESSAGE m ON m.conversationID = c.conversationID
       WHERE c.bookingID IS NULL
         AND (
           (m.senderUserID = ? AND m.receiverUserID = ?)
           OR
           (m.senderUserID = ? AND m.receiverUserID = ?)
         )
       LIMIT 1`,
      [req.userId, sitterUserID, sitterUserID, req.userId]
    );

    if (!conv) return send(res, 200, []);

    const [rows] = await db.query(
      'SELECT * FROM MESSAGE WHERE conversationID = ? ORDER BY timestamp ASC',
      [conv.conversationID]
    );

    return send(res, 200, rows);
  }

  if (role === 'minder') {
    const mySitterID = await getSitterId(db, req.userId);
    if (!mySitterID) return send(res, 403, { error: 'Minder profile not found' });
    if (String(mySitterID) !== String(sitterID)) {
      return send(res, 403, { error: 'Forbidden' });
    }

    const [rows] = await db.query(
      `SELECT m.*
       FROM MESSAGE m
       JOIN CONVERSATION c ON c.conversationID = m.conversationID
       WHERE c.bookingID IS NULL
         AND (m.senderUserID = ? OR m.receiverUserID = ?)
       ORDER BY m.timestamp ASC`,
      [req.userId, req.userId]
    );

    return send(res, 200, rows);
  }

  return send(res, 403, { error: 'Forbidden' });
});