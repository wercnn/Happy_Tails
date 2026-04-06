// server/routes/auth.js
const { randomUUID } = require('crypto'); // for generating unique report IDs if you are curious
const { register } = require('../router');
const db = require('../db');

function toText(value) {
  if (value == null) return null;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function isValidIncidentType(value) {
  return ['PetInjury', 'PetIllness', 'LostPet', 'MinderNoShow', 'Other'].includes(value);
}

function isValidSeverityLevel(value) {
  return ['Low', 'Medium', 'High'].includes(value);
}


// post visit reports for ONLY minders
register('POST', '/api/reports/visit', async (req, res, send) => {
  if (!req.requireRole('Minder')) return;

  const { bookingID, taskChecklist, behaviouralNotes, completedAt } = await req.parseBody();

  if (!bookingID) {
    send(res, 400, { error: 'bookingID is required' });
    return;
  }

  const reportID = randomUUID();
  await db.query(
    'INSERT INTO VISIT_REPORT (reportID, bookingID, taskChecklist, behaviouralNotes, completedAt) VALUES (?, ?, ?, ?, ?)',
    [reportID, bookingID, toText(taskChecklist), behaviouralNotes || null, completedAt || null]
  );

  send(res, 201, { reportID, bookingID, taskChecklist, behaviouralNotes, completedAt: completedAt || null, });
});


// get visit report for a booking
register('GET', '/api/reports/visit/:booking_id', async (req, res, send) => {
  if (!req.requireRole(['Owner', 'Minder', 'Support'])) return;

  const bookingID = req.params.booking_id;
  const [rows] = await db.query('SELECT * FROM VISIT_REPORT WHERE bookingID = ?', [bookingID]);
  send(res, 200, rows);
});


// post incident reports
register('POST', '/api/reports/incident', async (req, res, send) => {
  if (!req.requireRole(['Minder', 'Support'])) return;

  const { bookingID, incidentType = 'Other', severityLevel = 'Low', description,
    employeeID: bodyEmployeeID,} = await req.parseBody();

  if (!bookingID) {
    send(res, 400, { error: 'bookingID is required' });
    return;
  } if (!description) {
    send(res, 400, { error: 'description is required' });
    return;
  } if (!isValidIncidentType(incidentType)) {
    send(res, 400, { error: 'incidentType must be one of PetInjury, PetIllness, LostPet, MinderNoShow, Other' });
    return;
  } if (!isValidSeverityLevel(severityLevel)) {
    send(res, 400, { error: 'severityLevel must be one of Low, Medium, High' });
    return;
  }

  let employeeID = bodyEmployeeID;

  // extra safety check for support staff so only those with an employee 
  if (req.userRole === 'Support' && !employeeID) {
    const [supportRows] = await db.query('SELECT employeeID FROM CUSTOMER_SUPPORT WHERE userID = ?', [req.userId]);
    if (supportRows.length === 0) {
      send(res, 403, { error: 'Support user not registered as customer support employee' });
      return;
    }
    employeeID = supportRows[0].employeeID;
  }

  if (!employeeID) {
    send(res, 400, { error: 'employeeID is required when reporting as a Minder' });
    return;
  }

  const incidentID = randomUUID();
  await db.query(
    'INSERT INTO INCIDENT_REPORT (incidentID, bookingID, employeeID, incidentType, severityLevel, description) VALUES (?, ?, ?, ?, ?, ?)',
    [incidentID, bookingID, employeeID, incidentType, severityLevel, description]
  );

  send(res, 201, { incidentID, bookingID, employeeID, incidentType, severityLevel, description, });
});


// get all incident reports for ONLY support staff
register('GET', '/api/reports/incidents', async (req, res, send) => {
  if (!req.requireRole('Support')) return;

  const [rows] = await db.query('SELECT * FROM INCIDENT_REPORT ORDER BY reportedAt DESC');
  send(res, 200, rows);
});