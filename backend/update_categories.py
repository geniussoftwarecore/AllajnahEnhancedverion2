from database import SessionLocal, engine
from models import Category, Base

def update_categories():
    """Update categories with government entities and their complaint types"""
    db = SessionLocal()
    
    try:
        # Delete existing categories
        db.query(Category).delete()
        db.commit()
        print("✓ Deleted existing categories")
        
        # Define all categories by government entity
        categories_data = [
            # المواصفات والمقاييس
            {"government_entity": "المواصفات والمقاييس", "name_ar": "سحب عينات متكررة لنفس المنتج", "name_en": "Repeated sample withdrawal for the same product"},
            {"government_entity": "المواصفات والمقاييس", "name_ar": "عدم قبولهم الفحوصات السابقة", "name_en": "Not accepting previous tests"},
            {"government_entity": "المواصفات والمقاييس", "name_ar": "مبالغة في الاجراءات الشكلية والمعاينة الظاهرية", "name_en": "Exaggeration in formal procedures and visual inspection"},
            {"government_entity": "المواصفات والمقاييس", "name_ar": "رفض شهادات المطابقة ونتائج الاختبار", "name_en": "Rejection of conformity certificates and test results"},
            {"government_entity": "المواصفات والمقاييس", "name_ar": "رفض تقارير اختبار العينات", "name_en": "Rejection of sample test reports"},
            {"government_entity": "المواصفات والمقاييس", "name_ar": "التحريز الشامل لجميع محتويات الشاحنة", "name_en": "Comprehensive inspection of all truck contents"},
            {"government_entity": "المواصفات والمقاييس", "name_ar": "تأخير الإفراج – الفحص لمدة طويلة", "name_en": "Delay in release - long inspection period"},
            {"government_entity": "المواصفات والمقاييس", "name_ar": "ارتفاع أجور الفحص", "name_en": "High inspection fees"},
            {"government_entity": "المواصفات والمقاييس", "name_ar": "الإجراءات على منتج سليم بسبب منتج مخالف", "name_en": "Procedures on a sound product due to a defective product"},
            {"government_entity": "المواصفات والمقاييس", "name_ar": "تأخير الافراج", "name_en": "Delay in release"},
            {"government_entity": "المواصفات والمقاييس", "name_ar": "التأخير في نتائج الفحص الظاهر", "name_en": "Delay in visual inspection results"},
            {"government_entity": "المواصفات والمقاييس", "name_ar": "تكرار الفحوصات لمنتجات سابقة", "name_en": "Repeating tests for previous products"},
            {"government_entity": "المواصفات والمقاييس", "name_ar": "غرامات غير قانونية", "name_en": "Illegal fines"},
            {"government_entity": "المواصفات والمقاييس", "name_ar": "ابتزاز", "name_en": "Extortion"},
            {"government_entity": "المواصفات والمقاييس", "name_ar": "إلزام المصنعين بمواصفات اختيارية", "name_en": "Forcing manufacturers to comply with optional specifications"},
            
            # الجمارك
            {"government_entity": "الجمارك", "name_ar": "اهمال البضائع عند المطابقة", "name_en": "Neglect of goods during conformity"},
            {"government_entity": "الجمارك", "name_ar": "غرامات غير قانونية", "name_en": "Illegal fines"},
            {"government_entity": "الجمارك", "name_ar": "معاملة المواد الخام كمنتج نهائي للاستهلاك", "name_en": "Treating raw materials as final consumer products"},
            {"government_entity": "الجمارك", "name_ar": "ازدواجية المطالبة بالضمان", "name_en": "Duplicate warranty claims"},
            {"government_entity": "الجمارك", "name_ar": "مخالفة اتفاق", "name_en": "Violation of agreement"},
            {"government_entity": "الجمارك", "name_ar": "عدم البت في الاتلاف", "name_en": "Failure to decide on destruction"},
            {"government_entity": "الجمارك", "name_ar": "تفاوت أوقات المعاينة بين الجهات المعنية", "name_en": "Variation in inspection times between concerned authorities"},
            {"government_entity": "الجمارك", "name_ar": "تأخر الافراج لعدم الوزن", "name_en": "Delay in release due to lack of weight"},
            {"government_entity": "الجمارك", "name_ar": "الافتقار لنظام واضح لقيمة البضائع", "name_en": "Lack of clear system for goods valuation"},
            {"government_entity": "الجمارك", "name_ar": "عدم حماية العلامة التجارية", "name_en": "Lack of trademark protection"},
            {"government_entity": "الجمارك", "name_ar": "رفض اقرارات الشراء", "name_en": "Rejection of purchase declarations"},
            {"government_entity": "الجمارك", "name_ar": "كسر الاعفاء المقدم", "name_en": "Breaking the granted exemption"},
            {"government_entity": "الجمارك", "name_ar": "مخالفة للتعميمات", "name_en": "Violation of circulars"},
            {"government_entity": "الجمارك", "name_ar": "زيادة في القيمة الجمركية", "name_en": "Increase in customs value"},
            {"government_entity": "الجمارك", "name_ar": "احتجاز بضائع خارجة من صنعاء", "name_en": "Detention of goods leaving Sana'a"},
            {"government_entity": "الجمارك", "name_ar": "استيفاء وثائق الهيئة العامة للاستثمار", "name_en": "Fulfillment of General Investment Authority documents"},
            {"government_entity": "الجمارك", "name_ar": "تأخير السلع منها سلع سريعة التلف", "name_en": "Delay of goods including perishable goods"},
            {"government_entity": "الجمارك", "name_ar": "اختلال في التقييم للسعر", "name_en": "Imbalance in price assessment"},
            {"government_entity": "الجمارك", "name_ar": "عدم إعادة الرسوم", "name_en": "Non-refund of fees"},
            {"government_entity": "الجمارك", "name_ar": "إعادة الجمركة", "name_en": "Re-customs"},
            {"government_entity": "الجمارك", "name_ar": "احتجار المرتجع", "name_en": "Monopolization of returns"},
            {"government_entity": "الجمارك", "name_ar": "فترة التخصيم", "name_en": "Allocation period"},
            {"government_entity": "الجمارك", "name_ar": "الية القيمة والثمن", "name_en": "Value and price mechanism"},
            
            # الضرائب
            {"government_entity": "الضرائب", "name_ar": "طلب اقرارات سابقة", "name_en": "Request for previous declarations"},
            {"government_entity": "الضرائب", "name_ar": "تأخير استلام الاقرارات الضريبية", "name_en": "Delay in receiving tax returns"},
            {"government_entity": "الضرائب", "name_ar": "سداد الضريبة نقداً وشيكات", "name_en": "Payment of tax in cash and checks"},
            {"government_entity": "الضرائب", "name_ar": "رفع ضريبة الأرباح", "name_en": "Increase in profit tax"},
            {"government_entity": "الضرائب", "name_ar": "طلب اصل البيان الجمركي", "name_en": "Request for original customs declaration"},
            {"government_entity": "الضرائب", "name_ar": "طلب التجار من مباحث الأموال العامة", "name_en": "Traders request from Public Funds Investigation"},
            {"government_entity": "الضرائب", "name_ar": "مبالغ تحت الحساب", "name_en": "Amounts on account"},
            {"government_entity": "الضرائب", "name_ar": "عدم اتخاذ الإجراءات القانونية", "name_en": "Failure to take legal action"},
            {"government_entity": "الضرائب", "name_ar": "زيادة الإجراءات في المعاملات", "name_en": "Increase in transaction procedures"},
            
            # صندوق النظافة والتحسين
            {"government_entity": "صندوق النظافة والتحسين", "name_ar": "التحصيل بين المديريات في إطار المحافظة الواحدة", "name_en": "Collection between directorates within one governorate"},
            {"government_entity": "صندوق النظافة والتحسين", "name_ar": "رسوم الدعاية والاعلان وازدواجية تحصيل الرسوم بلوائح مختلفة", "name_en": "Advertising fees and duplicate fee collection with different regulations"},
            {"government_entity": "صندوق النظافة والتحسين", "name_ar": "ارتفاع الرسوم", "name_en": "High fees"},
            {"government_entity": "صندوق النظافة والتحسين", "name_ar": "ازدواجية التحصيل", "name_en": "Duplicate collection"},
            {"government_entity": "صندوق النظافة والتحسين", "name_ar": "تحصيل رسوم بدون سندات", "name_en": "Fee collection without receipts"},
            {"government_entity": "صندوق النظافة والتحسين", "name_ar": "أسلوب الإكراه في الوسائل الإعلانية", "name_en": "Coercion method in advertising media"},
            {"government_entity": "صندوق النظافة والتحسين", "name_ar": "ضعف تنسيق الصندوق مع الامن", "name_en": "Weak coordination of the fund with security"},
            {"government_entity": "صندوق النظافة والتحسين", "name_ar": "التنصل عن تنفيذ الاتفاقات", "name_en": "Disavowal of implementing agreements"},
            {"government_entity": "صندوق النظافة والتحسين", "name_ar": "المزاجية في المعاملات الإدارية", "name_en": "Arbitrariness in administrative transactions"},
            {"government_entity": "صندوق النظافة والتحسين", "name_ar": "خلل اداري", "name_en": "Administrative malfunction"},
        ]
        
        # Insert new categories
        for cat_data in categories_data:
            category = Category(**cat_data)
            db.add(category)
        
        db.commit()
        print(f"✓ Successfully added {len(categories_data)} categories")
        
        # Print summary
        entities = db.query(Category.government_entity).distinct().all()
        print("\n✓ Categories by government entity:")
        for entity in entities:
            count = db.query(Category).filter(Category.government_entity == entity[0]).count()
            print(f"  - {entity[0]}: {count} categories")
        
        print("\n✓ Database updated successfully!")
        
    except Exception as e:
        print(f"✗ Error updating categories: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_categories()
