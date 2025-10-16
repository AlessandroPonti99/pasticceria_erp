const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

// Middleware per verificare token e ruolo
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, 'un_super_segreto_sicuro');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).send('Token non valido');
  }
}

// GET - tutte le fatture
router.get('/outgoing', verifyToken, (req, res) => {
  db.query('SELECT * FROM outgoing_invoices ORDER BY date DESC', (err, results) => {
    if (err) return res.status(500).send('Errore database');
    res.json(results);
  });
});

// POST - nuova fattura
router.post('/outgoing', verifyToken, (req, res) => {
  const {
    date, company_name, sdi_code, vat_number,
    address_street, address_number, address_city, address_province, address_cap,
    products, total, payment_method
  } = req.body;

  const sql = `
    INSERT INTO outgoing_invoices
    (date, company_name, sdi_code, vat_number, address_street, address_number, address_city, address_province, address_cap,
     products, total, payment_method, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NON emessa', ?)
  `;

  db.query(sql, [
    date, company_name, sdi_code, vat_number, address_street, address_number, address_city, address_province, address_cap,
    products, total, payment_method, req.user.id
  ], (err) => {
    if (err) return res.status(500).send('Errore inserimento');
    res.sendStatus(200);
  });
});

// PUT - emetti fattura
router.put('/outgoing/:id/emit', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Token post non valido');

  db.query('UPDATE outgoing_invoices SET status = "Emessa" WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send('Errore aggiornamento');
    res.sendStatus(200);
  });
});

module.exports = router;