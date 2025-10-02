
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.post('/', auth, (req, res) => {
  const { type, amount, category, date, description } = req.body;
  db.query(
    'INSERT INTO transactions (type, amount, category, date, description) VALUES (?, ?, ?, ?, ?)',
    [type, amount, category, date, description],
    err => err ? res.status(500).send('Errore transazione') : res.send('Transazione salvata')
  );
});

router.get('/', auth, (req, res) => {
  const { from, to, category } = req.query;
  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params = [];

  if (from) {
    query += ' AND date >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND date <= ?';
    params.push(to);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY date DESC';

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).send('Errore lettura transazioni');
    res.json(results);
  });
});

module.exports = router;
