"""
FastAPI Application Entry Point
Run: uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
Docs: http://localhost:8000/docs
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import os
import traceback

from api.routes import predict, filters, colleges, health
from phase4_prediction.predictor import load_all


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model + data into memory once at startup
    try:
        print("🚀 Starting predictor initialization...")
        load_all()
        print("✅ Application startup complete")
    except Exception as e:
        print(f"❌ Startup error: {e}")
        traceback.print_exc()
        raise
    
    yield
    # Cleanup on shutdown (nothing needed)


app = FastAPI(
    title="MHT CET College Predictor API",
    description="Predict college admissions based on MHT CET cutoff trends (2022-2024)",
    version="1.0.0",
    lifespan=lifespan,
)

# Custom exception handler for better error messages
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc),
            "detail": str(exc),
            "type": type(exc).__name__
        }
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Restrict to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router,    prefix="/api",          tags=["Health"])
app.include_router(predict.router,   prefix="/api/predict",  tags=["Prediction"])
app.include_router(filters.router,   prefix="/api/filters",  tags=["Filters"])
app.include_router(colleges.router,  prefix="/api/colleges", tags=["Colleges"])

# Serve frontend at root
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

    @app.get("/")
    def serve_frontend():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
