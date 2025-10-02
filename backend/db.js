const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'kisfu4-Jetciw-boztuh',
  database: 'pasticceria_erp'
});
db.connect(err => {
  if (err) console.error('DB error:', err);
  else console.log('Connected to MySQL');
});
module.exports = db;