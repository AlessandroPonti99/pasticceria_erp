import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function SalesForm({ token }) {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/inventory`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setProducts(res.data));
  }, [token]);

  const addItem = (product_id) => {
    setItems([...items, { product_id: parseInt(product_id), quantity: 1 }]);
  };

  const submitSale = () => {
    axios.post(`${process.env.REACT_APP_API_BASE_URL}/sales`, { items }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      alert('Vendita registrata!');
      setItems([]);
    });
  };

  return (
    <div>
      <select onChange={e => addItem(e.target.value)}>
        <option>Seleziona prodotto...</option>
        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      <ul>
        {items.map((item, i) => (
          <li key={i}>
            ID prodotto: {item.product_id}
            <input
              type="number"
              value={item.quantity}
              onChange={e => {
                const newItems = [...items];
                newItems[i].quantity = parseInt(e.target.value);
                setItems(newItems);
              }}
            />
          </li>
        ))}
      </ul>

      <button onClick={submitSale}>Registra Vendita</button>
    </div>
  );
}