"""
processor.py

Calculates financial metrics from stored exchange rate data.
Run after fetcher.py to enrich the raw rates with analytics.

Metrics calculated:
- 24h percentage change
- 7-day volatility score
- 7-day moving average
- Spread estimation (buy vs sell approximation)
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from database import SessionLocal
from models import ExchangeRate
from sqlalchemy import desc


def get_recent_rates(db, currency: str, days: int = 30) -> pd.DataFrame:
    """Pull recent rate history for a currency from the database."""
    since = datetime.utcnow() - timedelta(days=days)
    records = db.query(ExchangeRate).filter(
        ExchangeRate.target_currency == currency,
        ExchangeRate.timestamp >= since
    ).order_by(ExchangeRate.timestamp.asc()).all()

    if not records:
        return pd.DataFrame()

    df = pd.DataFrame([{
        "timestamp": r.timestamp,
        "rate": r.rate,
        "mwk_per_unit": r.mwk_per_unit,
    } for r in records])

    df["timestamp"] = pd.to_datetime(df["timestamp"])
    return df


def calculate_24h_change(df: pd.DataFrame) -> dict:
    """Calculate percentage change over the last 24 hours."""
    if len(df) < 2:
        return {"change_pct": 0.0, "direction": "stable"}

    latest = df.iloc[-1]["rate"]
    # Find rate closest to 24h ago
    cutoff = df.iloc[-1]["timestamp"] - timedelta(hours=24)
    older = df[df["timestamp"] <= cutoff]

    if older.empty:
        prev = df.iloc[0]["rate"]
    else:
        prev = older.iloc[-1]["rate"]

    if prev == 0:
        return {"change_pct": 0.0, "direction": "stable"}

    change_pct = round(((latest - prev) / prev) * 100, 4)
    direction = "up" if change_pct > 0 else "down" if change_pct < 0 else "stable"
    return {"change_pct": change_pct, "direction": direction}


def calculate_volatility(df: pd.DataFrame, window: int = 7) -> float:
    """
    Calculate 7-day volatility as the standard deviation of daily returns.
    Higher = more volatile = more economic stress.
    """
    if len(df) < 3:
        return 0.0

    df = df.copy()
    df["daily_return"] = df["rate"].pct_change()
    recent = df.tail(window * 24)  # last 7 days of hourly data
    volatility = round(float(recent["daily_return"].std() * 100), 4)
    return volatility if not np.isnan(volatility) else 0.0


def calculate_moving_average(df: pd.DataFrame, window: int = 7) -> float:
    """Calculate simple moving average over last N days of hourly data."""
    if df.empty:
        return 0.0
    recent = df.tail(window * 24)
    return round(float(recent["rate"].mean()), 4)


def estimate_spread(rate: float) -> dict:
    """
    Estimate buy/sell spread for Malawian commercial banks.
    Banks typically add 1.5-2.5% margin on each side.
    """
    margin = 0.02  # 2% typical Malawian bank margin
    buy_rate = round(rate * (1 - margin), 2)
    sell_rate = round(rate * (1 + margin), 2)
    spread = round(sell_rate - buy_rate, 2)
    return {
        "buy_rate": buy_rate,
        "sell_rate": sell_rate,
        "spread": spread,
        "spread_pct": round(margin * 2 * 100, 2)
    }


def process_all_currencies():
    """Run all analytics for all tracked currencies."""
    CURRENCIES = ["MWK", "ZAR", "GBP", "EUR", "ZMW", "TZS", "CNY", "MZN", "INR", "AED"]

    db = SessionLocal()
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Processing analytics...\n")

    results = {}

    for currency in CURRENCIES:
        df = get_recent_rates(db, currency, days=30)

        if df.empty:
            print(f"  ⚠️  No data for {currency}, skipping")
            continue

        latest_rate = df.iloc[-1]["rate"]
        latest_mwk = df.iloc[-1]["mwk_per_unit"]
        change = calculate_24h_change(df)
        volatility = calculate_volatility(df)
        ma7 = calculate_moving_average(df, window=7)
        spread = estimate_spread(latest_rate) if currency != "MWK" else None

        results[currency] = {
            "currency": currency,
            "latest_rate": latest_rate,
            "mwk_per_unit": latest_mwk,
            "change_24h_pct": change["change_pct"],
            "direction": change["direction"],
            "volatility_7d": volatility,
            "moving_avg_7d": ma7,
            "spread": spread,
            "data_points": len(df),
        }

        direction_symbol = "▲" if change["direction"] == "up" else "▼" if change["direction"] == "down" else "─"

        if currency == "MWK":
            print(f"  USD/MWK  {latest_rate:>10.2f}  {direction_symbol} {change['change_pct']:+.4f}%  volatility: {volatility:.4f}")
        else:
            print(f"  {currency}/MWK  {latest_mwk:>10.4f}  {direction_symbol} {change['change_pct']:+.4f}%  volatility: {volatility:.4f}")

    db.close()
    print(f"\n✅ Analytics complete for {len(results)} currencies")
    return results


if __name__ == "__main__":
    print("═" * 55)
    print("  ERBM Rate Processor — Analytics Engine")
    print("  Reserve Bank of Malawi Intelligence Dashboard")
    print("═" * 55)
    results = process_all_currencies()

    print("\n─── MWK Summary ───────────────────────────────────")
    mwk = results.get("MWK", {})
    print(f"  Current rate:     1 USD = {mwk.get('latest_rate', 0):.2f} MWK")
    print(f"  24h change:       {mwk.get('change_24h_pct', 0):+.4f}%")
    print(f"  7-day avg:        {mwk.get('moving_avg_7d', 0):.2f}")
    print(f"  7-day volatility: {mwk.get('volatility_7d', 0):.4f}%")
    print(f"  Data points:      {mwk.get('data_points', 0)}")
