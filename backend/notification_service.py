from typing import Optional, List
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from twilio.rest import Client
from config import get_settings

settings = get_settings()


class NotificationService:
    def __init__(self):
        self.sendgrid_client = None
        self.twilio_client = None
        
        if settings.ENABLE_EMAIL_NOTIFICATIONS and settings.SENDGRID_API_KEY:
            self.sendgrid_client = SendGridAPIClient(settings.SENDGRID_API_KEY)
        
        if settings.ENABLE_SMS_NOTIFICATIONS and settings.TWILIO_ACCOUNT_SID:
            self.twilio_client = Client(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN
            )
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str] = None
    ) -> bool:
        if not self.sendgrid_client:
            return False
        
        try:
            message = Mail(
                from_email=Email(settings.EMAIL_FROM),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            if plain_content:
                message.content = [
                    Content("text/plain", plain_content),
                    Content("text/html", html_content)
                ]
            
            response = self.sendgrid_client.send(message)
            return response.status_code == 202
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    
    async def send_sms(self, to_phone: str, message: str) -> bool:
        if not self.twilio_client:
            return False
        
        try:
            result = self.twilio_client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=to_phone
            )
            return result.sid is not None
        except Exception as e:
            print(f"Error sending SMS: {e}")
            return False
    
    async def send_complaint_status_update(
        self,
        user_email: str,
        user_phone: Optional[str],
        complaint_id: int,
        new_status: str,
        language: str = "ar"
    ):
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
        
        email_sent = await self.send_email(user_email, email_subject, email_body)
        sms_sent = False
        if user_phone:
            sms_sent = await self.send_sms(user_phone, sms_message)
        
        return email_sent or sms_sent
    
    async def send_assignment_notification(
        self,
        user_email: str,
        user_phone: Optional[str],
        complaint_id: int,
        language: str = "ar"
    ):
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
        
        email_sent = await self.send_email(user_email, subject, body)
        sms_sent = False
        if user_phone:
            sms_sent = await self.send_sms(user_phone, sms)
        
        return email_sent or sms_sent
    
    async def send_approval_request_notification(
        self,
        user_email: str,
        user_phone: Optional[str],
        complaint_id: int,
        requester_name: str,
        language: str = "ar"
    ):
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
        
        email_sent = await self.send_email(user_email, subject, body)
        sms_sent = False
        if user_phone:
            sms_sent = await self.send_sms(user_phone, sms)
        
        return email_sent or sms_sent
    
    async def send_approval_decision_notification(
        self,
        user_email: str,
        user_phone: Optional[str],
        complaint_id: int,
        decision: str,
        approver_name: str,
        notes: Optional[str] = None,
        language: str = "ar"
    ):
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
        
        email_sent = await self.send_email(user_email, subject, body)
        sms_sent = False
        if user_phone:
            sms_sent = await self.send_sms(user_phone, sms)
        
        return email_sent or sms_sent
    
    async def send_task_notification(
        self,
        user_email: str,
        user_phone: Optional[str],
        complaint_id: int,
        task_action: str,
        language: str = "ar"
    ):
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
        
        email_sent = await self.send_email(user_email, subject, body)
        sms_sent = False
        if user_phone:
            sms_sent = await self.send_sms(user_phone, sms)
        
        return email_sent or sms_sent


notification_service = NotificationService()
