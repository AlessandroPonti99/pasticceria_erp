# ERP Pasticceria & Bistrot

Questo progetto è una web application ERP per la gestione di:
- Magazzino
- Vendite
- Contabilità
- Produzione
- Risorse Umane

## Tecnologie
- Frontend: React.js
- Backend: Node.js con Express
- Database: MySQL
- Autenticazione: Token JWT

## Moduli attivi
- Login e gestione utenti
- Magazzino
- Vendite
- Contabilità
- Produzione
- Risorse umane

## Struttura
- /backend: codice backend Node.js
- /frontend: codice React.js
- /sql/schema.sql: script per creare le tabelle

## Istruzioni per l'uso
1. Crea un database MySQL vuoto.
2. Esegui lo script in `sql/schema.sql`.
3. Avvia il backend con `npm install && node server.js`.
4. Avvia il frontend con `npm install && npm start` dalla cartella `frontend`.
