from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from models import Complaint, User, TaskStatus, ComplaintStatus
from datetime import datetime
from audit_helper import create_audit_log
import logging

logger = logging.getLogger(__name__)

class ComplaintTaskService:
    
    @staticmethod
    def accept_task(complaint_id: int, user: User, db: Session) -> Complaint:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        if complaint.task_status not in [TaskStatus.ASSIGNED, TaskStatus.IN_QUEUE]:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot accept task in current status: {complaint.task_status}"
            )
        
        if complaint.assigned_to_id and complaint.assigned_to_id != user.id:
            raise HTTPException(
                status_code=403, 
                detail="This task is assigned to another user"
            )
        
        complaint.task_status = TaskStatus.ACCEPTED
        complaint.accepted_at = datetime.utcnow()
        complaint.assigned_to_id = user.id
        complaint.lock_version += 1
        
        create_audit_log(
            db,
            user.id,
            "ACCEPT_TASK",
            "complaint",
            complaint.id,
            f"User {user.email} accepted task for complaint #{complaint.id}"
        )
        
        db.commit()
        db.refresh(complaint)
        
        logger.info(f"User {user.id} accepted task for complaint {complaint.id}")
        
        return complaint
    
    @staticmethod
    def reject_task(complaint_id: int, user: User, reason: str, db: Session) -> Complaint:
        from models import TaskQueue
        
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        if complaint.task_status != TaskStatus.ASSIGNED:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot reject task in current status: {complaint.task_status}"
            )
        
        if complaint.assigned_to_id != user.id:
            raise HTTPException(
                status_code=403, 
                detail="You are not assigned to this task"
            )
        
        from task_queue_service import task_queue_service
        
        queue_entry = db.query(TaskQueue).filter(
            TaskQueue.complaint_id == complaint_id,
            TaskQueue.assigned_user_id == user.id
        ).first()
        
        if queue_entry:
            queue_entry.assigned_user_id = None
            queue_entry.assigned_at = None
            queue_entry.workload_score = 0.0
        
        complaint.task_status = TaskStatus.IN_QUEUE
        complaint.assigned_to_id = None
        complaint.lock_version += 1
        
        create_audit_log(
            db,
            user.id,
            "REJECT_TASK",
            "complaint",
            complaint.id,
            f"User {user.email} rejected task for complaint #{complaint.id}. Reason: {reason}"
        )
        
        db.commit()
        
        task_queue_service.rebalance_queue(user.role, db)
        
        db.refresh(complaint)
        
        logger.info(f"User {user.id} rejected task for complaint {complaint.id}")
        
        return complaint
    
    @staticmethod
    def start_working(complaint_id: int, user: User, db: Session) -> Complaint:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        if complaint.task_status != TaskStatus.ACCEPTED:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot start working on task in current status: {complaint.task_status}"
            )
        
        if complaint.assigned_to_id != user.id:
            raise HTTPException(
                status_code=403, 
                detail="You are not assigned to this task"
            )
        
        if complaint.claimed_by_id and complaint.claimed_by_id != user.id:
            raise HTTPException(
                status_code=409, 
                detail=f"Another user is currently working on this complaint"
            )
        
        complaint.task_status = TaskStatus.IN_PROGRESS
        complaint.claimed_by_id = user.id
        complaint.lock_version += 1
        
        create_audit_log(
            db,
            user.id,
            "START_WORKING",
            "complaint",
            complaint.id,
            f"User {user.email} started working on complaint #{complaint.id}"
        )
        
        db.commit()
        db.refresh(complaint)
        
        logger.info(f"User {user.id} started working on complaint {complaint.id}")
        
        return complaint
    
    @staticmethod
    def release_claim(complaint_id: int, user: User, db: Session) -> Complaint:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        if complaint.claimed_by_id != user.id:
            raise HTTPException(
                status_code=403, 
                detail="You have not claimed this complaint"
            )
        
        complaint.claimed_by_id = None
        complaint.task_status = TaskStatus.ACCEPTED
        complaint.lock_version += 1
        
        create_audit_log(
            db,
            user.id,
            "RELEASE_CLAIM",
            "complaint",
            complaint.id,
            f"User {user.email} released claim on complaint #{complaint.id}"
        )
        
        db.commit()
        db.refresh(complaint)
        
        logger.info(f"User {user.id} released claim on complaint {complaint.id}")
        
        return complaint
    
    @staticmethod
    def update_with_optimistic_lock(
        complaint_id: int, 
        lock_version: int, 
        update_data: dict,
        user: User,
        db: Session
    ) -> Complaint:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        if complaint.lock_version != lock_version:
            raise HTTPException(
                status_code=409,
                detail=f"Conflict: The complaint has been modified by another user. Please refresh and try again."
            )
        
        for key, value in update_data.items():
            if hasattr(complaint, key) and value is not None:
                setattr(complaint, key, value)
        
        complaint.lock_version += 1
        
        create_audit_log(
            db,
            user.id,
            "UPDATE_COMPLAINT",
            "complaint",
            complaint.id,
            f"User {user.email} updated complaint #{complaint.id} with optimistic lock"
        )
        
        try:
            db.commit()
            db.refresh(complaint)
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(status_code=409, detail="Conflict during update")
        
        logger.info(f"User {user.id} updated complaint {complaint.id} with lock version {lock_version}")
        
        return complaint

complaint_task_service = ComplaintTaskService()
