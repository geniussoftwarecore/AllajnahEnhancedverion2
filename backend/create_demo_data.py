import sys
import random
from datetime import datetime, timedelta
from database import SessionLocal, engine
from models import Base, User, Category, Complaint, Comment, Payment, Subscription, ComplaintFeedback
from models import UserRole, ComplaintStatus, Priority, PaymentStatus, SubscriptionStatus
from auth import get_password_hash

def create_demo_data():
    db = SessionLocal()
    
    try:
        print("Creating demo data...")
        
        demo_password = get_password_hash("demo123")
        
        users = [
            User(
                email="admin@allajnah.sa",
                hashed_password=demo_password,
                first_name="أحمد",
                last_name="المدير",
                role=UserRole.HIGHER_COMMITTEE,
                phone="+966501234567",
                is_active=True
            ),
            User(
                email="tech1@allajnah.sa",
                hashed_password=demo_password,
                first_name="محمد",
                last_name="التقني",
                role=UserRole.TECHNICAL_COMMITTEE,
                phone="+966501234568",
                is_active=True
            ),
            User(
                email="tech2@allajnah.sa",
                hashed_password=demo_password,
                first_name="فاطمة",
                last_name="التقنية",
                role=UserRole.TECHNICAL_COMMITTEE,
                phone="+966501234569",
                is_active=True
            ),
            User(
                email="trader1@example.com",
                hashed_password=demo_password,
                first_name="عبدالله",
                last_name="التاجر",
                role=UserRole.TRADER,
                phone="+966501234570",
                whatsapp="+966501234570",
                address="الرياض، حي النخيل",
                is_active=True
            ),
            User(
                email="trader2@example.com",
                hashed_password=demo_password,
                first_name="نورة",
                last_name="التاجرة",
                role=UserRole.TRADER,
                phone="+966501234571",
                whatsapp="+966501234571",
                address="جدة، حي الحمراء",
                is_active=True
            ),
            User(
                email="trader3@example.com",
                hashed_password=demo_password,
                first_name="خالد",
                last_name="التاجر",
                role=UserRole.TRADER,
                phone="+966501234572",
                address="الدمام، حي الفيحاء",
                is_active=True
            )
        ]
        
        for user in users:
            db.add(user)
        db.commit()
        print(f"✓ Created {len(users)} users")
        
        for user in users:
            if user.role == UserRole.TRADER:
                subscription = Subscription(
                    user_id=user.id,
                    start_date=datetime.utcnow() - timedelta(days=90),
                    end_date=datetime.utcnow() + timedelta(days=275),
                    status=SubscriptionStatus.ACTIVE
                )
                db.add(subscription)
        db.commit()
        print("✓ Created subscriptions for traders")
        
        categories = db.query(Category).all()
        traders = [u for u in users if u.role == UserRole.TRADER]
        tech_members = [u for u in users if u.role == UserRole.TECHNICAL_COMMITTEE]
        
        complaint_templates = [
            {
                "title": "تأخر في استخراج التراخيص التجارية",
                "description": "تقدمت بطلب للحصول على ترخيص تجاري منذ 3 أشهر ولم يتم الرد على الطلب حتى الآن. هذا يؤثر على بدء نشاطي التجاري.",
                "complaint_summary": "تأخر 3 أشهر في استخراج الترخيص التجاري",
                "desired_resolution": "استخراج الترخيص في أسرع وقت ممكن",
                "priority": Priority.HIGH
            },
            {
                "title": "رفض طلب التجديد بدون سبب واضح",
                "description": "تم رفض طلب تجديد الترخيص الخاص بي دون تقديم أسباب واضحة أو طلب أي مستندات إضافية.",
                "complaint_summary": "رفض تجديد الترخيص بدون مبرر",
                "desired_resolution": "مراجعة القرار وتجديد الترخيص",
                "priority": Priority.URGENT
            },
            {
                "title": "سوء معاملة من موظفي الخدمات",
                "description": "تعرضت لمعاملة غير لائقة من أحد الموظفين في مكتب الخدمات عند محاولة استفسار عن إجراءات معينة.",
                "complaint_summary": "سوء معاملة من الموظفين",
                "desired_resolution": "اتخاذ الإجراءات اللازمة مع الموظف المعني",
                "priority": Priority.MEDIUM
            },
            {
                "title": "عدم وضوح الإجراءات المطلوبة",
                "description": "الموقع الإلكتروني لا يوضح بشكل كافٍ المستندات المطلوبة للحصول على الخدمة، مما يؤدي إلى رفض الطلبات المتكررة.",
                "complaint_summary": "غموض في متطلبات الخدمة",
                "desired_resolution": "توضيح المتطلبات بشكل أفضل على الموقع",
                "priority": Priority.LOW
            },
            {
                "title": "ارتفاع الرسوم المفاجئ",
                "description": "تم زيادة رسوم التجديد بنسبة كبيرة دون إشعار مسبق، مما أثر على ميزانيتي.",
                "complaint_summary": "زيادة غير متوقعة في الرسوم",
                "desired_resolution": "إعادة النظر في الرسوم أو تقديم تبرير للزيادة",
                "priority": Priority.MEDIUM
            }
        ]
        
        complaints_created = 0
        for i in range(15):
            template = random.choice(complaint_templates)
            trader = random.choice(traders)
            category = random.choice(categories)
            
            days_ago = random.randint(1, 60)
            created_at = datetime.utcnow() - timedelta(days=days_ago)
            
            status_choices = [ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW, 
                            ComplaintStatus.ESCALATED, ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED]
            status = random.choice(status_choices)
            
            complaint = Complaint(
                user_id=trader.id,
                category_id=category.id,
                title=template["title"],
                description=template["description"],
                complaint_summary=template["complaint_summary"],
                desired_resolution=template["desired_resolution"],
                priority=template["priority"],
                status=status,
                created_at=created_at,
                updated_at=created_at + timedelta(hours=random.randint(1, 48))
            )
            
            if status in [ComplaintStatus.UNDER_REVIEW, ComplaintStatus.ESCALATED, ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED]:
                complaint.assigned_to_id = random.choice(tech_members).id
            
            if status in [ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED]:
                complaint.resolved_at = created_at + timedelta(days=random.randint(3, 15))
                if status == ComplaintStatus.RESOLVED:
                    complaint.can_reopen_until = complaint.resolved_at + timedelta(days=7)
            
            db.add(complaint)
            db.flush()
            
            for j in range(random.randint(1, 4)):
                comment_user = random.choice(tech_members) if random.random() > 0.3 else trader
                comment = Comment(
                    complaint_id=complaint.id,
                    user_id=comment_user.id,
                    content=random.choice([
                        "نشكركم على تقديم الشكوى. سيتم مراجعتها في أقرب وقت.",
                        "تم تحويل الشكوى للجهة المختصة للمراجعة.",
                        "يرجى تزويدنا بالمستندات الداعمة.",
                        "تم حل المشكلة ونعتذر عن التأخير.",
                        "نقدر تعاونكم ونعمل على حل الموضوع."
                    ]),
                    is_internal=random.choice([0, 1]) if comment_user.role != UserRole.TRADER else 0,
                    created_at=created_at + timedelta(days=random.randint(1, 5))
                )
                db.add(comment)
            
            if status == ComplaintStatus.RESOLVED and random.random() > 0.5:
                feedback = ComplaintFeedback(
                    complaint_id=complaint.id,
                    user_id=trader.id,
                    rating=random.randint(3, 5),
                    comment=random.choice([
                        "خدمة ممتازة وحل سريع للمشكلة",
                        "شكراً على الاهتمام والمتابعة",
                        "تم حل المشكلة بشكل مرضي",
                        None
                    ]),
                    created_at=complaint.resolved_at + timedelta(days=1)
                )
                db.add(feedback)
            
            complaints_created += 1
        
        db.commit()
        print(f"✓ Created {complaints_created} complaints with comments and feedback")
        
        for trader in traders[0:2]:
            payment = Payment(
                user_id=trader.id,
                amount=1000.00,
                method="تحويل بنكي",
                proof_path="uploads/demo_payment.pdf",
                status=PaymentStatus.APPROVED,
                approved_by_id=users[0].id,
                approved_at=datetime.utcnow() - timedelta(days=30),
                created_at=datetime.utcnow() - timedelta(days=31)
            )
            db.add(payment)
        
        pending_payment = Payment(
            user_id=traders[2].id,
            amount=1000.00,
            method="سداد",
            proof_path="uploads/demo_payment.pdf",
            status=PaymentStatus.PENDING,
            created_at=datetime.utcnow() - timedelta(days=2)
        )
        db.add(pending_payment)
        
        db.commit()
        print("✓ Created demo payments")
        
        print("\n" + "="*50)
        print("Demo data created successfully!")
        print("="*50)
        print("\nDemo Users:")
        print("Admin: admin@allajnah.sa / demo123")
        print("Technical Committee 1: tech1@allajnah.sa / demo123")
        print("Technical Committee 2: tech2@allajnah.sa / demo123")
        print("Trader 1: trader1@example.com / demo123")
        print("Trader 2: trader2@example.com / demo123")
        print("Trader 3: trader3@example.com / demo123")
        print("="*50)
        
    except Exception as e:
        print(f"Error creating demo data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Warning: This will create demo data in the database.")
    response = input("Continue? (yes/no): ")
    if response.lower() == 'yes':
        create_demo_data()
    else:
        print("Cancelled.")
