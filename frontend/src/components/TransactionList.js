import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function TransactionList({ token }) {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [filters, setFilters] = useState({ from: '', to: '', category: '' });

  const loadData = () => {
    axios.get(`${process.env.REACT_APP_API_URL}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters
    }).then(res => setTransactions(res.data));

    axios.get(`${process.env.REACT_APP_API_URL}/transactions/balance`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setBalance(res.data.balance));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      <h3>Saldo attuale: {balance.toFixed(2)} €</h3>

      <div>
        <input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
        <input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} />
        <input placeholder="Categoria" value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} />
        <button onClick={loadData}>Filtra</button>
      </div>

      <ul>
        {transactions.map(t => (
          <li key={t.id}>
            {new Date(t.date).toLocaleString()} – <strong>{t.type === 'income' ? '+' : '-'}</strong> {t.amount} € – {t.description} ({t.category})
          </li>
        ))}
      </ul>
    </div>
  );
}
