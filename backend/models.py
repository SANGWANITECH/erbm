from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.sql import func
from database import Base

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)
    base_currency = Column(String(10), default="USD")
    target_currency = Column(String(10), index=True)
    rate = Column(Float, nullable=False)
    mwk_per_unit = Column(Float, nullable=True)  # how many MWK per 1 unit of target
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    source = Column(String(50), default="exchangerate-api")


class RateAlert(Base):
    __tablename__ = "rate_alerts"

    id = Column(Integer, primary_key=True, index=True)
    currency_pair = Column(String(20))       # e.g. MWK/USD
    alert_type = Column(String(50))          # e.g. THRESHOLD_BREACH, ANOMALY
    message = Column(Text)
    rate_at_alert = Column(Float)
    threshold = Column(Float, nullable=True)
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    acknowledged = Column(Boolean, default=False)


class Operator(Base):
    __tablename__ = "operators"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(200))
    role = Column(String(20), default="analyst")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
