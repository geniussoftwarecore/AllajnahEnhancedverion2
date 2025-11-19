from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Query, WebSocket, WebSocketDisconnect, Response, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, text
from typing import List, Optional
import os
import shutil
from datetime import datetime, timedelta
from slowapi.errors import RateLimitExceeded

from database import get_db
from models import (
    User, Complaint, Comment, Attachment, Category, 
    Subscription, Payment, ComplaintFeedback, AuditLog,
    PaymentMethod, SLAConfig, SystemSettings, TaskQueue, ComplaintApproval, QuickReply, NotificationPreference,
    ComplaintEscalation, ComplaintAppeal, ComplaintMediationRequest,
    UserRole, ComplaintStatus, SubscriptionStatus, PaymentStatus, Priority, TaskStatus, ApprovalStatus, AccountStatus,
    EscalationType, AppealStatus, MediationStatus, EscalationState
)
from schemas import (
    UserCreate, UserLogin, UserResponse, Token, UserUpdate, PasswordReset, ProfileUpdate, ChangePasswordRequest, EmailUpdateRequest,
    ComplaintCreate, ComplaintUpdate, ComplaintResponse,
    CommentCreate, CommentResponse,
    AttachmentResponse, CategoryResponse, CategoryCreate, CategoryUpdate, DashboardStats, AnalyticsData,
    SubscriptionCreate, SubscriptionResponse,
    PaymentCreate, PaymentUpdate, PaymentResponse,
    FeedbackCreate, FeedbackResponse, AuditLogResponse,
    PaymentMethodCreate, PaymentMethodUpdate, PaymentMethodResponse,
    SLAConfigCreate, SLAConfigUpdate, SLAConfigResponse,
    SystemSettingsCreate, SystemSettingsUpdate, SystemSettingsResponse,
    TaskQueueResponse, ComplaintApprovalCreate, ComplaintApprovalUpdate, ComplaintApprovalResponse,
    QuickReplyCreate, QuickReplyUpdate, QuickReplyResponse,
    BulkAssignRequest, BulkStatusRequest, BulkActionResponse,
    NotificationPreferenceCreate, NotificationPreferenceUpdate, NotificationPreferenceResponse,
    MerchantRegisterRequest, MerchantApprovalRequest,
    ComplaintEscalationCreate, ComplaintEscalationResponse,
    ComplaintAppealCreate, ComplaintAppealUpdate, ComplaintAppealResponse,
    ComplaintMediationRequestCreate, ComplaintMediationRequestUpdate, ComplaintMediationRequestResponse,
    ManualEscalationRequest, ReassignmentRequest,
    NotificationResponse, NotificationListResponse, TrialStatusResponse
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
from config import get_settings
from rate_limiter import limiter, LOGIN_RATE_LIMIT, COMPLAINT_RATE_LIMIT, UPLOAD_RATE_LIMIT, _rate_limit_exceeded_handler
from file_validator import validate_upload_file
from notification_service import notification_service
from cache_service import cache_service
from export_service import export_service
from scheduler_service import start_scheduler, stop_scheduler
from websocket_manager import manager
from response_cache import cache_response

settings = get_settings()

# Helper function to get dashboard URL
def get_dashboard_url(path: str = "") -> str:
    """Construct the full dashboard URL for email links"""
    # Get the first CORS origin as the frontend URL (or use wildcard fallback)
    if settings.CORS_ORIGINS and settings.CORS_ORIGINS != "*":
        frontend_url = settings.CORS_ORIGINS.split(',')[0].strip()
    else:
        # Fallback to environment variable or default
        frontend_url = os.getenv("FRONTEND_URL", "https://allajnah-enhanced.replit.app")
    
    # Remove trailing slash
    frontend_url = frontend_url.rstrip('/')
    # Add path
    if path:
        return f"{frontend_url}/{path.lstrip('/')}"
    return frontend_url

app = FastAPI(title="Allajnah Enhanced API")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add GZip compression for all responses over 500 bytes (improves speed by 70%)
app.add_middleware(GZipMiddleware, minimum_size=500)

cors_origins = settings.CORS_ORIGINS.split(',') if settings.CORS_ORIGINS != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # Prevent clickjacking attacks
    response.headers["X-Frame-Options"] = "DENY"
    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    # Enable XSS protection
    response.headers["X-XSS-Protection"] = "1; mode=block"
    # Strict transport security (HTTPS only)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    # Referrer policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # Permissions policy - disable unnecessary browser features
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

@app.on_event("startup")
async def startup_event():
    print("Starting application...")
    
    print("Validating critical configuration...")
    try:
        if not settings.JWT_SECRET_KEY or len(settings.JWT_SECRET_KEY) < 32:
            raise RuntimeError("JWT_SECRET_KEY must be set and at least 32 characters long. Generate one using: python3 -c \"import secrets; print(secrets.token_urlsafe(32))\"")
        
        if not settings.DATABASE_URL:
            raise RuntimeError("DATABASE_URL must be set")
        
        if not settings.CORS_ORIGINS:
            raise RuntimeError("CORS_ORIGINS must be set. Use '*' for development or comma-separated origins for production")
        
        if settings.CORS_ORIGINS == "*":
            print("⚠️  WARNING: CORS is set to '*'. This is acceptable for development but MUST be changed to specific origins in production!")
        
        if not settings.STRIPE_WEBHOOK_SECRET:
            print("⚠️  WARNING: STRIPE_WEBHOOK_SECRET is not configured. Stripe webhooks will be rejected for security. Configure this to enable webhook processing.")
        
        print(f"✓ Configuration validated (JWT key length: {len(settings.JWT_SECRET_KEY)} chars)")
    except Exception as e:
        print(f"✗ CRITICAL CONFIGURATION ERROR: {e}")
        raise RuntimeError(f"Application startup failed due to configuration error: {e}")
    
    print("Initializing database...")
    try:
        from database import Base, engine, SessionLocal
        from sqlalchemy import text, inspect
        from sqlalchemy.exc import IntegrityError, ProgrammingError
        
        try:
            Base.metadata.create_all(bind=engine)
            print("✓ Database tables verified/created")
        except (IntegrityError, ProgrammingError) as e:
            if 'already exists' in str(e).lower() or 'duplicate key' in str(e).lower():
                print("✓ Database tables already exist")
            else:
                raise
        
        inspector = inspect(engine)
        existing_indexes = [idx['name'] for idx in inspector.get_indexes('categories')]
        existing_constraints = [c['name'] for c in inspector.get_unique_constraints('categories')]
        
        if 'uq_category_name_en' not in existing_constraints and 'uq_category_name_en' not in existing_indexes:
            print("Adding unique index to categories table...")
            try:
                with engine.connect() as conn:
                    conn.execute(text('CREATE UNIQUE INDEX IF NOT EXISTS uq_category_name_en ON categories (name_en)'))
                    conn.commit()
                print("✓ Unique index added")
            except Exception as e:
                if 'already exists' in str(e).lower() or 'duplicate' in str(e).lower():
                    print("✓ Unique index already exists")
                else:
                    db_error = f"Failed to create unique index: {e}"
                    print(f"✗ CRITICAL: {db_error}")
                    raise RuntimeError(db_error)
        else:
            print("✓ Unique constraint/index exists")
        
        db = SessionLocal()
        try:
            table_count = db.query(User).count()
            print(f"✓ Database connection verified ({table_count} users)")
        except Exception as e:
            db.close()
            raise RuntimeError(f"Database tables not accessible: {e}")
        
        try:
            from sqlalchemy.exc import IntegrityError
            if db.query(Category).count() == 0:
                print("Adding default categories...")
                categories = [
                    # المواصفات والمقاييس
                    Category(name_ar="سحب عينات متكررة لنفس المنتج", name_en="repeated_sampling_same_product", government_entity="المواصفات والمقاييس"),
                    Category(name_ar="عدم قبولهم الفحوصات السابقة", name_en="rejection_previous_tests", government_entity="المواصفات والمقاييس"),
                    Category(name_ar="مبالغة في الاجراءات الشكلية والمعاينة الظاهرية", name_en="excessive_formal_procedures", government_entity="المواصفات والمقاييس"),
                    Category(name_ar="رفض شهادات المطابقة ونتائج الاختبار", name_en="rejection_conformity_certificates", government_entity="المواصفات والمقاييس"),
                    Category(name_ar="رفض تقارير اختبار العينات", name_en="rejection_sample_test_reports", government_entity="المواصفات والمقاييس"),
                    Category(name_ar="التحريز الشامل لجميع محتويات الشاحنة", name_en="comprehensive_seizure_shipment", government_entity="المواصفات والمقاييس"),
                    Category(name_ar="تأخير الإفراج - الفحص لمدة طويلة", name_en="delayed_release_long_inspection", government_entity="المواصفات والمقاييس"),
                    Category(name_ar="ارتفاع أجور الفحص", name_en="high_inspection_fees", government_entity="المواصفات والمقاييس"),
                    Category(name_ar="الإجراءات على منتج سليم بسبب منتج مخالف", name_en="procedures_sound_product_due_defective", government_entity="المواصفات والمقاييس"),
                    Category(name_ar="تأخير الافراج", name_en="delayed_release", government_entity="المواصفات والمقاييس"),
                    Category(name_ar="التأخير في نتائج الفحص الظاهر", name_en="delay_visual_inspection_results", government_entity="المواصفات والمقاييس"),
                    Category(name_ar="تكرار الفحوصات لمنتجات سابقة", name_en="repeated_tests_previous_products", government_entity="المواصفات والمقاييس"),
                    Category(name_ar="غرامات غير قانونية", name_en="illegal_fines", government_entity="المواصفات والمقاييس"),
                    Category(name_ar="ابتزاز", name_en="extortion", government_entity="المواصفات والمقاييس"),
                    Category(name_ar="إلزام المصنعين بمواصفات اختيارية", name_en="mandatory_optional_specifications", government_entity="المواصفات والمقاييس"),
                    
                    # الجمارك
                    Category(name_ar="اهمال البضائع عند المطابقة", name_en="goods_neglect_during_matching", government_entity="الجمارك"),
                    Category(name_ar="غرامات غير قانونية", name_en="illegal_fines_customs", government_entity="الجمارك"),
                    Category(name_ar="معاملة المواد الخام كمنتج نهائي للاستهلاك", name_en="raw_materials_as_final_product", government_entity="الجمارك"),
                    Category(name_ar="ازدواجية المطالبة بالضمان", name_en="duplicate_guarantee_demand", government_entity="الجمارك"),
                    Category(name_ar="مخالفة اتفاق", name_en="agreement_violation", government_entity="الجمارك"),
                    Category(name_ar="عدم البت في الاتلاف", name_en="no_decision_destruction", government_entity="الجمارك"),
                    Category(name_ar="تفاوت أوقات المعاينة بين الجهات المعنية", name_en="varying_inspection_times", government_entity="الجمارك"),
                    Category(name_ar="تأخر الافراج لعدم الوزن", name_en="release_delay_no_weighing", government_entity="الجمارك"),
                    Category(name_ar="الافتقار لنظام واضح لقيمة البضائع", name_en="lack_clear_valuation_system", government_entity="الجمارك"),
                    Category(name_ar="عدم حماية العلامة التجارية", name_en="no_trademark_protection", government_entity="الجمارك"),
                    Category(name_ar="رفض اقرارات الشراء", name_en="purchase_declaration_rejection", government_entity="الجمارك"),
                    Category(name_ar="كسر الاعفاء المقدم", name_en="exemption_breach", government_entity="الجمارك"),
                    Category(name_ar="مخالفة للتعميمات", name_en="circulars_violation", government_entity="الجمارك"),
                    Category(name_ar="زيادة في القيمة الجمركية", name_en="customs_value_increase", government_entity="الجمارك"),
                    Category(name_ar="احتجاز بضائع خارجة من صنعاء", name_en="goods_detention_from_sanaa", government_entity="الجمارك"),
                    Category(name_ar="استيفاء وثائق الهيئة العامة للاستثمار", name_en="investment_authority_documents", government_entity="الجمارك"),
                    Category(name_ar="تأخير السلع منها سلع سريعة التلف", name_en="perishable_goods_delay", government_entity="الجمارك"),
                    Category(name_ar="اختلال في التقييم للسعر", name_en="price_valuation_disruption", government_entity="الجمارك"),
                    Category(name_ar="عدم إعادة الرسوم", name_en="no_fees_refund", government_entity="الجمارك"),
                    Category(name_ar="إعادة الجمركة", name_en="re_customs", government_entity="الجمارك"),
                    Category(name_ar="احتجار المرتجع", name_en="returned_goods_monopoly", government_entity="الجمارك"),
                    Category(name_ar="فترة التخصيم", name_en="clearance_period", government_entity="الجمارك"),
                    Category(name_ar="الية القيمة والثمن", name_en="value_price_mechanism", government_entity="الجمارك"),
                    
                    # الضرائب
                    Category(name_ar="طلب اقرارات سابقة", name_en="previous_declarations_request", government_entity="الضرائب"),
                    Category(name_ar="تأخير استلام الاقرارات الضريبية", name_en="tax_declarations_receipt_delay", government_entity="الضرائب"),
                    Category(name_ar="سداد الضريبة نقداً وشيكات", name_en="tax_payment_cash_checks", government_entity="الضرائب"),
                    Category(name_ar="رفع ضريبة الأرباح", name_en="profit_tax_increase", government_entity="الضرائب"),
                    Category(name_ar="طلب اصل البيان الجمركي", name_en="original_customs_statement_request", government_entity="الضرائب"),
                    Category(name_ar="طلب التجار من مباحث الأموال العامة", name_en="traders_request_public_funds_investigation", government_entity="الضرائب"),
                    Category(name_ar="مبالغ تحت الحساب", name_en="amounts_on_account", government_entity="الضرائب"),
                    Category(name_ar="عدم اتخاذ الإجراءات القانونية", name_en="no_legal_action", government_entity="الضرائب"),
                    Category(name_ar="زيادة الإجراءات في المعاملات", name_en="increased_transaction_procedures", government_entity="الضرائب"),
                    
                    # صندوق النظافة والتحسين
                    Category(name_ar="التحصيل بين المديريات في إطار المحافظة الواحدة", name_en="collection_between_directorates", government_entity="صندوق النظافة والتحسين"),
                    Category(name_ar="رسوم الدعاية والاعلان وازدواجية تحصيل الرسوم بلوائح مختلفة", name_en="advertising_fees_duplicate_collection", government_entity="صندوق النظافة والتحسين"),
                    Category(name_ar="ارتفاع الرسوم", name_en="high_fees", government_entity="صندوق النظافة والتحسين"),
                    Category(name_ar="ازدواجية التحصيل", name_en="duplicate_collection", government_entity="صندوق النظافة والتحسين"),
                    Category(name_ar="تحصيل رسوم بدون سندات", name_en="fees_collection_without_receipts", government_entity="صندوق النظافة والتحسين"),
                    Category(name_ar="أسلوب الإكراه في الوسائل الإعلانية", name_en="coercion_advertising_methods", government_entity="صندوق النظافة والتحسين"),
                    Category(name_ar="ضعف تنسيق الصندوق مع الامن", name_en="weak_coordination_security", government_entity="صندوق النظافة والتحسين"),
                    Category(name_ar="التنصل عن تنفيذ الاتفاقات", name_en="agreements_execution_evasion", government_entity="صندوق النظافة والتحسين"),
                    Category(name_ar="المزاجية في المعاملات الإدارية", name_en="arbitrary_administrative_transactions", government_entity="صندوق النظافة والتحسين"),
                ]
                for category in categories:
                    try:
                        db.add(category)
                        db.flush()
                    except IntegrityError:
                        db.rollback()
                db.commit()
                print("✓ Default categories added")
            else:
                print("✓ Categories already exist")
        except Exception as e:
            print(f"Warning: Could not initialize default categories: {e}")
            db.rollback()
        finally:
            db.close()
            
    except Exception as e:
        print(f"✗ CRITICAL: Database initialization failed: {e}")
        print("⚠ Application cannot start without a working database")
        raise
    
    print("Adding performance indexes...")
    try:
        from add_performance_indexes import add_performance_indexes
        add_performance_indexes()
    except Exception as e:
        print(f"⚠ Warning: Could not add performance indexes: {e}")
    
    start_scheduler()
    print("✓ Application started successfully!")

@app.on_event("shutdown")
async def shutdown_event():
    print("Shutting down application...")
    stop_scheduler()
    print("Application shut down successfully!")

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/health")
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint for monitoring and load balancers.
    Returns 200 OK if all systems are operational, 503 if unhealthy.
    """
    try:
        # Check database connectivity with a simple query
        db.execute(text("SELECT 1"))
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected",
            "version": "1.0.0"
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "timestamp": datetime.utcnow().isoformat(),
                "database": "disconnected",
                "error": str(e),
                "version": "1.0.0"
            }
        )

@app.get("/api/setup/status")
def get_setup_status(db: Session = Depends(get_db)):
    try:
        higher_committee_count = db.query(User).filter(User.role == UserRole.HIGHER_COMMITTEE).count()
        return {"needs_setup": higher_committee_count == 0}
    except Exception as e:
        return {"needs_setup": True}

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
        address=user_data.address,
        account_status=AccountStatus.APPROVED,
        approved_at=datetime.utcnow()
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

@app.post("/api/auth/register-merchant", response_model=dict)
@limiter.limit(LOGIN_RATE_LIMIT)
def register_merchant(
    request: Request,
    merchant_data: MerchantRegisterRequest,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.email == merchant_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(merchant_data.password)
    now = datetime.utcnow()
    
    new_user = User(
        email=merchant_data.email,
        hashed_password=hashed_password,
        first_name=merchant_data.first_name,
        last_name=merchant_data.last_name,
        role=UserRole.TRADER,
        phone=merchant_data.phone,
        whatsapp=merchant_data.whatsapp,
        telegram=merchant_data.telegram,
        address=merchant_data.address,
        is_active=True,
        account_status=AccountStatus.APPROVED,
        approved_at=now,
        trial_start_date=now,
        trial_end_date=now + timedelta(days=20)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    create_audit_log(db, new_user.id, "MERCHANT_REGISTRATION", "user", new_user.id, 
                     f"Merchant registered with 20-day trial: {new_user.email}")
    db.commit()
    
    return {
        "success": True,
        "message": "تم إنشاء حسابك بنجاح! يمكنك الآن تسجيل الدخول والاستمتاع بفترة تجريبية مجانية لمدة 20 يومًا.",
        "message_en": "Your account has been created successfully! You can now login and enjoy a free 20-day trial period."
    }

@app.post("/api/admin/users", response_model=UserResponse)
async def create_user(
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
    now = datetime.utcnow()
    
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
        account_status=AccountStatus.APPROVED,
        approved_at=now,
        approved_by_id=current_user.id
    )
    
    if user_data.role == UserRole.TRADER:
        new_user.trial_start_date = now
        new_user.trial_end_date = now + timedelta(days=20)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    if user_data.role == UserRole.TRADER:
        higher_committee_users = db.query(User).filter(
            User.role == UserRole.HIGHER_COMMITTEE,
            User.is_active == True
        ).all()
        
        for hc_user in higher_committee_users:
            await notification_service.create_in_app_notification(
                db=db,
                user_id=hc_user.id,
                notification_type="ACCOUNT_APPROVED",
                title_ar="تاجر جديد تم إضافته",
                title_en="New Trader Added",
                message_ar=f"تم إنشاء حساب تاجر جديد: {new_user.first_name} {new_user.last_name} ({new_user.email}). الفترة التجريبية: 20 يوم.",
                message_en=f"New trader account created: {new_user.first_name} {new_user.last_name} ({new_user.email}). Trial period: 20 days.",
                action_url="/admin/merchant-requests"
            )
    
    return UserResponse.model_validate(new_user)

@app.get("/api/admin/merchant-requests", response_model=List[UserResponse])
def get_merchant_requests(
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db),
    status_filter: Optional[str] = Query(None, description="Filter by status: pending, approved, rejected")
):
    query = db.query(User).filter(User.role == UserRole.TRADER)
    
    if status_filter:
        if status_filter.lower() == "pending":
            query = query.filter(User.account_status == AccountStatus.PENDING)
        elif status_filter.lower() == "approved":
            query = query.filter(User.account_status == AccountStatus.APPROVED)
        elif status_filter.lower() == "rejected":
            query = query.filter(User.account_status == AccountStatus.REJECTED)
    else:
        query = query.filter(User.account_status == AccountStatus.PENDING)
    
    requests = query.order_by(User.created_at.desc()).all()
    return [UserResponse.model_validate(req) for req in requests]

@app.put("/api/admin/merchant-requests/{user_id}", response_model=UserResponse)
async def approve_reject_merchant(
    user_id: int,
    approval_data: MerchantApprovalRequest,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    merchant = db.query(User).filter(
        User.id == user_id,
        User.role == UserRole.TRADER
    ).first()
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merchant request not found"
        )
    
    if merchant.account_status != AccountStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Merchant request has already been processed"
        )
    
    if approval_data.approved:
        merchant.account_status = AccountStatus.APPROVED
        merchant.approved_at = datetime.utcnow()
        merchant.approved_by_id = current_user.id
        merchant.rejection_reason = None
        
        action = "MERCHANT_APPROVED"
        message = f"Merchant account approved for {merchant.email}"
    else:
        if not approval_data.rejection_reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rejection reason is required"
            )
        
        merchant.account_status = AccountStatus.REJECTED
        merchant.rejection_reason = approval_data.rejection_reason
        merchant.is_active = False
        
        action = "MERCHANT_REJECTED"
        message = f"Merchant account rejected for {merchant.email}: {approval_data.rejection_reason}"
    
    db.commit()
    db.refresh(merchant)
    
    create_audit_log(db, current_user.id, action, "user", merchant.id, message)
    db.commit()
    
    if approval_data.approved:
        await notification_service.create_in_app_notification(
            db=db,
            user_id=merchant.id,
            notification_type="ACCOUNT_APPROVED",
            title_ar="تمت الموافقة على حسابك",
            title_en="Account Approved",
            message_ar="تمت الموافقة على حسابك كتاجر. يمكنك الآن تسجيل الدخول وتقديم الشكاوى.",
            message_en="Your merchant account has been approved. You can now login and submit complaints.",
            action_url="/dashboard"
        )
    else:
        await notification_service.create_in_app_notification(
            db=db,
            user_id=merchant.id,
            notification_type="ACCOUNT_REJECTED",
            title_ar="تم رفض حسابك",
            title_en="Account Rejected",
            message_ar=f"تم رفض حسابك كتاجر. السبب: {approval_data.rejection_reason}",
            message_en=f"Your merchant account has been rejected. Reason: {approval_data.rejection_reason}",
            action_url="/login"
        )
    
    return UserResponse.model_validate(merchant)

@app.post("/api/auth/login", response_model=Token)
@limiter.limit(LOGIN_RATE_LIMIT)
def login(request: Request, credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if user.account_status == AccountStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending approval. Please wait for the Higher Committee to review your request."
        )
    
    if user.account_status == AccountStatus.REJECTED:
        rejection_msg = f"Your account has been rejected."
        if user.rejection_reason:
            rejection_msg += f" Reason: {user.rejection_reason}"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=rejection_msg
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact the administrator."
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    user_response = UserResponse.model_validate(user)
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@app.put("/api/users/profile", response_model=UserResponse)
def update_own_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    update_fields = profile_data.model_dump(exclude_unset=True)
    
    for field, value in update_fields.items():
        setattr(current_user, field, value)
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)

@app.post("/api/users/profile-picture")
@limiter.limit(UPLOAD_RATE_LIMIT)
async def upload_profile_picture(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    validate_upload_file(file, allowed_types=['image/jpeg', 'image/jpg', 'image/png', 'image/webp'], max_size_mb=5)
    
    upload_dir = "uploads/profile_pictures"
    os.makedirs(upload_dir, exist_ok=True)
    
    if current_user.profile_picture and os.path.exists(current_user.profile_picture):
        try:
            os.remove(current_user.profile_picture)
        except:
            pass
    
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"user_{current_user.id}_{datetime.utcnow().timestamp()}{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    current_user.profile_picture = f"/{file_path}"
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"profile_picture": current_user.profile_picture, "message": "Profile picture uploaded successfully"}

@app.post("/api/users/change-password")
def change_own_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Password changed successfully"}

@app.post("/api/users/update-email")
def update_user_email(
    email_data: EmailUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(email_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    existing_user = db.query(User).filter(User.email == email_data.new_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already in use by another account"
        )
    
    old_email = current_user.email
    current_user.email = email_data.new_email
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    create_audit_log(
        db,
        actor_user_id=current_user.id,
        action="update_email",
        target_type="user",
        target_id=current_user.id,
        details=f"Email changed from {old_email} to {email_data.new_email}"
    )
    
    return {"message": "Email updated successfully", "new_email": current_user.email}

@app.get("/api/users/notification-preferences", response_model=NotificationPreferenceResponse)
def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    preferences = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == current_user.id
    ).first()
    
    if not preferences:
        preferences = NotificationPreference(
            user_id=current_user.id,
            email_enabled=True,
            sms_enabled=False,
            notify_status_change=True,
            notify_assignment=True,
            notify_comment=True,
            notify_approval_request=True,
            notify_approval_decision=True,
            notify_escalation=True,
            notify_sla_warning=True
        )
        db.add(preferences)
        db.commit()
        db.refresh(preferences)
    
    return NotificationPreferenceResponse.model_validate(preferences)

@app.put("/api/users/notification-preferences", response_model=NotificationPreferenceResponse)
def update_notification_preferences(
    preference_data: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    preferences = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == current_user.id
    ).first()
    
    if not preferences:
        preferences = NotificationPreference(user_id=current_user.id)
        db.add(preferences)
    
    update_fields = preference_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(preferences, field, value)
    
    preferences.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(preferences)
    
    create_audit_log(
        db,
        actor_user_id=current_user.id,
        action="update_notification_preferences",
        target_type="notification_preference",
        target_id=preferences.id,
        details=f"Updated notification preferences"
    )
    
    return NotificationPreferenceResponse.model_validate(preferences)

@app.get("/api/categories", response_model=List[CategoryResponse])
@cache_response(ttl_seconds=300)
def get_categories(government_entity: str = None, db: Session = Depends(get_db)):
    query = db.query(Category)
    if government_entity:
        query = query.filter(Category.government_entity == government_entity)
    categories = query.all()
    return categories

@app.get("/api/government-entities")
def get_government_entities(db: Session = Depends(get_db)):
    entities = db.query(Category.government_entity).distinct().all()
    return [{"name": entity[0]} for entity in entities]

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
@limiter.limit(COMPLAINT_RATE_LIMIT)
async def create_complaint(
    request: Request,
    complaint_data: ComplaintCreate,
    current_user: User = Depends(require_role(UserRole.TRADER)),
    db: Session = Depends(get_db)
):
    from subscription_middleware import require_active_subscription
    require_active_subscription(current_user, db)
    
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
    
    if new_complaint.assigned_to_id:
        await notification_service.create_in_app_notification(
            db=db,
            user_id=new_complaint.assigned_to_id,
            notification_type="COMPLAINT_ASSIGNED",
            title_ar=f"شكوى جديدة #{new_complaint.id}",
            title_en=f"New Complaint #{new_complaint.id}",
            message_ar=f"تم تعيين شكوى جديدة لك: {new_complaint.title}",
            message_en=f"A new complaint has been assigned to you: {new_complaint.title}",
            related_complaint_id=new_complaint.id,
            action_url=f"/complaints/{new_complaint.id}"
        )
    
    return ComplaintResponse.model_validate(new_complaint)

@app.get("/api/complaints", response_model=List[ComplaintResponse])
def get_complaints(
    status: Optional[ComplaintStatus] = None,
    category_id: Optional[int] = None,
    priority: Optional[Priority] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from sqlalchemy.orm import selectinload
    query = db.query(Complaint).options(
        selectinload(Complaint.user),
        selectinload(Complaint.category),
        selectinload(Complaint.assigned_to_user)
    )
    
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
    if priority:
        query = query.filter(Complaint.priority == priority)
    if search:
        query = query.filter(
            or_(
                Complaint.title.ilike(f"%{search}%"),
                Complaint.description.ilike(f"%{search}%"),
                Complaint.complaint_summary.ilike(f"%{search}%")
            )
        )
    
    offset = (page - 1) * page_size
    complaints = query.order_by(Complaint.created_at.desc()).offset(offset).limit(page_size).all()
    return complaints

@app.get("/api/complaints/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from sqlalchemy.orm import selectinload
    complaint = db.query(Complaint).options(
        selectinload(Complaint.user),
        selectinload(Complaint.category),
        selectinload(Complaint.assigned_to_user),
        selectinload(Complaint.comments)
    ).filter(Complaint.id == complaint_id).first()
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
    
    old_status = complaint.status
    
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
async def reopen_complaint(
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
    
    old_status = complaint.status
    old_assigned_to_id = complaint.assigned_to_id
    
    complaint.reopened_count += 1
    
    if complaint.assigned_to_id and old_status == ComplaintStatus.RESOLVED:
        complaint.last_assigned_tc_id = complaint.assigned_to_id
    
    complaint.status = ComplaintStatus.SUBMITTED
    complaint.resolved_at = None
    complaint.can_reopen_until = None
    complaint.updated_at = datetime.utcnow()
    complaint.task_status = TaskStatus.IN_QUEUE
    
    from task_queue_service import task_queue_service
    
    if complaint.last_assigned_tc_id:
        new_assignee = task_queue_service.reassign_task(
            complaint_id=complaint_id,
            excluding_user_id=complaint.last_assigned_tc_id,
            db=db
        )
        
        if new_assignee:
            complaint.assigned_to_id = new_assignee.id
            complaint.task_status = TaskStatus.ASSIGNED
            
            create_audit_log(
                db,
                current_user.id,
                "REOPEN_COMPLAINT",
                "complaint",
                complaint.id,
                f"Reopened complaint #{complaint.id} from status {old_status.value}. Reassigned to different TC member: {new_assignee.email}"
            )
            
            assigner_name = f"{current_user.first_name} {current_user.last_name}"
            dashboard_url = get_dashboard_url(f"complaints/{complaint.id}")
            await notification_service.send_assignment_notification(
                db,
                new_assignee.id,
                new_assignee.email,
                new_assignee.phone,
                complaint.id,
                complaint.title,
                assigner_name,
                dashboard_url,
                language="ar"
            )
        else:
            complaint.assigned_to_id = complaint.last_assigned_tc_id
            complaint.task_status = TaskStatus.ASSIGNED
            
            create_audit_log(
                db,
                current_user.id,
                "REOPEN_COMPLAINT_WARNING",
                "complaint",
                complaint.id,
                f"Reopened complaint #{complaint.id} from status {old_status.value}. WARNING: No different TC member available, reassigned to same user"
            )
            
            if complaint.assigned_to_id:
                assigned_user = db.query(User).filter(User.id == complaint.assigned_to_id).first()
                if assigned_user:
                    assigner_name = f"{current_user.first_name} {current_user.last_name}"
                    dashboard_url = get_dashboard_url(f"complaints/{complaint.id}")
                    await notification_service.send_assignment_notification(
                        db,
                        assigned_user.id,
                        assigned_user.email,
                        assigned_user.phone,
                        complaint.id,
                        complaint.title,
                        assigner_name,
                        dashboard_url,
                        language="ar"
                    )
    else:
        queue_entry = task_queue_service.add_to_queue(
            complaint_id=complaint_id,
            assigned_role=UserRole.TECHNICAL_COMMITTEE,
            db=db
        )
        
        if queue_entry and queue_entry.assigned_user_id:
            complaint.assigned_to_id = queue_entry.assigned_user_id
            complaint.task_status = TaskStatus.ASSIGNED
        
        create_audit_log(
            db,
            current_user.id,
            "REOPEN_COMPLAINT",
            "complaint",
            complaint.id,
            f"Reopened complaint #{complaint.id} from status {old_status.value}"
        )
        
        if queue_entry and queue_entry.assigned_user_id:
            assigned_user = db.query(User).filter(User.id == queue_entry.assigned_user_id).first()
            if assigned_user:
                assigner_name = f"{current_user.first_name} {current_user.last_name}"
                dashboard_url = get_dashboard_url(f"complaints/{complaint.id}")
                await notification_service.send_assignment_notification(
                    db,
                    assigned_user.id,
                    assigned_user.email,
                    assigned_user.phone,
                    complaint.id,
                    complaint.title,
                    assigner_name,
                    dashboard_url,
                    language="ar"
                )
    
    db.commit()
    db.refresh(complaint)
    
    return ComplaintResponse.model_validate(complaint)

@app.post("/api/complaints/bulk-assign", response_model=BulkActionResponse)
def bulk_assign_complaints(
    request_data: BulkAssignRequest,
    current_user: User = Depends(require_role(UserRole.TECHNICAL_COMMITTEE, UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    """Bulk assign multiple complaints to a user"""
    successful_ids = []
    failed_ids = []
    errors = []
    
    # Verify the assigned_to user exists and has appropriate role
    assigned_to_user = db.query(User).filter(User.id == request_data.assigned_to_id).first()
    if not assigned_to_user:
        raise HTTPException(status_code=404, detail="Assigned user not found")
    
    if assigned_to_user.role not in [UserRole.TECHNICAL_COMMITTEE, UserRole.HIGHER_COMMITTEE]:
        raise HTTPException(status_code=400, detail="Can only assign to technical or higher committee members")
    
    # Process each complaint
    for complaint_id in request_data.complaint_ids:
        try:
            complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
            if not complaint:
                failed_ids.append(complaint_id)
                errors.append(f"Complaint #{complaint_id} not found")
                continue
            
            old_assigned_to_id = complaint.assigned_to_id
            complaint.assigned_to_id = request_data.assigned_to_id
            
            # Update status if currently submitted
            if complaint.status == ComplaintStatus.SUBMITTED:
                complaint.status = ComplaintStatus.UNDER_REVIEW
            
            complaint.updated_at = datetime.utcnow()
            
            # Create audit log entry
            create_audit_log(
                db,
                current_user.id,
                "BULK_ASSIGN_COMPLAINT",
                "complaint",
                complaint.id,
                f"Bulk assigned complaint #{complaint.id} from user {old_assigned_to_id} to user {request_data.assigned_to_id}"
            )
            
            successful_ids.append(complaint_id)
            
        except Exception as e:
            failed_ids.append(complaint_id)
            errors.append(f"Error processing complaint #{complaint_id}: {str(e)}")
            db.rollback()
    
    # Commit all successful changes
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to commit changes: {str(e)}")
    
    return BulkActionResponse(
        success_count=len(successful_ids),
        failed_count=len(failed_ids),
        total=len(request_data.complaint_ids),
        successful_ids=successful_ids,
        failed_ids=failed_ids,
        errors=errors
    )

@app.post("/api/complaints/bulk-status", response_model=BulkActionResponse)
def bulk_update_complaint_status(
    request_data: BulkStatusRequest,
    current_user: User = Depends(require_role(UserRole.TECHNICAL_COMMITTEE, UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    """Bulk update status of multiple complaints"""
    successful_ids = []
    failed_ids = []
    errors = []
    
    # Process each complaint
    for complaint_id in request_data.complaint_ids:
        try:
            complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
            if not complaint:
                failed_ids.append(complaint_id)
                errors.append(f"Complaint #{complaint_id} not found")
                continue
            
            old_status = complaint.status
            complaint.status = request_data.status
            
            # Handle status-specific logic
            if request_data.status in [ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED]:
                complaint.resolved_at = datetime.utcnow()
                from dateutil.relativedelta import relativedelta
                complaint.can_reopen_until = datetime.utcnow() + relativedelta(days=7)
            
            complaint.updated_at = datetime.utcnow()
            
            # Create audit log entry
            create_audit_log(
                db,
                current_user.id,
                "BULK_UPDATE_STATUS",
                "complaint",
                complaint.id,
                f"Bulk updated complaint #{complaint.id} status from {old_status.value} to {request_data.status.value}"
            )
            
            successful_ids.append(complaint_id)
            
        except Exception as e:
            failed_ids.append(complaint_id)
            errors.append(f"Error processing complaint #{complaint_id}: {str(e)}")
            db.rollback()
    
    # Commit all successful changes
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to commit changes: {str(e)}")
    
    return BulkActionResponse(
        success_count=len(successful_ids),
        failed_count=len(failed_ids),
        total=len(request_data.complaint_ids),
        successful_ids=successful_ids,
        failed_ids=failed_ids,
        errors=errors
    )

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
    
    comment_type = "internal" if comment_data.is_internal else "public"
    create_audit_log(
        db,
        current_user.id,
        "CREATE_COMMENT",
        "comment",
        new_comment.id,
        f"Added {comment_type} comment to complaint #{complaint_id}",
        metadata={"complaint_id": complaint_id, "is_internal": comment_data.is_internal}
    )
    
    # Send comment notifications to relevant users
    try:
        users_to_notify = []
        
        # Notify complaint owner (trader) if comment is public
        if not comment_data.is_internal and complaint.user_id != current_user.id:
            complaint_owner = db.query(User).filter(User.id == complaint.user_id).first()
            if complaint_owner:
                users_to_notify.append(complaint_owner)
        
        # Notify assigned user if different from commenter
        if complaint.assigned_to_id and complaint.assigned_to_id != current_user.id:
            assigned_user = db.query(User).filter(User.id == complaint.assigned_to_id).first()
            if assigned_user:
                users_to_notify.append(assigned_user)
        
        # Send notifications asynchronously
        import asyncio
        for user in users_to_notify:
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(
                    notification_service.send_comment_notification(
                        db,
                        user.id,
                        user.email,
                        user.phone,
                        complaint_id,
                        f"{current_user.first_name} {current_user.last_name}",
                        comment_data.content,
                        language="ar"
                    )
                )
                loop.close()
            except Exception as notif_error:
                print(f"Error sending comment notification to user {user.id}: {notif_error}")
    except Exception as e:
        print(f"Error processing comment notifications: {e}")
    
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
@limiter.limit(UPLOAD_RATE_LIMIT)
async def upload_attachment(
    request: Request,
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
    
    await validate_upload_file(file)
    
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
    
    create_audit_log(
        db,
        current_user.id,
        "UPLOAD_ATTACHMENT",
        "attachment",
        new_attachment.id,
        f"Uploaded file '{file.filename}' to complaint #{complaint_id}",
        metadata={
            "complaint_id": complaint_id,
            "filename": file.filename,
            "file_type": file.content_type,
            "file_size": file_size
        }
    )
    
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

@app.get("/api/attachments/{attachment_id}/download")
async def download_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from fastapi.responses import FileResponse
    
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    complaint = db.query(Complaint).filter(Complaint.id == attachment.complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if current_user.role == UserRole.TRADER and complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to download this attachment")
    
    if not os.path.exists(attachment.filepath):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    create_audit_log(
        db,
        current_user.id,
        "DOWNLOAD_ATTACHMENT",
        "attachment",
        attachment.id,
        f"Downloaded file '{attachment.filename}' from complaint #{complaint.id}"
    )
    
    return FileResponse(
        path=attachment.filepath,
        filename=attachment.filename,
        media_type=attachment.file_type or "application/octet-stream"
    )


@app.post("/api/complaints/{complaint_id}/accept-task", response_model=ComplaintResponse)
async def accept_complaint_task(
    complaint_id: int,
    current_user: User = Depends(require_role(UserRole.TECHNICAL_COMMITTEE, UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    from complaint_task_service import complaint_task_service
    complaint = complaint_task_service.accept_task(complaint_id, current_user, db)
    
    await notification_service.send_task_notification(
        db,
        current_user.id,
        current_user.email,
        current_user.phone,
        complaint.id,
        "accepted",
        language="ar"
    )
    
    return complaint


@app.post("/api/complaints/{complaint_id}/reject-task", response_model=ComplaintResponse)
async def reject_complaint_task(
    complaint_id: int,
    reason: str,
    current_user: User = Depends(require_role(UserRole.TECHNICAL_COMMITTEE, UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    from complaint_task_service import complaint_task_service
    complaint = complaint_task_service.reject_task(complaint_id, current_user, reason, db)
    return complaint


@app.post("/api/complaints/{complaint_id}/start-working", response_model=ComplaintResponse)
async def start_working_on_complaint(
    complaint_id: int,
    current_user: User = Depends(require_role(UserRole.TECHNICAL_COMMITTEE, UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    from complaint_task_service import complaint_task_service
    complaint = complaint_task_service.start_working(complaint_id, current_user, db)
    
    await notification_service.send_task_notification(
        db,
        current_user.id,
        current_user.email,
        current_user.phone,
        complaint.id,
        "started",
        language="ar"
    )
    
    return complaint


@app.post("/api/complaints/{complaint_id}/release-claim", response_model=ComplaintResponse)
async def release_complaint_claim(
    complaint_id: int,
    current_user: User = Depends(require_role(UserRole.TECHNICAL_COMMITTEE, UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    from complaint_task_service import complaint_task_service
    complaint = complaint_task_service.release_claim(complaint_id, current_user, db)
    return complaint


@app.post("/api/approvals", response_model=ComplaintApprovalResponse)
async def create_approval_request(
    approval: ComplaintApprovalCreate,
    current_user: User = Depends(require_role(UserRole.TECHNICAL_COMMITTEE)),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == approval.complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if complaint.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="You must be assigned to this complaint to request approval")
    
    higher_committee_users = db.query(User).filter(
        User.role == UserRole.HIGHER_COMMITTEE,
        User.is_active == True
    ).all()
    
    if not higher_committee_users:
        raise HTTPException(status_code=400, detail="No active Higher Committee members found")
    
    new_approval = ComplaintApproval(
        complaint_id=approval.complaint_id,
        approver_id=higher_committee_users[0].id,
        approval_notes=approval.approval_notes
    )
    
    complaint.status = ComplaintStatus.ESCALATED
    complaint.task_status = TaskStatus.PENDING_APPROVAL
    
    db.add(new_approval)
    
    create_audit_log(
        db,
        current_user.id,
        "REQUEST_APPROVAL",
        "complaint",
        approval.complaint_id,
        f"Requested approval for complaint #{approval.complaint_id}"
    )
    
    db.commit()
    db.refresh(new_approval)
    
    approver = higher_committee_users[0]
    requester_name = f"{current_user.first_name} {current_user.last_name}"
    await notification_service.send_approval_request_notification(
        db,
        approver.id,
        approver.email,
        approver.phone,
        complaint.id,
        requester_name,
        language="ar"
    )
    
    return new_approval


@app.put("/api/approvals/{approval_id}", response_model=ComplaintApprovalResponse)
async def update_approval(
    approval_id: int,
    approval_update: ComplaintApprovalUpdate,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    approval = db.query(ComplaintApproval).filter(ComplaintApproval.id == approval_id).first()
    
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    
    if approval.approver_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not assigned to this approval")
    
    approval.approval_status = approval_update.approval_status
    approval.approval_notes = approval_update.approval_notes or approval.approval_notes
    approval.approved_at = datetime.utcnow()
    
    complaint = db.query(Complaint).filter(Complaint.id == approval.complaint_id).first()
    assigned_user = db.query(User).filter(User.id == complaint.assigned_to_id).first()
    complainant = db.query(User).filter(User.id == complaint.user_id).first()
    approver_name = f"{current_user.first_name} {current_user.last_name}"
    
    if approval_update.approval_status == ApprovalStatus.APPROVED:
        complaint.status = ComplaintStatus.RESOLVED
        complaint.task_status = TaskStatus.COMPLETED
        complaint.resolved_at = datetime.utcnow()
        
        create_audit_log(
            db,
            current_user.id,
            "APPROVE_COMPLAINT",
            "complaint",
            complaint.id,
            f"Approved complaint #{complaint.id}"
        )
    elif approval_update.approval_status == ApprovalStatus.REJECTED:
        complaint.status = ComplaintStatus.UNDER_REVIEW
        complaint.task_status = TaskStatus.ACCEPTED
        
        create_audit_log(
            db,
            current_user.id,
            "REJECT_APPROVAL",
            "complaint",
            complaint.id,
            f"Rejected approval for complaint #{complaint.id}"
        )
    
    db.commit()
    db.refresh(approval)
    
    decision = "approved" if approval_update.approval_status == ApprovalStatus.APPROVED else "rejected"
    
    if assigned_user:
        await notification_service.send_approval_decision_notification(
            db,
            assigned_user.id,
            assigned_user.email,
            assigned_user.phone,
            complaint.id,
            decision,
            approver_name,
            approval.approval_notes,
            language="ar"
        )
    
    if complainant:
        await notification_service.send_complaint_status_update(
            db,
            complainant.id,
            complainant.email,
            complainant.phone,
            complaint.id,
            complaint.status.value,
            language="ar"
        )
    
    return approval


@app.get("/api/approvals/complaint/{complaint_id}", response_model=List[ComplaintApprovalResponse])
async def get_complaint_approvals(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    approvals = db.query(ComplaintApproval).filter(
        ComplaintApproval.complaint_id == complaint_id
    ).all()
    
    return approvals


@app.get("/api/approvals/pending", response_model=List[ComplaintApprovalResponse])
async def get_pending_approvals(
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    approvals = db.query(ComplaintApproval).filter(
        ComplaintApproval.approver_id == current_user.id,
        ComplaintApproval.approval_status == ApprovalStatus.PENDING
    ).all()
    
    return approvals


@app.post("/api/complaints/{complaint_id}/manual-escalate", response_model=ComplaintResponse)
async def manual_escalate_complaint(
    complaint_id: int,
    escalation_request: ManualEscalationRequest,
    current_user: User = Depends(require_role(UserRole.TECHNICAL_COMMITTEE)),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if complaint.status == ComplaintStatus.ESCALATED:
        raise HTTPException(status_code=400, detail="Complaint is already escalated")
    
    if complaint.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="You must be assigned to this complaint to escalate it")
    
    escalation = ComplaintEscalation(
        complaint_id=complaint_id,
        escalated_by_id=current_user.id,
        escalation_type=EscalationType.MANUAL,
        target_role=UserRole.HIGHER_COMMITTEE,
        reason=escalation_request.reason
    )
    
    db.add(escalation)
    
    complaint.status = ComplaintStatus.ESCALATED
    complaint.escalation_state = EscalationState.TC_MANUAL
    
    from task_queue_service import task_queue_service
    queue_entry = task_queue_service.add_to_queue(
        complaint_id=complaint_id,
        assigned_role=UserRole.HIGHER_COMMITTEE,
        db=db
    )
    
    if queue_entry and queue_entry.assigned_user_id:
        complaint.assigned_to_id = queue_entry.assigned_user_id
        complaint.task_status = TaskStatus.ASSIGNED
    
    create_audit_log(
        db,
        current_user.id,
        "MANUAL_ESCALATE",
        "complaint",
        complaint.id,
        f"Manually escalated complaint #{complaint.id}. Reason: {escalation_request.reason}"
    )
    
    db.commit()
    db.refresh(complaint)
    
    if queue_entry and queue_entry.assigned_user_id:
        assigned_user = db.query(User).filter(User.id == queue_entry.assigned_user_id).first()
        if assigned_user:
            assigner_name = f"{current_user.first_name} {current_user.last_name}"
            dashboard_url = get_dashboard_url(f"complaints/{complaint.id}")
            await notification_service.send_assignment_notification(
                db,
                assigned_user.id,
                assigned_user.email,
                assigned_user.phone,
                complaint.id,
                complaint.title,
                assigner_name,
                dashboard_url,
                language="ar"
            )
    
    return complaint


@app.post("/api/complaints/{complaint_id}/appeals", response_model=ComplaintAppealResponse)
async def create_complaint_appeal(
    complaint_id: int,
    appeal_data: ComplaintAppealCreate,
    current_user: User = Depends(require_role(UserRole.TRADER)),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only appeal your own complaints")
    
    existing_appeal = db.query(ComplaintAppeal).filter(
        ComplaintAppeal.complaint_id == complaint_id,
        ComplaintAppeal.status == AppealStatus.PENDING
    ).first()
    
    if existing_appeal:
        raise HTTPException(status_code=400, detail="There is already a pending appeal for this complaint")
    
    appeal = ComplaintAppeal(
        complaint_id=complaint_id,
        requester_id=current_user.id,
        status=AppealStatus.PENDING,
        reason=appeal_data.reason
    )
    
    db.add(appeal)
    
    complaint.escalation_state = EscalationState.TRADER_APPEAL
    
    from task_queue_service import task_queue_service
    queue_entry = task_queue_service.add_to_queue(
        complaint_id=complaint_id,
        assigned_role=UserRole.HIGHER_COMMITTEE,
        db=db
    )
    
    if queue_entry and queue_entry.assigned_user_id:
        complaint.assigned_to_id = queue_entry.assigned_user_id
        complaint.task_status = TaskStatus.ASSIGNED
    
    create_audit_log(
        db,
        current_user.id,
        "CREATE_APPEAL",
        "complaint",
        complaint.id,
        f"Created appeal for complaint #{complaint.id}. Reason: {appeal_data.reason}"
    )
    
    db.commit()
    db.refresh(appeal)
    
    if queue_entry and queue_entry.assigned_user_id:
        assigned_user = db.query(User).filter(User.id == queue_entry.assigned_user_id).first()
        if assigned_user:
            assigner_name = f"{current_user.first_name} {current_user.last_name}"
            dashboard_url = get_dashboard_url(f"complaints/{complaint.id}")
            await notification_service.send_assignment_notification(
                db,
                assigned_user.id,
                assigned_user.email,
                assigned_user.phone,
                complaint.id,
                complaint.title,
                assigner_name,
                dashboard_url,
                language="ar"
            )
    
    return appeal


@app.get("/api/complaints/{complaint_id}/appeals", response_model=List[ComplaintAppealResponse])
def get_complaint_appeals(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if current_user.role == UserRole.TRADER and complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view appeals for your own complaints")
    
    appeals = db.query(ComplaintAppeal).filter(
        ComplaintAppeal.complaint_id == complaint_id
    ).all()
    
    return appeals


@app.patch("/api/appeals/{appeal_id}", response_model=ComplaintAppealResponse)
async def update_appeal(
    appeal_id: int,
    appeal_update: ComplaintAppealUpdate,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    appeal = db.query(ComplaintAppeal).filter(ComplaintAppeal.id == appeal_id).first()
    
    if not appeal:
        raise HTTPException(status_code=404, detail="Appeal not found")
    
    if appeal.status != AppealStatus.PENDING:
        raise HTTPException(status_code=400, detail="This appeal has already been decided")
    
    appeal.status = appeal_update.status
    appeal.decision_rationale = appeal_update.decision_rationale
    appeal.decided_at = datetime.utcnow()
    appeal.decided_by_id = current_user.id
    
    complaint = db.query(Complaint).filter(Complaint.id == appeal.complaint_id).first()
    
    if appeal_update.status == AppealStatus.ACCEPTED:
        complaint.status = ComplaintStatus.UNDER_REVIEW
        complaint.escalation_state = EscalationState.NONE
    elif appeal_update.status == AppealStatus.REJECTED:
        complaint.escalation_state = EscalationState.NONE
    
    create_audit_log(
        db,
        current_user.id,
        "DECIDE_APPEAL",
        "appeal",
        appeal.id,
        f"Decided appeal #{appeal.id}: {appeal_update.status.value}. Rationale: {appeal_update.decision_rationale}"
    )
    
    db.commit()
    db.refresh(appeal)
    
    requester = db.query(User).filter(User.id == appeal.requester_id).first()
    if requester:
        await notification_service.send_complaint_status_update(
            db,
            requester.id,
            requester.email,
            requester.phone,
            complaint.id,
            f"Appeal {appeal_update.status.value}",
            language="ar"
        )
    
    return appeal


@app.post("/api/complaints/{complaint_id}/reassign", response_model=ComplaintResponse)
async def reassign_complaint(
    complaint_id: int,
    reassignment_data: ReassignmentRequest,
    current_user: User = Depends(require_role(UserRole.TECHNICAL_COMMITTEE)),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if complaint.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="You must be assigned to this complaint to reassign it")
    
    from task_queue_service import task_queue_service
    
    if reassignment_data.target_user_id:
        target_user = db.query(User).filter(
            User.id == reassignment_data.target_user_id,
            User.role == UserRole.TECHNICAL_COMMITTEE,
            User.is_active == True
        ).first()
        
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user not found or not eligible")
        
        complaint.assigned_to_id = target_user.id
        complaint.task_status = TaskStatus.ASSIGNED
        
        queue_entry = db.query(TaskQueue).filter(
            TaskQueue.complaint_id == complaint_id,
            TaskQueue.assigned_role == UserRole.TECHNICAL_COMMITTEE
        ).first()
        
        if queue_entry:
            queue_entry.assigned_user_id = target_user.id
            queue_entry.assigned_at = datetime.utcnow()
    else:
        new_assignee = task_queue_service.reassign_task(
            complaint_id=complaint_id,
            excluding_user_id=current_user.id,
            db=db
        )
        
        if new_assignee:
            complaint.assigned_to_id = new_assignee.id
            complaint.task_status = TaskStatus.ASSIGNED
        else:
            create_audit_log(
                db,
                current_user.id,
                "REASSIGN_WARNING",
                "complaint",
                complaint.id,
                f"No different TC member available for reassignment. Complaint remains with {current_user.email}"
            )
            raise HTTPException(status_code=400, detail="No other available TC members for reassignment")
    
    escalation = ComplaintEscalation(
        complaint_id=complaint_id,
        escalated_by_id=current_user.id,
        escalation_type=EscalationType.MANUAL,
        target_role=UserRole.TECHNICAL_COMMITTEE,
        reason=reassignment_data.reason
    )
    
    db.add(escalation)
    
    create_audit_log(
        db,
        current_user.id,
        "REASSIGN_COMPLAINT",
        "complaint",
        complaint.id,
        f"Reassigned complaint #{complaint.id}. Reason: {reassignment_data.reason}"
    )
    
    db.commit()
    db.refresh(complaint)
    
    if complaint.assigned_to_id:
        assigned_user = db.query(User).filter(User.id == complaint.assigned_to_id).first()
        if assigned_user and assigned_user.id != current_user.id:
            assigner_name = f"{current_user.first_name} {current_user.last_name}"
            dashboard_url = get_dashboard_url(f"complaints/{complaint.id}")
            await notification_service.send_assignment_notification(
                db,
                assigned_user.id,
                assigned_user.email,
                assigned_user.phone,
                complaint.id,
                complaint.title,
                assigner_name,
                dashboard_url,
                language="ar"
            )
    
    return complaint


@app.post("/api/complaints/{complaint_id}/approvals/multi-review", response_model=ComplaintApprovalResponse)
async def create_multi_review_approval(
    complaint_id: int,
    required_approvals: int = Query(..., ge=1),
    stage: str = Query(...),
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    approval = ComplaintApproval(
        complaint_id=complaint_id,
        approver_id=current_user.id,
        approval_status=ApprovalStatus.PENDING,
        stage=stage,
        required_approvals=required_approvals,
        is_multi_reviewer=True
    )
    
    db.add(approval)
    
    complaint.task_status = TaskStatus.PENDING_APPROVAL
    
    create_audit_log(
        db,
        current_user.id,
        "CREATE_MULTI_REVIEW",
        "complaint",
        complaint.id,
        f"Created multi-review approval for complaint #{complaint.id}. Stage: {stage}, Required: {required_approvals}"
    )
    
    db.commit()
    db.refresh(approval)
    
    return approval


@app.get("/api/complaints/{complaint_id}/approvals/status")
def get_approval_status(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    approvals = db.query(ComplaintApproval).filter(
        ComplaintApproval.complaint_id == complaint_id
    ).all()
    
    multi_review_approvals = [a for a in approvals if a.is_multi_reviewer]
    
    if not multi_review_approvals:
        return {
            "complaint_id": complaint_id,
            "has_multi_review": False,
            "total_approvals": len(approvals),
            "approved_count": len([a for a in approvals if a.approval_status == ApprovalStatus.APPROVED]),
            "pending_count": len([a for a in approvals if a.approval_status == ApprovalStatus.PENDING]),
            "rejected_count": len([a for a in approvals if a.approval_status == ApprovalStatus.REJECTED])
        }
    
    stages = {}
    for approval in multi_review_approvals:
        stage = approval.stage
        if stage not in stages:
            stages[stage] = {
                "required_approvals": approval.required_approvals,
                "approved_count": 0,
                "pending_count": 0,
                "rejected_count": 0
            }
        
        if approval.approval_status == ApprovalStatus.APPROVED:
            stages[stage]["approved_count"] += 1
        elif approval.approval_status == ApprovalStatus.PENDING:
            stages[stage]["pending_count"] += 1
        elif approval.approval_status == ApprovalStatus.REJECTED:
            stages[stage]["rejected_count"] += 1
    
    return {
        "complaint_id": complaint_id,
        "has_multi_review": True,
        "stages": stages,
        "total_approvals": len(approvals)
    }


@app.post("/api/complaints/{complaint_id}/mediation-request", response_model=ComplaintMediationRequestResponse)
async def create_mediation_request(
    complaint_id: int,
    mediation_data: ComplaintMediationRequestCreate,
    current_user: User = Depends(require_role(UserRole.TECHNICAL_COMMITTEE)),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if complaint.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="You must be assigned to this complaint to request mediation")
    
    existing_request = db.query(ComplaintMediationRequest).filter(
        ComplaintMediationRequest.complaint_id == complaint_id,
        ComplaintMediationRequest.status.in_([MediationStatus.PENDING, MediationStatus.ACCEPTED, MediationStatus.IN_PROGRESS])
    ).first()
    
    if existing_request:
        raise HTTPException(status_code=400, detail="There is already an active mediation request for this complaint")
    
    mediation_request = ComplaintMediationRequest(
        complaint_id=complaint_id,
        requested_by_id=current_user.id,
        status=MediationStatus.PENDING,
        reason=mediation_data.reason
    )
    
    db.add(mediation_request)
    
    complaint.status = ComplaintStatus.MEDIATION_PENDING
    complaint.escalation_state = EscalationState.MEDIATION
    
    create_audit_log(
        db,
        current_user.id,
        "CREATE_MEDIATION_REQUEST",
        "complaint",
        complaint.id,
        f"Created mediation request for complaint #{complaint.id}. Reason: {mediation_data.reason}"
    )
    
    db.commit()
    db.refresh(mediation_request)
    
    higher_committee_users = db.query(User).filter(
        User.role == UserRole.HIGHER_COMMITTEE,
        User.is_active == True
    ).all()
    
    for hc_user in higher_committee_users:
        await notification_service.send_assignment_notification(
            db,
            hc_user.id,
            hc_user.email,
            hc_user.phone,
            complaint.id,
            language="ar"
        )
    
    return mediation_request


@app.patch("/api/mediation-requests/{request_id}", response_model=ComplaintMediationRequestResponse)
async def update_mediation_request(
    request_id: int,
    mediation_update: ComplaintMediationRequestUpdate,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    mediation_request = db.query(ComplaintMediationRequest).filter(
        ComplaintMediationRequest.id == request_id
    ).first()
    
    if not mediation_request:
        raise HTTPException(status_code=404, detail="Mediation request not found")
    
    mediation_request.status = mediation_update.status
    
    if mediation_update.mediator_id:
        mediator = db.query(User).filter(
            User.id == mediation_update.mediator_id,
            User.role == UserRole.HIGHER_COMMITTEE,
            User.is_active == True
        ).first()
        
        if not mediator:
            raise HTTPException(status_code=404, detail="Mediator not found or not eligible")
        
        mediation_request.mediator_id = mediation_update.mediator_id
    
    if mediation_update.notes:
        mediation_request.notes = mediation_update.notes
    
    complaint = db.query(Complaint).filter(Complaint.id == mediation_request.complaint_id).first()
    
    if mediation_update.status == MediationStatus.ACCEPTED:
        complaint.status = ComplaintStatus.MEDIATION_IN_PROGRESS
    elif mediation_update.status == MediationStatus.RESOLVED:
        complaint.status = ComplaintStatus.RESOLVED
        complaint.resolved_at = datetime.utcnow()
        complaint.escalation_state = EscalationState.NONE
    elif mediation_update.status == MediationStatus.REJECTED:
        complaint.status = ComplaintStatus.UNDER_REVIEW
        complaint.escalation_state = EscalationState.NONE
    elif mediation_update.status == MediationStatus.CANCELLED:
        complaint.status = ComplaintStatus.UNDER_REVIEW
        complaint.escalation_state = EscalationState.NONE
    
    create_audit_log(
        db,
        current_user.id,
        "UPDATE_MEDIATION_REQUEST",
        "mediation_request",
        mediation_request.id,
        f"Updated mediation request #{mediation_request.id}: {mediation_update.status.value}"
    )
    
    db.commit()
    db.refresh(mediation_request)
    
    requester = db.query(User).filter(User.id == mediation_request.requested_by_id).first()
    if requester:
        await notification_service.send_complaint_status_update(
            db,
            requester.id,
            requester.email,
            requester.phone,
            complaint.id,
            f"Mediation {mediation_update.status.value}",
            language="ar"
        )
    
    return mediation_request


@app.get("/api/mediation-requests", response_model=List[ComplaintMediationRequestResponse])
def get_mediation_requests(
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db),
    status_filter: Optional[str] = Query(None)
):
    query = db.query(ComplaintMediationRequest)
    
    if status_filter:
        try:
            status_enum = MediationStatus(status_filter)
            query = query.filter(ComplaintMediationRequest.status == status_enum)
        except ValueError:
            pass
    
    mediation_requests = query.order_by(ComplaintMediationRequest.created_at.desc()).all()
    
    return mediation_requests


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

@app.get("/api/payment-methods", response_model=List[PaymentMethodResponse])
def get_payment_methods(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment_methods = db.query(PaymentMethod).filter(PaymentMethod.is_active == True).order_by(PaymentMethod.created_at).all()
    return payment_methods

@app.post("/api/payment-methods", response_model=PaymentMethodResponse)
def create_payment_method(
    payment_method_data: PaymentMethodCreate,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    new_payment_method = PaymentMethod(
        name_ar=payment_method_data.name_ar,
        name_en=payment_method_data.name_en,
        instructions_ar=payment_method_data.instructions_ar,
        instructions_en=payment_method_data.instructions_en,
        wallet_type=payment_method_data.wallet_type,
        wallet_name=payment_method_data.wallet_name,
        wallet_number=payment_method_data.wallet_number,
        is_active=payment_method_data.is_active
    )
    
    db.add(new_payment_method)
    db.commit()
    db.refresh(new_payment_method)
    
    create_audit_log(db, current_user.id, "CREATE_PAYMENT_METHOD", "payment_method", new_payment_method.id,
                     f"Created payment method: {payment_method_data.name_en}")
    
    return PaymentMethodResponse.model_validate(new_payment_method)

@app.patch("/api/payment-methods/{method_id}", response_model=PaymentMethodResponse)
def update_payment_method(
    method_id: int,
    update_data: PaymentMethodUpdate,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    payment_method = db.query(PaymentMethod).filter(PaymentMethod.id == method_id).first()
    if not payment_method:
        raise HTTPException(status_code=404, detail="Payment method not found")
    
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(payment_method, key, value)
    
    db.commit()
    db.refresh(payment_method)
    
    create_audit_log(db, current_user.id, "UPDATE_PAYMENT_METHOD", "payment_method", method_id,
                     f"Updated payment method: {payment_method.name_en}")
    
    return PaymentMethodResponse.model_validate(payment_method)

@app.delete("/api/payment-methods/{method_id}")
def delete_payment_method(
    method_id: int,
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    payment_method = db.query(PaymentMethod).filter(PaymentMethod.id == method_id).first()
    if not payment_method:
        raise HTTPException(status_code=404, detail="Payment method not found")
    
    db.delete(payment_method)
    db.commit()
    
    create_audit_log(db, current_user.id, "DELETE_PAYMENT_METHOD", "payment_method", method_id,
                     f"Deleted payment method: {payment_method.name_en}")
    
    return {"message": "Payment method deleted successfully"}

@app.get("/api/trial/status", response_model=TrialStatusResponse)
def get_trial_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    has_trial = bool(current_user.trial_start_date and current_user.trial_end_date)
    is_active = False
    days_remaining = None
    
    if has_trial:
        is_active = now <= current_user.trial_end_date
        if is_active:
            days_remaining = (current_user.trial_end_date - now).days
    
    active_subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == SubscriptionStatus.ACTIVE,
        Subscription.end_date > now
    ).first()
    
    return TrialStatusResponse(
        has_trial=has_trial,
        is_active=is_active,
        trial_start_date=current_user.trial_start_date,
        trial_end_date=current_user.trial_end_date,
        days_remaining=days_remaining,
        has_active_subscription=bool(active_subscription)
    )

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
    payment_method_id: int = Form(...),
    amount: float = Form(...),
    method: str = Form(...),
    reference_number: Optional[str] = Form(None),
    account_details: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.TRADER)),
    db: Session = Depends(get_db)
):
    payment_method = db.query(PaymentMethod).filter(
        PaymentMethod.id == payment_method_id,
        PaymentMethod.is_active == True
    ).first()
    
    if not payment_method:
        raise HTTPException(status_code=404, detail="Payment method not found or inactive")
    
    validate_upload_file(file)
    
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"payment_{current_user.id}_{datetime.utcnow().timestamp()}{file_extension}"
    filepath = os.path.join("uploads", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    new_payment = Payment(
        user_id=current_user.id,
        payment_method_id=payment_method_id,
        amount=amount,
        method=method,
        reference_number=reference_number,
        account_details=account_details,
        proof_path=filepath,
        status=PaymentStatus.PENDING
    )
    
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    
    await notification_service.notify_committees_new_payment(db, new_payment.id, current_user)
    
    create_audit_log(db, current_user.id, "SUBMIT_PAYMENT", "payment", new_payment.id,
                     f"Submitted payment request with amount {amount}")
    
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
async def update_payment(
    payment_id: int,
    update_data: PaymentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.TECHNICAL_COMMITTEE, UserRole.HIGHER_COMMITTEE]:
        raise HTTPException(status_code=403, detail="Not authorized to review payments")
    
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if current_user.role == UserRole.TECHNICAL_COMMITTEE:
        payment.reviewed_by_technical_id = current_user.id
        payment.technical_reviewed_at = datetime.utcnow()
        if update_data.technical_review_notes:
            payment.technical_review_notes = update_data.technical_review_notes
        
        create_audit_log(db, current_user.id, "TECHNICAL_REVIEW_PAYMENT", "payment", payment.id,
                         f"Technical committee reviewed payment for user ID {payment.user_id}")
    
    elif current_user.role == UserRole.HIGHER_COMMITTEE:
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
            db.commit()
            payment.subscription_id = subscription.id
        
        trader = db.query(User).filter(User.id == payment.user_id).first()
        if trader:
            await notification_service.send_payment_decision_notification(
                db, trader.id, trader.email, trader.phone, payment.id, payment.amount,
                "approved" if payment.status == PaymentStatus.APPROVED else "rejected",
                update_data.approval_notes, "https://allajnah.com/dashboard", "ar"
            )
        
        create_audit_log(db, current_user.id, "APPROVE_PAYMENT", "payment", payment.id,
                         f"Payment {payment.status} for user ID {payment.user_id}, amount {payment.amount}")
    
    db.commit()
    db.refresh(payment)
    
    return PaymentResponse.model_validate(payment)

@app.post("/api/payments/stripe/create-checkout")
async def create_stripe_checkout(
    plan_type: str = Body(..., embed=True),
    current_user: User = Depends(require_role(UserRole.TRADER)),
    db: Session = Depends(get_db)
):
    from stripe_service import create_checkout_session
    from config import get_settings
    
    settings = get_settings()
    
    if not settings.STRIPE_SECRET_KEY:
        logger.warning("Stripe checkout attempted but STRIPE_SECRET_KEY is not configured")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe payment is not available. Please use manual payment methods."
        )
    
    if plan_type not in ['monthly', 'yearly']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan_type. Must be 'monthly' or 'yearly'"
        )
    
    result = create_checkout_session(current_user.id, plan_type, db)
    
    if not result:
        logger.error(f"Failed to create Stripe checkout session for user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session. Please try again or use manual payment."
        )
    
    create_audit_log(
        db=db,
        actor_user_id=current_user.id,
        action="stripe_checkout_created",
        target_type="Payment",
        target_id=0,
        details=f"Created Stripe checkout session for plan: {plan_type}"
    )
    
    return {
        "session_id": result['session_id'],
        "checkout_url": result['checkout_url'],
        "message": "Checkout session created successfully"
    }

@app.post("/api/payments/stripe/webhook")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    from webhooks import handle_stripe_webhook
    
    result = await handle_stripe_webhook(request, db)
    return result

@app.post("/api/users/business-verification/upload")
async def upload_business_verification(
    document: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.TRADER)),
    db: Session = Depends(get_db)
):
    validate_upload_file(document)
    
    file_extension = os.path.splitext(document.filename)[1]
    filename = f"business_license_{current_user.id}_{datetime.utcnow().timestamp()}{file_extension}"
    filepath = os.path.join("uploads", filename)
    
    os.makedirs("uploads", exist_ok=True)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(document.file, buffer)
    
    current_user.business_license_path = filepath
    current_user.business_verification_status = models.BusinessVerificationStatus.PENDING
    
    db.commit()
    db.refresh(current_user)
    
    create_audit_log(
        db=db,
        actor_user_id=current_user.id,
        action="business_verification_upload",
        target_type="User",
        target_id=current_user.id,
        details=f"Uploaded business verification document"
    )
    
    return {
        "message": "Business verification document uploaded successfully",
        "status": current_user.business_verification_status.value,
        "file_path": filepath
    }

@app.get("/api/users/subscription-status")
def check_subscription_status(
    current_user: User = Depends(require_role(UserRole.TRADER)),
    db: Session = Depends(get_db)
):
    from subscription_middleware import check_active_subscription
    
    has_active = check_active_subscription(current_user, db)
    
    active_subscription = None
    if has_active:
        active_subscription = db.query(Subscription).filter(
            Subscription.user_id == current_user.id,
            Subscription.status == SubscriptionStatus.ACTIVE,
            Subscription.end_date > datetime.utcnow()
        ).order_by(Subscription.end_date.desc()).first()
    
    response = {
        "has_active_subscription": has_active,
        "can_submit_complaints": has_active
    }
    
    if active_subscription:
        response["subscription"] = {
            "id": active_subscription.id,
            "start_date": active_subscription.start_date.isoformat(),
            "end_date": active_subscription.end_date.isoformat(),
            "status": active_subscription.status.value,
            "auto_renew": active_subscription.auto_renew,
            "days_remaining": (active_subscription.end_date - datetime.utcnow()).days
        }
    
    return response

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
    
    create_audit_log(
        db,
        current_user.id,
        "CREATE_FEEDBACK",
        "feedback",
        new_feedback.id,
        f"Submitted feedback (rating: {feedback_data.rating}/5) for complaint #{complaint_id}",
        metadata={"complaint_id": complaint_id, "rating": feedback_data.rating}
    )
    
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

@app.get("/api/notifications", response_model=NotificationListResponse)
async def get_notifications(
    skip: int = 0,
    limit: int = 20,
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = notification_service.get_user_notifications(
        db, current_user.id, skip, limit, unread_only
    )
    return result

@app.get("/api/notifications/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = notification_service.get_unread_count(db, current_user.id)
    return {"count": count}

@app.patch("/api/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notification = notification_service.mark_notification_as_read(db, notification_id, current_user.id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

@app.post("/api/notifications/mark-all-read")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = notification_service.mark_all_as_read(db, current_user.id)
    return {"message": f"Marked {count} notifications as read", "count": count}

@app.delete("/api/notifications/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = notification_service.delete_notification(db, notification_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted successfully"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...), db: Session = Depends(get_db)):
    try:
        from jose import jwt, JWTError
        from auth import SECRET_KEY, ALGORITHM
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            await websocket.close(code=1008)
            return
        
        await manager.connect(websocket, user.id, user.role.value)
        
        try:
            while True:
                data = await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(websocket, user.id, user.role.value)
    except (JWTError, Exception):
        await websocket.close(code=1008)


@app.get("/api/export/complaints/csv")
async def export_complaints_csv(
    status: Optional[ComplaintStatus] = None,
    category_id: Optional[int] = None,
    priority: Optional[Priority] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    
    if current_user.role == UserRole.TRADER:
        query = query.filter(Complaint.user_id == current_user.id)
    
    if status:
        query = query.filter(Complaint.status == status)
    if category_id:
        query = query.filter(Complaint.category_id == category_id)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if search:
        query = query.filter(
            or_(
                Complaint.title.ilike(f"%{search}%"),
                Complaint.description.ilike(f"%{search}%")
            )
        )
    
    complaints = query.all()
    data = [
        {
            "ID": c.id,
            "Title": c.title,
            "Status": c.status.value,
            "Priority": c.priority.value,
            "Category": c.category.name_en if c.category else "",
            "Created": c.created_at.isoformat(),
            "Trader": f"{c.user.first_name} {c.user.last_name}" if c.user else ""
        }
        for c in complaints
    ]
    
    csv_buffer = export_service.export_to_csv(data)
    
    return StreamingResponse(
        iter([csv_buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=complaints_{datetime.now().strftime('%Y%m%d')}.csv"}
    )


@app.get("/api/export/complaints/excel")
async def export_complaints_excel(
    status: Optional[ComplaintStatus] = None,
    category_id: Optional[int] = None,
    priority: Optional[Priority] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    
    if current_user.role == UserRole.TRADER:
        query = query.filter(Complaint.user_id == current_user.id)
    
    if status:
        query = query.filter(Complaint.status == status)
    if category_id:
        query = query.filter(Complaint.category_id == category_id)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if search:
        query = query.filter(
            or_(
                Complaint.title.ilike(f"%{search}%"),
                Complaint.description.ilike(f"%{search}%")
            )
        )
    
    complaints = query.all()
    data = [
        {
            "ID": c.id,
            "Title": c.title,
            "Status": c.status.value,
            "Priority": c.priority.value,
            "Category": c.category.name_en if c.category else "",
            "Created": c.created_at.isoformat(),
            "Trader": f"{c.user.first_name} {c.user.last_name}" if c.user else ""
        }
        for c in complaints
    ]
    
    excel_buffer = export_service.export_to_excel(data, "Complaints")
    
    return StreamingResponse(
        iter([excel_buffer.getvalue()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=complaints_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    )


@app.get("/api/export/complaint/{complaint_id}/pdf")
async def export_complaint_pdf(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if current_user.role == UserRole.TRADER and complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    complaint_data = {
        "id": complaint.id,
        "title": complaint.title,
        "status": complaint.status.value,
        "priority": complaint.priority.value,
        "category": complaint.category.name_en if complaint.category else "",
        "description": complaint.description,
        "created_at": complaint.created_at.isoformat(),
        "trader_name": f"{complaint.user.first_name} {complaint.user.last_name}" if complaint.user else ""
    }
    
    pdf_buffer = export_service.generate_complaint_pdf(complaint_data)
    
    return StreamingResponse(
        iter([pdf_buffer.getvalue()]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=complaint_{complaint_id}.pdf"}
    )


@app.get("/api/export/analytics/excel")
async def export_analytics_excel(
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE, UserRole.TECHNICAL_COMMITTEE)),
    db: Session = Depends(get_db)
):
    total_complaints = db.query(func.count(Complaint.id)).scalar()
    submitted = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.SUBMITTED).scalar()
    under_review = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.UNDER_REVIEW).scalar()
    escalated = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.ESCALATED).scalar()
    resolved = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.RESOLVED).scalar()
    rejected = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.REJECTED).scalar()
    
    data = [
        {
            "Metric": "Total Complaints",
            "Value": total_complaints
        },
        {
            "Metric": "Submitted",
            "Value": submitted
        },
        {
            "Metric": "Under Review",
            "Value": under_review
        },
        {
            "Metric": "Escalated",
            "Value": escalated
        },
        {
            "Metric": "Resolved",
            "Value": resolved
        },
        {
            "Metric": "Rejected",
            "Value": rejected
        }
    ]
    
    excel_buffer = export_service.export_to_excel(data, "Analytics")
    
    return StreamingResponse(
        iter([excel_buffer.getvalue()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=analytics_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    )


@app.get("/api/export/analytics/csv")
async def export_analytics_csv(
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE, UserRole.TECHNICAL_COMMITTEE)),
    db: Session = Depends(get_db)
):
    total_complaints = db.query(func.count(Complaint.id)).scalar()
    submitted = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.SUBMITTED).scalar()
    under_review = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.UNDER_REVIEW).scalar()
    escalated = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.ESCALATED).scalar()
    resolved = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.RESOLVED).scalar()
    rejected = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.REJECTED).scalar()
    
    data = [
        {
            "Metric": "Total Complaints",
            "Value": total_complaints
        },
        {
            "Metric": "Submitted",
            "Value": submitted
        },
        {
            "Metric": "Under Review",
            "Value": under_review
        },
        {
            "Metric": "Escalated",
            "Value": escalated
        },
        {
            "Metric": "Resolved",
            "Value": resolved
        },
        {
            "Metric": "Rejected",
            "Value": rejected
        }
    ]
    
    csv_buffer = export_service.export_to_csv(data)
    
    return StreamingResponse(
        iter([csv_buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=analytics_{datetime.now().strftime('%Y%m%d')}.csv"}
    )


@app.get("/api/export/analytics/pdf")
async def export_analytics_pdf(
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE, UserRole.TECHNICAL_COMMITTEE)),
    db: Session = Depends(get_db)
):
    total_complaints = db.query(func.count(Complaint.id)).scalar()
    pending = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.SUBMITTED).scalar()
    in_progress = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.UNDER_REVIEW).scalar()
    resolved = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.RESOLVED).scalar()
    rejected = db.query(func.count(Complaint.id)).filter(Complaint.status == ComplaintStatus.REJECTED).scalar()
    
    analytics_data = {
        "total_complaints": total_complaints,
        "pending_count": pending,
        "in_progress_count": in_progress,
        "resolved_count": resolved,
        "rejected_count": rejected
    }
    
    pdf_buffer = export_service.generate_analytics_report(analytics_data)
    
    return StreamingResponse(
        iter([pdf_buffer.getvalue()]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=analytics_{datetime.now().strftime('%Y%m%d')}.pdf"}
    )


@app.get("/api/auth/password-requirements")
async def get_password_requirements():
    from password_validator import validate_password_strength
    
    return {
        "min_length": settings.PASSWORD_MIN_LENGTH,
        "require_uppercase": settings.PASSWORD_REQUIRE_UPPERCASE,
        "require_lowercase": settings.PASSWORD_REQUIRE_LOWERCASE,
        "require_digits": settings.PASSWORD_REQUIRE_DIGITS,
        "require_special": settings.PASSWORD_REQUIRE_SPECIAL
    }


@app.get("/api/task-queue/my-queue", response_model=List[TaskQueueResponse])
async def get_my_task_queue(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from task_queue_service import task_queue_service
    queue_items = task_queue_service.get_my_queue(current_user.id, db)
    return queue_items


@app.get("/api/task-queue/role-queue", response_model=List[TaskQueueResponse])
async def get_role_task_queue(
    current_user: User = Depends(require_role(UserRole.TECHNICAL_COMMITTEE, UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    from task_queue_service import task_queue_service
    queue_items = task_queue_service.get_role_queue(current_user.role, db)
    return queue_items


@app.post("/api/task-queue/rebalance")
async def rebalance_task_queue(
    current_user: User = Depends(require_role(UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    from task_queue_service import task_queue_service
    from audit_helper import create_audit_log
    
    task_queue_service.rebalance_queue(UserRole.TECHNICAL_COMMITTEE, db)
    task_queue_service.rebalance_queue(UserRole.HIGHER_COMMITTEE, db)
    
    create_audit_log(
        db,
        current_user.id,
        "REBALANCE_QUEUE",
        "system",
        0,
        "Rebalanced task queues for all roles"
    )
    
    return {"message": "Task queues rebalanced successfully"}


@app.get("/api/quick-replies", response_model=List[QuickReplyResponse])
async def get_quick_replies(
    category: Optional[str] = None,
    current_user: User = Depends(require_role(UserRole.TECHNICAL_COMMITTEE, UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    query = db.query(QuickReply).filter(QuickReply.is_active == True)
    
    if category:
        query = query.filter(QuickReply.category == category)
    
    quick_replies = query.order_by(QuickReply.created_at.desc()).all()
    return quick_replies


@app.post("/api/quick-replies", response_model=QuickReplyResponse, status_code=status.HTTP_201_CREATED)
async def create_quick_reply(
    quick_reply: QuickReplyCreate,
    current_user: User = Depends(require_role(UserRole.TECHNICAL_COMMITTEE, UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    new_quick_reply = QuickReply(
        title=quick_reply.title,
        content=quick_reply.content,
        category=quick_reply.category,
        created_by_id=current_user.id
    )
    
    db.add(new_quick_reply)
    db.commit()
    db.refresh(new_quick_reply)
    
    create_audit_log(
        db,
        current_user.id,
        "CREATE_QUICK_REPLY",
        "quick_reply",
        new_quick_reply.id,
        f"Created quick reply: {quick_reply.title}"
    )
    
    return new_quick_reply


@app.put("/api/quick-replies/{quick_reply_id}", response_model=QuickReplyResponse)
async def update_quick_reply(
    quick_reply_id: int,
    quick_reply_update: QuickReplyUpdate,
    current_user: User = Depends(require_role(UserRole.TECHNICAL_COMMITTEE, UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    quick_reply = db.query(QuickReply).filter(QuickReply.id == quick_reply_id).first()
    
    if not quick_reply:
        raise HTTPException(status_code=404, detail="Quick reply not found")
    
    if quick_reply_update.title is not None:
        quick_reply.title = quick_reply_update.title
    if quick_reply_update.content is not None:
        quick_reply.content = quick_reply_update.content
    if quick_reply_update.category is not None:
        quick_reply.category = quick_reply_update.category
    if quick_reply_update.is_active is not None:
        quick_reply.is_active = quick_reply_update.is_active
    
    db.commit()
    db.refresh(quick_reply)
    
    create_audit_log(
        db,
        current_user.id,
        "UPDATE_QUICK_REPLY",
        "quick_reply",
        quick_reply.id,
        f"Updated quick reply: {quick_reply.title}"
    )
    
    return quick_reply


@app.delete("/api/quick-replies/{quick_reply_id}")
async def delete_quick_reply(
    quick_reply_id: int,
    current_user: User = Depends(require_role(UserRole.TECHNICAL_COMMITTEE, UserRole.HIGHER_COMMITTEE)),
    db: Session = Depends(get_db)
):
    quick_reply = db.query(QuickReply).filter(QuickReply.id == quick_reply_id).first()
    
    if not quick_reply:
        raise HTTPException(status_code=404, detail="Quick reply not found")
    
    quick_reply.is_active = False
    db.commit()
    
    create_audit_log(
        db,
        current_user.id,
        "DELETE_QUICK_REPLY",
        "quick_reply",
        quick_reply.id,
        f"Deleted quick reply: {quick_reply.title}"
    )
    
    return {"message": "Quick reply deleted successfully"}


@app.get("/")
def root():
    return {"message": "Allajnah Enhanced API - Complaint Management System"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
