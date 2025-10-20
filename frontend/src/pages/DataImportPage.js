import React, { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './DataImportPage.css';

const DataImportPage = () => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const token = localStorage.getItem('token');

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    setResults([]);
  };

  const extractDateFromFilename = (filename) => {
    // Estrai data dal nome file: "report 1 novembre 2024.html" -> "2024-11-01"
    const match = filename.match(/(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(\d{4})/i);
    
    if (match) {
      const [, day, month, year] = match;
      const monthMap = {
        'gennaio': '01', 'febbraio': '02', 'marzo': '03', 'aprile': '04',
        'maggio': '05', 'giugno': '06', 'luglio': '07', 'agosto': '08',
        'settembre': '09', 'ottobre': '10', 'novembre': '11', 'dicembre': '12'
      };
      
      const monthNum = monthMap[month.toLowerCase()];
      const dayNum = day.padStart(2, '0');
      
      return `${year}-${monthNum}-${dayNum}`;
    }
    return null;
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const importAllFiles = async () => {
    if (selectedFiles.length === 0) return;

    setImporting(true);
    setProgress(0);
    const importResults = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      try {
        setProgress(((i + 1) / selectedFiles.length) * 100);
        
        const htmlContent = await readFileContent(file);
        const date = extractDateFromFilename(file.name);
        
        if (!date) {
          importResults.push({
            file: file.name,
            success: false,
            error: 'Data non trovata nel nome file'
          });
          continue;
        }

        const response = await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/predictions/import-daily-data`,
          { htmlContent, date },
          { headers: { Authorization: 'Bearer ' + token } }
        );

        importResults.push({
          file: file.name,
          success: true,
          data: response.data
        });

      } catch (error) {
        importResults.push({
          file: file.name,
          success: false,
          error: error.response?.data?.error || error.message
        });
      }
    }

    setResults(importResults);
    setImporting(false);
    setProgress(100);
  };

  const getFileSummary = () => {
    const validFiles = selectedFiles.filter(file => 
      extractDateFromFilename(file.name) !== null
    );
    
    const dates = validFiles.map(file => extractDateFromFilename(file.name));
    const minDate = dates.length > 0 ? Math.min(...dates) : null;
    const maxDate = dates.length > 0 ? Math.max(...dates) : null;

    return {
      total: selectedFiles.length,
      valid: validFiles.length,
      dateRange: minDate && maxDate ? `${minDate} - ${maxDate}` : 'N/A'
    };
  };

  return (
    <div className="import-container">
      <div className="import-header">
        <h1>📁 Importazione Dati Storici</h1>
        <p>Carica i report HTML giornalieri per popolare il database delle predizioni</p>
      </div>

      <div className="upload-section">
        <div className="upload-area">
          <input
            type="file"
            id="file-upload"
            multiple
            accept=".html,.htm"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-upload" className="upload-label">
            📎 Seleziona File HTML
          </label>
          
          {selectedFiles.length > 0 && (
            <div className="files-list">
              <h4>File selezionati ({selectedFiles.length}):</h4>
              <div className="files-grid">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <span className="file-name">{file.name}</span>
                    <span className="file-date">
                      {extractDateFromFilename(file.name) || 'Data non valida'}
                    </span>
                    <span className="file-size">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedFiles.length > 0 && (
          <div className="summary-section">
            <h4>Riepilogo Importazione</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-value">{getFileSummary().total}</span>
                <span className="summary-label">File Totali</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">{getFileSummary().valid}</span>
                <span className="summary-label">File Validi</span>
              </div>
              <div className="summary-item">
                <span className="summary-value">{getFileSummary().dateRange}</span>
                <span className="summary-label">Periodo</span>
              </div>
            </div>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="action-section">
            <button 
              onClick={importAllFiles} 
              disabled={importing}
              className="import-button"
            >
              {importing ? '⏳ Importazione...' : '🚀 Inizia Importazione'}
            </button>
            
            {importing && (
              <div className="progress-section">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="progress-text">
                  {Math.round(progress)}% completato
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="results-section">
          <h3>Risultati Importazione</h3>
          <div className="results-grid">
            {results.map((result, index) => (
              <div key={index} className={`result-card ${result.success ? 'success' : 'error'}`}>
                <div className="result-header">
                  <span className="result-filename">{result.file}</span>
                  <span className={`result-status ${result.success ? 'success' : 'error'}`}>
                    {result.success ? '✅' : '❌'}
                  </span>
                </div>
                
                {result.success ? (
                  <div className="result-details">
                    <div className="result-data">
                      <span>Data: {result.data.data.date}</span>
                      <span>Vendite: €{result.data.data.total_sales}</span>
                      <span>Transazioni: {result.data.data.transaction_count}</span>
                    </div>
                  </div>
                ) : (
                  <div className="result-error">
                    Errore: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="import-summary">
            <h4>Riepilogo Finale</h4>
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-value">
                  {results.filter(r => r.success).length}
                </span>
                <span className="stat-label">Importazioni Riuscite</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {results.filter(r => !r.success).length}
                </span>
                <span className="stat-label">Errori</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  €{results.filter(r => r.success).reduce((sum, r) => sum + (r.data?.data?.total_sales || 0), 0).toFixed(2)}
                </span>
                <span className="stat-label">Vendite Totali</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="instructions-section">
        <h3>📋 Istruzioni</h3>
        <div className="instructions-grid">
          <div className="instruction">
            <span className="instruction-icon">1️⃣</span>
            <div>
              <strong>Prepara i file</strong>
              <p>Assicurati che i file HTML abbiano nomi come "report 1 novembre 2024.html"</p>
            </div>
          </div>
          <div className="instruction">
            <span className="instruction-icon">2️⃣</span>
            <div>
              <strong>Seleziona multipli file</strong>
              <p>Puoi selezionare tutti i file HTML dei report giornalieri insieme</p>
            </div>
          </div>
          <div className="instruction">
            <span className="instruction-icon">3️⃣</span>
            <div>
              <strong>Importa</strong>
              <p>Il sistema estrae automaticamente dati, prodotti e transazioni</p>
            </div>
          </div>
          <div className="instruction">
            <span className="instruction-icon">4️⃣</span>
            <div>
              <strong>Analizza</strong>
              <p>Usa la pagina Analisi Dati per vedere i pattern scoperti</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataImportPage;