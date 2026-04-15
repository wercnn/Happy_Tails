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

async function insertNotification(recipientUserID, title, body) {
  await db.query(
    `INSERT INTO NOTIFICATION (notificationID, recipientID, channel, title, body)
     VALUES (?, ?, 'in-app', ?, ?)`,
    [uuid(), recipientUserID, title, body]
  );
}

async function getMinderName(sitterID) {
  const [[row]] = await db.query(
    `SELECT UP.firstName, UP.lastName
     FROM PET_MINDER PM
     JOIN USER_PROFILE UP ON UP.userID = PM.userID
     WHERE PM.sitterID = ?`,
    [sitterID]
  );
  return row ? `${row.firstName} ${row.lastName}`.trim() : 'your minder';
}

async function getServiceName(serviceTypeID) {
  const [[row]] = await db.query(
    'SELECT name FROM SERVICE_TYPE WHERE serviceTypeID = ?',
    [serviceTypeID]
  );
  return row?.name || serviceTypeID;
}

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

function toSafeDate(value) {
  if (!value) return null;
  const d = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatBookingDate(dateStr) {
  const d = toSafeDate(dateStr);
  if (!d) return null;

  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatBookingTime(dateStr) {
  const d = toSafeDate(dateStr);
  if (!d) return null;

  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getDisplayTime(booking) {
  if (booking?.selectedTime && String(booking.selectedTime).trim()) {
    return String(booking.selectedTime).trim();
  }
  return formatBookingTime(booking?.startTime);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function createGroupedBookingConfirmedMessage(bookings, acceptedByUserID) {
  if (!Array.isArray(bookings) || bookings.length === 0) return;

  const first = bookings[0];

  const [[serviceRow]] = await db.query(
    'SELECT name FROM SERVICE_TYPE WHERE serviceTypeID = ?',
    [first.serviceTypeID]
  );

  const [[petRow]] = await db.query(
    'SELECT name FROM PET_PROFILE WHERE petID = ?',
    [first.petID]
  );

  const ownerUserID = await getUserIdForOwner(first.ownerID);
  const sitterUserID = await getUserIdForSitter(first.sitterID);

  if (!ownerUserID || !sitterUserID) return;

  const [[ownerProfile]] = await db.query(
    'SELECT firstName, lastName FROM USER_PROFILE WHERE userID = ?',
    [ownerUserID]
  );

  const ownerName =
    [ownerProfile?.firstName, ownerProfile?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() || 'Pet Owner';

  const receiverUserID =
    String(acceptedByUserID) === String(ownerUserID) ? sitterUserID : ownerUserID;

  const conversationID = await getOrCreateDirectConversation(ownerUserID, sitterUserID);

  const serviceLabel = serviceRow?.name || 'booking';
  const petName = petRow?.name || 'pet';

  const dateLabels = unique(bookings.map((b) => formatBookingDate(b.startTime)));
  const timeLabels = unique(bookings.map((b) => getDisplayTime(b)));

  const dateText = dateLabels.length === 1 ? dateLabels[0] : dateLabels.join(', ');
  const timeText = timeLabels.length === 1 ? timeLabels[0] : timeLabels.join(', ');

  const content =
    `[[SYSTEM_BOOKING_CONFIRMED]] Booking confirmed with ${ownerName} and ${petName} for ${serviceLabel}` +
    `${dateText ? ` on ${dateText}` : ''}` +
    `${timeText ? ` at ${timeText}` : ''}.`;

  const messageID = uuid();

  await db.query(
    `
    INSERT INTO MESSAGE
      (messageID, conversationID, senderUserID, receiverUserID, content, isRead)
    VALUES (?, ?, ?, ?, ?, FALSE)
    `,
    [messageID, conversationID, acceptedByUserID, receiverUserID, content]
  );
}

// POST /api/bookings
register('POST', '/api/bookings', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const body = await req.parseBody();
  const {
    sitterID,
    petID,
    slotID,
    serviceTypeID,
    location,
    ownerNotes,
    selectedTime,
    bookingGroupID,
  } = body;

  if (
    !sitterID ||
    !petID ||
    !slotID ||
    !serviceTypeID ||
    !location?.postcode ||
    !location?.country
  ) {
    return badRequest(
      send,
      res,
      'sitterID, petID, slotID, serviceTypeID, and location {postcode,country} are required'
    );
  }

  const [petRows] = await db.query(
    'SELECT petID FROM PET_PROFILE WHERE petID = ? AND ownerID = ?',
    [petID, ownerID]
  );
  if (!petRows.length) return send(res, 403, { error: 'Pet does not belong to owner' });

  const [slotRows] = await db.query(
    `SELECT S.slotID, S.startTime, S.endTime, S.isBooked
     FROM SLOT S
     JOIN CALENDAR C ON C.calendarID = S.calendarID
     WHERE S.slotID = ? AND C.sitterID = ?`,
    [slotID, sitterID]
  );
  if (!slotRows.length) return notFound(send, res, 'Slot not found');
  if (slotRows[0].isBooked) return send(res, 409, { error: 'Slot already booked' });

  const [overlapRows] = await db.query(
    `
    SELECT bookingID
    FROM BOOKING
    WHERE sitterID = ?
      AND status = 'accepted'
      AND NOT (endTime <= ? OR startTime >= ?)
    LIMIT 1
    `,
    [sitterID, slotRows[0].startTime, slotRows[0].endTime]
  );
  if (overlapRows.length) {
    return send(res, 409, { error: 'Selected time overlaps an existing confirmed booking' });
  }

  const [[serviceRow]] = await db.query(
    `SELECT
       COALESCE(MS.customPrice, ST.basePrice) AS price
     FROM SERVICE_TYPE ST
     LEFT JOIN MINDER_SERVICE MS
       ON MS.serviceTypeID = ST.serviceTypeID
      AND MS.sitterID = ?
      AND MS.isActive = TRUE
     WHERE ST.serviceTypeID = ?`,
    [sitterID, serviceTypeID]
  );
  if (!serviceRow) return notFound(send, res, 'Service type not found');

  const locationID = uuid();
  await db.query(
    'INSERT INTO LOCATION (locationID, postcode, street, city, county, country) VALUES (?, ?, ?, ?, ?, ?)',
    [
      locationID,
      location.postcode,
      location.street || null,
      location.city || null,
      location.county || null,
      location.country,
    ]
  );

  const bookingID = uuid();
  const resolvedBookingGroupID =
    bookingGroupID && String(bookingGroupID).trim()
      ? String(bookingGroupID).trim()
      : bookingID;

  const startTime = slotRows[0].startTime;
  const endTime = slotRows[0].endTime;
  const totalCost = Number(serviceRow.price);

  await db.query(
    `INSERT INTO BOOKING
      (bookingID, bookingGroupID, ownerID, sitterID, petID, slotID, serviceTypeID, locationID, status, startTime, endTime, selectedTime, totalCost, ownerNotes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      bookingID,
      resolvedBookingGroupID,
      ownerID,
      sitterID,
      petID,
      slotID,
      serviceTypeID,
      locationID,
      'pending',
      startTime,
      endTime,
      selectedTime || null,
      totalCost,
      ownerNotes || null,
    ]
  );

  const [[booking]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  send(res, 201, booking);
});

// GET /api/bookings
register('GET', '/api/bookings', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, ['owner', 'minder'])) return;

  const role = String(req.userRole || '').toLowerCase();

  if (role === 'owner') {
    const ownerID = await getOwnerId(db, req.userId);
    if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

    const [rows] = await db.query(
      `SELECT
         B.*,
         P.name AS petName,
         P.species AS petSpecies,
         P.breed AS petBreed,
         P.age AS petAge,
         P.routines AS petRoutines,
         ST.name AS serviceName,
         MP.firstName AS minderFirstName,
         MP.lastName AS minderLastName,
         L.postcode,
         L.street,
         L.city,
         L.county,
         L.country,
         MAG.meetID AS magMeetID,
         MAG.scheduledTime AS magScheduledTime,
         MAG.isVirtual AS magIsVirtual,
         MAG.meetingLinkOrLocation AS magMeetingLinkOrLocation,
         MAG.status AS magStatus,
         MAGN.content AS magNote
       FROM BOOKING B
       JOIN PET_PROFILE P ON P.petID = B.petID
       JOIN SERVICE_TYPE ST ON ST.serviceTypeID = B.serviceTypeID
       JOIN PET_MINDER M ON M.sitterID = B.sitterID
       JOIN USER_PROFILE MP ON MP.userID = M.userID
       LEFT JOIN LOCATION L ON L.locationID = B.locationID
       LEFT JOIN MEET_AND_GREET MAG ON MAG.bookingID = B.bookingID
       LEFT JOIN MEET_AND_GREET_NOTE MAGN ON MAGN.meetID = MAG.meetID
       WHERE B.ownerID = ?
       ORDER BY B.createdAt DESC`,
      [ownerID]
    );

    return send(res, 200, rows);
  }

  if (role === 'minder') {
    const sitterID = await getSitterId(db, req.userId);
    if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

    const [rows] = await db.query(
      `SELECT
        B.*,
        P.name AS petName,
        P.species AS petSpecies,
        P.breed AS petBreed,
        P.age AS petAge,
        P.routines AS petRoutines,
        ST.name AS serviceName,
        UP.firstName AS ownerFirstName,
        UP.lastName AS ownerLastName,
        L.postcode,
        L.street,
        L.city,
        L.county,
        L.country
      FROM BOOKING B
      JOIN PET_PROFILE P ON P.petID = B.petID
      JOIN SERVICE_TYPE ST ON ST.serviceTypeID = B.serviceTypeID
      JOIN PET_OWNER O ON O.ownerID = B.ownerID
      JOIN USER_PROFILE UP ON UP.userID = O.userID
      LEFT JOIN LOCATION L ON L.locationID = B.locationID
      WHERE B.sitterID = ?
      ORDER BY B.createdAt DESC`,
      [sitterID]
    );

    for (const row of rows) {
      const [docs] = await db.query(
        `SELECT
          docID AS id,
          fileName AS name,
          fileURL AS url,
          description,
          uploadedAt
        FROM MEDICAL_DOCUMENT
        WHERE petID = ?
        ORDER BY uploadedAt DESC`,
        [row.petID]
      );

      row.medicalDocuments = docs;
    }

    return send(res, 200, rows);
  }

  return send(res, 403, { error: 'Forbidden' });
});

// GET /api/bookings/:id
register('GET', '/api/bookings/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, ['owner', 'minder'])) return;

  const role = String(req.userRole || '').toLowerCase();
  const bookingID = req.params.id;

  if (role === 'owner') {
    const ownerID = await getOwnerId(db, req.userId);
    if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

    const [[booking]] = await db.query(
      `SELECT
         B.*,
         P.name AS petName,
         P.species AS petSpecies,
         P.breed AS petBreed,
         P.age AS petAge,
         P.routines AS petRoutines,
         ST.name AS serviceName,
         MP.firstName AS minderFirstName,
         MP.lastName AS minderLastName,
         L.postcode,
         L.street,
         L.city,
         L.county,
         L.country
       FROM BOOKING B
       JOIN PET_PROFILE P ON P.petID = B.petID
       JOIN SERVICE_TYPE ST ON ST.serviceTypeID = B.serviceTypeID
       JOIN PET_MINDER M ON M.sitterID = B.sitterID
       JOIN USER_PROFILE MP ON MP.userID = M.userID
       LEFT JOIN LOCATION L ON L.locationID = B.locationID
       WHERE B.bookingID = ? AND B.ownerID = ?`,
      [bookingID, ownerID]
    );

    if (!booking) return notFound(send, res, 'Booking not found');
    return send(res, 200, booking);
  }

  if (role === 'minder') {
    const sitterID = await getSitterId(db, req.userId);
    if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

    const [[booking]] = await db.query(
      `SELECT
         B.*,
         P.name AS petName,
         P.species AS petSpecies,
         P.breed AS petBreed,
         P.age AS petAge,
         P.routines AS petRoutines,
         ST.name AS serviceName,
         UP.firstName AS ownerFirstName,
         UP.lastName AS ownerLastName,
         L.postcode,
         L.street,
         L.city,
         L.county,
         L.country
       FROM BOOKING B
       JOIN PET_PROFILE P ON P.petID = B.petID
       JOIN SERVICE_TYPE ST ON ST.serviceTypeID = B.serviceTypeID
       JOIN PET_OWNER O ON O.ownerID = B.ownerID
       JOIN USER_PROFILE UP ON UP.userID = O.userID
       LEFT JOIN LOCATION L ON L.locationID = B.locationID
       WHERE B.bookingID = ? AND B.sitterID = ?`,
      [bookingID, sitterID]
    );

    if (!booking) return notFound(send, res, 'Booking not found');

    const [docs] = await db.query(
      `SELECT
        docID AS id,
        fileName AS name,
        fileURL AS url,
        description,
        uploadedAt
      FROM MEDICAL_DOCUMENT
      WHERE petID = ?
      ORDER BY uploadedAt DESC`,
      [booking.petID]
    );

    booking.medicalDocuments = docs;
    return send(res, 200, booking);
  }

  return send(res, 403, { error: 'Forbidden' });
});

// PATCH /api/bookings/:id/accept
register('PATCH', '/api/bookings/:id/accept', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const bookingID = req.params.id;
  const [[booking]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);

  if (!booking) return notFound(send, res, 'Booking not found');
  if (booking.sitterID !== sitterID) return send(res, 403, { error: 'Forbidden' });
  if (String(booking.status).toLowerCase() !== 'pending') {
    return send(res, 409, { error: 'Booking not pending' });
  }

  const groupID =
    booking.bookingGroupID && String(booking.bookingGroupID).trim()
      ? booking.bookingGroupID
      : booking.bookingID;

  const [bookingsToAccept] = await db.query(
    `
    SELECT *
    FROM BOOKING
    WHERE sitterID = ?
      AND bookingGroupID = ?
      AND status = 'pending'
    ORDER BY startTime ASC
    `,
    [sitterID, groupID]
  );

  const safeBookings = bookingsToAccept.length ? bookingsToAccept : [booking];
  const bookingIDsToAccept = safeBookings.map((b) => b.bookingID);

  for (const b of safeBookings) {
    const placeholders = bookingIDsToAccept.map(() => '?').join(',');
    const [conflicts] = await db.query(
      `
      SELECT bookingID
      FROM BOOKING
      WHERE sitterID = ?
        AND status = 'accepted'
        AND bookingID NOT IN (${placeholders})
        AND NOT (endTime <= ? OR startTime >= ?)
      LIMIT 1
      `,
      [sitterID, ...bookingIDsToAccept, b.startTime, b.endTime]
    );

    if (conflicts.length) {
      return send(res, 409, { error: 'Booking overlaps an existing confirmed booking' });
    }
  }

  for (const b of safeBookings) {
    const [slotResult] = await db.query(
      'UPDATE SLOT SET isBooked = TRUE WHERE slotID = ? AND isBooked = FALSE',
      [b.slotID]
    );

    if (!slotResult.affectedRows) {
      return send(res, 409, { error: 'Slot already booked' });
    }
  }

  await db.query(
    `UPDATE BOOKING
     SET status = 'accepted'
     WHERE bookingID IN (${bookingIDsToAccept.map(() => '?').join(',')})`,
    bookingIDsToAccept
  );

  try {
    await createGroupedBookingConfirmedMessage(safeBookings, req.userId);
  } catch (err) {
    console.error('Failed to create booking confirmation chat message:', err);
  }

  try {
    const ownerUserID = await getUserIdForOwner(booking.ownerID);
    const serviceName = await getServiceName(booking.serviceTypeID);
    const minderName = await getMinderName(sitterID);
    const startDate = formatBookingDate(booking.startTime) || '';

    if (ownerUserID) {
      await insertNotification(
        ownerUserID,
        'Booking Accepted',
        `Your booking for ${serviceName}${startDate ? ` on ${startDate}` : ''} has been accepted by ${minderName}.`
      );
    }
  } catch (notifErr) {
    console.error('Failed to create acceptance notification:', notifErr.message);
  }

  const [updatedRows] = await db.query(
    `SELECT * FROM BOOKING
     WHERE bookingID IN (${bookingIDsToAccept.map(() => '?').join(',')})
     ORDER BY startTime ASC`,
    bookingIDsToAccept
  );

  send(res, 200, updatedRows);
});

// PATCH /api/bookings/:id/reject
register('PATCH', '/api/bookings/:id/reject', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const bookingID = req.params.id;
  const [[booking]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);

  if (!booking) return notFound(send, res, 'Booking not found');
  if (booking.sitterID !== sitterID) return send(res, 403, { error: 'Forbidden' });
  if (String(booking.status).toLowerCase() !== 'pending') {
    return send(res, 409, { error: 'Booking not pending' });
  }

  const groupID =
    booking.bookingGroupID && String(booking.bookingGroupID).trim()
      ? booking.bookingGroupID
      : booking.bookingID;

  const [bookingsToReject] = await db.query(
    `
    SELECT *
    FROM BOOKING
    WHERE sitterID = ?
      AND bookingGroupID = ?
      AND status = 'pending'
    ORDER BY startTime ASC
    `,
    [sitterID, groupID]
  );

  const safeBookings = bookingsToReject.length ? bookingsToReject : [booking];
  const bookingIDsToReject = safeBookings.map((b) => b.bookingID);

  await db.query(
    `UPDATE BOOKING
     SET status = 'rejected'
     WHERE bookingID IN (${bookingIDsToReject.map(() => '?').join(',')})`,
    bookingIDsToReject
  );

  for (const b of safeBookings) {
    const [acceptedUsingSlot] = await db.query(
      `SELECT bookingID FROM BOOKING WHERE slotID = ? AND status = 'accepted' LIMIT 1`,
      [b.slotID]
    );
    if (!acceptedUsingSlot.length) {
      await db.query('UPDATE SLOT SET isBooked = FALSE WHERE slotID = ?', [b.slotID]);
    }
  }

  try {
    const ownerUserID = await getUserIdForOwner(booking.ownerID);
    const serviceName = await getServiceName(booking.serviceTypeID);
    const startDate = formatBookingDate(booking.startTime) || '';

    if (ownerUserID) {
      await insertNotification(
        ownerUserID,
        'Booking Declined',
        `Unfortunately, your booking request for ${serviceName}${startDate ? ` on ${startDate}` : ''} was not accepted.`
      );
    }
  } catch (notifErr) {
    console.error('Failed to create rejection notification:', notifErr.message);
  }

  const [updatedRows] = await db.query(
    `SELECT * FROM BOOKING
     WHERE bookingID IN (${bookingIDsToReject.map(() => '?').join(',')})
     ORDER BY startTime ASC`,
    bookingIDsToReject
  );

  send(res, 200, updatedRows);
});

// PATCH /api/bookings/:id/cancel
register('PATCH', '/api/bookings/:id/cancel', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const bookingID = req.params.id;
  const [[booking]] = await db.query(
    'SELECT * FROM BOOKING WHERE bookingID = ?',
    [bookingID]
  );

  if (!booking) return notFound(send, res, 'Booking not found');
  if (booking.ownerID !== ownerID) return send(res, 403, { error: 'Forbidden' });

  const body = await req.parseBody();
  const reason = body?.cancellationReason || null;

  const groupID =
    booking.bookingGroupID && String(booking.bookingGroupID).trim()
      ? String(booking.bookingGroupID).trim()
      : null;

  let bookingsToCancel = [];

  if (groupID) {
    const [rows] = await db.query(
      `
      SELECT *
      FROM BOOKING
      WHERE ownerID = ?
        AND bookingGroupID = ?
        AND status NOT IN ('completed', 'cancelled', 'rejected')
      ORDER BY startTime ASC
      `,
      [ownerID, groupID]
    );

    bookingsToCancel = rows;
  } else {
    const status = String(booking.status || '').toLowerCase();

    if (['completed', 'cancelled', 'rejected'].includes(status)) {
      return send(res, 409, { error: 'Booking cannot be cancelled' });
    }

    bookingsToCancel = [booking];
  }

  if (!bookingsToCancel.length) {
    return send(res, 409, { error: 'No cancellable bookings found' });
  }

  const bookingIDsToCancel = bookingsToCancel.map((b) => b.bookingID);

  await db.query(
    `
    UPDATE BOOKING
    SET status = ?, cancellationReason = ?
    WHERE bookingID IN (${bookingIDsToCancel.map(() => '?').join(',')})
    `,
    ['cancelled', reason, ...bookingIDsToCancel]
  );

  for (const b of bookingsToCancel) {
    const placeholders = bookingIDsToCancel.map(() => '?').join(',');
    const [activeUsingSlot] = await db.query(
      `
      SELECT bookingID
      FROM BOOKING
      WHERE slotID = ?
        AND bookingID NOT IN (${placeholders})
        AND status IN ('pending', 'accepted', 'completed')
      LIMIT 1
      `,
      [b.slotID, ...bookingIDsToCancel]
    );

    if (!activeUsingSlot.length) {
      await db.query('UPDATE SLOT SET isBooked = FALSE WHERE slotID = ?', [b.slotID]);
    }
  }

  const [updatedRows] = await db.query(
    `
    SELECT *
    FROM BOOKING
    WHERE bookingID IN (${bookingIDsToCancel.map(() => '?').join(',')})
    ORDER BY startTime ASC
    `,
    bookingIDsToCancel
  );

  send(res, 200, updatedRows);
});

// POST /api/bookings/:id/meet-and-greet
register('POST', '/api/bookings/:id/meet-and-greet', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const bookingID = req.params.id;
  const [[booking]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  if (!booking) return notFound(send, res, 'Booking not found');
  if (booking.ownerID !== ownerID) return send(res, 403, { error: 'Forbidden' });

  const body = await req.parseBody();
  const { scheduledTime, isVirtual, meetingLinkOrLocation, note } = body;

  if (!scheduledTime) return send(res, 400, { error: 'scheduledTime is required' });

  const meetID = uuid();
  await db.query(
    `INSERT INTO MEET_AND_GREET (meetID, bookingID, scheduledTime, isVirtual, meetingLinkOrLocation, status)
     VALUES (?, ?, ?, ?, ?, 'Scheduled')`,
    [meetID, bookingID, scheduledTime, isVirtual ? 1 : 0, meetingLinkOrLocation || null]
  );

  if (note && String(note).trim()) {
    await db.query(
      `INSERT INTO MEET_AND_GREET_NOTE (noteID, meetID, content) VALUES (?, ?, ?)`,
      [uuid(), meetID, String(note).trim()]
    );
  }

  const [[row]] = await db.query('SELECT * FROM MEET_AND_GREET WHERE meetID = ?', [meetID]);
  send(res, 201, row);
});

// PATCH /api/bookings/:id/complete
register('PATCH', '/api/bookings/:id/complete', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'minder')) return;

  const sitterID = await getSitterId(db, req.userId);
  if (!sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const bookingID = req.params.id;
  const [[booking]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  if (!booking) return notFound(send, res, 'Booking not found');
  if (booking.sitterID !== sitterID) return send(res, 403, { error: 'Forbidden' });
  if (String(booking.status).toLowerCase() !== 'accepted') {
    return send(res, 409, { error: 'Only accepted bookings can be marked as complete' });
  }

  await db.query('UPDATE BOOKING SET status = ? WHERE bookingID = ?', ['completed', bookingID]);

  try {
    const ownerUserID = await getUserIdForOwner(booking.ownerID);
    const serviceName = await getServiceName(booking.serviceTypeID);
    const minderName = await getMinderName(sitterID);
    const startDate = formatBookingDate(booking.startTime) || '';

    if (ownerUserID) {
      await insertNotification(
        ownerUserID,
        'Visit Complete',
        `Your ${serviceName} session${startDate ? ` on ${startDate}` : ''} with ${minderName} has been completed.`
      );
      await insertNotification(
        ownerUserID,
        'Leave a Review',
        `How was your experience with ${minderName}? Share your feedback to help other pet owners.`
      );
    }
  } catch (notifErr) {
    console.error('Failed to create completion notifications:', notifErr.message);
  }

  const [[updated]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  send(res, 200, updated);
});