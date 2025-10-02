
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.post('/', auth, (req, res) => {
  const { name, role, hire_date, hourly_rate } = req.body;
  db.query(
    'INSERT INTO employees (name, role, hire_date, hourly_rate) VALUES (?, ?, ?, ?)',
    [name, role, hire_date, hourly_rate],
    err => err ? res.status(500).send('Errore inserimento') : res.send('Dipendente salvato')
  );
});

router.get('/', auth, (req, res) => {
  db.query('SELECT * FROM employees ORDER BY name', (err, results) => {
    if (err) return res.status(500).send('Errore lettura');
    res.json(results);
  });
});

router.post('/shifts', auth, (req, res) => {
  const { employee_id, shift_date, start_time, end_time } = req.body;
  db.query(
    'INSERT INTO shifts (employee_id, shift_date, start_time, end_time) VALUES (?, ?, ?, ?)',
    [employee_id, shift_date, start_time, end_time],
    err => err ? res.status(500).send('Errore turno') : res.send('Turno registrato')
  );
});

router.post('/attendances', auth, (req, res) => {
  const { employee_id, date, status } = req.body;
  db.query(
    'INSERT INTO attendances (employee_id, date, status) VALUES (?, ?, ?)',
    [employee_id, date, status],
    err => err ? res.status(500).send('Errore presenza') : res.send('Presenza registrata')
  );
});

router.get('/costs', auth, (req, res) => {
    const q = `
    SELECT e.name, SUM(TIMESTAMPDIFF(HOUR, s.start_time, s.end_time)) AS ore,
           e.hourly_rate, SUM(TIMESTAMPDIFF(HOUR, s.start_time, s.end_time) * e.hourly_rate) AS costo
    FROM shifts s
    JOIN employees e ON s.employee_id = e.id
    GROUP BY e.id
  `;
  db.query(q, (err, results) => {
    if (err) return res.status(500).send('Errore calcolo costi');
    res.json(results);
  });
});

module.exports = router;
