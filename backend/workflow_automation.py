from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import random

from models import (
    Complaint, User, UserRole, ComplaintStatus, Category,
    SLAConfig, SystemSettings, Priority
)
from audit_helper import create_audit_log


def get_setting(db: Session, key: str, default: str) -> str:
    setting = db.query(SystemSettings).filter(SystemSettings.setting_key == key).first()
    return setting.setting_value if setting else default


def auto_assign_complaint(db: Session, complaint: Complaint) -> Optional[User]:
    try:
        available_tech_members = db.query(User).filter(
            User.role == UserRole.TECHNICAL_COMMITTEE,
            User.is_active == True
        ).all()
        
        if not available_tech_members:
            return None
        
        assigned_user = random.choice(available_tech_members)
        complaint.assigned_to_id = assigned_user.id
        complaint.status = ComplaintStatus.UNDER_REVIEW
        
        create_audit_log(
            db, 
            assigned_user.id, 
            "AUTO_ASSIGN", 
            "complaint", 
            complaint.id,
            f"Auto-assigned complaint #{complaint.id} to {assigned_user.email}"
        )
        
        db.commit()
        return assigned_user
    except Exception as e:
        print(f"Error in auto_assign_complaint: {e}")
        db.rollback()
        return None


def check_sla_violations(db: Session) -> int:
    escalation_count = 0
    
    try:
        default_escalation_hours = int(get_setting(db, "default_escalation_hours", "72"))
        
        complaints = db.query(Complaint).filter(
            Complaint.status == ComplaintStatus.UNDER_REVIEW
        ).all()
        
        for complaint in complaints:
            sla_config = db.query(SLAConfig).filter(
                (SLAConfig.category_id == complaint.category_id) |
                (SLAConfig.priority == complaint.priority)
            ).first()
            
            if sla_config:
                escalation_threshold = timedelta(hours=sla_config.escalation_time_hours)
            else:
                escalation_threshold = timedelta(hours=default_escalation_hours)
            
            time_since_creation = datetime.utcnow() - complaint.created_at
            
            if time_since_creation > escalation_threshold:
                complaint.status = ComplaintStatus.ESCALATED
                
                create_audit_log(
                    db,
                    1,
                    "AUTO_ESCALATE",
                    "complaint",
                    complaint.id,
                    f"Auto-escalated complaint #{complaint.id} due to SLA violation (threshold: {escalation_threshold})"
                )
                
                escalation_count += 1
                print(f"Auto-escalated complaint #{complaint.id} after {time_since_creation}")
        
        if escalation_count > 0:
            db.commit()
            print(f"Total complaints escalated: {escalation_count}")
    
    except Exception as e:
        print(f"Error in check_sla_violations: {e}")
        db.rollback()
    
    return escalation_count


def auto_close_resolved_complaints(db: Session) -> int:
    closed_count = 0
    
    try:
        auto_close_days = int(get_setting(db, "auto_close_after_days", "7"))
        reopen_window_days = int(get_setting(db, "reopen_window_days", "7"))
        
        threshold_date = datetime.utcnow() - timedelta(days=auto_close_days)
        
        complaints = db.query(Complaint).filter(
            Complaint.status.in_([ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED]),
            Complaint.resolved_at.isnot(None),
            Complaint.resolved_at < threshold_date,
            Complaint.closed_at.is_(None)
        ).all()
        
        for complaint in complaints:
            complaint.closed_at = datetime.utcnow()
            complaint.can_reopen_until = datetime.utcnow() + timedelta(days=reopen_window_days)
            
            create_audit_log(
                db,
                1,
                "AUTO_CLOSE",
                "complaint",
                complaint.id,
                f"Auto-closed complaint #{complaint.id} after {auto_close_days} days of inactivity"
            )
            
            closed_count += 1
            print(f"Auto-closed complaint #{complaint.id}")
        
        if closed_count > 0:
            db.commit()
            print(f"Total complaints auto-closed: {closed_count}")
    
    except Exception as e:
        print(f"Error in auto_close_resolved_complaints: {e}")
        db.rollback()
    
    return closed_count


def run_periodic_tasks(db: Session):
    print(f"\n=== Running periodic workflow automation tasks at {datetime.utcnow()} ===")
    
    escalated = check_sla_violations(db)
    closed = auto_close_resolved_complaints(db)
    
    print(f"Summary: {escalated} complaints escalated, {closed} complaints closed")
    print("=" * 70 + "\n")
    
    return {"escalated": escalated, "closed": closed}
