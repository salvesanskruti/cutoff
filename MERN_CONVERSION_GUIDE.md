# MERN Stack Conversion Guide

Your college predictor project has been converted from Python/FastAPI + Vanilla JS to a full **MERN stack** (MongoDB, Express, React, Node.js).

## 📁 New Project Structure

```
college_predictor/
├── backend/                          # Node.js + Express API
│   ├── package.json
│   ├── server.js                      # Express server entry point
│   ├── .env.example
│   ├── .gitignore
│   ├── models/
│   │   └── index.js                   # MongoDB schemas (Mongoose)
│   ├── routes/
│   │   ├── predict.js                 # POST /predict/colleges, /chances
│   │   ├── filters.js                 # GET /filters/*
│   │   ├── colleges.js                # GET /colleges/*
│   │   └── health.js                  # GET /health
│   └── scripts/
│       └── seedDatabase.js            # Migrate CSV data to MongoDB
│
├── frontend/                          # React + Vite frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx                   # React entry point
│   │   ├── App.jsx                    # Main component
│   │   ├── index.css                  # Global styles (migrated from original)
│   │   ├── services/
│   │   │   └── api.js                 # Axios API client
│   │   └── components/
│   │       ├── NavBar.jsx
│   │       ├── Hero.jsx
│   │       ├── HowItWorks.jsx
│   │       ├── Predictor.jsx
│   │       ├── PredictionForm.jsx
│   │       ├── CollegeResults.jsx
│   │       ├── Features.jsx
│   │       ├── Footer.jsx
│   │       └── StatusIndicator.jsx
│
├── api/                               # Python ML Backend (UNCHANGED)
│   └── ... (unchanged - still running on :8000)
├── data/
├── phase1_data_prep/
├── phase2_features/
├── phase3_model/
├── phase4_prediction/
└── scripts/
```

---

## 🚀 Quick Start Setup

### Prerequisites
- Node.js v16+ ([download](https://nodejs.org/))
- MongoDB ([install locally](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas cloud](https://www.mongodb.com/cloud/atlas))
- Python (for existing ML backend)

### Step 1: Setup MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB Community Edition and start the service
# On macOS with Homebrew:
brew services start mongodb-community

# On Windows: MongoDB runs as a service

# On Linux:
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Set `MONGO_URI` in `.env`

### Step 2: Setup Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Update .env with your configuration:
# MONGO_URI=mongodb://localhost:27017/college_predictor
# PORT=5000
# ML_SERVICE_URL=http://localhost:8000

# Install dependencies
npm install

# Seed database from existing CSV files
# (Make sure ML backend is running and has generated predictions_2025.csv)
npm run seed

# Start development server (with auto-reload)
npm run dev

# Or production:
npm start
```

**Backend should be running at:** `http://localhost:5000`

### Step 3: Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

**Frontend will be available at:** `http://localhost:3000`

The Vite dev server is configured to proxy `/api/*` requests to `http://localhost:5000`.

### Step 4: Keep Python ML Backend Running

The Python FastAPI backend is still used for ML model serving.

```bash
# In a separate terminal, from project root:
cd api

# Make sure you have Python dependencies installed
pip install -r ../requirements.txt

# Start FastAPI server
uvicorn api.main:app --reload --port 8000
```

**ML Service at:** `http://localhost:8000`

---

## 🔗 Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│  React Frontend (Vite, Port 3000)                       │
│  - User Interface                                       │
│  - Form collecting score/category/seat-type            │
│  - Displays college results                            │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP Requests
                   │ (Proxied via Vite to /api)
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Node.js Backend (Express, Port 5000)                  │
│  - API routes for prediction, filters, colleges        │
│  - MongoDB data layer                                  │
│  - Serves frontend static files (production)           │
└──────────────────┬──────────────────────────────────────┘
         ┌─────────┴──────────┐
         ▼                    ▼
   ┌──────────────┐    ┌──────────────────┐
   │  MongoDB     │    │  Python FastAPI  │
   │  (Data)      │    │  (:8000 ML)      │
   │              │    │  XGBoost Model   │
   │ Collections: │    │  Predictions     │
   │ - Colleges   │    │  Load at startup │
   │ - Predictions│    │  (cached)        │
   │ - History    │    └──────────────────┘
   │ - Lookups    │
   └──────────────┘
```

### Data Flow

1. **User fills form** (React frontend)
   - Score, Category, Seat Type
   - Optional: Branch names, filters

2. **Frontend sends POST request** to `/api/predict/colleges`
   - Request goes to Node backend

3. **Node backend processes**
   - Queries MongoDB for predictions matching criteria
   - Returns ranked results with "safe/moderate/reach" labels

4. **Python backend (async)**
   - Still trains ML models
   - Generates CSV predictions
   - MongoDB seeded once during setup

---

## 📡 API Endpoints (Node Backend)

All endpoints return JSON and have CORS enabled.

### Prediction Routes
```
POST /api/predict/colleges
  Body: { score, category, seatType, branchNames, includeReach, topN }
  Response: { total, colleges: [...], userScore, category, seatType }

POST /api/predict/chances
  Body: { collegeId, branchId, category, seatType, score }
  Response: { collegeName, branchName, predictedCutoff, chance, margin, ... }
```

### Filter Routes
```
GET /api/filters/branches          → { branches: [...] }
GET /api/filters/categories        → { categories: [...] }
GET /api/filters/seat-types        → { seatTypes: [...] }
GET /api/filters/college-names     → { collegeNames: [...] }
```

### College Routes
```
GET /api/colleges?page=1&limit=50
GET /api/colleges/:collegeId
GET /api/colleges/:collegeId/history
```

### Health
```
GET /api/health
  Response: { status, timestamp, uptime, database, environment }
```

---

## 📦 Environment Variables (.env)

Create `backend/.env`:
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/college_predictor
ML_SERVICE_URL=http://localhost:8000
```

For production `backend/.env.production`:
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster0.mongodb.net/college_predictor
ML_SERVICE_URL=https://your-ml-api.com
```

---

## 🗄️ MongoDB Collections Schema

When seeded, the following collections are created:

### `colleges`
```json
{
  "collegeId": "string (unique)",
  "collegeName": "string",
  "state": "string",
  "type": "string",
  "branches": ["string"]
}
```

### `predictions`
```json
{
  "collegeId": "string",
  "branchId": "string",
  "category": "string",
  "seatType": "string",
  "predictedCutoff": "number",
  "confidence": "number",
  "year": 2025
}
```

### `cutoff_histories`
```json
{
  "collegeId": "string",
  "branchId": "string",
  "category": "string",
  "seatType": "string",
  "year": "number",
  "cutoff": "number"
}
```

### `lookup_data`
```json
{
  "branches": ["string"],
  "categories": ["string"],
  "seatTypes": ["string"],
  "collegeNames": ["string"],
  "lastUpdated": "date"
}
```

---

## 🌱 Data Migration from CSV to MongoDB

The `backend/scripts/seedDatabase.js` script handles CSV → MongoDB migration:

```bash
npm run seed
```

It reads from:
- `data/processed/predictions_2025.csv` → `predictions` collection
- `data/processed/merged_clean.csv` → `cutoff_histories` collection

Creates associated documents in:
- `colleges`, `branches`, `categories`, `seatTypes`, `lookup_data`

After seeding, CSV files are no longer needed (data is in MongoDB).

---

## 🏗️ Building for Production

### Frontend
```bash
cd frontend
npm run build
# Creates optimized dist/ folder

# Serve locally to test:
npm run preview
```

### Backend
```bash
# No build needed for Node.js, but review environment:
# - Set NODE_ENV=production
# - Use cloud MongoDB URI
# - Deploy to Heroku, Railway, Render, AWS, etc.

npm start
```

---

## 🐛 Troubleshooting

### Backend won't connect to MongoDB
```
Error: MongoServerError: connect ECONNREFUSED
```
**Fix:** Make sure MongoDB is running
```bash
# macOS:
brew services list  # Check if mongo is running
brew services start mongodb-community

# Or check MongoDB Atlas connection string
```

### Frontend can't reach backend API
```
Error: Failed to get predictions
```
**Fix:** Make sure backend is running on :5000 and CORS is enabled
```bash
# Check backend is running:
curl http://localhost:5000/api/health

# If CORS issue:
# Frontend should proxy to backend via Vite
```

### Predictions return empty results
```
Fix: Seed database first:
npm run seed
```

---

## 🔄 Comparison: Python vs Node Backend

| Aspect | Python (Old) | Node (New) |
|--------|-------------|-----------|
| **Framework** | FastAPI | Express |
| **Database** | CSV + Pickle | MongoDB |
| **Language** | Python | JavaScript |
| **ML Model** | XGBoost | (still Python) |
| **API Port** | 8000 | 5000 |
| **Frontend** | Vanilla JS | React + Vite |
| **Frontend Port** | N/A | 3000 |

**Why the change?**
- **MongoDB** provides flexible querying (vs static CSV)
- **React** provides reactive UI updates (vs vanilla JS)
- **Express** integrates seamlessly with Node frontend (single ecosystem)
- **Vite** offers faster dev builds than manual JS

---

## 📚 Additional Resources

- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [MongoDB Docs](https://docs.mongodb.com/)

---

## 🎯 Next Steps

1. ✅ Backend setup complete
2. ✅ Frontend setup complete
3. ⏳ **Test locally with all 3 services running**
4. ⏳ **Deploy to hosting (Vercel, Render, Heroku, etc.)**
5. ⏳ **Setup CI/CD pipeline**

---

**Questions?** Check the API docs at `http://localhost:5000/docs` (Swagger docs were removed in Node, but you can add them with `swagger-ui-express` if needed).

Happy coding! 🚀
