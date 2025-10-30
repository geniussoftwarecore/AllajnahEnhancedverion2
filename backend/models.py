from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
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
    created_at = Column(DateTime, default=datetime.utcnow)
    
    complaints = relationship("Complaint", back_populates="user", foreign_keys="Complaint.user_id")
    assigned_complaints = relationship("Complaint", back_populates="assigned_to_user", foreign_keys="Complaint.assigned_to_id")
    comments = relationship("Comment", back_populates="user")

class Category(Base):
    __tablename__ = "categories"
    
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
    
    status = Column(SQLEnum(ComplaintStatus), default=ComplaintStatus.SUBMITTED)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime)
    
    user = relationship("User", back_populates="complaints", foreign_keys=[user_id])
    assigned_to_user = relationship("User", back_populates="assigned_complaints", foreign_keys=[assigned_to_id])
    category = relationship("Category", back_populates="complaints")
    comments = relationship("Comment", back_populates="complaint", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="complaint", cascade="all, delete-orphan")

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
