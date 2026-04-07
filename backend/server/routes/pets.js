const { register } = require('../router');
const db = require('../db');
const {
  uuid,
  badRequest,
  notFound,
  requireUser,
  requireRole,
  getOwnerId,
} = require('../lib/helpers');

// Create a pet profile
register('POST', '/api/pets', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const body = await req.parseBody();
  const { name, species, breed = null, age = null, weight = null, neutered = false, routines = null } = body;
  if (!name || !species) return badRequest(send, res, 'name and species are required');

  const petID = uuid();
  await db.query(
    'INSERT INTO PET_PROFILE (petID, ownerID, name, species, breed, age, weight, neutered, routines) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [petID, ownerID, name, species, breed, age, weight, !!neutered, routines]
  );

  const [rows] = await db.query('SELECT * FROM PET_PROFILE WHERE petID = ?', [petID]);
  send(res, 201, rows[0]);
});

// List all pets for the logged-in owner
register('GET', '/api/pets', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const [rows] = await db.query('SELECT * FROM PET_PROFILE WHERE ownerID = ? ORDER BY name', [ownerID]);
  send(res, 200, rows);
});

// Get a single pet
register('GET', '/api/pets/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const petID = req.params.id;
  const [rows] = await db.query('SELECT * FROM PET_PROFILE WHERE petID = ? AND ownerID = ?', [petID, ownerID]);
  if (!rows.length) return notFound(send, res, 'Pet not found');
  send(res, 200, rows[0]);
});

// Update pet details
register('PATCH', '/api/pets/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const petID = req.params.id;
  const [existing] = await db.query('SELECT petID FROM PET_PROFILE WHERE petID = ? AND ownerID = ?', [petID, ownerID]);
  if (!existing.length) return notFound(send, res, 'Pet not found');

  const body = await req.parseBody();
  const fields = ['name', 'species', 'breed', 'age', 'weight', 'neutered', 'routines'];
  const sets = [];
  const params = [];
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(body, f)) {
      sets.push(`${f} = ?`);
      params.push(f === 'neutered' ? !!body[f] : body[f]);
    }
  }
  if (!sets.length) return badRequest(send, res, 'No updatable fields provided');

  params.push(petID, ownerID);
  await db.query(`UPDATE PET_PROFILE SET ${sets.join(', ')} WHERE petID = ? AND ownerID = ?`, params);

  const [rows] = await db.query('SELECT * FROM PET_PROFILE WHERE petID = ? AND ownerID = ?', [petID, ownerID]);
  send(res, 200, rows[0]);
});

// Delete a pet profile
register('DELETE', '/api/pets/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const petID = req.params.id;
  const [result] = await db.query('DELETE FROM PET_PROFILE WHERE petID = ? AND ownerID = ?', [petID, ownerID]);
  if (!result.affectedRows) return notFound(send, res, 'Pet not found');
  send(res, 200, { ok: true });
});