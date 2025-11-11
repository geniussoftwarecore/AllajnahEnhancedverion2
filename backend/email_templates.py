from typing import Optional
from datetime import datetime


def get_base_template(content: str, direction: str = "rtl", lang: str = "ar") -> str:
    """
    Base email template with professional styling, brand colors, and RTL support.
    """
    return f"""
<!DOCTYPE html>
<html lang="{lang}" dir="{direction}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>اللجنة - Allajnah</title>
    <style>
        body {{
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, Arial, sans-serif;
            background-color: #f5f7fa;
            direction: {direction};
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }}
        .header {{
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            padding: 30px 20px;
            text-align: center;
        }}
        .header-icon {{
            width: 60px;
            height: 60px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
        }}
        .header-title {{
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .content h2 {{
            color: #1f2937;
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 20px 0;
        }}
        .content p {{
            color: #4b5563;
            font-size: 15px;
            line-height: 1.6;
            margin: 0 0 15px 0;
        }}
        .info-box {{
            background-color: #f0fdf4;
            border-{direction === "rtl" ? "right" : "left"}: 4px solid #10b981;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }}
        .info-box-warning {{
            background-color: #fef3c7;
            border-{direction === "rtl" ? "right" : "left"}: 4px solid #f59e0b;
        }}
        .info-box-error {{
            background-color: #fee2e2;
            border-{direction === "rtl" ? "right" : "left"}: 4px solid #ef4444;
        }}
        .info-box-blue {{
            background-color: #eff6ff;
            border-{direction === "rtl" ? "right" : "left"}: 4px solid #3b82f6;
        }}
        .info-item {{
            margin: 10px 0;
            color: #374151;
            font-size: 14px;
        }}
        .info-label {{
            font-weight: 600;
            color: #1f2937;
        }}
        .button {{
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
        }}
        .button:hover {{
            box-shadow: 0 6px 10px rgba(16, 185, 129, 0.3);
        }}
        .footer {{
            background-color: #f9fafb;
            padding: 30px 20px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }}
        .footer p {{
            color: #6b7280;
            font-size: 13px;
            margin: 5px 0;
        }}
        .divider {{
            height: 1px;
            background-color: #e5e7eb;
            margin: 30px 0;
        }}
        .badge {{
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            margin: 5px 0;
        }}
        .badge-success {{
            background-color: #d1fae5;
            color: #065f46;
        }}
        .badge-warning {{
            background-color: #fef3c7;
            color: #92400e;
        }}
        .badge-error {{
            background-color: #fee2e2;
            color: #991b1b;
        }}
        .badge-info {{
            background-color: #dbeafe;
            color: #1e40af;
        }}
        @media only screen and (max-width: 600px) {{
            .content {{
                padding: 25px 20px;
            }}
            .header {{
                padding: 25px 15px;
            }}
            .button {{
                display: block;
                text-align: center;
            }}
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="header-icon">✨</div>
            <h1 class="header-title">{"نظام إدارة الشكاوى" if lang == "ar" else "Complaint Management System"}</h1>
        </div>
        <div class="content">
            {content}
        </div>
        <div class="footer">
            <p>{"© 2025 اللجنة - جميع الحقوق محفوظة" if lang == "ar" else "© 2025 Allajnah - All Rights Reserved"}</p>
            <p>{"هذا البريد الإلكتروني تم إرساله تلقائياً، يرجى عدم الرد عليه." if lang == "ar" else "This is an automated email, please do not reply."}</p>
        </div>
    </div>
</body>
</html>
"""


def complaint_status_update_template(
    complaint_id: int,
    complaint_title: str,
    old_status: str,
    new_status: str,
    updated_by: str,
    dashboard_url: str,
    language: str = "ar"
) -> str:
    """Email template for complaint status updates."""
    
    status_colors = {
        "SUBMITTED": "info",
        "UNDER_REVIEW": "info",
        "ESCALATED": "warning",
        "RESOLVED": "success",
        "REJECTED": "error",
        "MEDIATION_PENDING": "warning",
        "MEDIATION_IN_PROGRESS": "warning"
    }
    
    status_translations_ar = {
        "SUBMITTED": "مقدمة",
        "UNDER_REVIEW": "قيد المراجعة",
        "ESCALATED": "مصعدة",
        "RESOLVED": "محلولة",
        "REJECTED": "مرفوضة",
        "MEDIATION_PENDING": "في انتظار الوساطة",
        "MEDIATION_IN_PROGRESS": "جاري الوساطة"
    }
    
    status_badge = status_colors.get(new_status, "info")
    
    if language == "ar":
        content = f"""
            <h2>تحديث حالة الشكوى</h2>
            <p>مرحباً،</p>
            <p>تم تحديث حالة شكواك التالية:</p>
            
            <div class="info-box">
                <div class="info-item"><span class="info-label">رقم الشكوى:</span> #{complaint_id}</div>
                <div class="info-item"><span class="info-label">العنوان:</span> {complaint_title}</div>
                <div class="info-item"><span class="info-label">الحالة السابقة:</span> {status_translations_ar.get(old_status, old_status)}</div>
                <div class="info-item">
                    <span class="info-label">الحالة الجديدة:</span> 
                    <span class="badge badge-{status_badge}">{status_translations_ar.get(new_status, new_status)}</span>
                </div>
                <div class="info-item"><span class="info-label">تم التحديث بواسطة:</span> {updated_by}</div>
            </div>
            
            <p>يمكنك متابعة شكواك والاطلاع على جميع التفاصيل من خلال لوحة التحكم.</p>
            
            <center>
                <a href="{dashboard_url}" class="button">عرض الشكوى</a>
            </center>
            
            <div class="divider"></div>
            <p style="font-size: 13px; color: #6b7280;">إذا كان لديك أي استفسار، يمكنك التواصل معنا من خلال النظام.</p>
        """
    else:
        content = f"""
            <h2>Complaint Status Update</h2>
            <p>Hello,</p>
            <p>Your complaint status has been updated:</p>
            
            <div class="info-box">
                <div class="info-item"><span class="info-label">Complaint ID:</span> #{complaint_id}</div>
                <div class="info-item"><span class="info-label">Title:</span> {complaint_title}</div>
                <div class="info-item"><span class="info-label">Previous Status:</span> {old_status}</div>
                <div class="info-item">
                    <span class="info-label">New Status:</span> 
                    <span class="badge badge-{status_badge}">{new_status}</span>
                </div>
                <div class="info-item"><span class="info-label">Updated by:</span> {updated_by}</div>
            </div>
            
            <p>You can track your complaint and view all details from the dashboard.</p>
            
            <center>
                <a href="{dashboard_url}" class="button">View Complaint</a>
            </center>
            
            <div class="divider"></div>
            <p style="font-size: 13px; color: #6b7280;">If you have any questions, you can contact us through the system.</p>
        """
    
    direction = "rtl" if language == "ar" else "ltr"
    return get_base_template(content, direction, language)


def complaint_assignment_template(
    complaint_id: int,
    complaint_title: str,
    complaint_category: str,
    priority: str,
    submitted_by: str,
    dashboard_url: str,
    language: str = "ar"
) -> str:
    """Email template for complaint assignment notification."""
    
    priority_colors = {
        "LOW": "info",
        "MEDIUM": "warning",
        "HIGH": "warning",
        "URGENT": "error"
    }
    
    priority_translations_ar = {
        "LOW": "منخفضة",
        "MEDIUM": "متوسطة",
        "HIGH": "عالية",
        "URGENT": "عاجلة"
    }
    
    priority_badge = priority_colors.get(priority, "info")
    
    if language == "ar":
        content = f"""
            <h2>تكليف بشكوى جديدة</h2>
            <p>مرحباً،</p>
            <p>تم تكليفك بمراجعة شكوى جديدة. يرجى اتخاذ الإجراء اللازم في أقرب وقت ممكن.</p>
            
            <div class="info-box info-box-blue">
                <div class="info-item"><span class="info-label">رقم الشكوى:</span> #{complaint_id}</div>
                <div class="info-item"><span class="info-label">العنوان:</span> {complaint_title}</div>
                <div class="info-item"><span class="info-label">الفئة:</span> {complaint_category}</div>
                <div class="info-item">
                    <span class="info-label">الأولوية:</span> 
                    <span class="badge badge-{priority_badge}">{priority_translations_ar.get(priority, priority)}</span>
                </div>
                <div class="info-item"><span class="info-label">مقدمة من:</span> {submitted_by}</div>
            </div>
            
            <p>يرجى مراجعة تفاصيل الشكوى واتخاذ الإجراءات المناسبة.</p>
            
            <center>
                <a href="{dashboard_url}" class="button">مراجعة الشكوى</a>
            </center>
        """
    else:
        content = f"""
            <h2>New Complaint Assignment</h2>
            <p>Hello,</p>
            <p>You have been assigned a new complaint. Please take action as soon as possible.</p>
            
            <div class="info-box info-box-blue">
                <div class="info-item"><span class="info-label">Complaint ID:</span> #{complaint_id}</div>
                <div class="info-item"><span class="info-label">Title:</span> {complaint_title}</div>
                <div class="info-item"><span class="info-label">Category:</span> {complaint_category}</div>
                <div class="info-item">
                    <span class="info-label">Priority:</span> 
                    <span class="badge badge-{priority_badge}">{priority}</span>
                </div>
                <div class="info-item"><span class="info-label">Submitted by:</span> {submitted_by}</div>
            </div>
            
            <p>Please review the complaint details and take appropriate action.</p>
            
            <center>
                <a href="{dashboard_url}" class="button">Review Complaint</a>
            </center>
        """
    
    direction = "rtl" if language == "ar" else "ltr"
    return get_base_template(content, direction, language)


def complaint_escalation_template(
    complaint_id: int,
    complaint_title: str,
    escalation_reason: str,
    escalated_from: str,
    escalated_to: str,
    dashboard_url: str,
    language: str = "ar"
) -> str:
    """Email template for complaint escalation notification."""
    
    if language == "ar":
        content = f"""
            <h2>تصعيد الشكوى</h2>
            <p>مرحباً،</p>
            <p>تم تصعيد شكواك إلى مستوى أعلى للمراجعة.</p>
            
            <div class="info-box info-box-warning">
                <div class="info-item"><span class="info-label">رقم الشكوى:</span> #{complaint_id}</div>
                <div class="info-item"><span class="info-label">العنوان:</span> {complaint_title}</div>
                <div class="info-item"><span class="info-label">سبب التصعيد:</span> {escalation_reason}</div>
                <div class="info-item"><span class="info-label">من:</span> {escalated_from}</div>
                <div class="info-item"><span class="info-label">إلى:</span> {escalated_to}</div>
            </div>
            
            <p>سيتم مراجعة شكواك من قبل اللجنة المختصة واتخاذ القرار المناسب. ستصلك إشعارات عند أي تحديث.</p>
            
            <center>
                <a href="{dashboard_url}" class="button">متابعة الشكوى</a>
            </center>
        """
    else:
        content = f"""
            <h2>Complaint Escalated</h2>
            <p>Hello,</p>
            <p>Your complaint has been escalated to a higher level for review.</p>
            
            <div class="info-box info-box-warning">
                <div class="info-item"><span class="info-label">Complaint ID:</span> #{complaint_id}</div>
                <div class="info-item"><span class="info-label">Title:</span> {complaint_title}</div>
                <div class="info-item"><span class="info-label">Escalation Reason:</span> {escalation_reason}</div>
                <div class="info-item"><span class="info-label">From:</span> {escalated_from}</div>
                <div class="info-item"><span class="info-label">To:</span> {escalated_to}</div>
            </div>
            
            <p>Your complaint will be reviewed by the relevant committee and appropriate action will be taken. You will receive notifications for any updates.</p>
            
            <center>
                <a href="{dashboard_url}" class="button">Track Complaint</a>
            </center>
        """
    
    direction = "rtl" if language == "ar" else "ltr"
    return get_base_template(content, direction, language)


def sla_warning_template(
    complaint_id: int,
    complaint_title: str,
    time_remaining: str,
    sla_deadline: str,
    dashboard_url: str,
    language: str = "ar"
) -> str:
    """Email template for SLA warning notification."""
    
    if language == "ar":
        content = f"""
            <h2>⚠️ تحذير: اقتراب الموعد النهائي</h2>
            <p>مرحباً،</p>
            <p>هذا تنبيه بأن الشكوى التالية تقترب من موعدها النهائي ويجب اتخاذ إجراء عاجل.</p>
            
            <div class="info-box info-box-error">
                <div class="info-item"><span class="info-label">رقم الشكوى:</span> #{complaint_id}</div>
                <div class="info-item"><span class="info-label">العنوان:</span> {complaint_title}</div>
                <div class="info-item">
                    <span class="info-label">الوقت المتبقي:</span> 
                    <span style="color: #dc2626; font-weight: 600;">{time_remaining}</span>
                </div>
                <div class="info-item"><span class="info-label">الموعد النهائي:</span> {sla_deadline}</div>
            </div>
            
            <p style="color: #dc2626; font-weight: 600;">يرجى اتخاذ الإجراءات اللازمة على الفور لتجنب تجاوز الموعد النهائي.</p>
            
            <center>
                <a href="{dashboard_url}" class="button">اتخاذ إجراء الآن</a>
            </center>
        """
    else:
        content = f"""
            <h2>⚠️ Warning: Approaching Deadline</h2>
            <p>Hello,</p>
            <p>This is an alert that the following complaint is approaching its deadline and requires urgent action.</p>
            
            <div class="info-box info-box-error">
                <div class="info-item"><span class="info-label">Complaint ID:</span> #{complaint_id}</div>
                <div class="info-item"><span class="info-label">Title:</span> {complaint_title}</div>
                <div class="info-item">
                    <span class="info-label">Time Remaining:</span> 
                    <span style="color: #dc2626; font-weight: 600;">{time_remaining}</span>
                </div>
                <div class="info-item"><span class="info-label">SLA Deadline:</span> {sla_deadline}</div>
            </div>
            
            <p style="color: #dc2626; font-weight: 600;">Please take necessary action immediately to avoid missing the deadline.</p>
            
            <center>
                <a href="{dashboard_url}" class="button">Take Action Now</a>
            </center>
        """
    
    direction = "rtl" if language == "ar" else "ltr"
    return get_base_template(content, direction, language)


def new_comment_template(
    complaint_id: int,
    complaint_title: str,
    commenter_name: str,
    comment_preview: str,
    dashboard_url: str,
    language: str = "ar"
) -> str:
    """Email template for new comment notification."""
    
    if language == "ar":
        content = f"""
            <h2>تعليق جديد على شكواك</h2>
            <p>مرحباً،</p>
            <p>تم إضافة تعليق جديد على شكواك.</p>
            
            <div class="info-box">
                <div class="info-item"><span class="info-label">رقم الشكوى:</span> #{complaint_id}</div>
                <div class="info-item"><span class="info-label">العنوان:</span> {complaint_title}</div>
                <div class="info-item"><span class="info-label">من:</span> {commenter_name}</div>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 3px solid #10b981;">
                <p style="font-style: italic; color: #374151; margin: 0;">"{comment_preview}"</p>
            </div>
            
            <p>يمكنك الرد على التعليق من خلال لوحة التحكم.</p>
            
            <center>
                <a href="{dashboard_url}" class="button">قراءة التعليق والرد</a>
            </center>
        """
    else:
        content = f"""
            <h2>New Comment on Your Complaint</h2>
            <p>Hello,</p>
            <p>A new comment has been added to your complaint.</p>
            
            <div class="info-box">
                <div class="info-item"><span class="info-label">Complaint ID:</span> #{complaint_id}</div>
                <div class="info-item"><span class="info-label">Title:</span> {complaint_title}</div>
                <div class="info-item"><span class="info-label">From:</span> {commenter_name}</div>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 3px solid #10b981;">
                <p style="font-style: italic; color: #374151; margin: 0;">"{comment_preview}"</p>
            </div>
            
            <p>You can reply to this comment from the dashboard.</p>
            
            <center>
                <a href="{dashboard_url}" class="button">Read and Reply</a>
            </center>
        """
    
    direction = "rtl" if language == "ar" else "ltr"
    return get_base_template(content, direction, language)


def approval_request_template(
    complaint_id: int,
    complaint_title: str,
    requester_name: str,
    requester_role: str,
    request_reason: str,
    dashboard_url: str,
    language: str = "ar"
) -> str:
    """Email template for approval request notification."""
    
    if language == "ar":
        content = f"""
            <h2>طلب موافقة جديد</h2>
            <p>مرحباً،</p>
            <p>لديك طلب موافقة جديد يحتاج إلى مراجعتك واتخاذ قرار بشأنه.</p>
            
            <div class="info-box info-box-blue">
                <div class="info-item"><span class="info-label">رقم الشكوى:</span> #{complaint_id}</div>
                <div class="info-item"><span class="info-label">العنوان:</span> {complaint_title}</div>
                <div class="info-item"><span class="info-label">طالب الموافقة:</span> {requester_name}</div>
                <div class="info-item"><span class="info-label">الصفة:</span> {requester_role}</div>
                <div class="info-item"><span class="info-label">السبب:</span> {request_reason}</div>
            </div>
            
            <p>يرجى مراجعة الطلب واتخاذ القرار المناسب (موافقة أو رفض) في أقرب وقت ممكن.</p>
            
            <center>
                <a href="{dashboard_url}" class="button">مراجعة واتخاذ قرار</a>
            </center>
        """
    else:
        content = f"""
            <h2>New Approval Request</h2>
            <p>Hello,</p>
            <p>You have a new approval request that requires your review and decision.</p>
            
            <div class="info-box info-box-blue">
                <div class="info-item"><span class="info-label">Complaint ID:</span> #{complaint_id}</div>
                <div class="info-item"><span class="info-label">Title:</span> {complaint_title}</div>
                <div class="info-item"><span class="info-label">Requested by:</span> {requester_name}</div>
                <div class="info-item"><span class="info-label">Role:</span> {requester_role}</div>
                <div class="info-item"><span class="info-label">Reason:</span> {request_reason}</div>
            </div>
            
            <p>Please review the request and make a decision (approve or reject) as soon as possible.</p>
            
            <center>
                <a href="{dashboard_url}" class="button">Review and Decide</a>
            </center>
        """
    
    direction = "rtl" if language == "ar" else "ltr"
    return get_base_template(content, direction, language)


def approval_decision_template(
    complaint_id: int,
    complaint_title: str,
    decision: str,
    approver_name: str,
    notes: Optional[str],
    dashboard_url: str,
    language: str = "ar"
) -> str:
    """Email template for approval decision notification."""
    
    is_approved = decision.lower() == "approved"
    
    if language == "ar":
        decision_text = "تمت الموافقة" if is_approved else "تم الرفض"
        box_class = "info-box" if is_approved else "info-box info-box-error"
        
        content = f"""
            <h2>قرار الموافقة: {decision_text}</h2>
            <p>مرحباً،</p>
            <p>تم اتخاذ قرار بشأن طلب الموافقة للشكوى التالية:</p>
            
            <div class="{box_class}">
                <div class="info-item"><span class="info-label">رقم الشكوى:</span> #{complaint_id}</div>
                <div class="info-item"><span class="info-label">العنوان:</span> {complaint_title}</div>
                <div class="info-item">
                    <span class="info-label">القرار:</span> 
                    <span class="badge badge-{'success' if is_approved else 'error'}">{decision_text}</span>
                </div>
                <div class="info-item"><span class="info-label">بواسطة:</span> {approver_name}</div>
                {f'<div class="info-item"><span class="info-label">ملاحظات:</span> {notes}</div>' if notes else ''}
            </div>
            
            <p>يمكنك متابعة الشكوى ومعرفة المزيد من التفاصيل من خلال لوحة التحكم.</p>
            
            <center>
                <a href="{dashboard_url}" class="button">عرض التفاصيل</a>
            </center>
        """
    else:
        decision_text = "Approved" if is_approved else "Rejected"
        box_class = "info-box" if is_approved else "info-box info-box-error"
        
        content = f"""
            <h2>Approval Decision: {decision_text}</h2>
            <p>Hello,</p>
            <p>A decision has been made regarding the approval request for the following complaint:</p>
            
            <div class="{box_class}">
                <div class="info-item"><span class="info-label">Complaint ID:</span> #{complaint_id}</div>
                <div class="info-item"><span class="info-label">Title:</span> {complaint_title}</div>
                <div class="info-item">
                    <span class="info-label">Decision:</span> 
                    <span class="badge badge-{'success' if is_approved else 'error'}">{decision_text}</span>
                </div>
                <div class="info-item"><span class="info-label">By:</span> {approver_name}</div>
                {f'<div class="info-item"><span class="info-label">Notes:</span> {notes}</div>' if notes else ''}
            </div>
            
            <p>You can track the complaint and view more details from the dashboard.</p>
            
            <center>
                <a href="{dashboard_url}" class="button">View Details</a>
            </center>
        """
    
    direction = "rtl" if language == "ar" else "ltr"
    return get_base_template(content, direction, language)


def welcome_template(
    user_name: str,
    user_email: str,
    dashboard_url: str,
    language: str = "ar"
) -> str:
    """Email template for welcome message to new users."""
    
    if language == "ar":
        content = f"""
            <h2>مرحباً بك في نظام إدارة الشكاوى!</h2>
            <p>عزيزي/عزيزتي {user_name}،</p>
            <p>نرحب بك في نظام إدارة الشكاوى الخاص باللجنة. تم إنشاء حسابك بنجاح.</p>
            
            <div class="info-box">
                <div class="info-item"><span class="info-label">البريد الإلكتروني:</span> {user_email}</div>
                <div class="info-item"><span class="info-label">تاريخ الانضمام:</span> {datetime.now().strftime("%Y-%m-%d")}</div>
            </div>
            
            <p>يمكنك الآن:</p>
            <ul style="color: #4b5563; line-height: 1.8;">
                <li>تقديم شكاوى جديدة</li>
                <li>متابعة حالة شكاواك</li>
                <li>التواصل مع اللجان المختصة</li>
                <li>تلقي إشعارات فورية</li>
            </ul>
            
            <center>
                <a href="{dashboard_url}" class="button">الذهاب إلى لوحة التحكم</a>
            </center>
            
            <div class="divider"></div>
            <p style="font-size: 13px; color: #6b7280;">إذا كنت بحاجة إلى أي مساعدة، لا تتردد في التواصل معنا.</p>
        """
    else:
        content = f"""
            <h2>Welcome to the Complaint Management System!</h2>
            <p>Dear {user_name},</p>
            <p>Welcome to the Allajnah Complaint Management System. Your account has been successfully created.</p>
            
            <div class="info-box">
                <div class="info-item"><span class="info-label">Email:</span> {user_email}</div>
                <div class="info-item"><span class="info-label">Join Date:</span> {datetime.now().strftime("%Y-%m-%d")}</div>
            </div>
            
            <p>You can now:</p>
            <ul style="color: #4b5563; line-height: 1.8;">
                <li>Submit new complaints</li>
                <li>Track your complaint status</li>
                <li>Communicate with relevant committees</li>
                <li>Receive instant notifications</li>
            </ul>
            
            <center>
                <a href="{dashboard_url}" class="button">Go to Dashboard</a>
            </center>
            
            <div class="divider"></div>
            <p style="font-size: 13px; color: #6b7280;">If you need any assistance, don't hesitate to contact us.</p>
        """
    
    direction = "rtl" if language == "ar" else "ltr"
    return get_base_template(content, direction, language)


def payment_approval_template(
    user_name: str,
    payment_amount: float,
    subscription_end_date: str,
    approved: bool,
    rejection_reason: Optional[str],
    dashboard_url: str,
    language: str = "ar"
) -> str:
    """Email template for payment approval/rejection notification."""
    
    if language == "ar":
        if approved:
            content = f"""
                <h2>✅ تمت الموافقة على الدفع</h2>
                <p>عزيزي/عزيزتي {user_name}،</p>
                <p>يسعدنا إبلاغك بأنه تمت الموافقة على دفعتك وتفعيل اشتراكك.</p>
                
                <div class="info-box">
                    <div class="info-item"><span class="info-label">المبلغ:</span> {payment_amount} ريال</div>
                    <div class="info-item"><span class="info-label">حالة الاشتراك:</span> <span class="badge badge-success">نشط</span></div>
                    <div class="info-item"><span class="info-label">تاريخ الانتهاء:</span> {subscription_end_date}</div>
                </div>
                
                <p>يمكنك الآن الاستفادة من جميع خدمات النظام وتقديم الشكاوى.</p>
                
                <center>
                    <a href="{dashboard_url}" class="button">تقديم شكوى جديدة</a>
                </center>
            """
        else:
            content = f"""
                <h2>❌ تم رفض الدفع</h2>
                <p>عزيزي/عزيزتي {user_name}،</p>
                <p>نأسف لإبلاغك بأنه لم يتم قبول دفعتك.</p>
                
                <div class="info-box info-box-error">
                    <div class="info-item"><span class="info-label">المبلغ:</span> {payment_amount} ريال</div>
                    <div class="info-item"><span class="info-label">الحالة:</span> <span class="badge badge-error">مرفوض</span></div>
                    {f'<div class="info-item"><span class="info-label">السبب:</span> {rejection_reason}</div>' if rejection_reason else ''}
                </div>
                
                <p>يرجى التواصل معنا لمزيد من المعلومات أو إعادة تقديم الدفع.</p>
                
                <center>
                    <a href="{dashboard_url}" class="button">التواصل مع الدعم</a>
                </center>
            """
    else:
        if approved:
            content = f"""
                <h2>✅ Payment Approved</h2>
                <p>Dear {user_name},</p>
                <p>We are pleased to inform you that your payment has been approved and your subscription is now active.</p>
                
                <div class="info-box">
                    <div class="info-item"><span class="info-label">Amount:</span> {payment_amount} SAR</div>
                    <div class="info-item"><span class="info-label">Subscription Status:</span> <span class="badge badge-success">Active</span></div>
                    <div class="info-item"><span class="info-label">End Date:</span> {subscription_end_date}</div>
                </div>
                
                <p>You can now use all system services and submit complaints.</p>
                
                <center>
                    <a href="{dashboard_url}" class="button">Submit New Complaint</a>
                </center>
            """
        else:
            content = f"""
                <h2>❌ Payment Rejected</h2>
                <p>Dear {user_name},</p>
                <p>We regret to inform you that your payment has not been accepted.</p>
                
                <div class="info-box info-box-error">
                    <div class="info-item"><span class="info-label">Amount:</span> {payment_amount} SAR</div>
                    <div class="info-item"><span class="info-label">Status:</span> <span class="badge badge-error">Rejected</span></div>
                    {f'<div class="info-item"><span class="info-label">Reason:</span> {rejection_reason}</div>' if rejection_reason else ''}
                </div>
                
                <p>Please contact us for more information or to resubmit your payment.</p>
                
                <center>
                    <a href="{dashboard_url}" class="button">Contact Support</a>
                </center>
            """
    
    direction = "rtl" if language == "ar" else "ltr"
    return get_base_template(content, direction, language)
