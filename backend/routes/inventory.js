
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Aggiunta movimento inventario
router.post('/add', auth, (req, res) => {
  const { product_id, quantity, movement_type } = req.body;
  const q = 'INSERT INTO inventory_movements (product_id, quantity, movement_type) VALUES (?, ?, ?)';
  db.query(q, [product_id, quantity, movement_type], (err) => {
    if (err) return res.status(500).send('Errore movimento inventario');
    res.send('Movimento registrato');
  });
});

// Elenco prodotti con saldo scorte
router.get('/stock', auth, (req, res) => {
  const q = `
    SELECT p.id, p.name, p.category, p.unit, p.unit_price,
           IFNULL(SUM(CASE WHEN m.movement_type = 'IN' THEN m.quantity ELSE 0 END),0)
         - IFNULL(SUM(CASE WHEN m.movement_type = 'OUT' THEN m.quantity ELSE 0 END),0) AS stock
    FROM products p
    LEFT JOIN inventory_movements m ON p.id = m.product_id
    GROUP BY p.id
  `;
  db.query(q, (err, results) => {
    if (err) return res.status(500).send('Errore nel recupero scorte');
    res.json(results);
  });
});

module.exports = router;
