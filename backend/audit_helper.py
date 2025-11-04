from sqlalchemy.orm import Session
from models import AuditLog
from datetime import datetime
from typing import Optional, Dict, Any
import json

def create_audit_log(
    db: Session,
    actor_user_id: int,
    action: str,
    target_type: str,
    target_id: int,
    details: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
):
    if metadata:
        if details:
            details = f"{details} | Metadata: {json.dumps(metadata)}"
        else:
            details = f"Metadata: {json.dumps(metadata)}"
    
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

def create_change_log(
    db: Session,
    actor_user_id: int,
    action: str,
    target_type: str,
    target_id: int,
    changes: Dict[str, Dict[str, Any]],
    details: Optional[str] = None
):
    change_summary = []
    for field, values in changes.items():
        old_val = values.get('old', 'N/A')
        new_val = values.get('new', 'N/A')
        change_summary.append(f"{field}: '{old_val}' → '{new_val}'")
    
    change_details = f"{details or 'Changed:'} {'; '.join(change_summary)}"
    
    return create_audit_log(
        db=db,
        actor_user_id=actor_user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=change_details,
        metadata=changes
    )
