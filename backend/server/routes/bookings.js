const { register } = require('../router');
const db = require('../db');

register('GET', '/api/bookings', async (req, res, send) => {
	const [rows] = await db.query('SELECT * FROM BOOKING');
	send(res, 200, rows);
});