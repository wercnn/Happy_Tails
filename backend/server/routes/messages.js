const { register } = require('../router');
const db = require('../db');

const {
  uuid,
  badRequest,
  requireUser,
  requireRole,
} = require('../lib/helpers');

async function insertNotification(recipientUserID, title, body) {
  await db.query(
    `INSERT INTO NOTIFICATION (notificationID, recipientID, channel, title, body)
     VALUES (?, ?, 'in-app', ?, ?)`,
    [uuid(), recipientUserID, title, body]
  );
}

async function getOrCreateDirectConversation(userA, userB) {
  const [rows] = await db.query(
    `
    SELECT DISTINCT C.conversationID
    FROM CONVERSATION C
    JOIN MESSAGE M ON M.conversationID = C.conversationID
    WHERE C.bookingID IS NULL
      AND (
        (M.senderUserID = ? AND M.receiverUserID = ?)
        OR
        (M.senderUserID = ? AND M.receiverUserID = ?)
      )
    LIMIT 1
    `,
    [userA, userB, userB, userA]
  );

  if (rows.length) return rows[0].conversationID;

  const conversationID = uuid();
  await db.query(
    'INSERT INTO CONVERSATION (conversationID, bookingID) VALUES (?, NULL)',
    [conversationID]
  );

  return conversationID;
}

async function getProfileNameByUserID(userID) {
  if (!userID) return 'User';

  const [[row]] = await db.query(
    'SELECT firstName, lastName FROM USER_PROFILE WHERE userID = ?',
    [userID]
  );

  if (!row) return 'User';

  const fullName = [row.firstName, row.lastName].filter(Boolean).join(' ').trim();
  return fullName || 'User';
}

async function canMessageDirect(currentUserId, otherUserId) {
  if (!currentUserId || !otherUserId) return false;
  if (String(currentUserId) === String(otherUserId)) return false;
  return true;
}

// POST /api/messages
// Direct message only
register('POST', '/api/messages', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, ['owner', 'minder'])) return;

  const body = await req.parseBody();
  const { otherUserID, content } = body || {};

  if (!otherUserID) {
    return badRequest(send, res, 'otherUserID is required');
  }

  if (!content || !String(content).trim()) {
    return badRequest(send, res, 'content is required');
  }

  const senderUserID = req.userId;

  const allowed = await canMessageDirect(senderUserID, otherUserID);
  if (!allowed) {
    return send(res, 403, { error: 'Forbidden' });
  }

  const conversationID = await getOrCreateDirectConversation(senderUserID, otherUserID);
  const messageID = uuid();

  await db.query(
    `
    INSERT INTO MESSAGE
      (messageID, conversationID, senderUserID, receiverUserID, content)
    VALUES (?, ?, ?, ?, ?)
    `,
    [messageID, conversationID, senderUserID, otherUserID, String(content).trim()]
  );

  const [[row]] = await db.query(
    'SELECT * FROM MESSAGE WHERE messageID = ?',
    [messageID]
  );

  try {
    const senderName = await getProfileNameByUserID(senderUserID);
    const preview    = String(content).trim().slice(0, 60);
    const ellipsis   = String(content).trim().length > 60 ? '…' : '';
    await insertNotification(
      otherUserID,
      'New Message',
      `${senderName}: ${preview}${ellipsis}`
    );
  } catch (notifErr) {
    console.error('Failed to create message notification:', notifErr.message);
  }

  return send(res, 201, row);
});

// GET /api/messages/direct/user/:otherUserID
register('GET', '/api/messages/direct/user/:otherUserID', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, ['owner', 'minder'])) return;

  const currentUserID = req.userId;
  const otherUserID = req.params.otherUserID;

  const allowed = await canMessageDirect(currentUserID, otherUserID);
  if (!allowed) {
    return send(res, 403, { error: 'Forbidden' });
  }

  await db.query(
    `
    UPDATE MESSAGE M
    JOIN CONVERSATION C ON C.conversationID = M.conversationID
    SET M.isRead = TRUE
    WHERE C.bookingID IS NULL
      AND M.senderUserID = ?
      AND M.receiverUserID = ?
      AND M.isRead = FALSE
    `,
    [otherUserID, currentUserID]
  );

  const [rows] = await db.query(
    `
    SELECT M.*
    FROM MESSAGE M
    JOIN CONVERSATION C ON C.conversationID = M.conversationID
    WHERE C.bookingID IS NULL
      AND (
        (M.senderUserID = ? AND M.receiverUserID = ?)
        OR
        (M.senderUserID = ? AND M.receiverUserID = ?)
      )
    ORDER BY M.timestamp ASC, M.messageID ASC
    `,
    [currentUserID, otherUserID, otherUserID, currentUserID]
  );

  return send(res, 200, rows);
});

// GET /api/messages/conversations
register('GET', '/api/messages/conversations', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, ['owner', 'minder'])) return;

  const currentUserID = req.userId;

  const [conversationRows] = await db.query(
    `
    SELECT
      C.conversationID,
      MAX(M.timestamp) AS lastTimestamp
    FROM CONVERSATION C
    JOIN MESSAGE M ON M.conversationID = C.conversationID
    WHERE C.bookingID IS NULL
      AND (M.senderUserID = ? OR M.receiverUserID = ?)
    GROUP BY C.conversationID
    ORDER BY lastTimestamp DESC
    `,
    [currentUserID, currentUserID]
  );

  const results = [];

  for (const conv of conversationRows) {
    const [[lastMessage]] = await db.query(
      `
      SELECT *
      FROM MESSAGE
      WHERE conversationID = ?
      ORDER BY timestamp DESC, messageID DESC
      LIMIT 1
      `,
      [conv.conversationID]
    );

    if (!lastMessage) continue;

    const otherUserID =
      String(lastMessage.senderUserID) === String(currentUserID)
        ? lastMessage.receiverUserID
        : lastMessage.senderUserID;

    const otherUserName = await getProfileNameByUserID(otherUserID);

    const [[unreadRow]] = await db.query(
      `
      SELECT COUNT(*) AS unreadCount
      FROM MESSAGE
      WHERE conversationID = ?
        AND receiverUserID = ?
        AND isRead = FALSE
      `,
      [conv.conversationID, currentUserID]
    );

    results.push({
      conversationKey: `direct-${conv.conversationID}`,
      conversationType: 'direct',
      conversationID: conv.conversationID,
      bookingID: null,
      otherUserID: otherUserID || null,
      otherUserName: otherUserName || 'User',
      petName: '',
      serviceName: '',
      avatar: '',
      lastMessage: lastMessage.content || '',
      timestamp: lastMessage.timestamp,
      rawTimestamp: lastMessage.timestamp,
      unreadCount: Number(unreadRow?.unreadCount || 0),
    });
  }

  return send(res, 200, results);
});