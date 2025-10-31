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


def start_scheduler():
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
    
    scheduler.start()
    logger.info("Scheduler started successfully")


def stop_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler stopped")
