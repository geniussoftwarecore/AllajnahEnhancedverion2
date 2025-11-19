from database import engine, Base
from models import (
    User, Category, Complaint, Comment, Attachment,
    Subscription, Payment, ComplaintFeedback, AuditLog,
    PaymentMethod, UserRole
)

def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    
    from database import SessionLocal
    db = SessionLocal()
    
    try:
        if db.query(Category).count() == 0:
            categories = [
                Category(
                    name_ar="المواصفات والمقاييس",
                    name_en="Standards and Measurements",
                    government_entity="المواصفات والمقاييس",
                    description_ar="شكاوى متعلقة بالمواصفات والمقاييس"
                ),
                Category(
                    name_ar="الجمارك",
                    name_en="Customs",
                    government_entity="الجمارك",
                    description_ar="شكاوى متعلقة بالجمارك"
                ),
                Category(
                    name_ar="الضرائب",
                    name_en="Taxes",
                    government_entity="الضرائب",
                    description_ar="شكاوى متعلقة بالضرائب"
                ),
                Category(
                    name_ar="صندوق النظافة والتحسين",
                    name_en="Cleaning and Improvement Fund",
                    government_entity="صندوق النظافة والتحسين",
                    description_ar="شكاوى متعلقة بصندوق النظافة والتحسين"
                ),
                Category(
                    name_ar="مباحث الأموال العامة",
                    name_en="Public Funds Investigation",
                    government_entity="مباحث الأموال العامة",
                    description_ar="شكاوى متعلقة بمباحث الأموال العامة"
                ),
                Category(
                    name_ar="خلل إداري",
                    name_en="Administrative Issues",
                    government_entity="إدارة عامة",
                    description_ar="شكاوى متعلقة بالخلل الإداري"
                ),
            ]
            db.add_all(categories)
            db.commit()
            print("Default categories added successfully!")
        
        if db.query(PaymentMethod).count() == 0:
            payment_methods = [
                PaymentMethod(
                    name_ar="المحفظة الإلكترونية",
                    name_en="E-Wallet",
                    instructions_ar="""
                    يمكنك الدفع عن طريق المحفظة الإلكترونية بقيمة 15,000 ريال يمني.
                    
                    خطوات الدفع:
                    1. حول المبلغ إلى رقم المحفظة: 777-777-777
                    2. احتفظ برقم الإشعار المرجعي
                    3. قم برفع صورة من إشعار الدفع
                    4. أدخل رقم الإشعار المرجعي في الحقل المخصص
                    """,
                    instructions_en="""
                    You can pay via e-wallet with the amount of 15,000 Yemeni Riyals.
                    
                    Payment steps:
                    1. Transfer the amount to wallet number: 777-777-777
                    2. Keep the reference number
                    3. Upload a screenshot of the payment receipt
                    4. Enter the reference number in the designated field
                    """,
                    is_active=True
                ),
                PaymentMethod(
                    name_ar="حوالة شبكات محلية أو خارجية",
                    name_en="Local or International Money Transfer",
                    instructions_ar="""
                    يمكنك الدفع عن طريق الحوالة بقيمة 15,000 ريال يمني.
                    
                    خطوات الدفع:
                    1. قم بإرسال حوالة إلى الاسم: غرفة التجارة والصناعة
                    2. رقم الهاتف: 777-123-456
                    3. احتفظ بإيصال الحوالة ورقم الإشعار
                    4. قم برفع صورة من إيصال الحوالة
                    5. أدخل رقم الإشعار في الحقل المخصص
                    """,
                    instructions_en="""
                    You can pay via money transfer with the amount of 15,000 Yemeni Riyals.
                    
                    Payment steps:
                    1. Send a money transfer to: Chamber of Commerce and Industry
                    2. Phone number: 777-123-456
                    3. Keep the transfer receipt and reference number
                    4. Upload a screenshot of the transfer receipt
                    5. Enter the reference number in the designated field
                    """,
                    is_active=True
                ),
                PaymentMethod(
                    name_ar="تحويل بنكي",
                    name_en="Bank Transfer",
                    instructions_ar="""
                    يمكنك الدفع عن طريق التحويل البنكي بقيمة 15,000 ريال يمني.
                    
                    تفاصيل الحساب البنكي:
                    - اسم الحساب: غرفة التجارة والصناعة
                    - رقم الحساب: 123456789
                    - البنك: البنك الأهلي اليمني
                    - الفرع: الفرع الرئيسي
                    
                    خطوات الدفع:
                    1. قم بتحويل المبلغ إلى الحساب البنكي المذكور أعلاه
                    2. احتفظ بإيصال التحويل
                    3. قم برفع صورة من إيصال التحويل البنكي
                    4. أدخل رقم العملية في الحقل المخصص
                    """,
                    instructions_en="""
                    You can pay via bank transfer with the amount of 15,000 Yemeni Riyals.
                    
                    Bank account details:
                    - Account name: Chamber of Commerce and Industry
                    - Account number: 123456789
                    - Bank: Yemen National Bank
                    - Branch: Main Branch
                    
                    Payment steps:
                    1. Transfer the amount to the bank account mentioned above
                    2. Keep the transfer receipt
                    3. Upload a screenshot of the bank transfer receipt
                    4. Enter the transaction number in the designated field
                    """,
                    is_active=True
                ),
            ]
            db.add_all(payment_methods)
            db.commit()
            print("Default payment methods added successfully!")
    except Exception as e:
        print(f"Error initializing data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
