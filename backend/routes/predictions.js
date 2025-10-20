const express = require('express');
const router = express.Router();
const axios = require('axios');

// Festività italiane
const HOLIDAYS = {
  '01-01': { name: 'Capodanno', multiplier: 1.8 },
  '01-06': { name: 'Epifania', multiplier: 1.6 },
  '04-25': { name: 'Liberazione', multiplier: 1.4 },
  '05-01': { name: 'Festa Lavoro', multiplier: 1.5 },
  '06-02': { name: 'Festa Repubblica', multiplier: 1.3 },
  '08-15': { name: 'Ferragosto', multiplier: 1.7 },
  '11-01': { name: 'Ognissanti', multiplier: 1.4 },
  '12-08': { name: 'Immacolata', multiplier: 1.5 },
  '12-24': { name: 'Vigilia Natale', multiplier: 2.0 },
  '12-25': { name: 'Natale', multiplier: 1.9 },
  '12-26': { name: 'Santo Stefano', multiplier: 1.7 },
  '12-31': { name: 'San Silvestro', multiplier: 1.8 }
};

// Middleware di autenticazione
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token non fornito' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token non valido' });
  }
};

// Helper per serializzare/deserializzare JSON
const serializeJSON = (obj) => {
  try {
    return typeof obj === 'string' ? obj : JSON.stringify(obj);
  } catch (error) {
    console.error('JSON serialization error:', error);
    return '{}';
  }
};

const parseJSON = (str) => {
  try {
    return typeof str === 'string' ? JSON.parse(str) : str || {};
  } catch (error) {
    console.error('JSON parsing error:', error, 'String:', str);
    return {};
  }
};

// 1. Salva dati vendite per training
router.post('/sales-data', authenticateToken, (req, res) => {
  const { date, products, weather, temperature, is_holiday, total_sales } = req.body;
  
  // Validazione
  if (!date || !products || total_sales === undefined) {
    return res.status(400).json({ error: 'Campi obbligatori: date, products, total_sales' });
  }

  const query = `
    INSERT INTO sales_history 
    (date, products, weather, temperature, is_holiday, total_sales) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.query(query, [
    date, 
    serializeJSON(products),  // Serializza invece di JSON.stringify
    weather || 'unknown',
    temperature || 20,
    is_holiday || false,
    total_sales
  ], (err, results) => {
    if (err) {
      console.error('Error saving sales data:', err);
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    res.json({ 
      message: 'Dati vendita salvati con successo',
      id: results.insertId 
    });
  });
});

// 2. Predizione per i prossimi N giorni
router.get('/predict/:days', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 7;
    
    if (days > 30) {
      return res.status(400).json({ error: 'Massimo 30 giorni di predizione' });
    }

    const predictions = [];
    
    for (let i = 1; i <= days; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      
      const prediction = await generatePrediction(targetDate);
      predictions.push(prediction);
    }
    
    res.json({
      success: true,
      predictions: predictions,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ 
      error: 'Errore nella generazione predizioni',
      details: error.message 
    });
  }
});

// 3. Statistiche sistema predittivo
router.get('/stats', authenticateToken, (req, res) => {
  const queries = {
    totalRecords: 'SELECT COUNT(*) as count FROM sales_history',
    dateRange: 'SELECT MIN(date) as first_date, MAX(date) as last_date FROM sales_history',
    accuracy: `
      SELECT 
        AVG(confidence) as avg_confidence,
        COUNT(*) as prediction_count 
      FROM prediction_logs 
      WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
    `
  };

  db.query(queries.totalRecords, (err, countResult) => {
    if (err) {
      console.error('Error getting stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    db.query(queries.dateRange, (err, rangeResult) => {
      const stats = {
        total_records: countResult[0].count,
        first_date: rangeResult[0].first_date,
        last_date: rangeResult[0].last_date,
        system_status: countResult[0].count > 50 ? 'MATURO' : 'IN TRAINING'
      };

      res.json(stats);
    });
  });
});

// 4. Funzione principale di predizione
async function generatePrediction(date) {
  const weather = await getWeatherData(date);
  const holidayInfo = checkIfHoliday(date);
  const dayOfWeek = date.getDay();
  const season = getSeason(date);
  
  const prediction = await calculatePrediction(date, weather, holidayInfo, dayOfWeek, season);
  
  // Salva log predizione
  logPrediction(date, prediction);
  
  return {
    date: date.toISOString().split('T')[0],
    day_name: getDayName(dayOfWeek),
    weather: {
      temp: weather.temp,
      description: weather.description,
      rain: weather.rain,
      icon: getWeatherIcon(weather.description)
    },
    holiday: holidayInfo,
    season: season,
    predicted_sales: prediction.total,
    product_predictions: prediction.products,
    confidence: prediction.confidence,
    factors: prediction.factors
  };
}

// 5. Calcolo predizione basata su dati storici
async function calculatePrediction(date, weather, holidayInfo, dayOfWeek, season) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM sales_history 
      WHERE 
        (DAYOFWEEK(date) = ? OR is_holiday = ?)
        AND temperature BETWEEN ? AND ?
      ORDER BY date DESC
      LIMIT 100
    `;
    
    db.query(query, [
      dayOfWeek + 1, 
      holidayInfo.is_holiday,
      weather.temp - 3, 
      weather.temp + 3
    ], async (err, historicalData) => {
      if (err) return reject(err);
      
      let prediction;
      
      if (historicalData.length === 0) {
        prediction = await getFallbackPrediction(dayOfWeek, holidayInfo);
      } else {
        prediction = calculateWeightedPrediction(historicalData, weather, holidayInfo, season);
      }
      
      resolve(prediction);
    });
  });
}

// 6. Predizione pesata (AGGIORNATA per TEXT)
function calculateWeightedPrediction(historicalData, weather, holidayInfo, season) {
  let totalSales = 0;
  let productSales = {};
  let weights = 0;
  let factors = [];

  historicalData.forEach(record => {
    const weight = calculateSimilarityWeight(record, weather, holidayInfo, season);
    
    // Usa parseJSON invece di JSON.parse
    const recordProducts = parseJSON(record.products);
    
    totalSales += record.total_sales * weight;
    
    Object.keys(recordProducts).forEach(productId => {
      if (!productSales[productId]) productSales[productId] = 0;
      productSales[productId] += recordProducts[productId] * weight;
    });
    
    weights += weight;
  });

  // Applica moltiplicatori speciali
  const basePrediction = totalSales / weights;
  const finalPrediction = applySpecialMultipliers(basePrediction, weather, holidayInfo, season);
  
  // Calcola prodotti
  const predictedProducts = {};
  Object.keys(productSales).forEach(productId => {
    predictedProducts[productId] = Math.round(productSales[productId] / weights);
  });

  factors.push(`Meteo: ${weather.description}`);
  if (holidayInfo.is_holiday) factors.push(`Festività: ${holidayInfo.name}`);
  factors.push(`Stagione: ${season}`);

  return {
    total: Math.round(finalPrediction),
    products: predictedProducts,
    confidence: Math.min(weights / historicalData.length * 100, 95),
    factors: factors
  };
}

// 7. Calcolo peso similarità (rimane uguale)
function calculateSimilarityWeight(record, weather, holidayInfo, season) {
  let weight = 1.0;
  
  // Similarità temperatura
  const tempDiff = Math.abs(record.temperature - weather.temp);
  weight *= Math.max(0, 1 - tempDiff / 20);
  
  // Festività
  if (record.is_holiday === holidayInfo.is_holiday) {
    weight *= 1.5;
  }
  
  // Pioggia (impatto negativo)
  if (weather.rain > 5) {
    weight *= 0.8;
  }
  
  // Weekend
  const recordDate = new Date(record.date);
  const isRecordWeekend = [0, 6].includes(recordDate.getDay());
  const isTargetWeekend = [0, 6].includes(new Date().getDay());
  
  if (isRecordWeekend === isTargetWeekend) {
    weight *= 1.3;
  }
  
  return Math.max(weight, 0.1);
}

// 8. Applica moltiplicatori speciali (rimane uguale)
function applySpecialMultipliers(basePrediction, weather, holidayInfo, season) {
  let multiplier = 1.0;
  
  // Festività
  if (holidayInfo.is_holiday) {
    multiplier *= holidayInfo.multiplier;
  }
  
  // Meteo
  if (weather.rain > 10) multiplier *= 0.7;  // Forte pioggia
  if (weather.temp > 30) multiplier *= 1.2;   // Caldo estivo
  if (weather.temp < 5) multiplier *= 1.1;    // Freddo invernale
  
  // Stagione
  if (season === 'Estate') multiplier *= 1.15;
  if (season === 'Natale') multiplier *= 1.4;
  
  // Weekend
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 0) multiplier *= 1.3;  // Domenica
  if (dayOfWeek === 6) multiplier *= 1.2;  // Sabato
  
  return basePrediction * multiplier;
}

// 9. Predizione di fallback (AGGIORNATA per TEXT)
async function getFallbackPrediction(dayOfWeek, holidayInfo) {
  return new Promise((resolve) => {
    const query = `
      SELECT 
        AVG(total_sales) as avg_sales
      FROM sales_history 
      WHERE DAYOFWEEK(date) = ?
      GROUP BY DAYOFWEEK(date)
    `;
    
    db.query(query, [dayOfWeek + 1], (err, results) => {
      if (err || results.length === 0) {
        // Fallback ultimo ricorso
        resolve({
          total: holidayInfo.is_holiday ? 800 : 400,
          products: {},
          confidence: 30,
          factors: ['Dati limitati - Predizione base']
        });
        return;
      }
      
      resolve({
        total: Math.round(results[0].avg_sales * (holidayInfo.multiplier || 1)),
        products: {},
        confidence: 60,
        factors: ['Predizione basata su medie giornaliere']
      });
    });
  });
}

// 10. Helper functions (rimangono uguali)
function checkIfHoliday(date) {
  const dateStr = date.toISOString().slice(5, 10); // MM-DD
  const holiday = HOLIDAYS[dateStr];
  
  if (holiday) {
    return {
      is_holiday: true,
      name: holiday.name,
      multiplier: holiday.multiplier
    };
  }
  
  return {
    is_holiday: false,
    name: null,
    multiplier: 1.0
  };
}

function getSeason(date) {
  const month = date.getMonth() + 1;
  if (month === 12) return 'Natale';
  if (month >= 6 && month <= 8) return 'Estate';
  if (month >= 3 && month <= 5) return 'Primavera';
  return 'Inverno';
}

function getDayName(dayIndex) {
  const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  return days[dayIndex];
}

function getWeatherIcon(description) {
  const icons = {
    'clear': '☀️',
    'clouds': '☁️',
    'rain': '🌧️',
    'drizzle': '🌦️',
    'thunderstorm': '⛈️',
    'snow': '❄️',
    'mist': '🌫️'
  };
  
  const key = description.toLowerCase();
  return icons[key] || '🌈';
}

// 11. Integrazione API Meteo (rimane uguale)
async function getWeatherData(date) {
  // Se non abbiamo API key, usa mock data
  if (!process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY === 'bd5bbbee97bf3f5239759c050d5ae224') {
    console.log('Using mock weather data - please configure OPENWEATHER_API_KEY');
    return mockWeatherData(date);
  }

  try {
    const city = process.env.DEFAULT_CITY || 'Canzo';
    const units = process.env.WEATHER_UNITS || 'metric';
    const lang = process.env.WEATHER_LANG || 'it';
    
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=${units}&lang=${lang}`;
    
    console.log('Fetching weather data for:', city);
    const response = await axios.get(url);
    const forecasts = response.data.list;
    
    // Trova previsione più vicina alla data target
    const targetTimestamp = Math.floor(date.getTime() / 1000);
    const closest = forecasts.reduce((prev, curr) => {
      return (Math.abs(curr.dt - targetTimestamp) < Math.abs(prev.dt - targetTimestamp)) ? curr : prev;
    });
    
    return {
      temp: Math.round(closest.main.temp),
      description: closest.weather[0].description,
      rain: closest.rain ? closest.rain['3h'] || 0 : 0,
      humidity: closest.main.humidity,
      wind: closest.wind.speed,
      pressure: closest.main.pressure
    };
    
  } catch (error) {
    console.error('Weather API error:', error.response?.data || error.message);
    console.log('Falling back to mock data');
    return mockWeatherData(date);
  }
}

function mockWeatherData(date) {
  const seasons = {
    'Estate': { temp: 28, desc: 'clear', rain: 0 },
    'Inverno': { temp: 8, desc: 'clouds', rain: 2 },
    'Primavera': { temp: 18, desc: 'clear', rain: 1 },
    'Natale': { temp: 12, desc: 'clouds', rain: 0 }
  };
  
  const season = getSeason(date);
  const baseWeather = seasons[season];
  
  // Variazione random
  const tempVariation = (Math.random() - 0.5) * 10;
  const rainVariation = Math.random() * 5;
  
  return {
    temp: Math.round(baseWeather.temp + tempVariation),
    description: baseWeather.desc,
    rain: Math.max(0, baseWeather.rain + rainVariation),
    humidity: 60 + Math.random() * 30
  };
}

// 12. Log predizioni (AGGIORNATA per TEXT)
function logPrediction(date, prediction) {
  const query = `
    INSERT INTO prediction_logs 
    (prediction_date, predicted_sales, confidence, factors) 
    VALUES (?, ?, ?, ?)
  `;
  
  db.query(query, [
    date,
    prediction.total,
    prediction.confidence,
    serializeJSON(prediction.factors)  // Serializza invece di JSON.stringify
  ], (err) => {
    if (err) console.error('Error logging prediction:', err);
  });
}

// In predictions.js - aggiungi prima di module.exports
router.get('/config-test', authenticateToken, async (req, res) => {
  try {
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 1);
    
    const weatherData = await getWeatherData(testDate);
    const hasApiKey = !!(process.env.OPENWEATHER_API_KEY && process.env.OPENWEATHER_API_KEY !== 'bd5bbbee97bf3f5239759c050d5ae224');
    
    res.json({
      system: 'Sales Prediction System',
      status: 'OK',
      weather_api: {
        configured: hasApiKey,
        key_length: process.env.OPENWEATHER_API_KEY ? process.env.OPENWEATHER_API_KEY.length : 0,
        city: process.env.DEFAULT_CITY || 'Catania'
      },
      test_prediction: {
        date: testDate.toISOString().split('T')[0],
        weather: weatherData,
        using_mock_data: !hasApiKey
      },
      environment: {
        node_env: process.env.NODE_ENV,
        prediction_days: process.env.PREDICTION_DAYS || 7
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Configuration test failed',
      details: error.message
    });
  }
});

// Analisi dati storici per miglioramento algoritmo
router.get('/analyze/:year/:month', authenticateToken, (req, res) => {
  const { year, month } = req.params;
  
  const analysisQueries = {
    // Statistiche base
    basicStats: `
      SELECT 
        COUNT(*) as total_days,
        AVG(total_sales) as avg_sales,
        MIN(total_sales) as min_sales,
        MAX(total_sales) as max_sales,
        SUM(total_sales) as total_revenue
      FROM sales_history 
      WHERE YEAR(date) = ? AND MONTH(date) = ?
    `,
    
    // Analisi per giorno della settimana
    dayAnalysis: `
      SELECT 
        DAYOFWEEK(date) as day_of_week,
        COUNT(*) as days_count,
        AVG(total_sales) as avg_sales,
        AVG(temperature) as avg_temperature
      FROM sales_history 
      WHERE YEAR(date) = ? AND MONTH(date) = ?
      GROUP BY DAYOFWEEK(date)
      ORDER BY day_of_week
    `,
    
    // Impatto meteo
    weatherAnalysis: `
      SELECT 
        CASE 
          WHEN temperature < 10 THEN 'Freddo (<10°C)'
          WHEN temperature BETWEEN 10 AND 20 THEN 'Temperato (10-20°C)'
          WHEN temperature > 20 THEN 'Caldo (>20°C)'
          ELSE 'Non specificato'
        END as temp_range,
        COUNT(*) as days_count,
        AVG(total_sales) as avg_sales
      FROM sales_history 
      WHERE YEAR(date) = ? AND MONTH(date) = ?
      GROUP BY temp_range
      ORDER BY avg_sales DESC
    `,
    
    // Pattern festività
    holidayAnalysis: `
      SELECT 
        is_holiday,
        COUNT(*) as days_count,
        AVG(total_sales) as avg_sales,
        AVG(temperature) as avg_temperature
      FROM sales_history 
      WHERE YEAR(date) = ? AND MONTH(date) = ?
      GROUP BY is_holiday
    `,
    
    // Top prodotti per mese
    productAnalysis: `
      SELECT 
        date,
        products,
        total_sales
      FROM sales_history 
      WHERE YEAR(date) = ? AND MONTH(date) = ?
      ORDER BY date
    `
  };

  // Esegui tutte le query in parallelo
  Promise.all([
    executeQuery(analysisQueries.basicStats, [year, month]),
    executeQuery(analysisQueries.dayAnalysis, [year, month]),
    executeQuery(analysisQueries.weatherAnalysis, [year, month]),
    executeQuery(analysisQueries.holidayAnalysis, [year, month]),
    executeQuery(analysisQueries.productAnalysis, [year, month])
  ])
  .then(([basicStats, dayAnalysis, weatherAnalysis, holidayAnalysis, productAnalysis]) => {
    
    // Analisi avanzata prodotti
    const productTrends = analyzeProductTrends(productAnalysis);
    
    // Identifica pattern
    const patterns = identifySalesPatterns(dayAnalysis, weatherAnalysis, holidayAnalysis);
    
    // Suggerimenti per algoritmo
    const suggestions = generateAlgorithmSuggestions(basicStats, patterns, productTrends);
    
    res.json({
      period: `${month}/${year}`,
      basic_stats: basicStats[0],
      day_analysis: dayAnalysis,
      weather_analysis: weatherAnalysis,
      holiday_analysis: holidayAnalysis,
      product_trends: productTrends,
      patterns: patterns,
      algorithm_suggestions: suggestions,
      data_quality: assessDataQuality(basicStats[0])
    });
  })
  .catch(error => {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Errore nell\'analisi dati' });
  });
});

// Helper per eseguire query
function executeQuery(query, params) {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

// Analizza trend prodotti
function analyzeProductTrends(productData) {
  if (!productData || productData.length === 0) {
    return { error: 'Nessun dato prodotto disponibile' };
  }

  const productTotals = {};
  const productDays = {};
  
  productData.forEach(day => {
    try {
      const products = parseJSON(day.products);
      Object.entries(products).forEach(([product, quantity]) => {
        if (!productTotals[product]) {
          productTotals[product] = 0;
          productDays[product] = 0;
        }
        productTotals[product] += quantity;
        productDays[product]++;
      });
    } catch (error) {
      console.error('Error parsing products:', error);
    }
  });

  // Calcola medie e rank
  const productAverages = Object.keys(productTotals).map(product => ({
    product,
    total_sold: productTotals[product],
    average_per_day: productTotals[product] / productDays[product],
    days_available: productDays[product]
  }));

  // Ordina per vendite
  productAverages.sort((a, b) => b.total_sold - a.total_sold);

  return {
    top_products: productAverages.slice(0, 10),
    total_unique_products: productAverages.length,
    most_consistent: productAverages
      .filter(p => p.days_available > 15) // Disponibile più di 15 giorni
      .sort((a, b) => b.average_per_day - a.average_per_day)
      .slice(0, 5)
  };
}

// Identifica pattern di vendita
function identifySalesPatterns(dayAnalysis, weatherAnalysis, holidayAnalysis) {
  const patterns = {
    best_days: [],
    weather_impact: [],
    holiday_impact: null
  };

  // Pattern giorni della settimana
  if (dayAnalysis && dayAnalysis.length > 0) {
    const sortedDays = [...dayAnalysis].sort((a, b) => b.avg_sales - a.avg_sales);
    patterns.best_days = sortedDays.map(day => ({
      day_number: day.day_of_week,
      day_name: getDayNameFromNumber(day.day_of_week),
      average_sales: day.avg_sales,
      temperature: day.avg_temperature
    }));
  }

  // Pattern meteo
  if (weatherAnalysis && weatherAnalysis.length > 0) {
    patterns.weather_impact = weatherAnalysis.map(weather => ({
      range: weather.temp_range,
      average_sales: weather.avg_sales,
      days_count: weather.days_count
    }));
  }

  // Pattern festività
  if (holidayAnalysis && holidayAnalysis.length > 0) {
    const holidayData = holidayAnalysis.find(h => h.is_holiday);
    const normalData = holidayAnalysis.find(h => !h.is_holiday);
    
    if (holidayData && normalData) {
      patterns.holiday_impact = {
        holiday_sales: holidayData.avg_sales,
        normal_sales: normalData.avg_sales,
        difference: holidayData.avg_sales - normalData.avg_sales,
        multiplier: holidayData.avg_sales / normalData.avg_sales
      };
    }
  }

  return patterns;
}

// Genera suggerimenti per l'algoritmo
function generateAlgorithmSuggestions(basicStats, patterns, productTrends) {
  const suggestions = [];
  const stats = basicStats[0] || {};

  // Analizza variabilità vendite
  const salesRange = stats.max_sales - stats.min_sales;
  const variability = salesRange / stats.avg_sales;

  if (variability > 0.5) {
    suggestions.push({
      type: 'VARIABILITY',
      message: 'Alta variabilità nelle vendite giornaliere',
      recommendation: 'Aumenta il peso dei fattori meteo e festività',
      impact: 'ALTO'
    });
  }

  // Analizza pattern giorni
  if (patterns.best_days && patterns.best_days.length > 0) {
    const bestDay = patterns.best_days[0];
    const worstDay = patterns.best_days[patterns.best_days.length - 1];
    const dayDifference = (bestDay.average_sales - worstDay.average_sales) / worstDay.average_sales;

    if (dayDifference > 0.3) {
      suggestions.push({
        type: 'WEEKDAY_PATTERN',
        message: `Forte differenza tra ${bestDay.day_name} (migliori) e ${worstDay.day_name} (peggiori)`,
        recommendation: 'Aumenta il moltiplicatore per i giorni migliori',
        impact: 'MEDIO'
      });
    }
  }

  // Analizza impatto festività
  if (patterns.holiday_impact && patterns.holiday_impact.multiplier > 1.5) {
    suggestions.push({
      type: 'HOLIDAY_IMPACT',
      message: `Le festività aumentano le vendite del ${Math.round((patterns.holiday_impact.multiplier - 1) * 100)}%`,
      recommendation: 'Mantieni o aumenta i moltiplicatori festività',
      impact: 'ALTO'
    });
  }

  // Analizza prodotti
  if (productTrends.top_products && productTrends.top_products.length > 0) {
    const topProduct = productTrends.top_products[0];
    suggestions.push({
      type: 'PRODUCT_FOCUS',
      message: `Prodotto top: ${topProduct.product} (${topProduct.average_per_day.toFixed(1)}/giorno)`,
      recommendation: 'Considera questo prodotto nelle predizioni di picco',
      impact: 'MEDIO'
    });
  }

  return suggestions;
}

// Valuta qualità dati
function assessDataQuality(stats) {
  if (!stats || stats.total_days === 0) {
    return { quality: 'INSUFFICIENT', message: 'Dati insufficienti per l\'analisi' };
  }

  const quality = {
    total_days: stats.total_days,
    coverage: (stats.total_days / 30) * 100, // Assumendo mese di 30 giorni
    has_weather: stats.avg_temperature ? 'YES' : 'NO',
    has_products: stats.avg_sales > 0 ? 'YES' : 'NO'
  };

  // Assegna rating qualità
  if (quality.coverage >= 80) quality.rating = 'EXCELLENT';
  else if (quality.coverage >= 60) quality.rating = 'GOOD';
  else if (quality.coverage >= 40) quality.rating = 'FAIR';
  else quality.rating = 'POOR';

  return quality;
}

// Helper per nomi giorni
function getDayNameFromNumber(dayNumber) {
  const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  return days[(dayNumber - 1) % 7];
}

module.exports = router;