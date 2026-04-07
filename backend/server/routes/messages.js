// server/routes/messages.js
const { randomUUID } = require('crypto');
const { register } = require('../router');
const db = require('../db');

async function getBookingParticipants(bookingID) {
  const [rows] = await db.query(
    `SELECT b.bookingID,
            b.ownerID,
            b.sitterID,
            po.userID AS ownerUserID,
            pm.userID AS minderUserID
     FROM BOOKING b
     LEFT JOIN PET_OWNER po ON b.ownerID = po.ownerID
     LEFT JOIN PET_MINDER pm ON b.sitterID = pm.sitterID
     WHERE b.bookingID = ?`,
    [bookingID]
  );

  return rows[0] || null;
}

async function getSupportEmployeeID(userId) {
  const [rows] = await db.query(
    'SELECT employeeID FROM CUSTOMER_SUPPORT WHERE userID = ?',
    [userId]
  );
  return rows[0] ? rows[0].employeeID : null;
}

async function getOrCreateConversation(bookingID) {
  const [rows] = await db.query(
    'SELECT conversationID FROM CONVERSATION WHERE bookingID = ?',
    [bookingID]
  );

  if (rows.length > 0) {
    return rows[0].conversationID;
  }

  const conversationID = randomUUID();
  await db.query(
    'INSERT INTO CONVERSATION (conversationID, bookingID) VALUES (?, ?)',
    [conversationID, bookingID]
  );
  return conversationID;
}


// send message on a booking
register('POST', '/api/messages', async (req, res, send) => {
  if (!req.requireRole(['Owner', 'Minder', 'Support'])) return;

  const { bookingID, content, mediaID, receiverUserID: requestedReceiverUserID } = await req.parseBody();

  if (!bookingID) {
    send(res, 400, { error: 'bookingID is required' });
    return;
  }

  if (!content || typeof content !== 'string') {
    send(res, 400, { error: 'content is required' });
    return;
  }

  const booking = await getBookingParticipants(bookingID);
  if (!booking) {
    send(res, 404, { error: 'Booking not found' });
    return;
  }

  const { ownerUserID, minderUserID } = booking;
  if (!ownerUserID || !minderUserID) {
    send(res, 400, { error: 'Booking participants are incomplete' });
    return;
  }

  let senderUserID = req.userId;
  let receiverUserID = null;

  // determine receiver based on sender role (its a lot yeah)
  if (req.userRole === 'Owner') {
    if (senderUserID !== ownerUserID) {
      send(res, 403, { error: 'Owner is not associated with this booking' });
      return;
    }
    receiverUserID = minderUserID;
  } else if (req.userRole === 'Minder') {
    if (senderUserID !== minderUserID) {
      send(res, 403, { error: 'Minder is not associated with this booking' });
      return;
    }
    receiverUserID = ownerUserID;
  } else {
    const employeeID = await getSupportEmployeeID(senderUserID);
    if (!employeeID) {
      send(res, 403, { error: 'Support user is not registered' });
      return;
    }

    if (!requestedReceiverUserID) {
      send(res, 400, { error: 'receiverUserID is required for support staff' });
      return;
    }

    const validReceiverIDs = [ownerUserID, minderUserID];
    if (!validReceiverIDs.includes(requestedReceiverUserID)) {
      send(res, 400, { error: 'receiverUserID must be the owner or minder on this booking' });
      return;
    }

    receiverUserID = requestedReceiverUserID;
  }

  const conversationID = await getOrCreateConversation(bookingID);
  const messageID = randomUUID();

  await db.query(
    'INSERT INTO MESSAGE (messageID, conversationID, senderUserID, receiverUserID, content, mediaID) VALUES (?, ?, ?, ?, ?, ?)',
    [messageID, conversationID, senderUserID, receiverUserID, content, mediaID || null]
  );

  send(res, 201, { messageID, conversationID, bookingID, senderUserID, receiverUserID, content, mediaID: mediaID || null,});
});


// get messages for a booking
register('GET', '/api/messages/:booking_id', async (req, res, send) => {
  if (!req.requireRole(['Owner', 'Minder', 'Support'])) return;

  const bookingID = req.params.booking_id;
  const booking = await getBookingParticipants(bookingID);

  if (!booking) {
    send(res, 404, { error: 'Booking not found' });
    return;
  }

  const { ownerUserID, minderUserID } = booking;
  if (!ownerUserID || !minderUserID) {
    send(res, 400, { error: 'Booking participants are incomplete' });
    return;
  }

  const senderUserID = req.userId;
  if (req.userRole === 'Owner' && senderUserID !== ownerUserID) {
    send(res, 403, { error: 'Owner is not associated with this booking' });
    return;
  }
  if (req.userRole === 'Minder' && senderUserID !== minderUserID) {
    send(res, 403, { error: 'Minder is not associated with this booking' });
    return;
  }

  if (req.userRole === 'Support') {
    const employeeID = await getSupportEmployeeID(senderUserID);
    if (!employeeID) {
      send(res, 403, { error: 'Support user is not registered' });
      return;
    }
  }

  const [convRows] = await db.query('SELECT conversationID FROM CONVERSATION WHERE bookingID = ?', [bookingID]);
  if (convRows.length === 0) {
    send(res, 200, []);
    return;
  }

  const conversationID = convRows[0].conversationID;
  const [rows] = await db.query(
    'SELECT * FROM MESSAGE WHERE conversationID = ? ORDER BY timestamp ASC',
    [conversationID]
  );

  send(res, 200, rows);
});