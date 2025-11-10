from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, Coroutine, Any
import asyncio
import logging

from models import (
    Complaint, User, UserRole, ComplaintStatus, Category,
    SLAConfig, SystemSettings, Priority, TaskStatus
)
from audit_helper import create_audit_log
from task_queue_service import task_queue_service
from notification_service import notification_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _log_task_result(task: asyncio.Task) -> None:
    """Callback to log the result of background notification tasks."""
    try:
        exc = task.exception()
        if exc:
            logger.error(f"Background notification task failed: {exc}", exc_info=exc)
    except asyncio.CancelledError:
        logger.warning("Background notification task was cancelled")
    except Exception as e:
        logger.error(f"Error retrieving task result: {e}", exc_info=True)


def run_async_safely(coro: Coroutine[Any, Any, Any]) -> Any:
    """
    Safely run async code from synchronous context.
    Handles both cases: existing event loop (scheduler) and no event loop.
    
    Note: When running in scheduler context, notifications are fire-and-forget
    to avoid blocking. Failures are logged but not retried. For production,
    consider implementing a task queue with retry logic.
    """
    try:
        # Try to get the current running event loop
        try:
            loop = asyncio.get_running_loop()
            # We're in an event loop (scheduler context), schedule as background task
            task = loop.create_task(coro)
            # Add callback to log any failures
            task.add_done_callback(_log_task_result)
            # Don't wait for completion to avoid blocking scheduler
            logger.debug(f"Scheduled background task: {task.get_name()}")
            return task
        except RuntimeError:
            # No running loop, safe to use asyncio.run
            logger.debug("Running async task with asyncio.run()")
            return asyncio.run(coro)
    except Exception as e:
        logger.error(f"Error running async task: {e}", exc_info=True)
        return None


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
                
                run_async_safely(
                    notification_service.send_assignment_notification(
                        db,
                        assigned_user.id,
                        assigned_user.email,
                        assigned_user.phone,
                        complaint.id,
                        language="ar"
                    )
                )
                
                return assigned_user
        
        complaint.task_status = TaskStatus.IN_QUEUE
        db.commit()
        return None
    except Exception as e:
        logger.error(f"Error in auto_assign_complaint: {e}", exc_info=True)
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
                    
                    assigned_user = db.query(User).filter(User.id == queue_entry.assigned_user_id).first()
                    if assigned_user:
                        run_async_safely(
                            notification_service.send_assignment_notification(
                                db,
                                assigned_user.id,
                                assigned_user.email,
                                assigned_user.phone,
                                complaint.id,
                                language="ar"
                            )
                        )
                else:
                    complaint.task_status = TaskStatus.IN_QUEUE
                
                # Send escalation notification to complaint owner (trader)
                complaint_owner = db.query(User).filter(User.id == complaint.user_id).first()
                if complaint_owner:
                    run_async_safely(
                        notification_service.send_escalation_notification(
                            db,
                            complaint_owner.id,
                            complaint_owner.email,
                            complaint_owner.phone,
                            complaint.id,
                            f"تجاوز الوقت المحدد ({escalation_threshold})",
                            language="ar"
                        )
                    )
                
                create_audit_log(
                    db,
                    actor_id,
                    "AUTO_ESCALATE",
                    "complaint",
                    complaint.id,
                    f"Auto-escalated complaint #{complaint.id} due to SLA violation (threshold: {escalation_threshold}), added to Higher Committee queue"
                )
                
                escalation_count += 1
                logger.info(f"Auto-escalated complaint #{complaint.id} after {time_since_creation}")
        
        if escalation_count > 0:
            db.commit()
            logger.info(f"Total complaints escalated: {escalation_count}")
    
    except Exception as e:
        logger.error(f"Error in check_sla_violations: {e}", exc_info=True)
        db.rollback()
    
    return escalation_count


def check_sla_warnings(db: Session, actor_id: Optional[int] = None) -> int:
    """Check for complaints approaching SLA deadline and send warnings."""
    warning_count = 0
    
    try:
        default_escalation_hours = int(get_setting(db, "default_escalation_hours", "72"))
        warning_threshold_percent = 0.8  # Warn at 80% of deadline
        
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
            warning_threshold = escalation_threshold * warning_threshold_percent
            
            # Check if complaint is approaching deadline but not yet past it
            if time_since_creation > warning_threshold and time_since_creation < escalation_threshold:
                # Check if we already sent a warning (using audit log)
                from models import AuditLog
                existing_warning = db.query(AuditLog).filter(
                    AuditLog.action == "SLA_WARNING",
                    AuditLog.target_type == "complaint",
                    AuditLog.target_id == complaint.id
                ).first()
                
                if existing_warning:
                    continue  # Already sent warning for this complaint
                
                # Calculate time remaining
                time_remaining = escalation_threshold - time_since_creation
                hours_remaining = int(time_remaining.total_seconds() / 3600)
                minutes_remaining = int((time_remaining.total_seconds() % 3600) / 60)
                
                time_remaining_str = f"{hours_remaining} ساعة و {minutes_remaining} دقيقة"
                sla_deadline = (complaint.created_at + escalation_threshold).strftime("%Y-%m-%d %H:%M")
                
                # Send warning to complaint owner
                complaint_owner = db.query(User).filter(User.id == complaint.user_id).first()
                if complaint_owner:
                    run_async_safely(
                        notification_service.send_sla_warning_notification(
                            db,
                            complaint_owner.id,
                            complaint_owner.email,
                            complaint_owner.phone,
                            complaint.id,
                            time_remaining_str,
                            sla_deadline,
                            language="ar"
                        )
                    )
                
                # Send warning to assigned user if exists
                if complaint.assigned_to_id:
                    assigned_user = db.query(User).filter(User.id == complaint.assigned_to_id).first()
                    if assigned_user:
                        run_async_safely(
                            notification_service.send_sla_warning_notification(
                                db,
                                assigned_user.id,
                                assigned_user.email,
                                assigned_user.phone,
                                complaint.id,
                                time_remaining_str,
                                sla_deadline,
                                language="ar"
                            )
                        )
                
                # Create audit log to track that warning was sent
                if actor_id is None:
                    system_user = db.query(User).filter(User.role == UserRole.HIGHER_COMMITTEE).first()
                    if system_user:
                        actor_id = system_user.id
                
                if actor_id:
                    create_audit_log(
                        db,
                        actor_id,
                        "SLA_WARNING",
                        "complaint",
                        complaint.id,
                        f"SLA warning sent for complaint #{complaint.id} - {time_remaining_str} remaining"
                    )
                
                warning_count += 1
                logger.info(f"SLA warning sent for complaint #{complaint.id} - {time_remaining_str} remaining")
        
        if warning_count > 0:
            db.commit()
            logger.info(f"Total SLA warnings sent: {warning_count}")
    
    except Exception as e:
        logger.error(f"Error in check_sla_warnings: {e}", exc_info=True)
        db.rollback()
    
    return warning_count


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
            logger.info(f"Auto-closed complaint #{complaint.id}")
        
        if closed_count > 0:
            db.commit()
            logger.info(f"Total complaints auto-closed: {closed_count}")
    
    except Exception as e:
        logger.error(f"Error in auto_close_resolved_complaints: {e}", exc_info=True)
        db.rollback()
    
    return closed_count


def run_periodic_tasks(db: Session, actor_id: Optional[int] = None):
    logger.info(f"Running periodic workflow automation tasks at {datetime.utcnow()}")
    
    escalated = check_sla_violations(db, actor_id)
    closed = auto_close_resolved_complaints(db, actor_id)
    
    logger.info(f"Summary: {escalated} complaints escalated, {closed} complaints closed")
    
    return {"escalated": escalated, "closed": closed}
