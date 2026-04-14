// server/routes/reviews.js
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
  getEmployeeId,
} = require('../lib/helpers');

async function getBooking(bookingID) {
  const [[b]] = await db.query('SELECT * FROM BOOKING WHERE bookingID = ?', [bookingID]);
  return b || null;
}

async function isValidSitter(sitterID) {
  const [[sitter]] = await db.query('SELECT sitterID FROM PET_MINDER WHERE sitterID = ?', [sitterID]);
  return !!sitter;
}

// submit review for completed booking
register('POST', '/api/reviews', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const body = await req.parseBody();
  const { bookingID, rating, comment } = body;
  if (!bookingID || rating == null) return badRequest(send, res, 'bookingID and rating are required');

  const parsedRating = Number(rating);
  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return badRequest(send, res, 'rating must be an integer between 1 and 5');
  }

  const booking = await getBooking(bookingID);
  if (!booking) return notFound(send, res, 'Booking not found');
  if (booking.ownerID !== ownerID) return send(res, 403, { error: 'Forbidden' });
  if (String(booking.status).toLowerCase() !== 'completed') {
    return send(res, 409, { error: 'Reviews can only be submitted for completed bookings' });
  }

  const [[existing]] = await db.query('SELECT reviewID FROM REVIEW WHERE bookingID = ?', [bookingID]);
  if (existing) return send(res, 409, { error: 'You have already reviewed this booking' });

  const reviewID = uuid();
  await db.query(
    'INSERT INTO REVIEW (reviewID, bookingID, reviewerUserID, rating, comment) VALUES (?, ?, ?, ?, ?)',
    [reviewID, bookingID, req.userId, parsedRating, comment || null]
  );

  // Recalculate and update the minder's average rating
  await db.query(
    `UPDATE PET_MINDER
     SET ratingAvg = (
       SELECT AVG(R.rating)
       FROM REVIEW R
       JOIN BOOKING B ON B.bookingID = R.bookingID
       WHERE B.sitterID = ?
     )
     WHERE sitterID = ?`,
    [booking.sitterID, booking.sitterID]
  );

  const [[row]] = await db.query('SELECT * FROM REVIEW WHERE reviewID = ?', [reviewID]);
  send(res, 201, row);
});


// get flagged reviews for support staff — MUST be registered before GET /api/reviews/:minder_id
register('GET', '/api/reviews/flagged', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const [rows] = await db.query(
    `SELECT
        F.flagID, F.reviewID, F.flaggerUserID, F.reason, F.status, F.createdAt,
        R.bookingID, R.rating, R.comment, R.createdAt AS reviewCreatedAt
     FROM REVIEW_FLAG F
     JOIN REVIEW R ON R.reviewID = F.reviewID
     WHERE F.status = 'Open'
     ORDER BY F.createdAt DESC`
  );
  send(res, 200, rows);
});

// get all reviews submitted by the currently logged-in owner
register('GET', '/api/reviews/mine', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const [rows] = await db.query(
    `SELECT reviewID, bookingID, rating, comment, createdAt
     FROM REVIEW
     WHERE reviewerUserID = ?
     ORDER BY createdAt DESC`,
    [req.userId]
  );
  send(res, 200, rows);
});

// get reviews for a minder... any bookings in the query
register('GET', '/api/reviews/:minder_id', async (req, res, send) => {
  const sitterID = req.params.minder_id;
  if (!sitterID) return badRequest(send, res, 'minder_id is required');

  const validSitter = await isValidSitter(sitterID);
  if (!validSitter) return notFound(send, res, 'Minder not found');

  const [rows] = await db.query(
    `SELECT R.reviewID, R.bookingID, R.reviewerUserID, R.rating, R.comment, R.createdAt,
            CONCAT(P.firstName, ' ', P.lastName) AS reviewerName
     FROM REVIEW R
     JOIN BOOKING B ON B.bookingID = R.bookingID
     LEFT JOIN USER_PROFILE P ON P.userID = R.reviewerUserID
     WHERE B.sitterID = ?
     ORDER BY R.createdAt DESC`,
    [sitterID]
  );
  send(res, 200, rows);
});


// flag a review for moderation
register('PATCH', '/api/reviews/:id/flag', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, ['owner', 'minder'])) return;

  const reviewID = req.params.id;
  const [[review]] = await db.query('SELECT * FROM REVIEW WHERE reviewID = ?', [reviewID]);
  if (!review) return notFound(send, res, 'Review not found');

  // Only participants in the booking can flag
  const booking = await getBooking(review.bookingID);
  if (!booking) return notFound(send, res, 'Booking not found');

  const role = String(req.userRole || '').toLowerCase();
  const ownerID = role === 'owner' ? await getOwnerId(db, req.userId) : null;
  const sitterID = role === 'minder' ? await getSitterId(db, req.userId) : null;

  if (role === 'owner' && !ownerID) return send(res, 403, { error: 'Owner profile not found' });
  if (role === 'minder' && !sitterID) return send(res, 403, { error: 'Minder profile not found' });

  const allowed = (ownerID && booking.ownerID === ownerID) || (sitterID && booking.sitterID === sitterID);
  if (!allowed) return send(res, 403, { error: 'Forbidden' });

  const body = await req.parseBody();
  // Example: { reason: 'Review contains inaccurate information.' }
  const reason = body?.reason;

  const flagID = uuid();
  await db.query(
    'INSERT INTO REVIEW_FLAG (flagID, reviewID, flaggerUserID, reason, status) VALUES (?, ?, ?, ?, ?)',
    [flagID, reviewID, req.userID, reason, 'Open']
  );
  const [[row]] = await db.query('SELECT * FROM REVIEW_FLAG WHERE flagID = ?', [flagID]);
  send(res, 200, row);
});


// delete a review (support staff only)
register('DELETE', '/api/reviews/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'support')) return;

  const employeeID = await getEmployeeId(db, req.userId);
  if (!employeeID) return send(res, 403, { error: 'Support profile not found' });

  const reviewID = req.params.id;
  const [result] = await db.query('DELETE FROM REVIEW WHERE reviewID = ?', [reviewID]);
  if (!result.affectedRows) return notFound(send, res, 'Review not found');
  send(res, 200, { ok: true });
});
