const express = require('express');
const router = express.Router();

// Rotta di login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const db = require('../db'); // oppure usa la tua connessione se definita altrove

  db.query(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, results) => {
      if (err) return res.status(500).send('Errore server');

      if (results.length === 0) {
        return res.status(401).send('Credenziali errate');
      }

      const user = results[0];
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ id: user.id, role: user.role, username: user,username }, 'secret_key', { expiresIn: '1d' });

      res.json({ token });
    }
  );
});

module.exports = router;