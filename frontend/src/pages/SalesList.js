import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function SalesList({ token }) {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/sales`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setSales(res.data));
  }, [token]);

  return (
    <div>
      <h3>Vendite recenti</h3>
      <ul>
        {sales.map((s, i) => (
          <li key={i}>
            {s.sale_date}: {s.name} – {s.quantity} pz
          </li>
        ))}
      </ul>
    </div>
  );
}