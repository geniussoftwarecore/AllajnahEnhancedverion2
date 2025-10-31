from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import os
import shutil
from datetime import datetime

from database import get_db
from models import (
    User, Complaint, Comment, Attachment, Category, 
    Subscription, Payment, ComplaintFeedback, AuditLog,
    PaymentMethod, SLAConfig, SystemSettings,
    UserRole, ComplaintStatus, SubscriptionStatus, PaymentStatus, Priority
)
from schemas import (
    UserCreate, UserLogin, UserResponse, Token, UserUpdate, PasswordReset,
    ComplaintCreate, ComplaintUpdate, ComplaintResponse,
    CommentCreate, CommentResponse,
    AttachmentResponse, CategoryResponse, CategoryCreate, CategoryUpdate, DashboardStats, AnalyticsData,
    SubscriptionCreate, SubscriptionResponse,
    PaymentCreate, PaymentUpdate, PaymentResponse,
    FeedbackCreate, FeedbackResponse, AuditLogResponse,
    PaymentMethodCreate, PaymentMethodUpdate, PaymentMethodResponse,
    SLAConfigCreate, SLAConfigUpdate, SLAConfigResponse,
    SystemSettingsCreate, SystemSettingsUpdate, SystemSettingsResponse
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, require_role
)
from audit_helper import create_audit_log
from workflow_automation import (
    auto_assign_complaint, check_sla_violations,
    auto_close_resolved_complaints, run_periodic_tasks
)
from duplicate_detection import check_duplicate_warning

app = FastAPI(title="Allajnah Enhanced API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/api/setup/status")
def get_setup_status(db: Session = Depends(get_db)):
    higher_committee_count = db.query(User).filter(User.role == UserRole.HIGHER_COMMITTEE).count()
    return {"needs_setup": higher_committee_count == 0}

@app.post("/api/setup/initialize", response_model=Token)
def initialize_setup(user_data: UserCreate, db: Session = Depends(get_db)):
    higher_committee_count = db.query(User).filter(User.role == UserRole.HIGHER_COMMITTEE).count()
    
    if higher_committee_count > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Setup has already been completed. Admin users already exist."
        )
    
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=UserRole.HIGHER_COMMITTEE,
        phone=user_data.phone,
        whatsapp=user_data.whatsapp,
        telegram=user_data.telegram,
        address=user_data.address
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": str(new_user.id)})
    user_response = UserResponse.model_validate(new_user)
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@app.post("/api/auth/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Public registration is disabled. Please contact the administrator to create an account."
    )

@app.post("/api/admin/users", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role,
        phone=user_data.phone,
        whatsapp=user_data.whatsapp,
        telegram=user_data.telegram,
        address=user_data.address
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse.model_validate(new_user)

@app.post("/api/auth/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    user_response = UserResponse.model_validate(user)
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@app.get("/api/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    return categories

@app.post("/api/complaints/check-duplicate")
def check_complaint_duplicate(
    complaint_data: ComplaintCreate,
    current_user: User = Depends(require_role(UserRole.TRADER)),
    db: Session = Depends(get_db)
):
    result = check_duplicate_warning(
        db,
        title=complaint_data.title,
        category_id=complaint_data.category_id,
        description=complaint_data.description,
        summary=complaint_data.complaint_summary,
        threshold=0.7
    )
    return result

@app.post("/api/complaints", response_model=ComplaintResponse)
def create_complaint(
    complaint_data: ComplaintCreate,
    current_user: User = Depends(require_role(UserRole.TRADER)),
    db: Session = Depends(get_db)
):
    new_complaint = Complaint(
        user_id=current_user.id,
        **complaint_data.dict()
    )
    
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    
    auto_assign_complaint(db, new_complaint)
    db.refresh(new_complaint)
    
    create_audit_log(db, current_user.id, "CREATE_COMPLAINT", "complaint", new_complaint.id,
                     f"Created complaint #{new_complaint.id}")
    db.commit()
    
    return ComplaintResponse.model_validate(new_complaint)

@app.get("/api/complaints", response_model=List[ComplaintResponse])
def get_complaints(
    status: Optional[ComplaintStatus] = None,
    category_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    
    if current_user.role == UserRole.TRADER:
        query = query.filter(Complaint.user_id == current_user.id)
    elif current_user.role == UserRole.TECHNICAL_COMMITTEE:
        query = query.filter(
            (Complaint.status == ComplaintStatus.SUBMITTED) |
            (Complaint.status == ComplaintStatus.UNDER_REVIEW) |
            (Complaint.assigned_to_id == current_user.id)
        )
    
    if status:
        query = query.filter(Complaint.status == status)
    if category_id:
        query = query.filter(Complaint.category_id == category_id)
    
    complaints = query.order_by(Complaint.created_at.desc()).all()
    return complaints

@app.get("/api/complaints/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if current_user.role == UserRole.TRADER and complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return ComplaintResponse.model_validate(complaint)

@app.patch("/api/complaints/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(
    complaint_id: int,
    update_data: ComplaintUpdate,
    current_user: User = Depends(require_role(UserRole.TECHNICAL_COMMITTEE, UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if update_data.status is not None:
        complaint.status = update_data.status
        if update_data.status in [ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED]:
            complaint.resolved_at = datetime.utcnow()
            from dateutil.relativedelta import relativedelta
            complaint.can_reopen_until = datetime.utcnow() + relativedelta(days=7)
    
    if update_data.assigned_to_id is not None:
        complaint.assigned_to_id = update_data.assigned_to_id
        if complaint.status == ComplaintStatus.SUBMITTED:
            complaint.status = ComplaintStatus.UNDER_REVIEW
    
    complaint.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(complaint)
    
    create_audit_log(db, current_user.id, "UPDATE_COMPLAINT", "complaint", complaint.id, 
                     f"Updated complaint status to {complaint.status}")
    db.commit()
    
    return ComplaintResponse.model_validate(complaint)

@app.post("/api/complaints/{complaint_id}/reopen", response_model=ComplaintResponse)
def reopen_complaint(
    complaint_id: int,
    current_user: User = Depends(require_role(UserRole.TRADER)),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if complaint.status not in [ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED]:
        raise HTTPException(status_code=400, detail="Only resolved or rejected complaints can be reopened")
    
    if not complaint.can_reopen_until or datetime.utcnow() > complaint.can_reopen_until:
        raise HTTPException(status_code=400, detail="Reopen window has expired")
    
    complaint.status = ComplaintStatus.SUBMITTED
    complaint.resolved_at = None
    complaint.can_reopen_until = None
    complaint.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(complaint)
    
    return ComplaintResponse.model_validate(complaint)

@app.post("/api/complaints/{complaint_id}/comments", response_model=CommentResponse)
def create_comment(
    complaint_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if current_user.role == UserRole.TRADER and complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if current_user.role == UserRole.TRADER and comment_data.is_internal:
        raise HTTPException(status_code=403, detail="Cannot create internal comments")
    
    new_comment = Comment(
        complaint_id=complaint_id,
        user_id=current_user.id,
        content=comment_data.content,
        is_internal=1 if comment_data.is_internal else 0
    )
    
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    return CommentResponse.model_validate(new_comment)

@app.get("/api/complaints/{complaint_id}/comments", response_model=List[CommentResponse])
def get_comments(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if current_user.role == UserRole.TRADER and complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = db.query(Comment).filter(Comment.complaint_id == complaint_id)
    
    if current_user.role == UserRole.TRADER:
        query = query.filter(Comment.is_internal == 0)
    
    comments = query.order_by(Comment.created_at.asc()).all()
    return comments

@app.post("/api/complaints/{complaint_id}/attachments", response_model=AttachmentResponse)
async def upload_attachment(
    complaint_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if current_user.role == UserRole.TRADER and complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"{complaint_id}_{datetime.utcnow().timestamp()}{file_extension}"
    filepath = os.path.join("uploads", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = os.path.getsize(filepath)
    
    new_attachment = Attachment(
        complaint_id=complaint_id,
        filename=file.filename,
        filepath=filepath,
        file_type=file.content_type,
        file_size=file_size
    )
    
    db.add(new_attachment)
    db.commit()
    db.refresh(new_attachment)
    
    return AttachmentResponse.model_validate(new_attachment)

@app.get("/api/complaints/{complaint_id}/attachments", response_model=List[AttachmentResponse])
def get_attachments(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if current_user.role == UserRole.TRADER and complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    attachments = db.query(Attachment).filter(Attachment.complaint_id == complaint_id).all()
    return attachments

@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    
    if current_user.role == UserRole.TRADER:
        query = query.filter(Complaint.user_id == current_user.id)
    
    total_complaints = query.count()
    submitted = query.filter(Complaint.status == ComplaintStatus.SUBMITTED).count()
    under_review = query.filter(Complaint.status == ComplaintStatus.UNDER_REVIEW).count()
    escalated = query.filter(Complaint.status == ComplaintStatus.ESCALATED).count()
    resolved = query.filter(Complaint.status == ComplaintStatus.RESOLVED).count()
    rejected = query.filter(Complaint.status == ComplaintStatus.REJECTED).count()
    
    avg_resolution_time = None
    resolved_complaints = query.filter(
        Complaint.status.in_([ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED]),
        Complaint.resolved_at.isnot(None)
    ).all()
    
    if resolved_complaints:
        total_days = sum([
            (c.resolved_at - c.created_at).days 
            for c in resolved_complaints
        ])
        avg_resolution_time = round(total_days / len(resolved_complaints), 2)
    
    by_category = {}
    category_counts = db.query(
        Category.name_ar, 
        func.count(Complaint.id)
    ).join(Complaint).group_by(Category.id, Category.name_ar).all()
    
    for category_name, count in category_counts:
        by_category[category_name] = count
    
    return DashboardStats(
        total_complaints=total_complaints,
        submitted=submitted,
        under_review=under_review,
        escalated=escalated,
        resolved=resolved,
        rejected=rejected,
        avg_resolution_time_days=avg_resolution_time,
        by_category=by_category
    )

@app.get("/api/admin/analytics", response_model=AnalyticsData)
def get_enhanced_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    from datetime import datetime, timedelta
    
    date_start = datetime.fromisoformat(start_date) if start_date else None
    date_end = datetime.fromisoformat(end_date) if end_date else None
    
    query = db.query(Complaint)
    if date_start:
        query = query.filter(Complaint.created_at >= date_start)
    if date_end:
        query = query.filter(Complaint.created_at <= date_end)
    
    total_complaints = query.count()
    submitted = query.filter(Complaint.status == ComplaintStatus.SUBMITTED).count()
    under_review = query.filter(Complaint.status == ComplaintStatus.UNDER_REVIEW).count()
    escalated = query.filter(Complaint.status == ComplaintStatus.ESCALATED).count()
    resolved = query.filter(Complaint.status == ComplaintStatus.RESOLVED).count()
    rejected = query.filter(Complaint.status == ComplaintStatus.REJECTED).count()
    
    resolved_complaints = query.filter(
        Complaint.status.in_([ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED]),
        Complaint.resolved_at.isnot(None)
    ).all()
    
    avg_resolution_time = None
    if resolved_complaints:
        total_days = sum([(c.resolved_at - c.created_at).days for c in resolved_complaints])
        avg_resolution_time = round(total_days / len(resolved_complaints), 2)
    
    category_query = db.query(Category.name_ar, func.count(Complaint.id)).join(Complaint)
    if date_start:
        category_query = category_query.filter(Complaint.created_at >= date_start)
    if date_end:
        category_query = category_query.filter(Complaint.created_at <= date_end)
    category_counts = category_query.group_by(Category.id, Category.name_ar).all()
    
    by_category = {}
    for category_name, count in category_counts:
        by_category[category_name] = count
    
    sla_breaches = query.filter(Complaint.status == ComplaintStatus.ESCALATED).count()
    
    active_subs = db.query(Subscription).filter(Subscription.status == SubscriptionStatus.ACTIVE).count()
    expiring_soon = db.query(Subscription).filter(
        Subscription.status == SubscriptionStatus.ACTIVE,
        Subscription.end_date <= datetime.utcnow() + timedelta(days=30)
    ).count()
    pending_payments = db.query(Payment).filter(Payment.status == PaymentStatus.PENDING).count()
    
    feedback_query = db.query(ComplaintFeedback).join(Complaint)
    if date_start:
        feedback_query = feedback_query.filter(Complaint.created_at >= date_start)
    if date_end:
        feedback_query = feedback_query.filter(Complaint.created_at <= date_end)
    feedbacks = feedback_query.all()
    
    avg_feedback = None
    if feedbacks:
        avg_feedback = round(sum([f.rating for f in feedbacks]) / len(feedbacks), 2)
    
    assignee_query = db.query(
        User.first_name, User.last_name, func.count(Complaint.id).label('count')
    ).join(Complaint, Complaint.assigned_to_id == User.id)
    if date_start:
        assignee_query = assignee_query.filter(Complaint.created_at >= date_start)
    if date_end:
        assignee_query = assignee_query.filter(Complaint.created_at <= date_end)
    top_assignees = assignee_query.group_by(User.id, User.first_name, User.last_name).order_by(func.count(Complaint.id).desc()).limit(5).all()
    
    assignees_list = [{"name": f"{a[0]} {a[1]}", "count": a[2]} for a in top_assignees]
    
    resolution_rate = 0.0
    if total_complaints > 0:
        resolution_rate = round(((resolved + rejected) / total_complaints) * 100, 2)
    
    return AnalyticsData(
        total_complaints=total_complaints,
        submitted=submitted,
        under_review=under_review,
        escalated=escalated,
        resolved=resolved,
        rejected=rejected,
        avg_resolution_time_days=avg_resolution_time,
        sla_breaches=sla_breaches,
        active_subscriptions=active_subs,
        expiring_soon=expiring_soon,
        pending_payments=pending_payments,
        avg_feedback_rating=avg_feedback,
        by_category=by_category,
        by_status_trend=[],
        top_assignees=assignees_list,
        resolution_rate=resolution_rate
    )

@app.get("/api/users/committee", response_model=List[UserResponse])
def get_committee_users(
    current_user: User = Depends(require_role(UserRole.TECHNICAL_COMMITTEE, UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    users = db.query(User).filter(
        (User.role == UserRole.TECHNICAL_COMMITTEE) |
        (User.role == UserRole.HIGHER_COMMITTEE)
    ).all()
    return users

@app.get("/api/admin/users", response_model=List[UserResponse])
def list_all_users(
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.first_name.ilike(search_filter)) |
            (User.last_name.ilike(search_filter)) |
            (User.email.ilike(search_filter))
        )
    
    users = query.order_by(User.created_at.desc()).all()
    return users

@app.post("/api/admin/users", response_model=UserResponse)
def create_committee_user(
    user_data: UserCreate,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role,
        phone=user_data.phone,
        whatsapp=user_data.whatsapp,
        telegram=user_data.telegram,
        address=user_data.address,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    create_audit_log(db, current_user.id, "CREATE_USER", "user", new_user.id, 
                     f"Created user {new_user.email} with role {new_user.role}")
    db.commit()
    
    return UserResponse.model_validate(new_user)

@app.get("/api/admin/users/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)

@app.patch("/api/admin/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    update_data: UserUpdate,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id and update_data.is_active == False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    if user.id == current_user.id and update_data.role and update_data.role != UserRole.HIGHER_COMMITTEE:
        admins_count = db.query(User).filter(
            User.role == UserRole.HIGHER_COMMITTEE,
            User.is_active == True,
            User.id != current_user.id
        ).count()
        if admins_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change role - you are the last active admin"
            )
    
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(user, key, value)
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    create_audit_log(db, current_user.id, "UPDATE_USER", "user", user.id, 
                     f"Updated user {user.email}")
    db.commit()
    
    return UserResponse.model_validate(user)

@app.delete("/api/admin/users/{user_id}")
def deactivate_user(
    user_id: int,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    if user.role == UserRole.HIGHER_COMMITTEE:
        active_admins = db.query(User).filter(
            User.role == UserRole.HIGHER_COMMITTEE,
            User.is_active == True,
            User.id != user_id
        ).count()
        if active_admins == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate the last active admin"
            )
    
    user.is_active = False
    user.updated_at = datetime.utcnow()
    db.commit()
    
    create_audit_log(db, current_user.id, "DEACTIVATE_USER", "user", user.id, 
                     f"Deactivated user {user.email}")
    db.commit()
    
    return {"message": "User deactivated successfully"}

@app.post("/api/admin/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    password_data: PasswordReset,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    user.hashed_password = get_password_hash(password_data.new_password)
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Password reset successfully"}

@app.post("/api/categories", response_model=CategoryResponse)
def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    new_category = Category(**category_data.dict())
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return CategoryResponse.model_validate(new_category)

@app.patch("/api/categories/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    update_data: CategoryUpdate,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(category, key, value)
    
    db.commit()
    db.refresh(category)
    return CategoryResponse.model_validate(category)

@app.delete("/api/categories/{category_id}")
def delete_category(
    category_id: int,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully"}

@app.get("/api/subscriptions/me", response_model=Optional[SubscriptionResponse])
def get_my_subscription(
    current_user: User = Depends(require_role(UserRole.TRADER)),
    db: Session = Depends(get_db)
):
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == SubscriptionStatus.ACTIVE
    ).order_by(Subscription.end_date.desc()).first()
    
    if subscription and subscription.end_date < datetime.utcnow():
        subscription.status = SubscriptionStatus.EXPIRED
        db.commit()
        db.refresh(subscription)
    
    return subscription

@app.get("/api/subscriptions", response_model=List[SubscriptionResponse])
def get_all_subscriptions(
    status: Optional[SubscriptionStatus] = None,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    query = db.query(Subscription)
    if status:
        query = query.filter(Subscription.status == status)
    subscriptions = query.order_by(Subscription.created_at.desc()).all()
    return subscriptions

@app.post("/api/payments", response_model=PaymentResponse)
async def submit_payment(
    amount: float = Form(...),
    method: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.TRADER)),
    db: Session = Depends(get_db)
):
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"payment_{current_user.id}_{datetime.utcnow().timestamp()}{file_extension}"
    filepath = os.path.join("uploads", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    new_payment = Payment(
        user_id=current_user.id,
        amount=amount,
        method=method,
        proof_path=filepath,
        status=PaymentStatus.PENDING
    )
    
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    
    return PaymentResponse.model_validate(new_payment)

@app.get("/api/payments", response_model=List[PaymentResponse])
def get_payments(
    status: Optional[PaymentStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Payment)
    
    if current_user.role == UserRole.TRADER:
        query = query.filter(Payment.user_id == current_user.id)
    elif status:
        query = query.filter(Payment.status == status)
    
    payments = query.order_by(Payment.created_at.desc()).all()
    return payments

@app.patch("/api/payments/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: int,
    update_data: PaymentUpdate,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    payment.status = update_data.status
    payment.approved_by_id = current_user.id
    payment.approved_at = datetime.utcnow()
    if update_data.approval_notes:
        payment.approval_notes = update_data.approval_notes
    
    if update_data.status == PaymentStatus.APPROVED:
        from dateutil.relativedelta import relativedelta
        subscription = Subscription(
            user_id=payment.user_id,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + relativedelta(years=1),
            status=SubscriptionStatus.ACTIVE
        )
        db.add(subscription)
        payment.subscription_id = subscription.id
    
    create_audit_log(db, current_user.id, "APPROVE_PAYMENT", "payment", payment.id, 
                     f"Payment {payment.status} for user ID {payment.user_id}, amount {payment.amount}")
    db.commit()
    db.refresh(payment)
    
    return PaymentResponse.model_validate(payment)

@app.post("/api/complaints/{complaint_id}/feedback", response_model=FeedbackResponse)
def create_feedback(
    complaint_id: int,
    feedback_data: FeedbackCreate,
    current_user: User = Depends(require_role(UserRole.TRADER)),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if complaint.status not in [ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED]:
        raise HTTPException(status_code=400, detail="Can only provide feedback on resolved/rejected complaints")
    
    existing_feedback = db.query(ComplaintFeedback).filter(
        ComplaintFeedback.complaint_id == complaint_id,
        ComplaintFeedback.user_id == current_user.id
    ).first()
    
    if existing_feedback:
        raise HTTPException(status_code=400, detail="Feedback already submitted")
    
    if feedback_data.rating < 1 or feedback_data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    new_feedback = ComplaintFeedback(
        complaint_id=complaint_id,
        user_id=current_user.id,
        rating=feedback_data.rating,
        comment=feedback_data.comment
    )
    
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    
    return FeedbackResponse.model_validate(new_feedback)

@app.get("/api/complaints/{complaint_id}/feedback", response_model=Optional[FeedbackResponse])
def get_feedback(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if current_user.role == UserRole.TRADER and complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    feedback = db.query(ComplaintFeedback).filter(
        ComplaintFeedback.complaint_id == complaint_id
    ).first()
    
    return feedback

@app.get("/api/admin/payment-methods", response_model=List[PaymentMethodResponse])
def get_payment_methods(
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(PaymentMethod)
    if is_active is not None:
        query = query.filter(PaymentMethod.is_active == is_active)
    methods = query.order_by(PaymentMethod.created_at.desc()).all()
    return methods

@app.post("/api/admin/payment-methods", response_model=PaymentMethodResponse)
def create_payment_method(
    method_data: PaymentMethodCreate,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    new_method = PaymentMethod(**method_data.dict())
    db.add(new_method)
    db.commit()
    db.refresh(new_method)
    return PaymentMethodResponse.model_validate(new_method)

@app.patch("/api/admin/payment-methods/{method_id}", response_model=PaymentMethodResponse)
def update_payment_method(
    method_id: int,
    update_data: PaymentMethodUpdate,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    method = db.query(PaymentMethod).filter(PaymentMethod.id == method_id).first()
    if not method:
        raise HTTPException(status_code=404, detail="Payment method not found")
    
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(method, key, value)
    
    method.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(method)
    return PaymentMethodResponse.model_validate(method)

@app.delete("/api/admin/payment-methods/{method_id}")
def delete_payment_method(
    method_id: int,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    method = db.query(PaymentMethod).filter(PaymentMethod.id == method_id).first()
    if not method:
        raise HTTPException(status_code=404, detail="Payment method not found")
    
    db.delete(method)
    db.commit()
    return {"message": "Payment method deleted successfully"}

@app.get("/api/admin/sla-configs", response_model=List[SLAConfigResponse])
def get_sla_configs(
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    configs = db.query(SLAConfig).order_by(SLAConfig.created_at.desc()).all()
    return configs

@app.post("/api/admin/sla-configs", response_model=SLAConfigResponse)
def create_sla_config(
    config_data: SLAConfigCreate,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    new_config = SLAConfig(**config_data.dict())
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    return SLAConfigResponse.model_validate(new_config)

@app.patch("/api/admin/sla-configs/{config_id}", response_model=SLAConfigResponse)
def update_sla_config(
    config_id: int,
    update_data: SLAConfigUpdate,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    config = db.query(SLAConfig).filter(SLAConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="SLA config not found")
    
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(config, key, value)
    
    config.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(config)
    return SLAConfigResponse.model_validate(config)

@app.delete("/api/admin/sla-configs/{config_id}")
def delete_sla_config(
    config_id: int,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    config = db.query(SLAConfig).filter(SLAConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="SLA config not found")
    
    db.delete(config)
    db.commit()
    return {"message": "SLA config deleted successfully"}

@app.get("/api/admin/settings", response_model=List[SystemSettingsResponse])
def get_all_settings(
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    settings = db.query(SystemSettings).all()
    return settings

@app.get("/api/admin/settings/{setting_key}", response_model=SystemSettingsResponse)
def get_setting(
    setting_key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    setting = db.query(SystemSettings).filter(SystemSettings.setting_key == setting_key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return SystemSettingsResponse.model_validate(setting)

@app.post("/api/admin/settings", response_model=SystemSettingsResponse)
def create_setting(
    setting_data: SystemSettingsCreate,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    existing = db.query(SystemSettings).filter(SystemSettings.setting_key == setting_data.setting_key).first()
    if existing:
        raise HTTPException(status_code=400, detail="Setting with this key already exists")
    
    new_setting = SystemSettings(**setting_data.dict())
    db.add(new_setting)
    db.commit()
    db.refresh(new_setting)
    return SystemSettingsResponse.model_validate(new_setting)

@app.patch("/api/admin/settings/{setting_key}", response_model=SystemSettingsResponse)
def update_setting(
    setting_key: str,
    update_data: SystemSettingsUpdate,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    setting = db.query(SystemSettings).filter(SystemSettings.setting_key == setting_key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    setting.setting_value = update_data.setting_value
    if update_data.description is not None:
        setting.description = update_data.description
    setting.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(setting)
    return SystemSettingsResponse.model_validate(setting)

@app.delete("/api/admin/settings/{setting_key}")
def delete_setting(
    setting_key: str,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    setting = db.query(SystemSettings).filter(SystemSettings.setting_key == setting_key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    db.delete(setting)
    db.commit()
    return {"message": "Setting deleted successfully"}

@app.get("/api/admin/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    
    if user_id:
        query = query.filter(AuditLog.actor_user_id == user_id)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if target_type:
        query = query.filter(AuditLog.target_type == target_type)
    
    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset).all()
    return logs

@app.post("/api/admin/automation/run-periodic-tasks")
def trigger_periodic_tasks(
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    result = run_periodic_tasks(db, current_user.id)
    
    create_audit_log(db, current_user.id, "TRIGGER_AUTOMATION", "system", 0,
                     f"Manually triggered periodic automation tasks")
    db.commit()
    
    return {
        "message": "Periodic tasks executed successfully",
        "escalated_complaints": result["escalated"],
        "closed_complaints": result["closed"]
    }

@app.post("/api/admin/automation/check-sla")
def trigger_sla_check(
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    escalated = check_sla_violations(db, current_user.id)
    
    create_audit_log(db, current_user.id, "CHECK_SLA", "system", 0,
                     f"Manually triggered SLA check, {escalated} complaints escalated")
    db.commit()
    
    return {
        "message": "SLA check completed",
        "escalated_complaints": escalated
    }

@app.post("/api/admin/automation/auto-close")
def trigger_auto_close(
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    closed = auto_close_resolved_complaints(db, current_user.id)
    
    create_audit_log(db, current_user.id, "AUTO_CLOSE_TRIGGER", "system", 0,
                     f"Manually triggered auto-close, {closed} complaints closed")
    db.commit()
    
    return {
        "message": "Auto-close completed",
        "closed_complaints": closed
    }

@app.get("/")
def root():
    return {"message": "Allajnah Enhanced API - Complaint Management System"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
