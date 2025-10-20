import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import OutgoingInvoicesPage from '../pages/OutgoingInvoicesPage';
import SalesPredictionPage from '../pages/SalesPredictionPage';
import DataAnalysisPage from '../pages/DataAnalysisPage';
import DataImportPage from '../pages/DataImportPage';

const Dashboard = () => {
  const [username, setUsername] = useState('');
  const [view, setView] = useState('welcome');
  const navigate = useNavigate(); // AGGIUNGI QUESTA RIGA

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
  }, [navigate]); // AGGIUNGI navigate alle dipendenze

  const renderView = () => {
    switch (view) {
      case 'welcome':
        return (
          <div style={styles.welcome}>
            <h3>Benvenuto {username}!</h3>
            <div style={styles.welcomeGrid}>
              <div style={styles.welcomeCard}>
                <h4>🌤️ Predizioni Vendite</h4>
                <p>Scopri le previsioni di vendita basate su meteo e festività</p>
                <button 
                  onClick={() => setView('predictions')}
                  style={styles.primaryButton}
                >
                  Vai alle Predizioni
                </button>
              </div>
              <div style={styles.welcomeCard}>
                <h4>📄 Fatture</h4>
                <p>Gestisci le fatture in uscita della tua pasticceria</p>
                <button 
                  onClick={() => setView('invoices')}
                  style={styles.secondaryButton}
                >
                  Gestisci Fatture
                </button>
              </div>
              <div style={styles.welcomeCard}>
                <h4>📊 Statistiche</h4>
                <p>Monitora l'andamento del tuo business</p>
                <button 
                  onClick={() => setView('predictions')}
                  style={styles.secondaryButton}
                >
                  Visualizza Statistiche
                </button>
              </div>
              <div style={styles.welcomeCard}>
                <h4>📁 Carica Dati</h4>
                <p>Importa i report giornalieri per alimentare il sistema</p>
                <button 
                  onClick={() => setView('import')}
                  style={styles.secondaryButton}
                >
                  Carica Report
                </button>
              </div>
            </div>
          </div>
        );
      case 'invoices':
        return <OutgoingInvoicesPage />;
      case 'predictions':
        return <SalesPredictionPage />;
      case 'analysis':
        return <DataAnalysisPage />;
      case 'import':
        return <DataImportPage />;

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
        <h2>🍰 ERP Pasticceria</h2>
        <div style={styles.navButtons}>
          <button 
            onClick={() => setView('welcome')} 
            style={view === 'welcome' ? styles.activeButton : styles.navButton}
          >
            🏠 Home
          </button>
          <button 
            onClick={() => setView('predictions')} 
            style={view === 'predictions' ? styles.activeButton : styles.navButton}
          >
            🌤️ Predizioni
          </button>
          <button 
            onClick={() => setView('invoices')} 
            style={view === 'invoices' ? styles.activeButton : styles.navButton}
          >
            📄 Fatture
          </button>
          <button 
            onClick={() => setView('analysis')} 
            style={view === 'analysis' ? styles.activeButton : styles.navButton}
          >
            📊 Analisi Dati
          </button>
          <button 
            onClick={() => setView('import')} 
            style={view === 'import' ? styles.activeButton : styles.navButton}
          >
            📁 Importa Dati
          </button>
          {/*
          <button onClick={() => setView('inventory')}>📦 Inventario</button>
          <button onClick={() => setView('sales')}>💰 Vendite</button>
          <button onClick={() => setView('production')}>👨‍🍳 Produzione</button>
          <button onClick={() => setView('accounting')}>📊 Contabilità</button>
          <button onClick={() => setView('hr')}>👥 Risorse Umane</button>
          */}
          <button 
            onClick={handleLogout} 
            style={styles.logoutButton}
          >
            🚪 Logout
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
    background: 'linear-gradient(135deg, #d2955d 0%, #e6b980 100%)',
    color: '#fff',
    padding: '15px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  navButtons: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  navButton: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.3)',
    padding: '8px 15px',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  activeButton: {
    background: 'rgba(255,255,255,0.3)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.5)',
    padding: '8px 15px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transform: 'scale(1.05)'
  },
  logoutButton: {
    background: 'rgba(180, 70, 70, 0.8)',
    color: 'white',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '20px',
    cursor: 'pointer',
    marginLeft: '10px',
    transition: 'background 0.3s ease'
  },
  main: {
    padding: '20px',
    minHeight: 'calc(100vh - 80px)',
    backgroundColor: '#f5f5f5'
  },
  welcome: {
    textAlign: 'center',
    maxWidth: '1000px',
    margin: '0 auto'
  },
  welcomeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '25px',
    marginTop: '30px'
  },
  welcomeCard: {
    background: 'white',
    padding: '25px',
    borderRadius: '15px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    textAlign: 'center',
    transition: 'transform 0.3s ease'
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 25px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '15px',
    width: '100%',
    transition: 'transform 0.3s ease'
  },
  secondaryButton: {
    background: 'transparent',
    color: '#d2955d',
    border: '2px solid #d2955d',
    padding: '10px 20px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    marginTop: '15px',
    width: '100%',
    transition: 'all 0.3s ease'
  }
};

// Aggiungi hover effects
styles.navButton.onMouseOver = {
  background: 'rgba(255,255,255,0.3)',
  transform: 'scale(1.05)'
};

styles.logoutButton.onMouseOver = {
  background: 'rgba(180, 70, 70, 1)'
};

styles.welcomeCard.onMouseOver = {
  transform: 'translateY(-5px)'
};

styles.primaryButton.onMouseOver = {
  transform: 'scale(1.05)'
};

styles.secondaryButton.onMouseOver = {
  background: '#d2955d',
  color: 'white'
};

export default Dashboard;