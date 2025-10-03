import React, { useState } from 'react';
import axios from 'axios';

export default function SupplierForm({ token }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    axios.post(`${process.env.REACT_APP_API_BASE_URL}/suppliers`, { name, contact_info: contact }, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => alert('Fornitore aggiunto'));
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Nome fornitore" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Contatto" value={contact} onChange={e => setContact(e.target.value)} />
      <button>Aggiungi</button>
    </form>
  );
}