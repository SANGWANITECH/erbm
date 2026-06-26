# ERBM — Exchange Rate Intelligence Dashboard

> Real-time exchange rate monitoring and financial intelligence system for the Reserve Bank of Malawi.

**Developed by:** Sangwani Phiri | BSc Computer Science, University of Malawi (UNIMA) | RamTech  
**Version:** v1.0.0  
**Status:** ✅ Operational

---

## What It Does

ERBM is an automated financial intelligence platform that continuously monitors Malawi Kwacha exchange rates across 10 currencies. It replaces manual rate checking with an automated pipeline that fetches live data, calculates analytics, detects anomalies, and fires alerts when unusual market conditions are detected.

**Target users:** Reserve Bank of Malawi analysts, monetary policy teams, financial institutions

---

## Key Features

- **Live rate monitoring** — MWK rates against 10 currencies updated every hour
- **Analytics engine** — 24h change, 7-day volatility, moving averages, spread estimation
- **Anomaly detection** — statistical z-score analysis flags unusual rate movements
- **Automated alerts** — threshold breach, high volatility, and anomaly alerts with acknowledgement workflow
- **365-day trend charts** — interactive historical charts with period analytics
- **Professional dashboard** — institutional-grade UI designed for central bank analysts
- **JWT authentication** — secure operator access control

---

## Currencies Tracked

| Currency | Country | Relevance to Malawi |
|----------|---------|---------------------|
| USD | United States | Primary reserve currency, all major imports |
| GBP | United Kingdom | Major donor and development partner |
| EUR | Eurozone | EU aid flows and trade |
| ZAR | South Africa | Largest trading partner, most imports |
| ZMW | Zambia | Regional border trade |
| TZS | Tanzania | Northern border, transit corridor |
| CNY | China | Infrastructure loans, manufactured goods |
| MZN | Mozambique | Eastern border, Nacala port corridor |
| INR | India | Indian business diaspora, tea/tobacco trade |
| AED | UAE | Dubai re-export hub for goods into Malawi |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Data fetching | Python, requests, APScheduler |
| Data processing | pandas, NumPy |
| ML / Analytics | scikit-learn, statistical anomaly detection |
| Backend API | FastAPI, SQLAlchemy, JWT Auth |
| Database | PostgreSQL 14 |
| Frontend | React 18, TypeScript, Vite |
| Charts | Recharts |
| Data source | ExchangeRate-API (interbank mid-market rates) |

---

## Project Structure

```
erbm/
├── backend/
│   ├── main.py              # FastAPI app + hourly scheduler
│   ├── fetcher.py           # Live rate fetcher from ExchangeRate-API
│   ├── processor.py         # Analytics engine (volatility, change, averages)
│   ├── alert_engine.py      # Automated alert detection and firing
│   ├── seed_history.py      # Seeds 365 days of historical MWK data
│   ├── models.py            # SQLAlchemy database models
│   ├── database.py          # Database connection
│   └── routers/
│       ├── auth.py          # Authentication endpoints
│       ├── rates.py         # Rate data endpoints
│       └── alerts.py        # Alert management endpoints
└── frontend/
    └── src/
        ├── pages/
        │   ├── Dashboard.tsx    # Overview with live rates table
        │   ├── RatesTable.tsx   # Full sortable rates table
        │   ├── Charts.tsx       # Historical trend charts
        │   └── Alerts.tsx       # Alert management
        ├── components/
        │   └── Layout.tsx       # App shell with navigation
        ├── api/                 # Axios API clients
        └── store/               # Zustand auth store
```

---

## Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ (via nvm recommended)
- PostgreSQL 14+

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `.env` file:
```
DATABASE_URL=postgresql://erbm_user:your_password@localhost:5432/erbm_db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
EXCHANGE_API_KEY=your-exchangerate-api-key
EXCHANGE_API_BASE=https://v6.exchangerate-api.com/v6
```

Get a free API key at [exchangerate-api.com](https://app.exchangerate-api.com) — free tier gives 1500 requests/month, sufficient for hourly updates.

Setup database:
```bash
sudo -u postgres psql -c "CREATE DATABASE erbm_db;"
sudo -u postgres psql -c "CREATE USER erbm_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE erbm_db TO erbm_user;"
python3 create_tables.py
python3 seed_history.py   # Seeds 365 days of historical data
```

Start backend:
```bash
uvicorn main:app --host 0.0.0.0 --port 8001
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5174`

**Default login:**
```
Email:    admin@erbm.local
Password: rbm2026
```

---

## Dashboard Pages

| Page | Description |
|------|-------------|
| **Overview** | Key stats, live MWK/USD rate, full rates table with analytics |
| **Live Rates** | Sortable table with MWK highlight card, volatility bars, spread data |
| **Trend Analysis** | Interactive 365-day charts, period high/low/average, analytical summary |
| **Alerts** | Automated alerts with filter, acknowledge workflow, alert history |

---

## Alert System

The system automatically fires alerts when:

| Alert Type | Condition |
|-----------|-----------|
| `THRESHOLD_BREACH` | Rate moves more than 2% in 24 hours |
| `ANOMALY_DETECTED` | Rate is more than 2 standard deviations from 7-day mean |
| `HIGH_VOLATILITY` | 7-day volatility exceeds 0.5% |

Duplicate alerts are suppressed for 6 hours per currency pair per alert type.

---

## Data Source Note

Rates are sourced from [ExchangeRate-API](https://www.exchangerate-api.com) (interbank mid-market rates), updated hourly. This system is designed so that when RBM provides direct access to official internal rate data, the data source can be swapped with minimal changes to the pipeline. The analytics, alert, and dashboard layers work on any data source.

For official RBM published rates, refer to the Reserve Bank of Malawi daily bulletin at [rbm.mw](https://www.rbm.mw).

---

## Roadmap

- [ ] Direct RBM internal data integration
- [ ] 7-day ML rate forecasting with confidence bands
- [ ] Commercial bank spread comparison (NBS, Standard Bank, FDH)
- [ ] Weekly automated PDF report generation
- [ ] Mobile responsive optimization
- [ ] Multi-user operator management

---

## Developer

**Sangwani Phiri**  
BSc Computer Science · University of Malawi (UNIMA)  
Founder · RamTech · Zomba, Malawi  
🌐 [ram-techs.online](https://ram-techs.online)  
GitHub: [@SANGWANITECH](https://github.com/SANGWANITECH)

---

*ERBM v1.0.0 — Built in Malawi 🇲🇼*
