from typing import Optional
from models import User, Complaint, Payment


def send_notification(
    user: User,
    subject: str,
    message: str,
    notification_type: str = "email"
) -> dict:
    print(f"\n[NOTIFICATION - {notification_type.upper()}]")
    print(f"To: {user.email} ({user.first_name} {user.last_name})")
    print(f"Subject: {subject}")
    print(f"Message: {message}")
    print("-" * 70)
    
    return {
        "sent": True,
        "method": notification_type,
        "recipient": user.email
    }


def notify_complaint_status_change(user: User, complaint: Complaint, old_status: str, new_status: str):
    subject = f"تحديث حالة الشكوى #{complaint.id}"
    message = f"""
    مرحباً {user.first_name},
    
    تم تحديث حالة شكواك #{complaint.id}
    العنوان: {complaint.title}
    
    الحالة السابقة: {old_status}
    الحالة الجديدة: {new_status}
    
    يمكنك متابعة الشكوى من خلال النظام.
    
    مع التحية،
    نظام إدارة الشكاوى
    """
    
    send_notification(user, subject, message, "email")
    
    if user.whatsapp:
        sms_message = f"تحديث: شكواك #{complaint.id} تم تغيير حالتها إلى {new_status}"
        send_notification(user, "تحديث الشكوى", sms_message, "whatsapp")


def notify_complaint_assigned(assignee: User, complaint: Complaint):
    subject = f"شكوى جديدة تم تعيينها لك #{complaint.id}"
    message = f"""
    مرحباً {assignee.first_name},
    
    تم تعيين شكوى جديدة لك:
    رقم الشكوى: #{complaint.id}
    العنوان: {complaint.title}
    الفئة: {complaint.category.name_ar if complaint.category else 'غير محدد'}
    الأولوية: {complaint.priority.value}
    
    يرجى مراجعة الشكوى واتخاذ الإجراء اللازم.
    
    مع التحية،
    نظام إدارة الشكاوى
    """
    
    send_notification(assignee, subject, message, "email")


def notify_complaint_escalated(complaint: Complaint):
    subject = f"تصعيد الشكوى #{complaint.id}"
    message = f"""
    تم تصعيد الشكوى التالية إلى اللجنة العليا:
    
    رقم الشكوى: #{complaint.id}
    العنوان: {complaint.title}
    السبب: تجاوز الحد الزمني المسموح (SLA)
    
    يرجى المراجعة واتخاذ القرار المناسب.
    """
    
    return {
        "notification_sent": "escalation_notification",
        "complaint_id": complaint.id
    }


def notify_payment_approval(user: User, payment: Payment, approved: bool):
    subject = "نتيجة مراجعة الدفع" if approved else "رفض طلب الدفع"
    
    if approved:
        message = f"""
        مرحباً {user.first_name},
        
        تمت الموافقة على دفعتك بمبلغ {payment.amount} ريال.
        تم تفعيل اشتراكك السنوي.
        
        يمكنك الآن تقديم الشكاوى والاستفادة من جميع خدمات النظام.
        
        مع التحية،
        نظام إدارة الشكاوى
        """
    else:
        message = f"""
        مرحباً {user.first_name},
        
        نأسف لإبلاغك بأن دفعتك بمبلغ {payment.amount} ريال لم يتم قبولها.
        
        السبب: {payment.approval_notes or 'لم يتم تحديد السبب'}
        
        يرجى التواصل مع الإدارة لمزيد من المعلومات.
        
        مع التحية،
        نظام إدارة الشكاوى
        """
    
    send_notification(user, subject, message, "email")
    
    if user.whatsapp:
        status_text = "تمت الموافقة" if approved else "تم الرفض"
        sms = f"دفعتك بمبلغ {payment.amount} ريال - {status_text}"
        send_notification(user, "تحديث الدفع", sms, "whatsapp")


def notify_subscription_expiring(user: User, days_remaining: int):
    subject = "تنبيه: اشتراكك على وشك الانتهاء"
    message = f"""
    مرحباً {user.first_name},
    
    نود تذكيرك بأن اشتراكك السنوي سينتهي خلال {days_remaining} يوم.
    
    لتجديد اشتراكك والاستمرار في استخدام النظام، يرجى:
    1. تسديد رسوم التجديد
    2. رفع إثبات الدفع عبر النظام
    
    في حالة انتهاء الاشتراك، لن تتمكن من تقديم شكاوى جديدة.
    
    مع التحية،
    نظام إدارة الشكاوى
    """
    
    send_notification(user, subject, message, "email")
    
    if user.whatsapp:
        sms = f"تنبيه: اشتراكك سينتهي خلال {days_remaining} يوم. يرجى التجديد."
        send_notification(user, "تنبيه الاشتراك", sms, "whatsapp")


def notify_complaint_auto_closed(user: User, complaint: Complaint):
    subject = f"إغلاق تلقائي للشكوى #{complaint.id}"
    message = f"""
    مرحباً {user.first_name},
    
    تم إغلاق شكواك #{complaint.id} تلقائياً بعد عدم وجود تفاعل لفترة محددة.
    العنوان: {complaint.title}
    
    إذا كنت ترغب في إعادة فتح الشكوى، يمكنك القيام بذلك من خلال النظام خلال الفترة المسموحة.
    
    مع التحية،
    نظام إدارة الشكاوى
    """
    
    send_notification(user, subject, message, "email")


def notify_new_comment(user: User, complaint: Complaint, comment_author: str):
    subject = f"تعليق جديد على الشكوى #{complaint.id}"
    message = f"""
    مرحباً {user.first_name},
    
    تم إضافة تعليق جديد على شكواك #{complaint.id}
    من قبل: {comment_author}
    
    يرجى تسجيل الدخول لمشاهدة التعليق والرد عليه.
    
    مع التحية،
    نظام إدارة الشكاوى
    """
    
    send_notification(user, subject, message, "email")
