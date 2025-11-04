from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from models import TaskQueue, Complaint, User, UserRole, TaskStatus, ComplaintStatus
from datetime import datetime, timedelta
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

class TaskQueueService:
    
    @staticmethod
    def calculate_workload_score(user: User, db: Session) -> float:
        active_complaints = db.query(Complaint).filter(
            and_(
                Complaint.assigned_to_id == user.id,
                Complaint.status.in_([
                    ComplaintStatus.UNDER_REVIEW,
                    ComplaintStatus.ESCALATED
                ])
            )
        ).count()
        
        pending_in_queue = db.query(TaskQueue).filter(
            and_(
                TaskQueue.assigned_user_id == user.id,
                TaskQueue.assigned_at.isnot(None)
            )
        ).count()
        
        workload_score = (active_complaints * 1.5) + pending_in_queue
        
        return workload_score
    
    @staticmethod
    def get_best_assignee_for_role(role: UserRole, db: Session) -> Optional[User]:
        active_users = db.query(User).filter(
            and_(
                User.role == role,
                User.is_active == True
            )
        ).all()
        
        if not active_users:
            logger.warning(f"No active users found for role: {role}")
            return None
        
        user_workloads = []
        for user in active_users:
            workload = TaskQueueService.calculate_workload_score(user, db)
            user_workloads.append((user, workload))
        
        user_workloads.sort(key=lambda x: x[1])
        
        best_user, best_workload = user_workloads[0]
        logger.info(f"Assigned to user {best_user.id} ({best_user.email}) with workload: {best_workload}")
        
        return best_user
    
    @staticmethod
    def add_to_queue(complaint_id: int, assigned_role: UserRole, db: Session) -> TaskQueue:
        existing_queue = db.query(TaskQueue).filter(
            and_(
                TaskQueue.complaint_id == complaint_id,
                TaskQueue.assigned_role == assigned_role
            )
        ).first()
        
        if existing_queue:
            logger.info(f"Complaint {complaint_id} already in queue for role {assigned_role}")
            return existing_queue
        
        best_user = TaskQueueService.get_best_assignee_for_role(assigned_role, db)
        
        max_position = db.query(func.max(TaskQueue.queue_position)).filter(
            TaskQueue.assigned_role == assigned_role
        ).scalar() or 0
        
        queue_entry = TaskQueue(
            complaint_id=complaint_id,
            assigned_role=assigned_role,
            assigned_user_id=best_user.id if best_user else None,
            queue_position=max_position + 1,
            workload_score=TaskQueueService.calculate_workload_score(best_user, db) if best_user else 0.0,
            assigned_at=datetime.utcnow() if best_user else None
        )
        
        db.add(queue_entry)
        db.commit()
        db.refresh(queue_entry)
        
        logger.info(f"Added complaint {complaint_id} to queue for role {assigned_role}, assigned to user {best_user.id if best_user else 'None'}")
        
        return queue_entry
    
    @staticmethod
    def get_my_queue(user_id: int, db: Session) -> List[TaskQueue]:
        queue_items = db.query(TaskQueue).filter(
            TaskQueue.assigned_user_id == user_id
        ).order_by(TaskQueue.queue_position).all()
        
        return queue_items
    
    @staticmethod
    def get_role_queue(role: UserRole, db: Session) -> List[TaskQueue]:
        queue_items = db.query(TaskQueue).filter(
            TaskQueue.assigned_role == role
        ).order_by(TaskQueue.queue_position).all()
        
        return queue_items
    
    @staticmethod
    def remove_from_queue(complaint_id: int, db: Session):
        queue_entries = db.query(TaskQueue).filter(
            TaskQueue.complaint_id == complaint_id
        ).all()
        
        for entry in queue_entries:
            db.delete(entry)
        
        db.commit()
        logger.info(f"Removed complaint {complaint_id} from all queues")
    
    @staticmethod
    def rebalance_queue(role: UserRole, db: Session):
        active_users = db.query(User).filter(
            and_(
                User.role == role,
                User.is_active == True
            )
        ).all()
        
        if not active_users:
            logger.warning(f"No active users to rebalance for role: {role}")
            return
        
        unassigned_queue = db.query(TaskQueue).filter(
            and_(
                TaskQueue.assigned_role == role,
                TaskQueue.assigned_user_id.is_(None)
            )
        ).all()
        
        for queue_entry in unassigned_queue:
            best_user = TaskQueueService.get_best_assignee_for_role(role, db)
            if best_user:
                queue_entry.assigned_user_id = best_user.id
                queue_entry.workload_score = TaskQueueService.calculate_workload_score(best_user, db)
                queue_entry.assigned_at = datetime.utcnow()
        
        db.commit()
        logger.info(f"Rebalanced queue for role: {role}")
    
    @staticmethod
    def reassign_task(complaint_id: int, excluding_user_id: Optional[int], db: Session) -> Optional[User]:
        queue_entry = db.query(TaskQueue).filter(
            TaskQueue.complaint_id == complaint_id
        ).first()
        
        if not queue_entry:
            logger.warning(f"No queue entry found for complaint {complaint_id}")
            return None
        
        role = queue_entry.assigned_role
        
        active_users = db.query(User).filter(
            and_(
                User.role == role,
                User.is_active == True,
                User.id != excluding_user_id if excluding_user_id else True
            )
        ).all()
        
        if not active_users:
            logger.warning(f"No other active users found for reassignment (role: {role})")
            queue_entry.assigned_user_id = None
            queue_entry.assigned_at = None
            db.commit()
            return None
        
        user_workloads = []
        for user in active_users:
            workload = TaskQueueService.calculate_workload_score(user, db)
            user_workloads.append((user, workload))
        
        user_workloads.sort(key=lambda x: x[1])
        
        best_user, best_workload = user_workloads[0]
        
        queue_entry.assigned_user_id = best_user.id
        queue_entry.workload_score = best_workload
        queue_entry.assigned_at = datetime.utcnow()
        
        db.commit()
        db.refresh(queue_entry)
        
        logger.info(f"Reassigned complaint {complaint_id} to user {best_user.id} (workload: {best_workload})")
        
        return best_user

task_queue_service = TaskQueueService()
