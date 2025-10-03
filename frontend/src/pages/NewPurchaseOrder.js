import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function NewPurchaseOrder({ token }) {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/suppliers`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setSuppliers(res.data));
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/inventory`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setProducts(res.data));
  }, [token]);

  const addItem = (product_id) => {
    const product = products.find(p => p.id === parseInt(product_id));
    setItems([...items, { product_id: product.id, quantity: 1, unit_price: 0 }]);
  };

  const sendOrder = () => {
    axios.post(`${process.env.REACT_APP_API_BASE_URL}/purchases/orders`, {
      supplier_id: supplierId,
      items
    }, { headers: { Authorization: `Bearer ${token}` } }).then(() => alert('Ordine inviato'));
  };

  return (
    <div>
      <select onChange={e => setSupplierId(e.target.value)}>
        <option>Seleziona fornitore</option>
        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <select onChange={e => addItem(e.target.value)}>
        <option>Aggiungi prodotto</option>
        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <ul>
        {items.map((item, i) => (
          <li key={i}>
            ID Prodotto: {item.product_id}
            <input type="number" value={item.quantity} onChange={e => {
              const newItems = [...items];
              newItems[i].quantity = parseInt(e.target.value);
              setItems(newItems);
            }} />
            <input type="number" value={item.unit_price} onChange={e => {
              const newItems = [...items];
              newItems[i].unit_price = parseFloat(e.target.value);
              setItems(newItems);
            }} />
          </li>
        ))}
      </ul>
      <button onClick={sendOrder}>Invia Ordine</button>
    </div>
  );
}