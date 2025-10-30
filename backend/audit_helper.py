from sqlalchemy.orm import Session
from models import AuditLog
from datetime import datetime
from typing import Optional

def create_audit_log(
    db: Session,
    actor_user_id: int,
    action: str,
    target_type: str,
    target_id: int,
    details: Optional[str] = None
):
    audit_log = AuditLog(
        actor_user_id=actor_user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
        created_at=datetime.utcnow()
    )
    db.add(audit_log)
    db.flush()
    return audit_log
