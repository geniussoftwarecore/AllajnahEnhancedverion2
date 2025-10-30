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
from models import User, Complaint, Comment, Attachment, Category, UserRole, ComplaintStatus
from schemas import (
    UserCreate, UserLogin, UserResponse, Token,
    ComplaintCreate, ComplaintUpdate, ComplaintResponse,
    CommentCreate, CommentResponse,
    AttachmentResponse, CategoryResponse, DashboardStats
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, require_role
)

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

@app.post("/api/auth/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
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
        role=UserRole.TRADER,
        phone=user_data.phone,
        whatsapp=user_data.whatsapp,
        telegram=user_data.telegram,
        address=user_data.address
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.id})
    user_response = UserResponse.from_orm(new_user)
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@app.post("/api/auth/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": user.id})
    user_response = UserResponse.from_orm(user)
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.from_orm(current_user)

@app.get("/api/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    return categories

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
    
    return ComplaintResponse.from_orm(new_complaint)

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
    
    return ComplaintResponse.from_orm(complaint)

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
    
    if update_data.assigned_to_id is not None:
        complaint.assigned_to_id = update_data.assigned_to_id
        if complaint.status == ComplaintStatus.SUBMITTED:
            complaint.status = ComplaintStatus.UNDER_REVIEW
    
    complaint.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(complaint)
    
    return ComplaintResponse.from_orm(complaint)

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
    
    return CommentResponse.from_orm(new_comment)

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
    
    return AttachmentResponse.from_orm(new_attachment)

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
    
    return DashboardStats(
        total_complaints=total_complaints,
        submitted=submitted,
        under_review=under_review,
        escalated=escalated,
        resolved=resolved,
        rejected=rejected
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
    
    if user_data.role not in [UserRole.TECHNICAL_COMMITTEE, UserRole.HIGHER_COMMITTEE]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role for committee user"
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
    
    return UserResponse.from_orm(new_user)

@app.get("/")
def root():
    return {"message": "Allajnah Enhanced API - Complaint Management System"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
