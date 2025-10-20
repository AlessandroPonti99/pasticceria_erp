import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './DataAnalysisPage.css';

const DataAnalysisPage = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('2024-11');
  const [comparison, setComparison] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    analyzeData();
  }, [selectedMonth]);

  const analyzeData = async () => {
    try {
      setLoading(true);
      const [year, month] = selectedMonth.split('-');
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/predictions/analyze/${year}/${month}`,
        { headers: { Authorization: 'Bearer ' + token } }
      );
      setAnalysis(response.data);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Errore nell\'analisi dati: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const compareWithPrevious = async () => {
    try {
      const [year, month] = selectedMonth.split('-');
      const prevMonth = month === '1' ? '12' : String(parseInt(month) - 1).padStart(2, '0');
      const prevYear = month === '1' ? String(parseInt(year) - 1) : year;
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/predictions/analyze/${prevYear}/${prevMonth}`,
        { headers: { Authorization: 'Bearer ' + token } }
      );
      setComparison(response.data);
    } catch (error) {
      console.error('Comparison error:', error);
    }
  };

  if (loading) {
    return (
      <div className="analysis-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Analizzo i dati di novembre 2024...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="analysis-container">
        <p>Caricamento analisi...</p>
      </div>
    );
  }

  return (
    <div className="analysis-container">
      <div className="analysis-header">
        <h1>📊 Analisi Dati Storici</h1>
        <div className="controls">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-selector"
          >
            <option value="2024-11">Novembre 2024</option>
            <option value="2024-10">Ottobre 2024</option>
            <option value="2024-09">Settembre 2024</option>
            <option value="2024-12">Dicembre 2024</option>
          </select>
          <button onClick={analyzeData} className="analyze-btn">
            🔄 Analizza
          </button>
          <button onClick={compareWithPrevious} className="compare-btn">
            📈 Confronta
          </button>
        </div>
      </div>

      {/* Data Quality */}
      <div className="quality-section">
        <h3>Qualità Dati</h3>
        <div className="quality-grid">
          <div className="quality-item">
            <span className="quality-value">{analysis.data_quality.total_days}</span>
            <span className="quality-label">Giorni con dati</span>
          </div>
          <div className="quality-item">
            <span className="quality-value">{Math.round(analysis.data_quality.coverage)}%</span>
            <span className="quality-label">Copertura mese</span>
          </div>
          <div className="quality-item">
            <span className={`quality-rating ${analysis.data_quality.rating?.toLowerCase()}`}>
              {analysis.data_quality.rating}
            </span>
            <span className="quality-label">Qualità</span>
          </div>
        </div>
      </div>

      {/* Basic Stats */}
      <div className="stats-section">
        <h3>Statistiche Base</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">€{analysis.basic_stats.avg_sales?.toFixed(2)}</div>
            <div className="stat-label">Vendite Medie Giornaliere</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">€{analysis.basic_stats.min_sales?.toFixed(2)}</div>
            <div className="stat-label">Vendite Minime</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">€{analysis.basic_stats.max_sales?.toFixed(2)}</div>
            <div className="stat-label">Vendite Massime</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">€{analysis.basic_stats.total_revenue?.toFixed(2)}</div>
            <div className="stat-label">Fatturato Totale</div>
          </div>
        </div>
      </div>

      {/* Patterns */}
      <div className="patterns-section">
        <h3>Pattern Rilevati</h3>
        
        {/* Giorni della settimana */}
        <div className="pattern-group">
          <h4>📅 Performance per Giorno</h4>
          <div className="days-grid">
            {analysis.patterns.best_days?.map(day => (
              <div key={day.day_number} className="day-card">
                <div className="day-name">{day.day_name}</div>
                <div className="day-sales">€{day.average_sales?.toFixed(2)}</div>
                <div className="day-temp">{day.temperature?.toFixed(1)}°C</div>
              </div>
            ))}
          </div>
        </div>

        {/* Impatto Meteo */}
        <div className="pattern-group">
          <h4>🌤️ Impatto Meteo</h4>
          <div className="weather-grid">
            {analysis.patterns.weather_impact?.map(weather => (
              <div key={weather.range} className="weather-card">
                <div className="weather-range">{weather.range}</div>
                <div className="weather-sales">€{weather.average_sales?.toFixed(2)}</div>
                <div className="weather-days">{weather.days_count} giorni</div>
              </div>
            ))}
          </div>
        </div>

        {/* Impatto Festività */}
        {analysis.patterns.holiday_impact && (
          <div className="pattern-group">
            <h4>🎉 Impatto Festività</h4>
            <div className="holiday-impact">
              <div className="impact-item">
                <span>Giorni normali:</span>
                <strong>€{analysis.patterns.holiday_impact.normal_sales?.toFixed(2)}</strong>
              </div>
              <div className="impact-item">
                <span>Festività:</span>
                <strong>€{analysis.patterns.holiday_impact.holiday_sales?.toFixed(2)}</strong>
              </div>
              <div className="impact-item highlight">
                <span>Differenza:</span>
                <strong>+{Math.round((analysis.patterns.holiday_impact.multiplier - 1) * 100)}%</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Analysis */}
      {analysis.product_trends.top_products && (
        <div className="products-section">
          <h3>🍰 Analisi Prodotti</h3>
          <div className="products-grid">
            {analysis.product_trends.top_products.slice(0, 5).map((product, index) => (
              <div key={product.product} className="product-card">
                <div className="product-rank">#{index + 1}</div>
                <div className="product-name">{product.product}</div>
                <div className="product-stats">
                  <span>{product.average_per_day?.toFixed(1)}/giorno</span>
                  <span>{product.total_sold} totali</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Algorithm Suggestions */}
      <div className="suggestions-section">
        <h3>💡 Suggerimenti Algoritmo</h3>
        <div className="suggestions-list">
          {analysis.algorithm_suggestions?.map((suggestion, index) => (
            <div key={index} className={`suggestion-card ${suggestion.impact.toLowerCase()}`}>
              <div className="suggestion-header">
                <span className="suggestion-type">{suggestion.type}</span>
                <span className={`impact-badge ${suggestion.impact.toLowerCase()}`}>
                  {suggestion.impact}
                </span>
              </div>
              <p className="suggestion-message">{suggestion.message}</p>
              <p className="suggestion-recommendation">
                <strong>Raccomandazione:</strong> {suggestion.recommendation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison */}
      {comparison && (
        <div className="comparison-section">
          <h3>📈 Confronto con Mese Precedente</h3>
          <div className="comparison-grid">
            <div className="comparison-item">
              <span>Vendite Medie:</span>
              <div>
                <span className="current">€{analysis.basic_stats.avg_sales?.toFixed(2)}</span>
                <span className="vs"> vs </span>
                <span className="previous">€{comparison.basic_stats.avg_sales?.toFixed(2)}</span>
              </div>
            </div>
            <div className="comparison-item">
              <span>Variazione:</span>
              <span className={analysis.basic_stats.avg_sales > comparison.basic_stats.avg_sales ? 'positive' : 'negative'}>
                {(((analysis.basic_stats.avg_sales - comparison.basic_stats.avg_sales) / comparison.basic_stats.avg_sales) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnalysisPage;