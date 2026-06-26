"""
alert_engine.py

Monitors stored exchange rate data and fires alerts when:
1. MWK/USD moves more than 2% in 24 hours (THRESHOLD_BREACH)
2. Today's rate is more than 2 standard deviations from 7-day average (ANOMALY)
3. Volatility exceeds 0.5% (HIGH_VOLATILITY)
"""

import numpy as np
from datetime import datetime, timedelta
from database import SessionLocal
from models import ExchangeRate, RateAlert
from sqlalchemy import desc

THRESHOLD_PCT = 2.0
ANOMALY_SIGMA = 2.0
HIGH_VOLATILITY = 0.5
TRACKED = ["MWK", "GBP", "EUR", "ZAR", "MZN", "INR", "AED"]


def get_rates(db, currency: str, hours: int) -> list:
    since = datetime.utcnow() - timedelta(hours=hours)
    return db.query(ExchangeRate).filter(
        ExchangeRate.target_currency == currency,
        ExchangeRate.timestamp >= since,
    ).order_by(ExchangeRate.timestamp.asc()).all()


def alert_exists(db, currency_pair: str, alert_type: str, hours: int = 6) -> bool:
    since = datetime.utcnow() - timedelta(hours=hours)
    existing = db.query(RateAlert).filter(
        RateAlert.currency_pair == currency_pair,
        RateAlert.alert_type == alert_type,
        RateAlert.triggered_at >= since,
    ).first()
    return existing is not None


def fire_alert(db, currency_pair: str, alert_type: str, message: str, rate: float, threshold: float = None):
    alert = RateAlert(
        currency_pair=currency_pair,
        alert_type=alert_type,
        message=message,
        rate_at_alert=rate,
        threshold=threshold,
    )
    db.add(alert)
    db.commit()
    print(f"  🔔 ALERT FIRED: [{alert_type}] {currency_pair} — {message[:80]}...")


def run_alert_engine():
    db = SessionLocal()
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Running alert engine...")
    alerts_fired = 0

    for currency in TRACKED:
        pair = f"MWK/{currency}" if currency != "MWK" else "MWK/USD"

        recent_24h = get_rates(db, currency, hours=24)
        recent_7d = get_rates(db, currency, hours=24 * 7)

        if len(recent_24h) < 2:
            continue

        latest_rate = recent_24h[-1].rate
        oldest_24h_rate = recent_24h[0].rate

        # 1. THRESHOLD BREACH
        if oldest_24h_rate > 0:
            change_pct = ((latest_rate - oldest_24h_rate) / oldest_24h_rate) * 100
            if abs(change_pct) >= THRESHOLD_PCT:
                if not alert_exists(db, pair, "THRESHOLD_BREACH"):
                    direction = "increased" if change_pct > 0 else "decreased"
                    direction_meaning = ""
                    if currency == "MWK":
                        direction_meaning = "Kwacha is weakening." if change_pct > 0 else "Kwacha is strengthening."
                    msg = (
                        f"The {pair} rate has {direction} by {abs(change_pct):.2f}% in the past 24 hours, "
                        f"moving from {oldest_24h_rate:.4f} to {latest_rate:.4f}. "
                        f"{direction_meaning} This exceeds the {THRESHOLD_PCT}% monitoring threshold."
                    )
                    fire_alert(db, pair, "THRESHOLD_BREACH", msg, latest_rate, THRESHOLD_PCT)
                    alerts_fired += 1

        # 2. ANOMALY DETECTION
        if len(recent_7d) >= 10:
            rates_7d = [r.rate for r in recent_7d]
            mean_7d = np.mean(rates_7d)
            std_7d = np.std(rates_7d)
            if std_7d > 0:
                z_score = abs((latest_rate - mean_7d) / std_7d)
                if z_score >= ANOMALY_SIGMA:
                    if not alert_exists(db, pair, "ANOMALY_DETECTED"):
                        msg = (
                            f"Anomaly detected in {pair}: current rate of {latest_rate:.4f} is "
                            f"{z_score:.1f} standard deviations from the 7-day mean of {mean_7d:.4f}. "
                            f"This is statistically unusual and may indicate a significant market event."
                        )
                        fire_alert(db, pair, "ANOMALY_DETECTED", msg, latest_rate)
                        alerts_fired += 1

        # 3. HIGH VOLATILITY
        if len(recent_7d) >= 10:
            rates_7d = [r.rate for r in recent_7d]
            returns = np.diff(rates_7d) / rates_7d[:-1]
            volatility = float(np.std(returns) * 100)
            if volatility >= HIGH_VOLATILITY:
                if not alert_exists(db, pair, "HIGH_VOLATILITY", hours=12):
                    msg = (
                        f"High volatility detected for {pair}: 7-day volatility is {volatility:.4f}%, "
                        f"exceeding the {HIGH_VOLATILITY}% threshold. "
                        f"Increased monitoring recommended."
                    )
                    fire_alert(db, pair, "HIGH_VOLATILITY", msg, latest_rate, HIGH_VOLATILITY)
                    alerts_fired += 1

    db.close()
    print(f"  Alert engine complete — {alerts_fired} new alert(s) fired")
    return alerts_fired


if __name__ == "__main__":
    print("═" * 50)
    print("  ERBM Alert Engine")
    print("═" * 50)
    run_alert_engine()
