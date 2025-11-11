from typing import Optional, List
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from twilio.rest import Client
from config import get_settings
from replit_connectors import get_twilio_credentials, get_sendgrid_credentials
from sqlalchemy.orm import Session
from sqlalchemy import or_
from models import NotificationPreference
import email_templates as templates

settings = get_settings()


class NotificationService:
    def __init__(self):
        self.twilio_credentials = None
        self.sendgrid_credentials = None
    
    def _get_user_preferences(self, db: Session, user_id: int) -> NotificationPreference:
        prefs = db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id
        ).first()
        if not prefs:
            prefs = NotificationPreference(
                user_id=user_id,
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
            db.add(prefs)
            db.commit()
            db.refresh(prefs)
        return prefs
    
    async def _get_sendgrid_client(self):
        try:
            creds = await get_sendgrid_credentials()
            return SendGridAPIClient(creds["api_key"]), creds["from_email"]
        except Exception as e:
            print(f"Failed to get SendGrid credentials: {e}")
            return None, None
    
    async def _get_twilio_client(self):
        try:
            creds = await get_twilio_credentials()
            client = Client(creds["api_key"], creds["api_key_secret"], creds["account_sid"])
            return client, creds["phone_number"]
        except Exception as e:
            print(f"Failed to get Twilio credentials: {e}")
            return None, None
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str] = None
    ) -> bool:
        sendgrid_client, from_email = await self._get_sendgrid_client()
        if not sendgrid_client:
            print("SendGrid not configured, skipping email")
            return False
        
        try:
            message = Mail(
                from_email=Email(from_email),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            if plain_content:
                message.content = [
                    Content("text/plain", plain_content),
                    Content("text/html", html_content)
                ]
            
            response = sendgrid_client.send(message)
            return response.status_code == 202
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    
    async def send_sms(self, to_phone: str, message: str) -> bool:
        twilio_client, from_phone = await self._get_twilio_client()
        if not twilio_client:
            print("Twilio not configured, skipping SMS")
            return False
        
        try:
            result = twilio_client.messages.create(
                body=message,
                from_=from_phone,
                to=to_phone
            )
            return result.sid is not None
        except Exception as e:
            print(f"Error sending SMS: {e}")
            return False
    
    async def send_complaint_status_update(
        self,
        db: Session,
        user_id: int,
        user_email: str,
        user_phone: Optional[str],
        complaint_id: int,
        complaint_title: str,
        old_status: str,
        new_status: str,
        updated_by: str,
        dashboard_url: str = "https://allajnah.com/dashboard",
        language: str = "ar"
    ):
        prefs = self._get_user_preferences(db, user_id)
        
        if not prefs.notify_status_change:
            return False
        
        status_translations_ar = {
            "SUBMITTED": "مقدمة",
            "UNDER_REVIEW": "قيد المراجعة",
            "ESCALATED": "مصعدة",
            "RESOLVED": "محلولة",
            "REJECTED": "مرفوضة",
            "MEDIATION_PENDING": "في انتظار الوساطة",
            "MEDIATION_IN_PROGRESS": "جاري الوساطة"
        }
        
        if language == "ar":
            email_subject = f"تحديث حالة الشكوى #{complaint_id}"
            email_body = templates.complaint_status_update_template(
                complaint_id=complaint_id,
                complaint_title=complaint_title,
                old_status=old_status,
                new_status=new_status,
                updated_by=updated_by,
                dashboard_url=dashboard_url,
                language=language
            )
            status_ar = status_translations_ar.get(new_status, new_status)
            sms_message = f"تحديث الشكوى #{complaint_id}: الحالة الجديدة {status_ar}"
        else:
            email_subject = f"Complaint #{complaint_id} Status Update"
            email_body = templates.complaint_status_update_template(
                complaint_id=complaint_id,
                complaint_title=complaint_title,
                old_status=old_status,
                new_status=new_status,
                updated_by=updated_by,
                dashboard_url=dashboard_url,
                language=language
            )
            status_en_readable = new_status.replace('_', ' ').title()
            sms_message = f"Complaint #{complaint_id} update: {status_en_readable}"
        
        email_sent = False
        sms_sent = False
        
        if prefs.email_enabled:
            email_sent = await self.send_email(user_email, email_subject, email_body)
        
        if prefs.sms_enabled and user_phone:
            sms_sent = await self.send_sms(user_phone, sms_message)
        
        return email_sent or sms_sent
    
    async def send_assignment_notification(
        self,
        db: Session,
        user_id: int,
        user_email: str,
        user_phone: Optional[str],
        complaint_id: int,
        complaint_title: str,
        complaint_category: str,
        priority: str,
        submitted_by: str,
        dashboard_url: str = "https://allajnah.com/dashboard",
        language: str = "ar"
    ):
        prefs = self._get_user_preferences(db, user_id)
        
        if not prefs.notify_assignment:
            return False
        
        if language == "ar":
            subject = f"تم تكليفك بشكوى جديدة #{complaint_id}"
            body = templates.complaint_assignment_template(
                complaint_id=complaint_id,
                complaint_title=complaint_title,
                complaint_category=complaint_category,
                priority=priority,
                submitted_by=submitted_by,
                dashboard_url=dashboard_url,
                language=language
            )
            sms = f"تم تكليفك بالشكوى #{complaint_id}. يرجى المراجعة."
        else:
            subject = f"New Complaint Assigned #{complaint_id}"
            body = templates.complaint_assignment_template(
                complaint_id=complaint_id,
                complaint_title=complaint_title,
                complaint_category=complaint_category,
                priority=priority,
                submitted_by=submitted_by,
                dashboard_url=dashboard_url,
                language=language
            )
            sms = f"New complaint #{complaint_id} assigned to you. Please review."
        
        email_sent = False
        sms_sent = False
        
        if prefs.email_enabled:
            email_sent = await self.send_email(user_email, subject, body)
        
        if prefs.sms_enabled and user_phone:
            sms_sent = await self.send_sms(user_phone, sms)
        
        return email_sent or sms_sent
    
    async def send_approval_request_notification(
        self,
        db: Session,
        user_id: int,
        user_email: str,
        user_phone: Optional[str],
        complaint_id: int,
        complaint_title: str,
        requester_name: str,
        requester_role: str,
        request_reason: str,
        dashboard_url: str = "https://allajnah.com/dashboard",
        language: str = "ar"
    ):
        prefs = self._get_user_preferences(db, user_id)
        
        if not prefs.notify_approval_request:
            return False
        
        if language == "ar":
            subject = f"طلب موافقة جديد للشكوى #{complaint_id}"
            body = templates.approval_request_template(
                complaint_id=complaint_id,
                complaint_title=complaint_title,
                requester_name=requester_name,
                requester_role=requester_role,
                request_reason=request_reason,
                dashboard_url=dashboard_url,
                language=language
            )
            sms = f"طلب موافقة جديد للشكوى #{complaint_id} من {requester_name}"
        else:
            subject = f"New Approval Request for Complaint #{complaint_id}"
            body = templates.approval_request_template(
                complaint_id=complaint_id,
                complaint_title=complaint_title,
                requester_name=requester_name,
                requester_role=requester_role,
                request_reason=request_reason,
                dashboard_url=dashboard_url,
                language=language
            )
            sms = f"New approval request for complaint #{complaint_id} from {requester_name}"
        
        email_sent = False
        sms_sent = False
        
        if prefs.email_enabled:
            email_sent = await self.send_email(user_email, subject, body)
        
        if prefs.sms_enabled and user_phone:
            sms_sent = await self.send_sms(user_phone, sms)
        
        return email_sent or sms_sent
    
    async def send_approval_decision_notification(
        self,
        db: Session,
        user_id: int,
        user_email: str,
        user_phone: Optional[str],
        complaint_id: int,
        complaint_title: str,
        decision: str,
        approver_name: str,
        notes: Optional[str] = None,
        dashboard_url: str = "https://allajnah.com/dashboard",
        language: str = "ar"
    ):
        prefs = self._get_user_preferences(db, user_id)
        
        if not prefs.notify_approval_decision:
            return False
        
        decision_ar = "موافق عليها" if decision == "approved" else "مرفوضة"
        decision_en = "Approved" if decision == "approved" else "Rejected"
        
        if language == "ar":
            subject = f"قرار الموافقة للشكوى #{complaint_id}: {decision_ar}"
            body = templates.approval_decision_template(
                complaint_id=complaint_id,
                complaint_title=complaint_title,
                decision=decision,
                approver_name=approver_name,
                notes=notes,
                dashboard_url=dashboard_url,
                language=language
            )
            sms = f"الشكوى #{complaint_id}: {decision_ar} بواسطة {approver_name}"
        else:
            subject = f"Approval Decision for Complaint #{complaint_id}: {decision_en}"
            body = templates.approval_decision_template(
                complaint_id=complaint_id,
                complaint_title=complaint_title,
                decision=decision,
                approver_name=approver_name,
                notes=notes,
                dashboard_url=dashboard_url,
                language=language
            )
            sms = f"Complaint #{complaint_id}: {decision_en} by {approver_name}"
        
        email_sent = False
        sms_sent = False
        
        if prefs.email_enabled:
            email_sent = await self.send_email(user_email, subject, body)
        
        if prefs.sms_enabled and user_phone:
            sms_sent = await self.send_sms(user_phone, sms)
        
        return email_sent or sms_sent
    
    async def send_task_notification(
        self,
        db: Session,
        user_id: int,
        user_email: str,
        user_phone: Optional[str],
        complaint_id: int,
        task_action: str,
        language: str = "ar"
    ):
        prefs = self._get_user_preferences(db, user_id)
        
        if not prefs.notify_assignment:
            return False
        
        action_ar_map = {
            "accepted": "تم قبول المهمة",
            "rejected": "تم رفض المهمة",
            "started": "بدء العمل على المهمة",
            "released": "تم إلغاء المطالبة بالمهمة"
        }
        action_en_map = {
            "accepted": "Task Accepted",
            "rejected": "Task Rejected",
            "started": "Work Started",
            "released": "Task Released"
        }
        
        if language == "ar":
            action_text = action_ar_map.get(task_action, task_action)
            subject = f"تحديث مهمة الشكوى #{complaint_id}"
            body = f"""
            <html dir="rtl">
                <body>
                    <h2>تحديث المهمة</h2>
                    <p>الشكوى رقم <strong>#{complaint_id}</strong></p>
                    <p>الإجراء: <strong>{action_text}</strong></p>
                    <p>يرجى مراجعة المهمة من خلال لوحة التحكم.</p>
                </body>
            </html>
            """
            sms = f"الشكوى #{complaint_id}: {action_text}"
        else:
            action_text = action_en_map.get(task_action, task_action)
            subject = f"Task Update for Complaint #{complaint_id}"
            body = f"""
            <html>
                <body>
                    <h2>Task Update</h2>
                    <p>Complaint <strong>#{complaint_id}</strong></p>
                    <p>Action: <strong>{action_text}</strong></p>
                    <p>Please review the task from the dashboard.</p>
                </body>
            </html>
            """
            sms = f"Complaint #{complaint_id}: {action_text}"
        
        email_sent = False
        sms_sent = False
        
        if prefs.email_enabled:
            email_sent = await self.send_email(user_email, subject, body)
        
        if prefs.sms_enabled and user_phone:
            sms_sent = await self.send_sms(user_phone, sms)
        
        return email_sent or sms_sent
    
    async def send_comment_notification(
        self,
        db: Session,
        user_id: int,
        user_email: str,
        user_phone: Optional[str],
        complaint_id: int,
        complaint_title: str,
        commenter_name: str,
        comment_preview: str,
        dashboard_url: str = "https://allajnah.com/dashboard",
        language: str = "ar"
    ):
        """Send notification when a new comment is added to a complaint."""
        prefs = self._get_user_preferences(db, user_id)
        
        if not prefs.notify_comment:
            return False
        
        # Truncate comment preview to 100 characters
        preview = comment_preview[:100] + "..." if len(comment_preview) > 100 else comment_preview
        
        if language == "ar":
            subject = f"تعليق جديد على الشكوى #{complaint_id}"
            body = templates.new_comment_template(
                complaint_id=complaint_id,
                complaint_title=complaint_title,
                commenter_name=commenter_name,
                comment_preview=preview,
                dashboard_url=dashboard_url,
                language=language
            )
            sms = f"تعليق جديد على الشكوى #{complaint_id} من {commenter_name}"
        else:
            subject = f"New Comment on Complaint #{complaint_id}"
            body = templates.new_comment_template(
                complaint_id=complaint_id,
                complaint_title=complaint_title,
                commenter_name=commenter_name,
                comment_preview=preview,
                dashboard_url=dashboard_url,
                language=language
            )
            sms = f"New comment on complaint #{complaint_id} from {commenter_name}"
        
        email_sent = False
        sms_sent = False
        
        if prefs.email_enabled:
            email_sent = await self.send_email(user_email, subject, body)
        
        if prefs.sms_enabled and user_phone:
            sms_sent = await self.send_sms(user_phone, sms)
        
        return email_sent or sms_sent
    
    async def send_escalation_notification(
        self,
        db: Session,
        user_id: int,
        user_email: str,
        user_phone: Optional[str],
        complaint_id: int,
        complaint_title: str,
        escalation_reason: str,
        escalated_from: str,
        escalated_to: str,
        dashboard_url: str = "https://allajnah.com/dashboard",
        language: str = "ar"
    ):
        """Send notification when a complaint is escalated to Higher Committee."""
        prefs = self._get_user_preferences(db, user_id)
        
        if not prefs.notify_escalation:
            return False
        
        if language == "ar":
            subject = f"تم تصعيد الشكوى #{complaint_id} للجنة العليا"
            body = templates.complaint_escalation_template(
                complaint_id=complaint_id,
                complaint_title=complaint_title,
                escalation_reason=escalation_reason,
                escalated_from=escalated_from,
                escalated_to=escalated_to,
                dashboard_url=dashboard_url,
                language=language
            )
            sms = f"تم تصعيد الشكوى #{complaint_id} للجنة العليا"
        else:
            subject = f"Complaint #{complaint_id} Escalated to Higher Committee"
            body = templates.complaint_escalation_template(
                complaint_id=complaint_id,
                complaint_title=complaint_title,
                escalation_reason=escalation_reason,
                escalated_from=escalated_from,
                escalated_to=escalated_to,
                dashboard_url=dashboard_url,
                language=language
            )
            sms = f"Complaint #{complaint_id} escalated to Higher Committee"
        
        email_sent = False
        sms_sent = False
        
        if prefs.email_enabled:
            email_sent = await self.send_email(user_email, subject, body)
        
        if prefs.sms_enabled and user_phone:
            sms_sent = await self.send_sms(user_phone, sms)
        
        return email_sent or sms_sent
    
    async def send_sla_warning_notification(
        self,
        db: Session,
        user_id: int,
        user_email: str,
        user_phone: Optional[str],
        complaint_id: int,
        complaint_title: str,
        time_remaining: str,
        sla_deadline: str,
        dashboard_url: str = "https://allajnah.com/dashboard",
        language: str = "ar"
    ):
        """Send notification when a complaint is approaching its SLA deadline."""
        prefs = self._get_user_preferences(db, user_id)
        
        if not prefs.notify_sla_warning:
            return False
        
        if language == "ar":
            subject = f"تحذير: الشكوى #{complaint_id} تقترب من الموعد النهائي"
            body = templates.sla_warning_template(
                complaint_id=complaint_id,
                complaint_title=complaint_title,
                time_remaining=time_remaining,
                sla_deadline=sla_deadline,
                dashboard_url=dashboard_url,
                language=language
            )
            sms = f"تحذير: الشكوى #{complaint_id} تقترب من الموعد النهائي. الوقت المتبقي: {time_remaining}"
        else:
            subject = f"Warning: Complaint #{complaint_id} Approaching Deadline"
            body = templates.sla_warning_template(
                complaint_id=complaint_id,
                complaint_title=complaint_title,
                time_remaining=time_remaining,
                sla_deadline=sla_deadline,
                dashboard_url=dashboard_url,
                language=language
            )
            sms = f"Warning: Complaint #{complaint_id} approaching deadline. Time remaining: {time_remaining}"
        
        email_sent = False
        sms_sent = False
        
        if prefs.email_enabled:
            email_sent = await self.send_email(user_email, subject, body)
        
        if prefs.sms_enabled and user_phone:
            sms_sent = await self.send_sms(user_phone, sms)
        
        return email_sent or sms_sent
    
    async def notify_committees_new_payment(self, db, payment_id: int, trader):
        from models import User, UserRole
        
        committees = db.query(User).filter(
            or_(User.role == UserRole.TECHNICAL_COMMITTEE, User.role == UserRole.HIGHER_COMMITTEE),
            User.is_active == True
        ).all()
        
        for committee_user in committees:
            subject_ar = f"طلب اشتراك جديد #{payment_id}"
            subject_en = f"New Subscription Request #{payment_id}"
            
            body_ar = f"""
            <html>
                <body style="direction: rtl; text-align: right;">
                    <h2>طلب اشتراك جديد</h2>
                    <p>تم تقديم طلب اشتراك جديد من قبل التاجر: <strong>{trader.first_name} {trader.last_name}</strong></p>
                    <p>رقم الطلب: <strong>#{payment_id}</strong></p>
                    <p>يرجى مراجعة الطلب في لوحة التحكم.</p>
                </body>
            </html>
            """
            
            body_en = f"""
            <html>
                <body>
                    <h2>New Subscription Request</h2>
                    <p>A new subscription request has been submitted by trader: <strong>{trader.first_name} {trader.last_name}</strong></p>
                    <p>Request ID: <strong>#{payment_id}</strong></p>
                    <p>Please review the request in your dashboard.</p>
                </body>
            </html>
            """
            
            sms_ar = f"طلب اشتراك جديد #{payment_id} من {trader.first_name} {trader.last_name}"
            sms_en = f"New subscription request #{payment_id} from {trader.first_name} {trader.last_name}"
            
            prefs = db.query(NotificationPreference).filter(
                NotificationPreference.user_id == committee_user.id
            ).first()
            
            if not prefs:
                continue
            
            if prefs.email_enabled:
                await self.send_email(committee_user.email, subject_ar, body_ar)
            
            if prefs.sms_enabled and committee_user.phone:
                await self.send_sms(committee_user.phone, sms_ar)
    
    async def send_payment_decision_notification(
        self, db, user_id: int, user_email: str, user_phone: Optional[str],
        payment_id: int, payment_amount: float, decision: str, notes: Optional[str] = None, 
        dashboard_url: str = "https://allajnah.com/dashboard", language: str = "ar"
    ) -> bool:
        from models import NotificationPreference, User
        
        prefs = db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id
        ).first()
        
        if not prefs:
            return False
        
        user = db.query(User).filter(User.id == user_id).first()
        user_name = f"{user.first_name} {user.last_name}" if user else "المستخدم"
        
        decision_ar = "تمت الموافقة" if decision == "approved" else "تم الرفض"
        decision_en = "Approved" if decision == "approved" else "Rejected"
        
        if language == "ar":
            subject = f"قرار طلب الاشتراك #{payment_id}: {decision_ar}"
            body = templates.payment_decision_template(
                user_name=user_name,
                payment_id=payment_id,
                payment_amount=payment_amount,
                decision=decision,
                notes=notes,
                dashboard_url=dashboard_url,
                language=language
            )
            sms = f"طلب الاشتراك #{payment_id}: {decision_ar}"
        else:
            subject = f"Subscription Request #{payment_id}: {decision_en}"
            body = templates.payment_decision_template(
                user_name=user_name,
                payment_id=payment_id,
                payment_amount=payment_amount,
                decision=decision,
                notes=notes,
                dashboard_url=dashboard_url,
                language=language
            )
            sms = f"Subscription request #{payment_id}: {decision_en}"
        
        email_sent = False
        sms_sent = False
        
        if prefs.email_enabled == True:
            email_sent = await self.send_email(user_email, subject, body)
        
        if prefs.sms_enabled == True and user_phone:
            sms_sent = await self.send_sms(user_phone, sms)
        
        return email_sent or sms_sent
    
    async def create_in_app_notification(
        self,
        db: Session,
        user_id: int,
        notification_type: str,
        title_ar: str,
        title_en: str,
        message_ar: str,
        message_en: str,
        related_complaint_id: Optional[int] = None,
        related_user_id: Optional[int] = None,
        related_payment_id: Optional[int] = None,
        action_url: Optional[str] = None
    ):
        from models import Notification, NotificationType
        from websocket_manager import manager
        
        notification = Notification(
            user_id=user_id,
            type=NotificationType(notification_type),
            title_ar=title_ar,
            title_en=title_en,
            message_ar=message_ar,
            message_en=message_en,
            related_complaint_id=related_complaint_id,
            related_user_id=related_user_id,
            related_payment_id=related_payment_id,
            action_url=action_url
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        await manager.send_personal_message({
            "type": "notification",
            "data": {
                "id": notification.id,
                "type": notification.type.value,
                "title_ar": notification.title_ar,
                "title_en": notification.title_en,
                "message_ar": notification.message_ar,
                "message_en": notification.message_en,
                "is_read": notification.is_read,
                "related_complaint_id": notification.related_complaint_id,
                "related_user_id": notification.related_user_id,
                "related_payment_id": notification.related_payment_id,
                "action_url": notification.action_url,
                "created_at": notification.created_at.isoformat()
            }
        }, user_id)
        
        return notification
    
    def get_user_notifications(
        self,
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 20,
        unread_only: bool = False
    ):
        from models import Notification
        
        query = db.query(Notification).filter(Notification.user_id == user_id)
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        total = query.count()
        notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
        
        unread_count = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()
        
        return {
            "total": total,
            "unread_count": unread_count,
            "notifications": notifications
        }
    
    def mark_notification_as_read(self, db: Session, notification_id: int, user_id: int):
        from models import Notification
        from datetime import datetime
        
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            db.commit()
            db.refresh(notification)
        
        return notification
    
    def mark_all_as_read(self, db: Session, user_id: int):
        from models import Notification
        from datetime import datetime
        
        notifications = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).all()
        
        for notification in notifications:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
        
        db.commit()
        
        return len(notifications)
    
    def delete_notification(self, db: Session, notification_id: int, user_id: int):
        from models import Notification
        
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            db.delete(notification)
            db.commit()
            return True
        
        return False
    
    def get_unread_count(self, db: Session, user_id: int) -> int:
        from models import Notification
        
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()


notification_service = NotificationService()
