const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Rotta di login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  global.db.query(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, results) => {
      if (err) return res.status(500).send('Errore server');

      if (results.length === 0) {
        return res.status(401).send('Credenziali errate');
      }

      const user = results[0];

      const token = jwt.sign(
        { id: user.id, role: user.is_admin ? 'admin' : 'user', username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.json({ token });
    }
  );
});

module.exports = router;
