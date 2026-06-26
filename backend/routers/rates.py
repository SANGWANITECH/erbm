from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from database import get_db
from models import ExchangeRate
from routers.auth import get_current_operator
from processor import get_recent_rates, calculate_24h_change, calculate_volatility, calculate_moving_average, estimate_spread
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter(prefix="/rates", tags=["rates"])

CURRENCIES = ["MWK", "ZAR", "GBP", "EUR", "ZMW", "TZS", "CNY", "MZN", "INR", "AED"]


@router.get("/latest")
def get_latest_rates(
    db: Session = Depends(get_db),
    current_operator=Depends(get_current_operator)
):
    """Get the most recent rate for each tracked currency with analytics."""
    results = []

    for currency in CURRENCIES:
        latest = db.query(ExchangeRate).filter(
            ExchangeRate.target_currency == currency
        ).order_by(desc(ExchangeRate.timestamp)).first()

        if not latest:
            continue

        df = get_recent_rates(db, currency, days=30)
        change = calculate_24h_change(df)
        volatility = calculate_volatility(df)
        ma7 = calculate_moving_average(df, 7)
        spread = estimate_spread(latest.rate) if currency != "MWK" else None

        results.append({
            "currency": currency,
            "rate": latest.rate,
            "mwk_per_unit": latest.mwk_per_unit,
            "change_24h_pct": change["change_pct"],
            "direction": change["direction"],
            "volatility_7d": volatility,
            "moving_avg_7d": ma7,
            "spread": spread,
            "last_updated": latest.timestamp.isoformat(),
        })

    return {"rates": results, "fetched_at": datetime.utcnow().isoformat()}


@router.get("/history/{currency}")
def get_rate_history(
    currency: str,
    days: int = Query(default=30, le=365),
    db: Session = Depends(get_db),
    current_operator=Depends(get_current_operator)
):
    """Get historical rates for a specific currency."""
    currency = currency.upper()
    since = datetime.utcnow() - timedelta(days=days)

    records = db.query(ExchangeRate).filter(
        ExchangeRate.target_currency == currency,
        ExchangeRate.timestamp >= since
    ).order_by(ExchangeRate.timestamp.asc()).all()

    return {
        "currency": currency,
        "days": days,
        "data_points": len(records),
        "history": [
            {
                "timestamp": r.timestamp.isoformat(),
                "rate": r.rate,
                "mwk_per_unit": r.mwk_per_unit,
            }
            for r in records
        ]
    }


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_operator=Depends(get_current_operator)
):
    """Get a high-level summary for the dashboard overview."""
    total_records = db.query(ExchangeRate).count()
    latest_mwk = db.query(ExchangeRate).filter(
        ExchangeRate.target_currency == "MWK"
    ).order_by(desc(ExchangeRate.timestamp)).first()

    df = get_recent_rates(db, "MWK", days=7)
    change = calculate_24h_change(df)
    volatility = calculate_volatility(df)

    return {
        "mwk_usd_rate": latest_mwk.rate if latest_mwk else None,
        "mwk_24h_change": change["change_pct"],
        "mwk_direction": change["direction"],
        "mwk_volatility_7d": volatility,
        "total_records": total_records,
        "last_updated": latest_mwk.timestamp.isoformat() if latest_mwk else None,
    }
