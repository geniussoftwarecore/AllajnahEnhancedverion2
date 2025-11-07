from typing import Optional, List
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from twilio.rest import Client
from config import get_settings
from replit_connectors import get_twilio_credentials, get_sendgrid_credentials
from sqlalchemy.orm import Session
from sqlalchemy import or_
from models import NotificationPreference

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
        new_status: str,
        language: str = "ar"
    ):
        prefs = self._get_user_preferences(db, user_id)
        
        if not prefs.notify_status_change:
            return False
        
        if language == "ar":
            email_subject = f"تحديث حالة الشكوى #{complaint_id}"
            email_body = f"""
            <html dir="rtl">
                <body>
                    <h2>تحديث حالة الشكوى</h2>
                    <p>تم تحديث حالة شكواك رقم <strong>#{complaint_id}</strong></p>
                    <p>الحالة الجديدة: <strong>{new_status}</strong></p>
                    <p>يمكنك متابعة شكواك من خلال لوحة التحكم.</p>
                </body>
            </html>
            """
            sms_message = f"تحديث الشكوى #{complaint_id}: الحالة الجديدة {new_status}"
        else:
            email_subject = f"Complaint #{complaint_id} Status Update"
            email_body = f"""
            <html>
                <body>
                    <h2>Complaint Status Update</h2>
                    <p>Your complaint <strong>#{complaint_id}</strong> has been updated</p>
                    <p>New status: <strong>{new_status}</strong></p>
                    <p>You can track your complaint from the dashboard.</p>
                </body>
            </html>
            """
            sms_message = f"Complaint #{complaint_id} update: {new_status}"
        
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
        language: str = "ar"
    ):
        prefs = self._get_user_preferences(db, user_id)
        
        if not prefs.notify_assignment:
            return False
        
        if language == "ar":
            subject = f"تم تكليفك بشكوى جديدة #{complaint_id}"
            body = f"""
            <html dir="rtl">
                <body>
                    <h2>شكوى جديدة</h2>
                    <p>تم تكليفك بمراجعة الشكوى رقم <strong>#{complaint_id}</strong></p>
                    <p>يرجى مراجعتها من خلال لوحة التحكم.</p>
                </body>
            </html>
            """
            sms = f"تم تكليفك بالشكوى #{complaint_id}. يرجى المراجعة."
        else:
            subject = f"New Complaint Assigned #{complaint_id}"
            body = f"""
            <html>
                <body>
                    <h2>New Complaint Assignment</h2>
                    <p>You have been assigned to complaint <strong>#{complaint_id}</strong></p>
                    <p>Please review it from the dashboard.</p>
                </body>
            </html>
            """
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
        requester_name: str,
        language: str = "ar"
    ):
        prefs = self._get_user_preferences(db, user_id)
        
        if not prefs.notify_approval_request:
            return False
        
        if language == "ar":
            subject = f"طلب موافقة جديد للشكوى #{complaint_id}"
            body = f"""
            <html dir="rtl">
                <body>
                    <h2>طلب موافقة جديد</h2>
                    <p>تم تصعيد الشكوى رقم <strong>#{complaint_id}</strong> وتحتاج موافقتك</p>
                    <p>طالب الموافقة: <strong>{requester_name}</strong></p>
                    <p>يرجى مراجعة الطلب واتخاذ القرار المناسب من خلال لوحة التحكم.</p>
                </body>
            </html>
            """
            sms = f"طلب موافقة جديد للشكوى #{complaint_id} من {requester_name}"
        else:
            subject = f"New Approval Request for Complaint #{complaint_id}"
            body = f"""
            <html>
                <body>
                    <h2>New Approval Request</h2>
                    <p>Complaint <strong>#{complaint_id}</strong> has been escalated and requires your approval</p>
                    <p>Requested by: <strong>{requester_name}</strong></p>
                    <p>Please review and make a decision from the dashboard.</p>
                </body>
            </html>
            """
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
        decision: str,
        approver_name: str,
        notes: Optional[str] = None,
        language: str = "ar"
    ):
        prefs = self._get_user_preferences(db, user_id)
        
        if not prefs.notify_approval_decision:
            return False
        
        decision_ar = "موافق عليها" if decision == "approved" else "مرفوضة"
        decision_en = "Approved" if decision == "approved" else "Rejected"
        
        if language == "ar":
            subject = f"قرار الموافقة للشكوى #{complaint_id}: {decision_ar}"
            body = f"""
            <html dir="rtl">
                <body>
                    <h2>قرار الموافقة</h2>
                    <p>تم اتخاذ قرار بشأن الشكوى رقم <strong>#{complaint_id}</strong></p>
                    <p>القرار: <strong>{decision_ar}</strong></p>
                    <p>بواسطة: <strong>{approver_name}</strong></p>
                    {f'<p>ملاحظات: {notes}</p>' if notes else ''}
                    <p>يمكنك متابعة الشكوى من خلال لوحة التحكم.</p>
                </body>
            </html>
            """
            sms = f"الشكوى #{complaint_id}: {decision_ar} بواسطة {approver_name}"
        else:
            subject = f"Approval Decision for Complaint #{complaint_id}: {decision_en}"
            body = f"""
            <html>
                <body>
                    <h2>Approval Decision</h2>
                    <p>A decision has been made for complaint <strong>#{complaint_id}</strong></p>
                    <p>Decision: <strong>{decision_en}</strong></p>
                    <p>By: <strong>{approver_name}</strong></p>
                    {f'<p>Notes: {notes}</p>' if notes else ''}
                    <p>You can track the complaint from the dashboard.</p>
                </body>
            </html>
            """
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
        commenter_name: str,
        comment_preview: str,
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
            body = f"""
            <html dir="rtl">
                <body>
                    <h2>تعليق جديد</h2>
                    <p>تم إضافة تعليق جديد على الشكوى رقم <strong>#{complaint_id}</strong></p>
                    <p>من: <strong>{commenter_name}</strong></p>
                    <p>التعليق: <em>{preview}</em></p>
                    <p>يمكنك مراجعة التعليق الكامل من خلال لوحة التحكم.</p>
                </body>
            </html>
            """
            sms = f"تعليق جديد على الشكوى #{complaint_id} من {commenter_name}"
        else:
            subject = f"New Comment on Complaint #{complaint_id}"
            body = f"""
            <html>
                <body>
                    <h2>New Comment</h2>
                    <p>A new comment has been added to complaint <strong>#{complaint_id}</strong></p>
                    <p>From: <strong>{commenter_name}</strong></p>
                    <p>Comment: <em>{preview}</em></p>
                    <p>You can view the full comment from the dashboard.</p>
                </body>
            </html>
            """
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
        escalation_reason: str,
        language: str = "ar"
    ):
        """Send notification when a complaint is escalated to Higher Committee."""
        prefs = self._get_user_preferences(db, user_id)
        
        if not prefs.notify_escalation:
            return False
        
        if language == "ar":
            subject = f"تم تصعيد الشكوى #{complaint_id} للجنة العليا"
            body = f"""
            <html dir="rtl">
                <body>
                    <h2>تصعيد الشكوى</h2>
                    <p>تم تصعيد الشكوى رقم <strong>#{complaint_id}</strong> إلى اللجنة العليا</p>
                    <p>سبب التصعيد: <strong>{escalation_reason}</strong></p>
                    <p>سيتم مراجعة الشكوى من قبل اللجنة العليا واتخاذ القرار المناسب.</p>
                    <p>يمكنك متابعة حالة الشكوى من خلال لوحة التحكم.</p>
                </body>
            </html>
            """
            sms = f"تم تصعيد الشكوى #{complaint_id} للجنة العليا"
        else:
            subject = f"Complaint #{complaint_id} Escalated to Higher Committee"
            body = f"""
            <html>
                <body>
                    <h2>Complaint Escalated</h2>
                    <p>Complaint <strong>#{complaint_id}</strong> has been escalated to the Higher Committee</p>
                    <p>Escalation reason: <strong>{escalation_reason}</strong></p>
                    <p>The complaint will be reviewed by the Higher Committee and appropriate action will be taken.</p>
                    <p>You can track the complaint status from the dashboard.</p>
                </body>
            </html>
            """
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
        time_remaining: str,
        sla_deadline: str,
        language: str = "ar"
    ):
        """Send notification when a complaint is approaching its SLA deadline."""
        prefs = self._get_user_preferences(db, user_id)
        
        if not prefs.notify_sla_warning:
            return False
        
        if language == "ar":
            subject = f"تحذير: الشكوى #{complaint_id} تقترب من الموعد النهائي"
            body = f"""
            <html dir="rtl">
                <body>
                    <h2>تحذير الموعد النهائي (SLA)</h2>
                    <p>الشكوى رقم <strong>#{complaint_id}</strong> تقترب من الموعد النهائي المحدد</p>
                    <p>الوقت المتبقي: <strong style="color: #dc2626;">{time_remaining}</strong></p>
                    <p>الموعد النهائي: <strong>{sla_deadline}</strong></p>
                    <p>يرجى اتخاذ الإجراءات اللازمة في أقرب وقت ممكن.</p>
                </body>
            </html>
            """
            sms = f"تحذير: الشكوى #{complaint_id} تقترب من الموعد النهائي. الوقت المتبقي: {time_remaining}"
        else:
            subject = f"Warning: Complaint #{complaint_id} Approaching Deadline"
            body = f"""
            <html>
                <body>
                    <h2>SLA Deadline Warning</h2>
                    <p>Complaint <strong>#{complaint_id}</strong> is approaching its deadline</p>
                    <p>Time remaining: <strong style="color: #dc2626;">{time_remaining}</strong></p>
                    <p>Deadline: <strong>{sla_deadline}</strong></p>
                    <p>Please take necessary action as soon as possible.</p>
                </body>
            </html>
            """
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
        self, db, user_id: int, user_email: str, user_phone: str,
        payment_id: int, decision: str, notes: str = None, language: str = "ar"
    ) -> bool:
        from models import NotificationPreference
        
        prefs = db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id
        ).first()
        
        if not prefs:
            return False
        
        decision_ar = "تمت الموافقة" if decision == "approved" else "تم الرفض"
        decision_en = "Approved" if decision == "approved" else "Rejected"
        
        if language == "ar":
            subject = f"قرار طلب الاشتراك #{payment_id}: {decision_ar}"
            body = f"""
            <html>
                <body style="direction: rtl; text-align: right;">
                    <h2>قرار طلب الاشتراك</h2>
                    <p>تم اتخاذ قرار بشأن طلب الاشتراك <strong>#{payment_id}</strong></p>
                    <p>القرار: <strong style="color: {'#16a34a' if decision == 'approved' else '#dc2626'};">{decision_ar}</strong></p>
                    {f'<p>ملاحظات: {notes}</p>' if notes else ''}
                    <p>يمكنك متابعة حالة الاشتراك من لوحة التحكم.</p>
                </body>
            </html>
            """
            sms = f"طلب الاشتراك #{payment_id}: {decision_ar}"
        else:
            subject = f"Subscription Request #{payment_id}: {decision_en}"
            body = f"""
            <html>
                <body>
                    <h2>Subscription Request Decision</h2>
                    <p>A decision has been made for subscription request <strong>#{payment_id}</strong></p>
                    <p>Decision: <strong style="color: {'#16a34a' if decision == 'approved' else '#dc2626'};">{decision_en}</strong></p>
                    {f'<p>Notes: {notes}</p>' if notes else ''}
                    <p>You can track your subscription status from the dashboard.</p>
                </body>
            </html>
            """
            sms = f"Subscription request #{payment_id}: {decision_en}"
        
        email_sent = False
        sms_sent = False
        
        if prefs.email_enabled:
            email_sent = await self.send_email(user_email, subject, body)
        
        if prefs.sms_enabled and user_phone:
            sms_sent = await self.send_sms(user_phone, sms)
        
        return email_sent or sms_sent


notification_service = NotificationService()
