from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum, Float, Boolean, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class UserRole(str, enum.Enum):
    TRADER = "trader"
    TECHNICAL_COMMITTEE = "technical_committee"
    HIGHER_COMMITTEE = "higher_committee"

class ComplaintStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ESCALATED = "escalated"
    RESOLVED = "resolved"
    REJECTED = "rejected"

class Priority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskStatus(str, enum.Enum):
    UNASSIGNED = "unassigned"
    IN_QUEUE = "in_queue"
    ASSIGNED = "assigned"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    PENDING_APPROVAL = "pending_approval"
    COMPLETED = "completed"

class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    PENDING = "pending"
    CANCELLED = "cancelled"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    phone = Column(String)
    whatsapp = Column(String)
    telegram = Column(String)
    address = Column(String)
    profile_picture = Column(String)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    complaints = relationship("Complaint", back_populates="user", foreign_keys="Complaint.user_id")
    assigned_complaints = relationship("Complaint", back_populates="assigned_to_user", foreign_keys="Complaint.assigned_to_id")
    comments = relationship("Comment", back_populates="user")
    subscriptions = relationship("Subscription", back_populates="user")
    payments = relationship("Payment", back_populates="user", foreign_keys="Payment.user_id")
    feedbacks = relationship("ComplaintFeedback", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="actor")

class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (
        UniqueConstraint('name_en', name='uq_category_name_en'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    name_ar = Column(String, nullable=False)
    name_en = Column(String, nullable=False)
    government_entity = Column(String, nullable=False)
    description_ar = Column(Text)
    description_en = Column(Text)
    
    complaints = relationship("Complaint", back_populates="category")

class Complaint(Base):
    __tablename__ = "complaints"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    complaint_summary = Column(Text, nullable=False)
    
    closed_at = Column(DateTime)
    can_reopen_until = Column(DateTime)
    
    complaining_on_behalf_of = Column(String, nullable=False)
    behalf_person_name = Column(String)
    behalf_person_relation = Column(String)
    behalf_person_address = Column(String)
    behalf_person_phone = Column(String)
    
    request_type = Column(String)
    problem_occurred_date = Column(DateTime)
    problem_discovered_date = Column(DateTime)
    
    entity_offered_solution = Column(String)
    desired_resolution = Column(Text)
    previous_complaint_filed = Column(String)
    legal_proceedings = Column(String)
    
    priority = Column(SQLEnum(Priority), default=Priority.MEDIUM)
    status = Column(SQLEnum(ComplaintStatus), default=ComplaintStatus.SUBMITTED)
    task_status = Column(SQLEnum(TaskStatus), default=TaskStatus.UNASSIGNED)
    accepted_at = Column(DateTime, nullable=True)
    claimed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    lock_version = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime)
    
    user = relationship("User", back_populates="complaints", foreign_keys=[user_id])
    assigned_to_user = relationship("User", back_populates="assigned_complaints", foreign_keys=[assigned_to_id])
    claimed_by_user = relationship("User", foreign_keys=[claimed_by_id])
    category = relationship("Category", back_populates="complaints")
    comments = relationship("Comment", back_populates="complaint", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="complaint", cascade="all, delete-orphan")
    feedbacks = relationship("ComplaintFeedback", back_populates="complaint", cascade="all, delete-orphan")
    approvals = relationship("ComplaintApproval", back_populates="complaint", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_internal = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    complaint = relationship("Complaint", back_populates="comments")
    user = relationship("User", back_populates="comments")

class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    file_type = Column(String)
    file_size = Column(Integer)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    complaint = relationship("Complaint", back_populates="attachments")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(SQLEnum(SubscriptionStatus), default=SubscriptionStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="subscriptions")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    method = Column(String, nullable=False)
    proof_path = Column(String)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    approval_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime)
    
    user = relationship("User", foreign_keys=[user_id], back_populates="payments")
    approved_by = relationship("User", foreign_keys=[approved_by_id])

class ComplaintFeedback(Base):
    __tablename__ = "complaint_feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    complaint = relationship("Complaint", back_populates="feedbacks")
    user = relationship("User", back_populates="feedbacks")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    target_type = Column(String, nullable=False)
    target_id = Column(Integer, nullable=False)
    details = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    actor = relationship("User", back_populates="audit_logs")

class PaymentMethod(Base):
    __tablename__ = "payment_methods"
    
    id = Column(Integer, primary_key=True, index=True)
    name_ar = Column(String, nullable=False)
    name_en = Column(String, nullable=False)
    instructions_ar = Column(Text)
    instructions_en = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SLAConfig(Base):
    __tablename__ = "sla_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    priority = Column(SQLEnum(Priority), nullable=True)
    response_time_hours = Column(Integer, nullable=False)
    resolution_time_hours = Column(Integer, nullable=False)
    escalation_time_hours = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    category = relationship("Category")

class SystemSettings(Base):
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String, unique=True, nullable=False, index=True)
    setting_value = Column(Text, nullable=False)
    description = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TaskQueue(Base):
    __tablename__ = "task_queues"
    __table_args__ = (
        UniqueConstraint('complaint_id', 'assigned_role', name='uq_taskqueue_complaint_role'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    assigned_role = Column(SQLEnum(UserRole), nullable=False)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    queue_position = Column(Integer, default=0)
    workload_score = Column(Float, default=0.0)
    assigned_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    complaint = relationship("Complaint")
    assigned_user = relationship("User")

class ComplaintApproval(Base):
    __tablename__ = "complaint_approvals"
    
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approval_status = Column(SQLEnum(ApprovalStatus), default=ApprovalStatus.PENDING)
    approval_notes = Column(Text)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    complaint = relationship("Complaint", back_populates="approvals")
    approver = relationship("User")

class QuickReply(Base):
    __tablename__ = "quick_replies"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    created_by = relationship("User")

class NotificationPreference(Base):
    __tablename__ = "notification_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    email_enabled = Column(Boolean, default=True, nullable=False)
    sms_enabled = Column(Boolean, default=False, nullable=False)
    
    notify_status_change = Column(Boolean, default=True, nullable=False)
    notify_assignment = Column(Boolean, default=True, nullable=False)
    notify_comment = Column(Boolean, default=True, nullable=False)
    notify_approval_request = Column(Boolean, default=True, nullable=False)
    notify_approval_decision = Column(Boolean, default=True, nullable=False)
    notify_escalation = Column(Boolean, default=True, nullable=False)
    notify_sla_warning = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", backref="notification_preference")
