// server/routes/pets.js
const { randomUUID } = require('crypto');
const { register } = require('../router');
const db = require('../db');

// helper: get ownerID from userID
async function getOwnerID(userID) {
  const [rows] = await db.query(
    'SELECT ownerID FROM PET_OWNER WHERE userID = ?',
    [userID]
  );
  return rows[0] ? rows[0].ownerID : null;
}


// ─────────────────────────────────────────────
// POST /api/pets → create pet
// ─────────────────────────────────────────────
register('POST', '/api/pets', async (req, res, send) => {
  if (!req.requireRole('Owner')) return;

  const userID = req.userId;
  console.log("USER ID:", userID);

  const ownerID = await getOwnerID(userID);

  if (!ownerID) {
    return send(res, 404, { error: 'Owner profile not found' });
  }

  const body = await req.parseBody();
  const { name, species, breed, age, weight } = body;

  if (!name || !species) {
    return send(res, 400, { error: 'name and species required' });
  }

  const petID = randomUUID();

  await db.query(
    `INSERT INTO PET_PROFILE (petID, ownerID, name, species, breed, age, weight)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [petID, ownerID, name, species, breed || null, age || null, weight || null]
  );

  send(res, 201, { petID, message: 'Pet created' });
});


// ─────────────────────────────────────────────
// GET /api/pets → list pets for owner
// ─────────────────────────────────────────────
register('GET', '/api/pets', async (req, res, send) => {
  if (!req.requireRole('Owner')) return;

  const userID = req.headers['x-user-id'];
  console.log("USER ID:", userID);
  const ownerID = await getOwnerID(userID);

  if (!ownerID) {
    return send(res, 404, { error: 'Owner profile not found' });
  }

  const [rows] = await db.query(
    'SELECT * FROM PET_PROFILE WHERE ownerID = ?',
    [ownerID]
  );

  send(res, 200, rows);
});


// ─────────────────────────────────────────────
// GET /api/pets/:id → single pet
// ─────────────────────────────────────────────
register('GET', '/api/pets/:id', async (req, res, send) => {
  if (!req.requireRole('Owner')) return;

  const userID = req.userId;
  const ownerID = await getOwnerID(userID);
  const petID = req.params.id;

  const [rows] = await db.query(
    'SELECT * FROM PET_PROFILE WHERE petID = ? AND ownerID = ?',
    [petID, ownerID]
  );

  if (rows.length === 0) {
    return send(res, 404, { error: 'Pet not found' });
  }

  send(res, 200, rows[0]);
});


// ─────────────────────────────────────────────
// PATCH /api/pets/:id → update pet
// ─────────────────────────────────────────────
register('PATCH', '/api/pets/:id', async (req, res, send) => {
  if (!req.requireRole('Owner')) return;

  const userID = req.userId;
  const ownerID = await getOwnerID(userID);
  const petID = req.params.id;

  const body = await req.parseBody();
  const { name, species, breed, age, weight } = body;

  const fields = [];
  const params = [];

  if (name !== undefined)    { fields.push('name = ?'); params.push(name); }
  if (species !== undefined) { fields.push('species = ?'); params.push(species); }
  if (breed !== undefined)   { fields.push('breed = ?'); params.push(breed); }
  if (age !== undefined)     { fields.push('age = ?'); params.push(age); }
  if (weight !== undefined)  { fields.push('weight = ?'); params.push(weight); }

  if (fields.length === 0) {
    return send(res, 400, { error: 'No fields to update' });
  }

  params.push(petID, ownerID);

  const [result] = await db.query(
    `UPDATE PET_PROFILE SET ${fields.join(', ')} WHERE petID = ? AND ownerID = ?`,
    params
  );

  if (result.affectedRows === 0) {
    return send(res, 404, { error: 'Pet not found or not yours' });
  }

  send(res, 200, { message: 'Pet updated' });
});


// ─────────────────────────────────────────────
// DELETE /api/pets/:id → delete pet
// ─────────────────────────────────────────────
register('DELETE', '/api/pets/:id', async (req, res, send) => {
  if (!req.requireRole('Owner')) return;

  const userID = req.userId;
  const ownerID = await getOwnerID(userID);
  const petID = req.params.id;

  const [result] = await db.query(
    'DELETE FROM PET_PROFILE WHERE petID = ? AND ownerID = ?',
    [petID, ownerID]
  );

  if (result.affectedRows === 0) {
    return send(res, 404, { error: 'Pet not found or not yours' });
  }

  send(res, 200, { message: 'Pet deleted' });
});