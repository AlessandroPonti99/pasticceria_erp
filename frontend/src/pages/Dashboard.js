import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import OutgoingInvoicesPage from '../pages/OutgoingInvoicesPage';

const Dashboard = () => {
  const [username, setUsername] = useState('');
  const [view, setView] = useState('welcome');

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || token.length < 20) {
      navigate('/login');
    }
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUsername(decoded.username || 'Utente');
      } catch (err) {
        console.error('Token non valido');
        handleLogout();
      }
    }
  }, []);

  const renderView = () => {
    switch (view) {
      case 'welcome':
        return <h3>Benvenuto {username}!</h3>;
      case 'invoices':
        return <OutgoingInvoicesPage />;
      /*case 'inventory':
        return <p>Modulo inventario (disattivato temporaneamente)</p>;
      case 'sales':
        return <p>Modulo vendite (disattivato temporaneamente)</p>;
      case 'accounting':
        return <p>Modulo contabilità (disattivato temporaneamente)</p>;
      case 'production':
        return <p>Modulo produzione (non implementato)</p>;
      case 'hr':
        return <p>Modulo risorse umane (non implementato)</p>;*/
      default:
        return <h3>Benvenuto {username}!</h3>;
    }
  };

  return (
    <div>
      <header style={styles.header}>
        <h2>ERP Pasticceria</h2>
        <div>
          <button onClick={() => setView('invoices')}>Fatture</button>
          <button onClick={() => setView('welcome')}>Home</button>
          {/*<button onClick={() => setView('inventory')}>Inventario</button>
          <button onClick={() => setView('sales')}>Vendite</button>
          <button onClick={() => setView('production')}>Produzione</button>
          <button onClick={() => setView('accounting')}>Contabilità</button>
          <button onClick={() => setView('hr')}>Risorse Umane</button>*/}
          <button onClick={handleLogout} style={{ backgroundColor: '#944', marginLeft: '10px' }}>
            Logout
          </button>
        </div>
      </header>
      <main style={styles.main}>
        {renderView()}
      </main>
    </div>
  );
};

const styles = {
  header: {
    background: '#d2955d',
    color: '#fff',
    padding: '10px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  main: {
    padding: '20px'
  }
};

export default Dashboard;
