// server/routes/reviews.js
const { randomUUID } = require('crypto');
const { register } = require('../router');
const db = require('../db');

function toText(value) {
  if (value == null) return null;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function isValidRating(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

// this was originally the review flag table creation as it didnt exist in the schema when i made this but now that
// it does exist i changed it to match the schema. its not necessary but i thought why not keep it given i already made it
async function ensureReviewFlagTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS REVIEW_FLAG (
      flagID VARCHAR(36) NOT NULL,
      reviewID VARCHAR(36) NOT NULL,
      flaggerUserID VARCHAR(36) NOT NULL,
      reason TEXT,
      status ENUM('Open', 'Resolved', 'Dismissed') NOT NULL DEFAULT 'Open',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT PK_REVIEW_FLAG PRIMARY KEY (flagID),
      CONSTRAINT FK_REVIEW_FLAG_REVIEW FOREIGN KEY (reviewID)
        REFERENCES REVIEW (reviewID) ON DELETE CASCADE
    )
  `);
}

ensureReviewFlagTable().catch(err => {
  console.error('Unable to ensure REVIEW_FLAG table exists:', err.message);
});


// submit review for completed booking
register('POST', '/api/reviews', async (req, res, send) => {
  if (!req.requireRole('Owner')) return;

  const { bookingID, rating, comment } = await req.parseBody();
  const currentUserId = req.headers['x-user-id'] || req.userId;

  if (!bookingID) {
    send(res, 400, { error: 'bookingID is required' });
    return;
  }

  if (!isValidRating(rating)) {
    send(res, 400, { error: 'rating must be an integer between 1 and 5' });
    return;
  }

  const [bookingRows] = await db.query(
    `SELECT bookingID FROM BOOKING
     WHERE bookingID = ?
       AND ownerID = ?
       AND (status = 'Completed' OR endTime < NOW())`,
    [bookingID, currentUserId]
  );

  if (bookingRows.length === 0) {
    send(res, 404, { error: 'Completed booking not found for current owner' });
    return;
  }

  const [existingRows] = await db.query('SELECT reviewID FROM REVIEW WHERE bookingID = ?', [bookingID]);
  if (existingRows.length > 0) {
    send(res, 409, { error: 'A review has already been submitted for this booking' });
    return;
  }

  const reviewID = randomUUID();
  await db.query(
    'INSERT INTO REVIEW (reviewID, bookingID, reviewerUserID, rating, comment) VALUES (?, ?, ?, ?, ?)',
    [reviewID, bookingID, currentUserId, rating, toText(comment)]
  );

  send(res, 201, { reviewID, bookingID, reviewerUserID: currentUserId, rating, comment: comment || null, });
});


// get reviews for a minder... only completed bookings in the query
register('GET', '/api/reviews/:minder_id', async (req, res, send) => {
  const minderID = req.params.minder_id;
  const [rows] = await db.query(
    `SELECT r.reviewID, r.bookingID, r.rating, r.comment, r.createdAt
     FROM REVIEW r
     JOIN BOOKING b ON r.bookingID = b.bookingID
     WHERE b.sitterID = ?
       AND (b.status = 'Completed' OR b.endTime < NOW())
     ORDER BY r.createdAt DESC`,
    [minderID]
  );

  send(res, 200, rows);
});


// flag a review
register('PATCH', '/api/reviews/:id/flag', async (req, res, send) => {
  if (!req.requireRole(['Owner', 'Minder', 'Support'])) return;

  const reviewID = req.params.id;
  const { reason } = await req.parseBody();
  const currentUserId = req.headers['x-user-id'] || req.userId;

  const [reviewRows] = await db.query('SELECT reviewID FROM REVIEW WHERE reviewID = ?', [reviewID]);
  if (reviewRows.length === 0) {
    send(res, 404, { error: 'Review not found' });
    return;
  }

  const flagID = randomUUID();
  await db.query(
    `INSERT INTO REVIEW_FLAG (flagID, reviewID, flaggerUserID, reason)
     VALUES (?, ?, ?, ?)`,
    [flagID, reviewID, currentUserId, toText(reason)]
  );

  send(res, 200, { reviewID, flaggerUserID: currentUserId, reason: reason || null, status: 'Open' });
});


// get flagged reviews for support staff
register('GET', '/api/reviews/flagged', async (req, res, send) => {
  if (!req.requireRole('Support')) return;

  const [rows] = await db.query(
    `SELECT r.reviewID, r.bookingID, r.reviewerUserID, r.rating, r.comment, r.createdAt,
            rf.reason, rf.flaggerUserID, rf.status, rf.createdAt AS flaggedAt
     FROM REVIEW_FLAG rf
     JOIN REVIEW r ON rf.reviewID = r.reviewID
     ORDER BY rf.createdAt DESC`
  );

  send(res, 200, rows);
});


// delete a review (support staff only)
register('DELETE', '/api/reviews/:id', async (req, res, send) => {
  if (!req.requireRole('Support')) return;

  const reviewID = req.params.id;
  const [result] = await db.query('DELETE FROM REVIEW WHERE reviewID = ?', [reviewID]);

  if (result.affectedRows === 0) {
    send(res, 404, { error: 'Review not found' });
    return;
  }

  send(res, 200, { deletedReviewID: reviewID });
});
