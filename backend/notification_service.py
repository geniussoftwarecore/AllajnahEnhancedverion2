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


notification_service = NotificationService()
