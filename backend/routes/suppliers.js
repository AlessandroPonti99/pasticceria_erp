const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  db.query('SELECT * FROM suppliers', (err, results) => {
    if (err) return res.status(500).send('Errore DB');
    res.json(results);
  });
});

router.post('/', auth, (req, res) => {
  const { name, contact_info } = req.body;
  db.query('INSERT INTO suppliers (name, contact_info) VALUES (?, ?)', [name, contact_info], err => {
    if (err) return res.status(500).send('Errore inserimento');
    res.send('Fornitore aggiunto');
  });
});

module.exports = router;