import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './SalesPredictionPage.css';

const SalesPredictionPage = () => {
  const [predictions, setPredictions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('predictions');
  const [days, setDays] = useState(7);

  const token = localStorage.getItem('token');
  const user = jwtDecode(token);

  useEffect(() => {
    fetchPredictions();
    fetchStats();
  }, [days]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/predictions/predict/${days}`,
        { headers: { Authorization: 'Bearer ' + token } }
      );
      setPredictions(response.data.predictions || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      alert('Errore nel caricamento delle predizioni: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/predictions/stats`,
        { headers: { Authorization: 'Bearer ' + token } }
      );
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getSalesLevel = (sales) => {
    if (sales > 600) return 'high';
    if (sales > 400) return 'medium';
    return 'low';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence > 80) return '#4CAF50';
    if (confidence > 60) return '#FF9800';
    return '#F44336';
  };

  if (loading) {
    return (
      <div className="predictions-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Analizzo dati meteo e storici per predire le vendite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="predictions-container">
      <div className="predictions-header">
        <h1>🌤️ Predizioni Vendite</h1>
        <p>Sistema intelligente di previsione basato su meteo, festività e dati storici</p>
      </div>

      {/* Stats Banner */}
      {stats && (
        <div className="stats-banner">
          <div className="stat-item">
            <span className="stat-value">{stats.total_records}</span>
            <span className="stat-label">Dati Storici</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.system_status}</span>
            <span className="stat-label">Stato Sistema</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.first_date ? new Date(stats.first_date).toLocaleDateString('it-IT') : 'N/A'}</span>
            <span className="stat-label">Primo Dato</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="controls">
        <div className="days-selector">
          <label>Giorni di predizione:</label>
          <select value={days} onChange={(e) => setDays(parseInt(e.target.value))}>
            <option value={3}>3 giorni</option>
            <option value={7}>7 giorni</option>
            <option value={14}>14 giorni</option>
          </select>
        </div>
        <button onClick={fetchPredictions} className="refresh-btn">
          🔄 Aggiorna
        </button>
      </div>

      {/* Predictions Grid */}
      <div className="predictions-grid">
        {predictions.map((prediction, index) => (
          <div key={index} className={`prediction-card ${getSalesLevel(prediction.predicted_sales)}`}>
            <div className="prediction-header">
              <div className="date">
                <strong>{prediction.day_name}</strong>
                <br />
                {new Date(prediction.date).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'long'
                })}
              </div>
              <div className="weather">
                <span className="weather-icon">{prediction.weather.icon}</span>
                <span className="weather-temp">{prediction.weather.temp}°C</span>
              </div>
            </div>

            {prediction.holiday.is_holiday && (
              <div className="holiday-badge">
                🎉 {prediction.holiday.name}
              </div>
            )}

            <div className="sales-prediction">
              <div className="sales-amount">
                €{prediction.predicted_sales}
              </div>
              <div 
                className="confidence"
                style={{ color: getConfidenceColor(prediction.confidence) }}
              >
                Affidabilità: {Math.round(prediction.confidence)}%
              </div>
            </div>

            <div className="factors">
              <strong>Fattori influenti:</strong>
              <ul>
                {prediction.factors.map((factor, idx) => (
                  <li key={idx}>{factor}</li>
                ))}
              </ul>
            </div>

            {Object.keys(prediction.product_predictions).length > 0 && (
              <div className="products-prediction">
                <strong>Prodotti previsti:</strong>
                <div className="products-list">
                  {Object.entries(prediction.product_predictions)
                    .slice(0, 4)
                    .map(([product, quantity]) => (
                      <div key={product} className="product-item">
                        <span className="product-name">{product}</span>
                        <span className="product-quantity">{quantity} pz</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* System Info */}
      <div className="system-info">
        <h3>ℹ️ Come funziona il sistema</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-icon">🌤️</span>
            <div>
              <strong>Meteo</strong>
              <p>Temperature e pioggia influenzano le vendite</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🎉</span>
            <div>
              <strong>Festività</strong>
              <p>Natale, Pasqua e feste locali aumentano le vendite</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">📊</span>
            <div>
              <strong>Dati Storici</strong>
              <p>Impara dai pattern delle vendite passate</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">📈</span>
            <div>
              <strong>Stagionalità</strong>
              <p>Estate e Natale hanno trend specifici</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPredictionPage;