from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from models import UserRole, ComplaintStatus, Priority, SubscriptionStatus, PaymentStatus

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: UserRole
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    telegram: Optional[str] = None
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    role: UserRole
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    telegram: Optional[str] = None
    address: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class CategoryResponse(BaseModel):
    id: int
    name_ar: str
    name_en: str
    government_entity: str
    description_ar: Optional[str] = None
    description_en: Optional[str] = None
    
    class Config:
        from_attributes = True

class ComplaintCreate(BaseModel):
    category_id: int
    title: str
    description: str
    complaint_summary: str
    complaining_on_behalf_of: str
    behalf_person_name: Optional[str] = None
    behalf_person_relation: Optional[str] = None
    behalf_person_address: Optional[str] = None
    behalf_person_phone: Optional[str] = None
    request_type: Optional[str] = None
    problem_occurred_date: Optional[datetime] = None
    problem_discovered_date: Optional[datetime] = None
    entity_offered_solution: Optional[str] = None
    desired_resolution: Optional[str] = None
    previous_complaint_filed: Optional[str] = None
    legal_proceedings: Optional[str] = None

class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    assigned_to_id: Optional[int] = None
    priority: Optional[Priority] = None

class ComplaintResponse(BaseModel):
    id: int
    user_id: int
    category_id: int
    assigned_to_id: Optional[int] = None
    title: str
    description: str
    complaint_summary: str
    complaining_on_behalf_of: str
    behalf_person_name: Optional[str] = None
    behalf_person_relation: Optional[str] = None
    behalf_person_address: Optional[str] = None
    behalf_person_phone: Optional[str] = None
    request_type: Optional[str] = None
    problem_occurred_date: Optional[datetime] = None
    problem_discovered_date: Optional[datetime] = None
    entity_offered_solution: Optional[str] = None
    desired_resolution: Optional[str] = None
    previous_complaint_filed: Optional[str] = None
    legal_proceedings: Optional[str] = None
    priority: Priority
    status: ComplaintStatus
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    can_reopen_until: Optional[datetime] = None
    user: Optional[UserResponse] = None
    category: Optional[CategoryResponse] = None
    assigned_to_user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    complaint_id: int
    content: str
    is_internal: bool = False

class CommentResponse(BaseModel):
    id: int
    complaint_id: int
    user_id: int
    content: str
    is_internal: int
    created_at: datetime
    user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class AttachmentResponse(BaseModel):
    id: int
    complaint_id: int
    filename: str
    filepath: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_complaints: int
    submitted: int
    under_review: int
    escalated: int
    resolved: int
    rejected: int
    avg_resolution_time_days: Optional[float] = None
    by_category: Optional[dict] = None

class AnalyticsData(BaseModel):
    total_complaints: int
    submitted: int
    under_review: int
    escalated: int
    resolved: int
    rejected: int
    avg_resolution_time_days: Optional[float] = None
    sla_breaches: int
    active_subscriptions: int
    expiring_soon: int
    pending_payments: int
    avg_feedback_rating: Optional[float] = None
    by_category: dict
    by_status_trend: List[dict] = []
    top_assignees: List[dict] = []
    resolution_rate: float = 0.0

class SubscriptionCreate(BaseModel):
    start_date: datetime
    end_date: datetime

class SubscriptionResponse(BaseModel):
    id: int
    user_id: int
    start_date: datetime
    end_date: datetime
    status: SubscriptionStatus
    created_at: datetime
    
    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    amount: Decimal
    method: str
    subscription_id: Optional[int] = None

class PaymentUpdate(BaseModel):
    status: PaymentStatus
    approval_notes: Optional[str] = None
    
class PaymentResponse(BaseModel):
    id: int
    user_id: int
    subscription_id: Optional[int] = None
    amount: Decimal
    method: str
    proof_path: Optional[str] = None
    approved_by_id: Optional[int] = None
    status: PaymentStatus
    approval_notes: Optional[str] = None
    created_at: datetime
    approved_at: Optional[datetime] = None
    user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class FeedbackCreate(BaseModel):
    rating: int
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: int
    complaint_id: int
    user_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class CategoryCreate(BaseModel):
    name_ar: str
    name_en: str
    government_entity: str
    description_ar: Optional[str] = None
    description_en: Optional[str] = None

class CategoryUpdate(BaseModel):
    name_ar: Optional[str] = None
    name_en: Optional[str] = None
    government_entity: Optional[str] = None
    description_ar: Optional[str] = None
    description_en: Optional[str] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    telegram: Optional[str] = None
    address: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class PasswordReset(BaseModel):
    new_password: str

class AuditLogResponse(BaseModel):
    id: int
    actor_user_id: int
    action: str
    target_type: str
    target_id: int
    details: Optional[str] = None
    created_at: datetime
    actor: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class PaymentMethodCreate(BaseModel):
    name_ar: str
    name_en: str
    instructions_ar: Optional[str] = None
    instructions_en: Optional[str] = None
    is_active: bool = True

class PaymentMethodUpdate(BaseModel):
    name_ar: Optional[str] = None
    name_en: Optional[str] = None
    instructions_ar: Optional[str] = None
    instructions_en: Optional[str] = None
    is_active: Optional[bool] = None

class PaymentMethodResponse(BaseModel):
    id: int
    name_ar: str
    name_en: str
    instructions_ar: Optional[str] = None
    instructions_en: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class SLAConfigCreate(BaseModel):
    category_id: Optional[int] = None
    priority: Optional[Priority] = None
    response_time_hours: int
    resolution_time_hours: int
    escalation_time_hours: int

class SLAConfigUpdate(BaseModel):
    response_time_hours: Optional[int] = None
    resolution_time_hours: Optional[int] = None
    escalation_time_hours: Optional[int] = None

class SLAConfigResponse(BaseModel):
    id: int
    category_id: Optional[int] = None
    priority: Optional[Priority] = None
    response_time_hours: int
    resolution_time_hours: int
    escalation_time_hours: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    category: Optional[CategoryResponse] = None
    
    class Config:
        from_attributes = True

class SystemSettingsCreate(BaseModel):
    setting_key: str
    setting_value: str
    description: Optional[str] = None

class SystemSettingsUpdate(BaseModel):
    setting_value: str
    description: Optional[str] = None

class SystemSettingsResponse(BaseModel):
    id: int
    setting_key: str
    setting_value: str
    description: Optional[str] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
