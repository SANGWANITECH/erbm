from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models import RateAlert
from routers.auth import get_current_operator
from datetime import datetime

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/")
def list_alerts(
    limit: int = Query(default=50, le=200),
    unacknowledged_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_operator=Depends(get_current_operator)
):
    query = db.query(RateAlert)
    if unacknowledged_only:
        query = query.filter(RateAlert.acknowledged == False)
    alerts = query.order_by(desc(RateAlert.triggered_at)).limit(limit).all()
    return {
        "total": len(alerts),
        "alerts": [
            {
                "id": a.id,
                "currency_pair": a.currency_pair,
                "alert_type": a.alert_type,
                "message": a.message,
                "rate_at_alert": a.rate_at_alert,
                "threshold": a.threshold,
                "triggered_at": a.triggered_at.isoformat(),
                "acknowledged": a.acknowledged,
            }
            for a in alerts
        ]
    }


@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_operator=Depends(get_current_operator)
):
    alert = db.query(RateAlert).filter(RateAlert.id == alert_id).first()
    if not alert:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.acknowledged = True
    db.commit()
    return {"message": f"Alert {alert_id} acknowledged"}
