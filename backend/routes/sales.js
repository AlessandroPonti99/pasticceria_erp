
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.post('/', auth, (req, res) => {
  const { product_id, quantity, sale_date, total_price } = req.body;
  const q = 'INSERT INTO sales (product_id, quantity, sale_date, total_price) VALUES (?, ?, ?, ?)';
  db.query(q, [product_id, quantity, sale_date, total_price], err => {
    if (err) return res.status(500).send('Errore registrazione vendita');
    res.send('Vendita registrata');
  });

   // Scarico dal magazzino
      const movements = items.map(i => [i.product_id, 'OUT', i.quantity]);
      db.query('INSERT INTO inventory_movements (product_id, movement_type, quantity) VALUES ?', [movements], err3 => {
        if (err3) return res.status(500).send('Errore scarico magazzino');
        res.send('Vendita registrata con successo');
      });

      const totalAmount = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);  // aggiungi `unit_price` se non esiste

      db.query(
        'INSERT INTO transactions (type, description, amount, vat, category) VALUES (?, ?, ?, ?, ?)',
        ['income', 'Vendita al dettaglio', totalAmount, 0, 'Vendite'],
        (err4) => {
          if (err4) console.error('Errore inserimento entrata da vendita:', err4);
        }
      );

});
module.exports = router;
