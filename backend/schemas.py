from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from models import UserRole, ComplaintStatus, Priority, SubscriptionStatus, PaymentStatus, TaskStatus, ApprovalStatus, AccountStatus, EscalationType, AppealStatus, MediationStatus, EscalationState

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
    profile_picture: Optional[str] = None
    is_active: bool = True
    account_status: AccountStatus
    approved_at: Optional[datetime] = None
    approved_by_id: Optional[int] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class MerchantRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    telegram: Optional[str] = None
    address: Optional[str] = None

class MerchantApprovalRequest(BaseModel):
    approved: bool
    rejection_reason: Optional[str] = None

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
    task_status: Optional[TaskStatus] = None
    lock_version: Optional[int] = None

class TaskActionRequest(BaseModel):
    reason: Optional[str] = None

class TaskAcceptResponse(BaseModel):
    success: bool
    message: str
    complaint: Optional['ComplaintResponse'] = None
    
    class Config:
        from_attributes = True

class TaskDeclineResponse(BaseModel):
    success: bool
    message: str
    reassigned_to_id: Optional[int] = None
    
    class Config:
        from_attributes = True

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
    task_status: TaskStatus
    accepted_at: Optional[datetime] = None
    claimed_by_id: Optional[int] = None
    lock_version: int
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    can_reopen_until: Optional[datetime] = None
    escalation_state: EscalationState
    escalation_locked_until: Optional[datetime] = None
    reopened_count: int
    last_assigned_tc_id: Optional[int] = None
    user: Optional[UserResponse] = None
    category: Optional[CategoryResponse] = None
    assigned_to_user: Optional[UserResponse] = None
    claimed_by_user: Optional[UserResponse] = None
    
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
    payment_method_id: int
    amount: Decimal
    method: str
    reference_number: Optional[str] = None
    account_details: Optional[str] = None
    subscription_id: Optional[int] = None

class PaymentUpdate(BaseModel):
    status: PaymentStatus
    approval_notes: Optional[str] = None
    technical_review_notes: Optional[str] = None
    
class PaymentResponse(BaseModel):
    id: int
    user_id: int
    subscription_id: Optional[int] = None
    payment_method_id: int
    amount: Decimal
    method: str
    proof_path: Optional[str] = None
    reference_number: Optional[str] = None
    account_details: Optional[str] = None
    approved_by_id: Optional[int] = None
    reviewed_by_technical_id: Optional[int] = None
    status: PaymentStatus
    approval_notes: Optional[str] = None
    technical_review_notes: Optional[str] = None
    created_at: datetime
    approved_at: Optional[datetime] = None
    technical_reviewed_at: Optional[datetime] = None
    user: Optional[UserResponse] = None
    payment_method: Optional['PaymentMethodResponse'] = None
    
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

class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    telegram: Optional[str] = None
    address: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class EmailUpdateRequest(BaseModel):
    new_email: EmailStr
    current_password: str

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

class TaskQueueResponse(BaseModel):
    id: int
    complaint_id: int
    assigned_role: UserRole
    assigned_user_id: Optional[int] = None
    queue_position: int
    workload_score: float
    assigned_at: Optional[datetime] = None
    created_at: datetime
    assigned_user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class ComplaintApprovalCreate(BaseModel):
    complaint_id: int
    approval_notes: Optional[str] = None

class ComplaintApprovalUpdate(BaseModel):
    approval_status: ApprovalStatus
    approval_notes: Optional[str] = None

class ComplaintApprovalResponse(BaseModel):
    id: int
    complaint_id: int
    approver_id: int
    approval_status: ApprovalStatus
    approval_notes: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    stage: str
    required_approvals: int
    is_multi_reviewer: bool
    approver: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class QuickReplyCreate(BaseModel):
    title: str
    content: str
    category: Optional[str] = None

class QuickReplyUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None

class QuickReplyResponse(BaseModel):
    id: int
    title: str
    content: str
    category: Optional[str] = None
    is_active: bool
    created_by_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class BulkAssignRequest(BaseModel):
    complaint_ids: List[int]
    assigned_to_id: int

class BulkStatusRequest(BaseModel):
    complaint_ids: List[int]
    status: ComplaintStatus

class BulkActionResponse(BaseModel):
    success_count: int
    failed_count: int
    total: int
    successful_ids: List[int]
    failed_ids: List[int]
    errors: List[str] = []

class NotificationPreferenceCreate(BaseModel):
    email_enabled: bool = True
    sms_enabled: bool = False
    notify_status_change: bool = True
    notify_assignment: bool = True
    notify_comment: bool = True
    notify_approval_request: bool = True
    notify_approval_decision: bool = True
    notify_escalation: bool = True
    notify_sla_warning: bool = True

class NotificationPreferenceUpdate(BaseModel):
    email_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None
    notify_status_change: Optional[bool] = None
    notify_assignment: Optional[bool] = None
    notify_comment: Optional[bool] = None
    notify_approval_request: Optional[bool] = None
    notify_approval_decision: Optional[bool] = None
    notify_escalation: Optional[bool] = None
    notify_sla_warning: Optional[bool] = None

class NotificationPreferenceResponse(BaseModel):
    id: int
    user_id: int
    email_enabled: bool
    sms_enabled: bool
    notify_status_change: bool
    notify_assignment: bool
    notify_comment: bool
    notify_approval_request: bool
    notify_approval_decision: bool
    notify_escalation: bool
    notify_sla_warning: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ComplaintEscalationCreate(BaseModel):
    escalation_type: EscalationType
    target_role: UserRole
    reason: Optional[str] = None

class ComplaintEscalationResponse(BaseModel):
    id: int
    complaint_id: int
    escalated_by_id: int
    escalation_type: EscalationType
    target_role: UserRole
    reason: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    escalated_by: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class ComplaintAppealCreate(BaseModel):
    reason: str

class ComplaintAppealUpdate(BaseModel):
    status: AppealStatus
    decision_rationale: Optional[str] = None

class ComplaintAppealResponse(BaseModel):
    id: int
    complaint_id: int
    requester_id: int
    status: AppealStatus
    reason: str
    submitted_at: datetime
    decided_at: Optional[datetime] = None
    decided_by_id: Optional[int] = None
    decision_rationale: Optional[str] = None
    requester: Optional[UserResponse] = None
    decided_by: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class ComplaintMediationRequestCreate(BaseModel):
    reason: str

class ComplaintMediationRequestUpdate(BaseModel):
    status: MediationStatus
    mediator_id: Optional[int] = None
    notes: Optional[str] = None

class ComplaintMediationRequestResponse(BaseModel):
    id: int
    complaint_id: int
    requested_by_id: int
    status: MediationStatus
    mediator_id: Optional[int] = None
    reason: str
    scheduled_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    requested_by: Optional[UserResponse] = None
    mediator: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class ManualEscalationRequest(BaseModel):
    reason: str

class ReassignmentRequest(BaseModel):
    target_user_id: Optional[int] = None
    reason: str
