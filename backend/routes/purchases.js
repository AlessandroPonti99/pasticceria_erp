const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Crea ordine di acquisto
router.post('/orders', auth, (req, res) => {
  const { supplier_id, items } = req.body;
  db.query('INSERT INTO purchase_orders (supplier_id, order_date) VALUES (?, CURDATE())', [supplier_id], (err, result) => {
    if (err) return res.sendStatus(500);
    const order_id = result.insertId;
    const values = items.map(item => [order_id, item.product_id, item.quantity, item.unit_price]);
    db.query('INSERT INTO purchase_items (order_id, product_id, quantity, unit_price) VALUES ?', [values], err2 => {
      if (err2) return res.sendStatus(500);
      res.send('Ordine creato');
    });
  });
});

// Ricevi ordine → carico in magazzino
router.post('/orders/:id/receive', auth, (req, res) => {
  const order_id = req.params.id;
  const q1 = 'UPDATE purchase_orders SET status = "received" WHERE id = ?';
  const q2 = 'SELECT product_id, quantity FROM purchase_items WHERE order_id = ?';
  const q3 = 'INSERT INTO inventory_movements (product_id, movement_type, quantity) VALUES ?';

  db.query(q1, [order_id], err1 => {
    if (err1) return res.sendStatus(500);
    db.query(q2, [order_id], (err2, items) => {
      if (err2) return res.sendStatus(500);
      const movements = items.map(i => [i.product_id, 'IN', i.quantity]);
      db.query(q3, [movements], err3 => {
        if (err3) return res.sendStatus(500);
        res.send('Ordine ricevuto e caricato');
      });
    });
  });

  // Calcola costo totale
  const q4 = 'SELECT SUM(quantity * unit_price) AS total FROM purchase_items WHERE order_id = ?';
  db.query(q4, [order_id], (err4, result) => {
    if (err4) return console.error('Errore calcolo costo acquisto');
    const total = result[0].total || 0;

    db.query(
      'INSERT INTO transactions (type, description, amount, vat, category) VALUES (?, ?, ?, ?, ?)',
      ['expense', `Acquisto ordine #${order_id}`, total, 0, 'Acquisti'],
      err5 => {
        if (err5) console.error('Errore inserimento spesa da acquisto:', err5);
      }
    );
  });

});

module.exports = router;
