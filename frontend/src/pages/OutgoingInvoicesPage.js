import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import AddInvoiceDialog from '../components/AddInvoiceDialog';

const OutgoingInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const token = localStorage.getItem('token');
  const user = jwtDecode(token);
  const isAdmin = user.role === 'admin';

  const styles = {
  container: {
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  },
  title: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  addButton: {
    marginBottom: '15px',
    padding: '10px 15px',
    backgroundColor: '#5cb85c',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '30px'
  },
  emitButton: {
    padding: '5px 10px',
    backgroundColor: '#337ab7',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

  const fetchInvoices = () => {
  axios.get(`${process.env.REACT_APP_API_BASE_URL}/invoices/outgoing`, {
    headers: { Authorization: 'Bearer ' + token }
  })
  .then(res => {
    console.log('Fatture ricevute:', res.data);
    setInvoices(res.data);
  })
  .catch((error) => {
    console.error('Errore completo:', error);
    console.error('Dettagli errore:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    alert('Errore nel caricamento delle fatture: ' + (error.response?.data?.error || error.message));
  });
};

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleEmit = (id) => {
    axios.put(`${process.env.REACT_APP_API_BASE_URL}/invoices/outgoing/${id}/emit`, {}, {
      headers: { Authorization: 'Bearer ' + token }
    }).then(fetchInvoices)
      .catch(() => alert('Errore durante emissione'));
  };

  return (
  <div style={styles.container}>
    <h2 style={styles.title}>Fatture in uscita</h2>

    <button onClick={() => setShowDialog(true)} style={styles.addButton}>
      ➕ Aggiungi fattura
    </button>

    <table style={styles.table}>
      <thead>
        <tr>
          <th>Data</th>
          <th>Azienda</th>
          <th>Totale</th>
          <th>Metodo</th>
          <th>Stato</th>
          <th>Azioni</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map(inv => (
          <tr key={inv.id}>
            <td>{new Date(inv.date).toLocaleDateString('it-IT')}</td>
            <td>{inv.company_name}</td>
            <td>{parseFloat(inv.total).toFixed(2)} €</td>
            <td>{inv.payment_method}</td>
            <td>{inv.status}</td>
            <td>
              {isAdmin && inv.status === 'NON emessa' && (
                <button onClick={() => handleEmit(inv.id)} style={styles.emitButton}>
                  Emetti
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {showDialog && <AddInvoiceDialog onClose={() => {
      setShowDialog(false);
      fetchInvoices();
    }} />}
  </div>
);
};

export default OutgoingInvoicesPage;