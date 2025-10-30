from database import engine, Base
from models import (
    User, Category, Complaint, Comment, Attachment,
    Subscription, Payment, ComplaintFeedback, AuditLog,
    UserRole
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
                    name_ar="الموصفات والمقاييس",
                    name_en="Standards and Measurements",
                    government_entity="الموصفات والمقاييس",
                    description_ar="شكاوى متعلقة بالموصفات والمقاييس"
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
    except Exception as e:
        print(f"Error initializing categories: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
