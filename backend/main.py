"""
main.py — ERBM Exchange Rate Intelligence Dashboard
FastAPI backend with scheduled data fetching and WebSocket live rates
"""

import asyncio
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from database import engine, Base, SessionLocal
from models import ExchangeRate, Operator
from routers import rates, auth, alerts
from fetcher import fetch_and_store_rates
from alert_engine import run_alert_engine
from processor import process_all_currencies
from passlib.context import CryptContext
from datetime import datetime

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ERBM — Exchange Rate Intelligence Dashboard", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(rates.router)
app.include_router(alerts.router)

scheduler = AsyncIOScheduler()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def scheduled_fetch():
    """Called by scheduler every hour."""
    print(f"\n[SCHEDULER] Running scheduled fetch at {datetime.now().strftime('%H:%M:%S')}")
    fetch_and_store_rates()
    process_all_currencies()


def create_default_operator():
    """Create default admin operator if none exists."""
    db = SessionLocal()
    existing = db.query(Operator).filter(Operator.email == "admin@erbm.local").first()
    if not existing:
        op = Operator(
            name="RBM Administrator",
            email="admin@erbm.local",
            hashed_password=pwd_context.hash("rbm2026"),
            role="admin",
        )
        db.add(op)
        db.commit()
        print("✅ Default operator created: admin@erbm.local / erbm2026")
    db.close()


@app.on_event("startup")
async def startup():
    create_default_operator()

    # Fetch rates immediately on startup
    print("\n[STARTUP] Fetching initial rates...")
    fetch_and_store_rates()
    process_all_currencies()
    run_alert_engine()

    # Schedule hourly fetches
    scheduler.add_job(scheduled_fetch, "interval", hours=1, id="hourly_fetch")
    scheduler.start()
    print("\n✅ Scheduler started — rates will update every hour")
    print("✅ ERBM API is running\n")


@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()


@app.get("/")
def root():
    return {
        "system": "ERBM — Exchange Rate Intelligence Dashboard",
        "version": "1.0.0",
        "status": "operational",
        "description": "Reserve Bank of Malawi Forex Intelligence System"
    }


@app.get("/health")
def health():
    db = SessionLocal()
    count = db.query(ExchangeRate).count()
    db.close()
    return {
        "status": "healthy",
        "rate_records": count,
        "timestamp": datetime.utcnow().isoformat()
    }
