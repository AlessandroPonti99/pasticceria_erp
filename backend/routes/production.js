const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/costs', auth, (req, res) => {
  const query = `
    SELECT
      r.id AS recipe_id,
      pf.name AS product_name,
      pf.id AS product_id,
      ri.ingredient_id,
      pi.name AS ingredient_name,
      ri.quantity,
      pi.unit_price
    FROM recipes r
    JOIN products pf ON r.product_id = pf.id
    JOIN recipe_ingredients ri ON ri.recipe_id = r.id
    JOIN products pi ON ri.ingredient_id = pi.id
  `;

  db.query(query, (err, rows) => {
    if (err) return res.status(500).send('Errore calcolo costi');
    const costs = {};
    for (const row of rows) {
      if (!costs[row.recipe_id]) {
        costs[row.recipe_id] = {
          recipe_id: row.recipe_id,
          product_name: row.product_name,
          total_cost: 0,
          details: []
        };
      }
      const ingredient_cost = parseFloat(row.unit_price) * parseFloat(row.quantity);
      costs[row.recipe_id].total_cost += ingredient_cost;
      costs[row.recipe_id].details.push({
        ingredient: row.ingredient_name,
        quantity: row.quantity,
        unit_price: row.unit_price,
        cost: ingredient_cost
      });
    }
    res.json(Object.values(costs));
  });
});

module.exports = router;
