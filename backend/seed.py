import sys
from datetime import datetime, timedelta
from database import SessionLocal
from models import (
    User, Category, Complaint, Payment, Subscription,
    PaymentMethod, SystemSettings,
    UserRole, ComplaintStatus, SubscriptionStatus, PaymentStatus, Priority
)
from auth import get_password_hash

def seed_database():
    db = SessionLocal()
    
    try:
        print("Starting database seeding...")
        
        existing_admin = db.query(User).filter(User.role == UserRole.HIGHER_COMMITTEE).first()
        if existing_admin:
            print("Database already has admin users. Skipping seed.")
            return
        
        print("Creating users...")
        admin = User(
            email="admin@allajnah.com",
            hashed_password=get_password_hash("admin123"),
            first_name="Admin",
            last_name="User",
            role=UserRole.HIGHER_COMMITTEE,
            phone="+249912345678",
            is_active=True
        )
        db.add(admin)
        
        tech1 = User(
            email="tech@allajnah.com",
            hashed_password=get_password_hash("tech123"),
            first_name="Technical",
            last_name="Committee",
            role=UserRole.TECHNICAL_COMMITTEE,
            phone="+249912345679",
            is_active=True
        )
        db.add(tech1)
        
        trader1 = User(
            email="trader1@example.com",
            hashed_password=get_password_hash("trader123"),
            first_name="Ahmed",
            last_name="Mohammed",
            role=UserRole.TRADER,
            phone="+249912345680",
            is_active=True
        )
        db.add(trader1)
        
        trader2 = User(
            email="trader2@example.com",
            hashed_password=get_password_hash("trader123"),
            first_name="Fatima",
            last_name="Ali",
            role=UserRole.TRADER,
            phone="+249912345681",
            is_active=True
        )
        db.add(trader2)
        
        db.commit()
        print(f"Created {admin.id}, {tech1.id}, {trader1.id}, {trader2.id}")
        
        print("Creating categories (if not exist)...")
        if db.query(Category).count() == 0:
            categories = [
                Category(
                    name_ar="الصحة",
                    name_en="Health",
                    government_entity="Ministry of Health"
                ),
                Category(
                    name_ar="التعليم",
                    name_en="Education",
                    government_entity="Ministry of Education"
                ),
                Category(
                    name_ar="النقل",
                    name_en="Transportation",
                    government_entity="Ministry of Infrastructure"
                ),
                Category(
                    name_ar="المرافق العامة",
                    name_en="Public Utilities",
                    government_entity="Ministry of Utilities"
                ),
            ]
            for cat in categories:
                db.add(cat)
            db.commit()
            print(f"Created {len(categories)} categories")
        
        print("Creating payment methods...")
        if db.query(PaymentMethod).count() == 0:
            payment_methods = [
                PaymentMethod(
                    name_ar="تحويل بنكي",
                    name_en="Bank Transfer",
                    instructions_ar="قم بالتحويل إلى الحساب البنكي رقم: 1234567890",
                    instructions_en="Transfer to bank account: 1234567890",
                    is_active=True
                ),
                PaymentMethod(
                    name_ar="موبي كاش",
                    name_en="Mobile Money",
                    instructions_ar="ارسل المبلغ إلى رقم: 0912345678",
                    instructions_en="Send amount to: 0912345678",
                    is_active=True
                ),
            ]
            for method in payment_methods:
                db.add(method)
            db.commit()
            print(f"Created {len(payment_methods)} payment methods")
        
        print("Creating system settings...")
        if db.query(SystemSettings).count() == 0:
            settings = [
                SystemSettings(
                    setting_key="subscription_price_annual",
                    setting_value="1000",
                    description="Annual subscription price in SDG"
                ),
                SystemSettings(
                    setting_key="reopen_window_days",
                    setting_value="7",
                    description="Number of days traders can reopen resolved complaints"
                ),
                SystemSettings(
                    setting_key="enable_duplicate_detection",
                    setting_value="true",
                    description="Enable duplicate complaint detection"
                ),
                SystemSettings(
                    setting_key="max_file_size_mb",
                    setting_value="10",
                    description="Maximum file upload size in MB"
                ),
            ]
            for setting in settings:
                db.add(setting)
            db.commit()
            print(f"Created {len(settings)} system settings")
        
        print("Creating subscriptions...")
        subscription1 = Subscription(
            user_id=trader1.id,
            start_date=datetime.utcnow() - timedelta(days=30),
            end_date=datetime.utcnow() + timedelta(days=335),
            status=SubscriptionStatus.ACTIVE
        )
        db.add(subscription1)
        db.commit()
        print(f"Created subscription for trader1")
        
        print("Creating sample complaints...")
        complaint1 = Complaint(
            user_id=trader1.id,
            category_id=1,
            title="مشكلة في الخدمات الصحية",
            description="لا توجد أدوية كافية في المستشفى الحكومي",
            complaint_summary="نقص الأدوية في المستشفيات",
            complaining_on_behalf_of="self",
            priority=Priority.HIGH,
            status=ComplaintStatus.SUBMITTED,
            problem_occurred_date=datetime.utcnow() - timedelta(days=5),
            problem_discovered_date=datetime.utcnow() - timedelta(days=3),
            desired_resolution="توفير الأدوية اللازمة"
        )
        db.add(complaint1)
        
        complaint2 = Complaint(
            user_id=trader2.id,
            category_id=3,
            title="تأخير النقل العام",
            description="الحافلات لا تأتي في الوقت المحدد",
            complaint_summary="تأخير مواعيد النقل العام",
            complaining_on_behalf_of="self",
            priority=Priority.MEDIUM,
            status=ComplaintStatus.UNDER_REVIEW,
            assigned_to_id=tech1.id,
            problem_occurred_date=datetime.utcnow() - timedelta(days=10),
            problem_discovered_date=datetime.utcnow() - timedelta(days=10),
            desired_resolution="تحسين مواعيد النقل"
        )
        db.add(complaint2)
        
        db.commit()
        print(f"Created sample complaints")
        
        print("✅ Database seeded successfully!")
        print("\n" + "="*50)
        print("SEED CREDENTIALS:")
        print("="*50)
        print("Admin:")
        print("  Email: admin@allajnah.com")
        print("  Password: admin123")
        print("\nTechnical Committee:")
        print("  Email: tech@allajnah.com")
        print("  Password: tech123")
        print("\nTrader 1:")
        print("  Email: trader1@example.com")
        print("  Password: trader123")
        print("\nTrader 2:")
        print("  Email: trader2@example.com")
        print("  Password: trader123")
        print("="*50)
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
