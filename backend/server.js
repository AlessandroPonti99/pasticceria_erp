const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const salesRoutes = require('./routes/sales');
const transactionRoutes = require('./routes/transactions');
const productionRoutes = require('./routes/production');
const employeesRoutes = require('./routes/employees');
const supplierRoutes = require('./routes/suppliers');
const purchaseRoutes = require('./routes/purchases');
const invoiceRoutes = require('./routes/invoices');

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

//test
// Route di test********************************
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    routes: [
      '/auth/login',
      '/auth/debug-users',
      '/inventory',
      '/sales'
    ]
  });
});

app.get('/auth/test', (req, res) => {
  res.json({ message: 'Auth routes are working!' });
});

app.post('/auth/test-login', (req, res) => {
  console.log('Test login body:', req.body);
  res.json({ 
    message: 'Test login received',
    receivedData: req.body 
  });
});
//fine route di test **********************************

// DB Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});
global.db = db;

// Routes
app.use('/auth', authRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/sales', salesRoutes);
app.use('/transactions', transactionRoutes);
app.use('/production', productionRoutes);
app.use('/employees', employeesRoutes);
app.use('/suppliers', supplierRoutes);
app.use('/purchases', purchaseRoutes);
app.use('/invoices', invoiceRoutes);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
