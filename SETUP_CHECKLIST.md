# MERN Conversion Checklist ✅

Use this list to verify everything is set up correctly before running the application.

---

## Backend Setup

- [ ] **Node.js installed**
  ```bash
  node --version  # Should show v16+
  ```

- [ ] **Backend dependencies installed**
  ```bash
  cd backend && npm install
  ```

- [ ] **`.env` file created**
  ```bash
  cp backend/.env.example backend/.env
  ```

- [ ] **`.env` configured**
  - [ ] `MONGO_URI` set (local or Atlas)
  - [ ] `PORT` set to 5000
  - [ ] `ML_SERVICE_URL` set (optional, defaults to http://localhost:8000)

- [ ] **MongoDB available**
  ```bash
  mongosh  # Or MongoDB Compass for GUI
  # Should connect without errors
  ```

- [ ] **Backend starts successfully**
  ```bash
  cd backend && npm run dev
  # Should see: "✅ MongoDB connected"
  # "College Predictor API Server"
  # "Port: 5000"
  ```

- [ ] **API health check**
  ```bash
  curl http://localhost:5000/api/health
  # Should return JSON with status: "ok"
  ```

---

## Frontend Setup

- [ ] **Frontend dependencies installed**
  ```bash
  cd frontend && npm install
  ```

- [ ] **Frontend starts successfully**
  ```bash
  cd frontend && npm run dev
  # Should see: "VITE v4.x.x  ready in XXX ms"
  # ➜  Local:   http://localhost:3000/
  ```

- [ ] **Frontend loads in browser**
  - Open http://localhost:3000
  - Should see CutoffAI landing page with logo & hero section
  - No console errors

- [ ] **Frontend can reach backend**
  - Try the predictor with sample data
  - Should get results (or error if mongoDB not seeded)

---

## Database Setup

- [ ] **MongoDB running**
  ```bash
  # Check if mongod is running
  # localhost:27017 should be accessible
  ```

- [ ] **Database seeded** (first time only)
  ```bash
  cd backend && npm run seed
  # Should see:
  # ✅ Connected
  # 🗑️  Clearing existing collections...
  # 📥 Seeding predictions_2025.csv...
  # ✅ Database seeding complete!
  ```

- [ ] **Verify data in MongoDB**
  ```bash
  mongosh
  > use college_predictor
  > db.predictions.countDocuments()  # Should show > 0
  > db.colleges.countDocuments()     # Should show > 0
  ```

---

## API Endpoints Working

- [ ] **Health check**
  ```bash
  curl http://localhost:5000/api/health
  ```

- [ ] **Get filters**
  ```bash
  curl http://localhost:5000/api/filters/categories
  curl http://localhost:5000/api/filters/branches
  ```

- [ ] **Get colleges**
  ```bash
  curl http://localhost:5000/api/colleges
  ```

- [ ] **Make prediction**
  ```bash
  curl -X POST http://localhost:5000/api/predict/colleges \
    -H "Content-Type: application/json" \
    -d '{
      "score": 95,
      "category": "OBC",
      "seatType": "GMR",
      "branchNames": [],
      "includeReach": true,
      "topN": 50
    }'
  # Should return array of colleges with predictions
  ```

---

## Frontend Features Working

- [ ] **Navigation bar appears**
  - Logo visible
  - Links work (smooth scroll)
  - Theme toggle button (🌙) works

- [ ] **Hero section renders**
  - Title visible
  - CTA buttons clickable

- [ ] **How It Works section**
  - 3 step cards visible
  - Proper styling applied

- [ ] **Prediction form interactive**
  - Can enter score (0-100)
  - Category dropdown works
  - Seat Type dropdown works
  - Branch search works
  - Toggle switches work
  - Range slider works

- [ ] **Prediction results display**
  - After submitting form:
    - Summary statistics visible (Total, Safe, Moderate, Reach)
    - College list renders
    - Each college shows name, branch, cutoff, chance, margin
    - Color indicators (green/yellow/orange/red) appear correctly
    - Can expand colleges to see details

- [ ] **Features section renders**
  - 6 feature cards visible
  - Icons and descriptions clear

- [ ] **Footer appears**
  - Logo + branding
  - Links

---

## Environment Verification

- [ ] **Python ML backend available** (optional)
  ```bash
  curl http://localhost:8000/docs
  # Should show FastAPI Swagger docs
  ```

- [ ] **Port conflicts resolved**
  - [ ] Port 3000 available (frontend)
  - [ ] Port 5000 available (backend)
  - [ ] Port 8000 available (ML, if using)
  - [ ] Port 27017 available (MongoDB)

- [ ] **Network connectivity**
  - Backend can reach MongoDB
  - Frontend can reach Backend (via Vite proxy)
  - CORS enabled properly

---

## Files & Structure Verified

- [ ] **Backend files exist**
  - [ ] `backend/server.js`
  - [ ] `backend/models/index.js`
  - [ ] `backend/routes/predict.js`
  - [ ] `backend/routes/filters.js`
  - [ ] `backend/routes/colleges.js`
  - [ ] `backend/routes/health.js`
  - [ ] `backend/scripts/seedDatabase.js`

- [ ] **Frontend files exist**
  - [ ] `frontend/vite.config.js`
  - [ ] `frontend/src/App.jsx`
  - [ ] `frontend/src/main.jsx`
  - [ ] `frontend/src/index.css`
  - [ ] `frontend/src/services/api.js`
  - [ ] All components in `frontend/src/components/`

- [ ] **Configuration files**
  - [ ] `backend/.env` created and filled
  - [ ] `backend/.env.example` as template
  - [ ] `frontend/vite.config.js` has proxy

---

## Documentation Created

- [ ] **MERN_CONVERSION_GUIDE.md** - Main setup guide
- [ ] **MERN_CONVERSION_SUMMARY.md** - What was created
- [ ] **BEFORE_AFTER_COMPARISON.md** - Architecture changes
- [ ] **setup.sh** - Linux/Mac setup script
- [ ] **setup.bat** - Windows setup script
- [ ] **README.md** - Updated (links to guides)

---

## Ready for Development ✅

Once all boxes are checked:

1. **Keep three terminals open:**
   ```bash
   # Terminal 1
   cd backend && npm run dev
   
   # Terminal 2
   cd frontend && npm run dev
   
   # Terminal 3 (if needed)
   uvicorn api.main:app --reload
   ```

2. **Open browser to:** http://localhost:3000

3. **Test full flow:**
   - Navigate to "Predictor"
   - Enter score 95
   - Select category
   - Select seat type
   - Click "Get My Colleges"
   - See results

4. **Feel the DX improvements:**
   - Edit a React component
   - Watch it reload in <500ms
   - State preserved
   - Errors highlighted

---

## Common Issues & Fixes

### Port Already in Use
```bash
# Find process using port
lsof -i :5000          # macOS/Linux
netstat -ano | grep 5000  # Windows

# Kill process and restart
```

### MongoDB Connection Error
```bash
# Check MongoDB running
mongosh

# Or use MongoDB Atlas
# Update MONGO_URI in .env
```

### CORS Errors
```bash
# Ensure frontend requests go through Vite proxy
# Check vite.config.js has /api proxy
# Backend should have CORS enabled (it does)
```

### Import Errors in Frontend
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Data Seeding Fails
```bash
# Make sure MongoDB is running
# Make sure CSV files exist at:
# - data/processed/predictions_2025.csv
# - data/processed/merged_clean.csv

# Check paths in seedDatabase.js
node backend/scripts/seedDatabase.js
```

---

## Performance Checklist

- [ ] **Frontend dev reload time < 1 second**
- [ ] **API response time < 500ms**
- [ ] **Database queries use indexes**
- [ ] **No console errors or warnings**
- [ ] **Network tab shows no failed requests**

---

## Security Checklist

- [ ] **`backend/.env` in .gitignore** (don't commit credentials)
- [ ] **MongoDB credentials not in code**
- [ ] **CORS whitelist set properly** (in production)
- [ ] **No sensitive data in frontend code**
- [ ] **API inputs validated on backend**

---

## Deployment Readiness

- [ ] **Frontend builds successfully**
  ```bash
  cd frontend && npm run build
  # Creates dist/ folder with optimized files
  ```

- [ ] **Backend runs in production**
  ```bash
  NODE_ENV=production npm start
  ```

- [ ] **Environment variables documented**
- [ ] **Database backup plan**
- [ ] **Error logging configured**
- [ ] **Performance monitoring plan**

---

## Sign-Off

**Date Completed:** _______________

**Verified By:** _______________

**Notes:** _______________________________________________

---

**You're ready to build on MERN!** 🚀
