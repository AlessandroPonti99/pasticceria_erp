import React, { useState } from 'react';
import axios from 'axios';

const AddInvoiceDialog = ({ onClose }) => {
  const [form, setForm] = useState({
    date: '', company_name: '', sdi_code: '', vat_number: '',
    address_street: '', address_number: '', address_city: '', address_province: '', address_cap: '',
    products: '', total: '', payment_method: 'Contanti'
  });

  const token = localStorage.getItem('token');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post(`${process.env.REACT_APP_API_BASE_URL}/invoices/outgoing`, form, {
      headers: { Authorization: 'Bearer ' + token }
    }).then(() => onClose())
      .catch((error) => {
            console.error(error);
            alert('Errore salvataggio fattura: ' + error.response?.data || error.message);
            
        });

  };

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <h3>Nuova fattura</h3>
        <form onSubmit={handleSubmit}>
          <input name="date" type="date" required onChange={handleChange} />
          <input name="company_name" placeholder="Nome azienda" required onChange={handleChange} />
          <input name="sdi_code" placeholder="Codice SDI" onChange={handleChange} />
          <input name="vat_number" placeholder="Partita IVA" onChange={handleChange} />
          <input name="address_street" placeholder="Via" onChange={handleChange} />
          <input name="address_number" placeholder="Numero civico" onChange={handleChange} />
          <input name="address_city" placeholder="Città" onChange={handleChange} />
          <input name="address_province" placeholder="Provincia" onChange={handleChange} />
          <input name="address_cap" placeholder="CAP" onChange={handleChange} />
          <textarea name="products" placeholder="Prodotti acquistati" onChange={handleChange} />
          <input name="total" type="number" step="0.01" min="0" placeholder="Totale €" required onChange={handleChange} />
          <select name="payment_method" onChange={handleChange}>
            <option value="Contanti">Contanti</option>
            <option value="Carta">Carta</option>
          </select>
          <br />
          <button type="submit">Salva</button>
          <button type="button" onClick={onClose}>Annulla</button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  dialog: {
    background: '#fff', padding: 20, borderRadius: 8, width: 400
  }
};

export default AddInvoiceDialog;
