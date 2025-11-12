from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def check_sla_violations_task():
    logger.info("Running SLA violations check...")
    try:
        from database import SessionLocal
        from workflow_automation import check_sla_violations
        
        db = SessionLocal()
        try:
            violations = check_sla_violations(db)
            logger.info(f"SLA check completed. Violations: {violations}")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error in SLA check task: {e}")


async def check_sla_warnings_task():
    logger.info("Running SLA warnings check...")
    try:
        from database import SessionLocal
        from workflow_automation import check_sla_warnings
        
        db = SessionLocal()
        try:
            warnings = check_sla_warnings(db)
            logger.info(f"SLA warnings check completed. Warnings sent: {warnings}")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error in SLA warnings task: {e}")


async def auto_close_resolved_task():
    logger.info("Running auto-close resolved complaints task...")
    try:
        from database import SessionLocal
        from workflow_automation import auto_close_resolved_complaints
        
        db = SessionLocal()
        try:
            closed = auto_close_resolved_complaints(db)
            logger.info(f"Auto-close task completed. Closed: {closed}")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error in auto-close task: {e}")


async def renewal_reminder_job():
    logger.info("Running subscription renewal reminder task...")
    try:
        from database import SessionLocal
        from models import Subscription, User, SubscriptionStatus, NotificationType
        from notification_service import notification_service
        from datetime import datetime, timedelta
        
        db = SessionLocal()
        try:
            three_days_from_now = datetime.utcnow() + timedelta(days=3)
            four_days_from_now = datetime.utcnow() + timedelta(days=4)
            
            expiring_subscriptions = db.query(Subscription).join(User).filter(
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.end_date >= three_days_from_now,
                Subscription.end_date < four_days_from_now
            ).all()
            
            reminder_count = 0
            for subscription in expiring_subscriptions:
                user = subscription.user
                
                notification_service.create_notification(
                    db=db,
                    user_id=user.id,
                    notification_type=NotificationType.SUBSCRIPTION_EXPIRING,
                    title="Subscription Expiring Soon",
                    message=f"Your subscription will expire on {subscription.end_date.strftime('%Y-%m-%d')}. Please renew to continue submitting complaints.",
                    related_id=subscription.id
                )
                
                reminder_count += 1
                logger.info(f"Sent renewal reminder to user {user.id} for subscription {subscription.id}")
            
            logger.info(f"Renewal reminder task completed. Reminders sent: {reminder_count}")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error in renewal reminder task: {e}")


def start_scheduler():
    scheduler.add_job(
        check_sla_warnings_task,
        trigger=IntervalTrigger(hours=1),
        id='sla_warnings',
        name='Check SLA Warnings',
        replace_existing=True
    )
    
    scheduler.add_job(
        check_sla_violations_task,
        trigger=IntervalTrigger(hours=1),
        id='sla_check',
        name='Check SLA Violations',
        replace_existing=True
    )
    
    scheduler.add_job(
        auto_close_resolved_task,
        trigger=CronTrigger(hour=2, minute=0),
        id='auto_close',
        name='Auto Close Resolved Complaints',
        replace_existing=True
    )
    
    scheduler.add_job(
        renewal_reminder_job,
        trigger=IntervalTrigger(hours=24),
        id='renewal_reminder',
        name='Subscription Renewal Reminder',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler started successfully")


def stop_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler stopped")
