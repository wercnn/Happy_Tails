// server/routes/pets.js
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

const mapMedicalDocument = (row) => ({
  id: row.docID,
  name: row.fileName,
  url: row.fileURL,
  description: row.description || null,
  uploadedAt: row.uploadedAt,
});

const getMedicalDocumentsByPetId = async (petID) => {
  const [rows] = await db.query(
    `SELECT docID, fileName, fileURL, description, uploadedAt
     FROM MEDICAL_DOCUMENT
     WHERE petID = ?
     ORDER BY uploadedAt DESC`,
    [petID]
  );

  return rows.map(mapMedicalDocument);
};


// ─────────────────────────────────────────────
// POST /api/pets → create pet
// ─────────────────────────────────────────────
register('POST', '/api/pets', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const body = await req.parseBody();
  // Example:
  // {
  //   name: 'Buddy',
  //   species: 'Dog',
  //   breed: 'Golden Retriever',
  //   age: 3,
  //   weight: 28.5,
  //   neutered: true,
  //   routines: 'Morning walk at 8am. Dinner at 6pm.',
  //   photoURL: '...',
  //   medicalDocuments: [{ name: 'vax.pdf', url: '...', uploadedAt: '...' }]
  // }
  const {
    name,
    species,
    breed,
    age,
    weight,
    neutered,
    routines,
    photoURL,
    medicalDocuments = [],
  } = body;

  if (!name || !species) {
    return badRequest(send, res, 'name and species are required');
  }

  const petID = uuid();

  await db.query(
    `INSERT INTO PET_PROFILE
      (petID, ownerID, name, species, breed, age, weight, neutered, routines)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [petID, ownerID, name, species, breed, age, weight, !!neutered, routines]
  );

  if (photoURL) {
    await db.query(
      'INSERT INTO PET_PHOTO (photoID, petID, fileURL) VALUES (?, ?, ?)',
      [uuid(), petID, photoURL]
    );
  }

  if (Array.isArray(medicalDocuments) && medicalDocuments.length) {
    for (const doc of medicalDocuments) {
      if (!doc?.name || !doc?.url) continue;

      await db.query(
        `INSERT INTO MEDICAL_DOCUMENT
          (docID, petID, fileURL, fileName, description, uploadedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          uuid(),
          petID,
          doc.url,
          doc.name,
          doc.description || null,
          doc.uploadedAt || new Date(),
        ]
      );
    }
  }

  const [rows] = await db.query(
    'SELECT * FROM PET_PROFILE WHERE petID = ?',
    [petID]
  );
  const [photos] = await db.query(
    'SELECT fileURL FROM PET_PHOTO WHERE petID = ? ORDER BY uploadedAt DESC LIMIT 1',
    [petID]
  );
  const documents = await getMedicalDocumentsByPetId(petID);

  send(res, 201, {
    ...rows[0],
    photo: photos[0]?.fileURL || null,
    medicalDocuments: documents,
  });
});


// ─────────────────────────────────────────────
// GET /api/pets → list pets for owner
// ─────────────────────────────────────────────
register('GET', '/api/pets', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const [rows] = await db.query(
    `SELECT p.*, ph.fileURL AS photo
     FROM PET_PROFILE p
     LEFT JOIN PET_PHOTO ph ON ph.petID = p.petID
     WHERE p.ownerID = ?
     ORDER BY p.name`,
    [ownerID]
  );

  send(res, 200, rows);
});


// ─────────────────────────────────────────────
// GET /api/pets/:id → single pet
// ─────────────────────────────────────────────
register('GET', '/api/pets/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const petID = req.params.id;

  const [rows] = await db.query(
    `SELECT p.*, ph.fileURL AS photo
     FROM PET_PROFILE p
     LEFT JOIN PET_PHOTO ph ON ph.petID = p.petID
     WHERE p.petID = ? AND p.ownerID = ?`,
    [petID, ownerID]
  );

  if (!rows.length) return notFound(send, res, 'Pet not found');

  const documents = await getMedicalDocumentsByPetId(petID);

  send(res, 200, {
    ...rows[0],
    medicalDocuments: documents,
  });
});


// ─────────────────────────────────────────────
// PATCH /api/pets/:id → update pet
// ─────────────────────────────────────────────
register('PATCH', '/api/pets/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const petID = req.params.id;
  const [existing] = await db.query(
    'SELECT petID FROM PET_PROFILE WHERE petID = ? AND ownerID = ?',
    [petID, ownerID]
  );
  if (!existing.length) return notFound(send, res, 'Pet not found');

  const body = await req.parseBody();
  const { photoURL, medicalDocuments } = body;

  const fields = ['name', 'species', 'breed', 'age', 'weight', 'neutered', 'routines'];
  const sets = [];
  const params = [];

  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(body, f)) {
      sets.push(`${f} = ?`);
      params.push(f === 'neutered' ? !!body[f] : body[f]);
    }
  }

  if (!sets.length && !photoURL && !Array.isArray(medicalDocuments)) {
    return badRequest(send, res, 'No updatable fields provided');
  }

  if (sets.length) {
    params.push(petID, ownerID);
    await db.query(
      `UPDATE PET_PROFILE
       SET ${sets.join(', ')}
       WHERE petID = ? AND ownerID = ?`,
      params
    );
  }

  if (photoURL) {
    const [existingPhoto] = await db.query(
      'SELECT photoID FROM PET_PHOTO WHERE petID = ?',
      [petID]
    );

    if (existingPhoto.length) {
      await db.query(
        'UPDATE PET_PHOTO SET fileURL = ?, uploadedAt = CURRENT_TIMESTAMP WHERE petID = ?',
        [photoURL, petID]
      );
    } else {
      await db.query(
        'INSERT INTO PET_PHOTO (photoID, petID, fileURL) VALUES (?, ?, ?)',
        [uuid(), petID, photoURL]
      );
    }
  }

  if (Array.isArray(medicalDocuments)) {
    await db.query('DELETE FROM MEDICAL_DOCUMENT WHERE petID = ?', [petID]);

    for (const doc of medicalDocuments) {
      if (!doc?.name || !doc?.url) continue;

      await db.query(
        `INSERT INTO MEDICAL_DOCUMENT
          (docID, petID, fileURL, fileName, description, uploadedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          uuid(),
          petID,
          doc.url,
          doc.name,
          doc.description || null,
          doc.uploadedAt || new Date(),
        ]
      );
    }
  }

  const [rows] = await db.query(
    'SELECT * FROM PET_PROFILE WHERE petID = ? AND ownerID = ?',
    [petID, ownerID]
  );
  const [photos] = await db.query(
    'SELECT fileURL FROM PET_PHOTO WHERE petID = ? ORDER BY uploadedAt DESC LIMIT 1',
    [petID]
  );
  const documents = await getMedicalDocumentsByPetId(petID);

  send(res, 200, {
    ...rows[0],
    photo: photos[0]?.fileURL || null,
    medicalDocuments: documents,
  });
});


// ─────────────────────────────────────────────
// GET /api/pets/:id/health → get health data
// ─────────────────────────────────────────────
register('GET', '/api/pets/:id/health', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const petID = req.params.id;

  const [pet] = await db.query(
    'SELECT petID FROM PET_PROFILE WHERE petID = ? AND ownerID = ?',
    [petID, ownerID]
  );
  if (!pet.length) return notFound(send, res, 'Pet not found');

  const [rows] = await db.query(
    'SELECT * FROM HEALTH_DATA WHERE petID = ?',
    [petID]
  );
  send(res, 200, rows[0] || null);
});


// ─────────────────────────────────────────────
// POST /api/pets/:id/health → upsert health data
// ─────────────────────────────────────────────
register('POST', '/api/pets/:id/health', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const petID = req.params.id;

  const [pet] = await db.query(
    'SELECT petID FROM PET_PROFILE WHERE petID = ? AND ownerID = ?',
    [petID, ownerID]
  );
  if (!pet.length) return notFound(send, res, 'Pet not found');

  const body = await req.parseBody();
  const {
    dietaryNeeds,
    medications,
    vaccinationInfo,
    allergies,
    requiresMedication,
    medicalNotes,
    vaccinated,
  } = body;

  const [existing] = await db.query(
    'SELECT healthID FROM HEALTH_DATA WHERE petID = ?',
    [petID]
  );

  if (existing.length) {
    await db.query(
      `UPDATE HEALTH_DATA
       SET dietaryNeeds = ?, medications = ?, vaccinationInfo = ?, allergies = ?,
           requiresMedication = ?, medicalNotes = ?, vaccinated = ?
       WHERE petID = ?`,
      [
        dietaryNeeds || null,
        medications || null,
        vaccinationInfo || null,
        allergies || null,
        !!requiresMedication,
        medicalNotes || null,
        !!vaccinated,
        petID,
      ]
    );
  } else {
    await db.query(
      `INSERT INTO HEALTH_DATA
        (healthID, petID, dietaryNeeds, medications, vaccinationInfo, allergies, requiresMedication, medicalNotes, vaccinated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid(),
        petID,
        dietaryNeeds || null,
        medications || null,
        vaccinationInfo || null,
        allergies || null,
        !!requiresMedication,
        medicalNotes || null,
        !!vaccinated,
      ]
    );
  }

  const [rows] = await db.query(
    'SELECT * FROM HEALTH_DATA WHERE petID = ?',
    [petID]
  );
  send(res, 200, rows[0]);
});


// ─────────────────────────────────────────────
// DELETE /api/pets/:id → delete pet
// ─────────────────────────────────────────────
register('DELETE', '/api/pets/:id', async (req, res, send) => {
  if (!requireUser(req, send, res)) return;
  if (!requireRole(req, send, res, 'owner')) return;

  const ownerID = await getOwnerId(db, req.userId);
  if (!ownerID) return send(res, 403, { error: 'Owner profile not found' });

  const petID = req.params.id;

  const [petRows] = await db.query(
    'SELECT petID FROM PET_PROFILE WHERE petID = ? AND ownerID = ?',
    [petID, ownerID]
  );
  if (!petRows.length) return notFound(send, res, 'Pet not found');

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [bookingRows] = await connection.query(
      'SELECT bookingID FROM BOOKING WHERE petID = ?',
      [petID]
    );
    const bookingIDs = bookingRows.map((row) => row.bookingID);

    if (bookingIDs.length) {
      const placeholders = bookingIDs.map(() => '?').join(',');

      await connection.query(
        `DELETE FROM DISPUTE WHERE bookingID IN (${placeholders})`,
        bookingIDs
      );
      await connection.query(
        `DELETE FROM INCIDENT_REPORT WHERE bookingID IN (${placeholders})`,
        bookingIDs
      );
      await connection.query(
        `DELETE FROM BOOKING WHERE bookingID IN (${placeholders})`,
        bookingIDs
      );
    }

    await connection.query(
      'DELETE FROM PET_PROFILE WHERE petID = ? AND ownerID = ?',
      [petID, ownerID]
    );

    await connection.commit();
    send(res, 200, { ok: true });
  } catch (err) {
    await connection.rollback();
    console.error(`Error on DELETE /api/pets/${petID}:`, err.message);
    send(res, 500, { error: 'Failed to delete pet' });
  } finally {
    connection.release();
  }
});