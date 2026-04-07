const crypto = require('crypto');

// Generate a random UUID (requires Node 14.17+)
function uuid() {
  return crypto.randomUUID();
}

// Send a 400 Bad Request response
function badRequest(send, res, message) {
  return send(res, 400, { error: message });
}

// Send a 404 Not Found response
function notFound(send, res, message) {
  return send(res, 404, { error: message });
}

// Check that a user is authenticated (X-User-Id header is present)
function requireUser(req, send, res) {
  if (!req.userId) {
    send(res, 401, { error: 'Unauthorized: missing X-User-Id header' });
    return false;
  }
  return true;
}

// Check that the logged-in user has the required role(s).
// role can be a single string ('owner' | 'minder' | 'support')
// or an array of strings for endpoints that allow multiple roles.
function requireRole(req, send, res, role) {
  const userRole = String(req.userRole || '').toLowerCase();
  const allowed = Array.isArray(role)
    ? role.map(r => r.toLowerCase()).includes(userRole)
    : userRole === String(role).toLowerCase();

  if (!allowed) {
    send(res, 403, { error: 'Forbidden: insufficient role' });
    return false;
  }
  return true;
}

// Normalise a role string from registration input to a canonical value.
// Returns 'owner' | 'minder' | 'support' | null
function normalizeRole(role) {
  if (!role) return null;
  const r = String(role).toLowerCase();
  if (r === 'owner' || r === 'pet_owner') return 'owner';
  if (r === 'minder' || r === 'pet_minder' || r === 'sitter') return 'minder';
  if (r === 'support' || r === 'customer_support') return 'support';
  return null;
}

// Hash a plaintext password using scrypt.
// Returns a string in the form "salt:derivedKeyHex".
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = process.env.PASSWORD_HASH_SALT || 'happytails-fixed-salt';
    crypto.scrypt(String(password), salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

// Verify a plaintext password against a stored "salt:derivedKeyHex" hash.
function verifyPassword(password, stored) {
  return new Promise((resolve, reject) => {
    const [salt, key] = String(stored).split(':');
    if (!salt || !key) return resolve(false);
    crypto.scrypt(String(password), salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey.toString('hex') === key);
    });
  });
}

// ─── Role-specific profile ID lookups ───────────────────────────────────────

// Return the ownerID for a given userID, or null if the user is not an owner.
async function getOwnerId(db, userId) {
  const [[row]] = await db.query('SELECT ownerID FROM PET_OWNER WHERE userID = ?', [userId]);
  return row?.ownerID || null;
}

// Return the sitterID for a given userID, or null if the user is not a minder.
async function getSitterId(db, userId) {
  const [[row]] = await db.query('SELECT sitterID FROM PET_MINDER WHERE userID = ?', [userId]);
  return row?.sitterID || null;
}

// Return the employeeID for a given userID, or null if the user is not support staff.
async function getEmployeeId(db, userId) {
  const [[row]] = await db.query('SELECT employeeID FROM CUSTOMER_SUPPORT WHERE userID = ?', [userId]);
  return row?.employeeID || null;
}

module.exports = {
  uuid,
  badRequest,
  notFound,
  requireUser,
  requireRole,
  normalizeRole,
  hashPassword,
  verifyPassword,
  getOwnerId,
  getSitterId,
  getEmployeeId,
};
