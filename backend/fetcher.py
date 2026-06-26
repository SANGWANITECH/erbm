"""
fetcher.py

Fetches live exchange rates from ExchangeRate-API and saves them
to the PostgreSQL database. This is the core data pipeline.

Run manually:  python3 fetcher.py
Runs automatically every hour when the main server is running.
"""

import requests
import os
from datetime import datetime
from dotenv import load_dotenv
from database import SessionLocal
from models import ExchangeRate

load_dotenv()

API_KEY = os.getenv("EXCHANGE_API_KEY")
BASE_URL = os.getenv("EXCHANGE_API_BASE")

# Currencies we track — MWK plus key trading partners
TRACKED_CURRENCIES = ["MWK", "ZAR", "GBP", "EUR", "ZMW", "TZS", "CNY", "MZN", "INR", "AED"]


def fetch_and_store_rates():
    """Fetch latest rates and store in database."""
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Fetching rates from API...")

    try:
        url = f"{BASE_URL}/{API_KEY}/latest/USD"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get("result") != "success":
            print(f"❌ API error: {data}")
            return False

        rates = data["conversion_rates"]
        mwk_per_usd = rates.get("MWK")

        if not mwk_per_usd:
            print("❌ MWK rate not found in response")
            return False

        db = SessionLocal()
        saved = 0

        for currency in TRACKED_CURRENCIES:
            if currency not in rates:
                print(f"⚠️  {currency} not in API response, skipping")
                continue

            usd_rate = rates[currency]  # how many units of currency per 1 USD

            # Calculate MWK per 1 unit of this currency
            # e.g. if 1 USD = 1744 MWK and 1 USD = 16.4 ZAR
            # then 1 ZAR = 1744 / 16.4 = 106.3 MWK
            if currency == "MWK":
                mwk_per_unit = 1.0
            else:
                mwk_per_unit = round(mwk_per_usd / usd_rate, 4) if usd_rate else None

            rate_record = ExchangeRate(
                base_currency="USD",
                target_currency=currency,
                rate=usd_rate,
                mwk_per_unit=mwk_per_unit,
                source="exchangerate-api",
            )
            db.add(rate_record)
            saved += 1

            if currency == "MWK":
                print(f"  ✅ USD/MWK: {usd_rate} (1 USD = {usd_rate} Kwacha)")
            else:
                print(f"  ✅ USD/{currency}: {usd_rate} (1 {currency} = {mwk_per_unit} MWK)")

        db.commit()
        db.close()

        print(f"\n✅ Saved {saved} rate records to database")
        return True

    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


if __name__ == "__main__":
    print("═" * 50)
    print("  ERBM Exchange Rate Fetcher")
    print("  Reserve Bank of Malawi Intelligence Dashboard")
    print("═" * 50)
    fetch_and_store_rates()
