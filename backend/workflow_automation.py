from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from models import (
    Complaint, User, UserRole, ComplaintStatus, Category,
    SLAConfig, SystemSettings, Priority, TaskStatus
)
from audit_helper import create_audit_log
from task_queue_service import task_queue_service


def get_setting(db: Session, key: str, default: str) -> str:
    setting = db.query(SystemSettings).filter(SystemSettings.setting_key == key).first()
    return setting.setting_value if setting else default


def auto_assign_complaint(db: Session, complaint: Complaint) -> Optional[User]:
    try:
        queue_entry = task_queue_service.add_to_queue(
            complaint_id=complaint.id,
            assigned_role=UserRole.TECHNICAL_COMMITTEE,
            db=db
        )
        
        if queue_entry and queue_entry.assigned_user_id:
            assigned_user = db.query(User).filter(User.id == queue_entry.assigned_user_id).first()
            
            if assigned_user:
                complaint.assigned_to_id = assigned_user.id
                complaint.status = ComplaintStatus.UNDER_REVIEW
                complaint.task_status = TaskStatus.ASSIGNED
                
                create_audit_log(
                    db, 
                    assigned_user.id, 
                    "AUTO_ASSIGN", 
                    "complaint", 
                    complaint.id,
                    f"Auto-assigned complaint #{complaint.id} to {assigned_user.email} via smart queue"
                )
                
                db.commit()
                return assigned_user
        
        complaint.task_status = TaskStatus.IN_QUEUE
        db.commit()
        return None
    except Exception as e:
        print(f"Error in auto_assign_complaint: {e}")
        db.rollback()
        return None


def check_sla_violations(db: Session, actor_id: Optional[int] = None) -> int:
    escalation_count = 0
    
    try:
        if actor_id is None:
            system_user = db.query(User).filter(User.role == UserRole.HIGHER_COMMITTEE).first()
            if not system_user:
                raise ValueError("No Higher Committee user found to act as system actor. Please create an admin user first.")
            actor_id = system_user.id
        
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
                
                queue_entry = task_queue_service.add_to_queue(
                    complaint_id=complaint.id,
                    assigned_role=UserRole.HIGHER_COMMITTEE,
                    db=db
                )
                
                if queue_entry and queue_entry.assigned_user_id:
                    complaint.assigned_to_id = queue_entry.assigned_user_id
                    complaint.task_status = TaskStatus.ASSIGNED
                else:
                    complaint.task_status = TaskStatus.IN_QUEUE
                
                create_audit_log(
                    db,
                    actor_id,
                    "AUTO_ESCALATE",
                    "complaint",
                    complaint.id,
                    f"Auto-escalated complaint #{complaint.id} due to SLA violation (threshold: {escalation_threshold}), added to Higher Committee queue"
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


def auto_close_resolved_complaints(db: Session, actor_id: Optional[int] = None) -> int:
    closed_count = 0
    
    try:
        if actor_id is None:
            system_user = db.query(User).filter(User.role == UserRole.HIGHER_COMMITTEE).first()
            if not system_user:
                raise ValueError("No Higher Committee user found to act as system actor. Please create an admin user first.")
            actor_id = system_user.id
        
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
                actor_id,
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


def run_periodic_tasks(db: Session, actor_id: Optional[int] = None):
    print(f"\n=== Running periodic workflow automation tasks at {datetime.utcnow()} ===")
    
    escalated = check_sla_violations(db, actor_id)
    closed = auto_close_resolved_complaints(db, actor_id)
    
    print(f"Summary: {escalated} complaints escalated, {closed} complaints closed")
    print("=" * 70 + "\n")
    
    return {"escalated": escalated, "closed": closed}
