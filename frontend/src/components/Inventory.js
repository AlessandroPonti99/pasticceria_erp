import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Sessione scaduta. Effettua di nuovo il login.');
      window.location.href = '/login';
      return;
    }

    axios.get(`${process.env.REACT_APP_API_URL}/inventory/stock`, {
      headers: { Authorization: 'Bearer ' + token }
    })
    .then(res => setInventory(res.data))
    .catch(() => alert('Errore caricamento inventario'))
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Caricamento inventario...</p>;

  return (
    <div>
      <h2>Inventario</h2>
      {inventory.length === 0 ? (
        <p>Nessun prodotto in magazzino.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Nome prodotto</th>
              <th>Quantità</th>
              <th>Unità</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{parseFloat(item.stock).toFixed(2)}</td>
                <td>{item.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Inventory;