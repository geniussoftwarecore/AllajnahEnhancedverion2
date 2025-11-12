from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from models import User, Subscription, SubscriptionStatus, UserRole
import logging

logger = logging.getLogger(__name__)


def check_active_subscription(user: User, db: Session) -> bool:
    if user.role != UserRole.TRADER:
        return True
    
    active_subscription = db.query(Subscription).filter(
        Subscription.user_id == user.id,
        Subscription.status == SubscriptionStatus.ACTIVE,
        Subscription.end_date > datetime.utcnow()
    ).first()
    
    return active_subscription is not None


def require_active_subscription(user: User, db: Session):
    if not check_active_subscription(user, db):
        logger.warning(f"User {user.id} attempted complaint submission without active subscription")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active subscription required to submit complaints. Please renew your subscription to continue."
        )
