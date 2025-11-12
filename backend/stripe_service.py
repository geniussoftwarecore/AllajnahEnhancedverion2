import stripe
import logging
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from config import get_settings
from models import User, Payment, Subscription, PaymentStatus, SubscriptionStatus, PaymentProvider
from audit_helper import create_audit_log

settings = get_settings()
logger = logging.getLogger(__name__)

if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY
else:
    logger.warning("STRIPE_SECRET_KEY is not configured. Stripe functionality will be disabled.")


def _check_stripe_configured() -> bool:
    if not settings.STRIPE_SECRET_KEY:
        logger.error("Stripe operation attempted but STRIPE_SECRET_KEY is not configured")
        return False
    return True


def create_customer(user: User) -> Optional[str]:
    if not _check_stripe_configured():
        return None
    
    try:
        customer = stripe.Customer.create(
            email=user.email,
            name=f"{user.first_name} {user.last_name}",
            phone=user.phone,
            metadata={
                "user_id": user.id,
                "role": user.role.value
            }
        )
        logger.info(f"Created Stripe customer {customer.id} for user {user.id}")
        return customer.id
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating customer for user {user.id}: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error creating Stripe customer for user {user.id}: {str(e)}")
        return None


def create_checkout_session(user_id: int, plan_type: str, db: Session) -> Optional[Dict[str, Any]]:
    if not _check_stripe_configured():
        return None
    
    if not settings.STRIPE_PRICE_ID:
        logger.error("STRIPE_PRICE_ID is not configured")
        return None
    
    SUBSCRIPTION_PRICES = {
        'monthly': 200,
        'yearly': 1920
    }
    
    if plan_type not in SUBSCRIPTION_PRICES:
        logger.error(f"Invalid plan_type: {plan_type}. Must be 'monthly' or 'yearly'")
        return None
    
    amount = SUBSCRIPTION_PRICES[plan_type]
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"User {user_id} not found")
            return None
        
        stripe_customer_id = None
        existing_payment = db.query(Payment).filter(
            Payment.user_id == user_id,
            Payment.stripe_customer_id.isnot(None)
        ).first()
        
        if existing_payment:
            stripe_customer_id = existing_payment.stripe_customer_id
        else:
            stripe_customer_id = create_customer(user)
        
        if not stripe_customer_id:
            logger.error(f"Failed to get or create Stripe customer for user {user_id}")
            return None
        
        import os
        
        frontend_url = settings.FRONTEND_URL
        if not frontend_url or frontend_url == "*":
            if settings.CORS_ORIGINS and settings.CORS_ORIGINS != "*":
                frontend_url = settings.CORS_ORIGINS.split(',')[0].strip()
            else:
                replit_domain = os.getenv("REPLIT_DOMAINS", "").split(',')[0]
                if replit_domain:
                    frontend_url = f"https://{replit_domain}"
                else:
                    logger.error("No valid frontend URL found. Set FRONTEND_URL environment variable.")
                    return None
        
        frontend_url = frontend_url.rstrip('/')
        
        success_url = f"{frontend_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{frontend_url}/payment-cancel"
        
        session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': settings.STRIPE_PRICE_ID,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'user_id': user_id,
                'plan_type': plan_type,
                'amount': str(amount)
            }
        )
        
        logger.info(f"Created Stripe checkout session {session.id} for user {user_id}, plan: {plan_type}, amount: {amount}")
        
        return {
            'session_id': session.id,
            'checkout_url': session.url,
            'customer_id': stripe_customer_id
        }
    
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating checkout session for user {user_id}: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error creating checkout session for user {user_id}: {str(e)}")
        return None


def handle_successful_payment(session_id: str, db: Session) -> bool:
    if not _check_stripe_configured():
        return False
    
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status != 'paid':
            logger.warning(f"Session {session_id} payment status is {session.payment_status}, not paid")
            return False
        
        user_id = int(session.metadata.get('user_id'))
        amount = float(session.metadata.get('amount', 0))
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"User {user_id} not found for session {session_id}")
            return False
        
        existing_payment = db.query(Payment).filter(
            Payment.stripe_session_id == session_id
        ).first()
        
        if existing_payment:
            logger.warning(f"Payment already processed for session {session_id}")
            return True
        
        subscription_start = datetime.utcnow()
        subscription_end = subscription_start + timedelta(days=365)
        
        subscription = Subscription(
            user_id=user_id,
            start_date=subscription_start,
            end_date=subscription_end,
            status=SubscriptionStatus.ACTIVE,
            stripe_subscription_id=session.subscription,
            auto_renew=True,
            next_billing_date=subscription_end
        )
        db.add(subscription)
        db.flush()
        
        payment_method = db.query(User).first()
        default_payment_method_id = 1
        
        payment = Payment(
            user_id=user_id,
            subscription_id=subscription.id,
            payment_method_id=default_payment_method_id,
            amount=amount,
            method='stripe',
            status=PaymentStatus.APPROVED,
            stripe_payment_id=session.payment_intent,
            stripe_customer_id=session.customer,
            stripe_session_id=session_id,
            payment_provider=PaymentProvider.STRIPE,
            approved_at=datetime.utcnow()
        )
        db.add(payment)
        db.flush()
        
        create_audit_log(
            db=db,
            actor_user_id=user_id,
            action="stripe_payment_created",
            target_type="Payment",
            target_id=payment.id,
            details=f"Stripe payment successful for session {session_id}, amount: {amount}"
        )
        
        create_audit_log(
            db=db,
            actor_user_id=user_id,
            action="subscription_activated",
            target_type="Subscription",
            target_id=subscription.id,
            details=f"Subscription activated via Stripe, valid until {subscription_end}"
        )
        
        db.commit()
        
        logger.info(f"Successfully processed payment for session {session_id}, user {user_id}")
        return True
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error handling payment for session {session_id}: {str(e)}")
        db.rollback()
        return False
    except Exception as e:
        logger.error(f"Unexpected error handling payment for session {session_id}: {str(e)}")
        db.rollback()
        return False


def cancel_subscription(subscription_id: str, db: Session) -> bool:
    if not _check_stripe_configured():
        return False
    
    try:
        subscription = stripe.Subscription.delete(subscription_id)
        
        logger.info(f"Cancelled Stripe subscription {subscription_id}")
        
        db_subscription = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription_id
        ).first()
        
        if db_subscription:
            db_subscription.status = SubscriptionStatus.CANCELLED
            db_subscription.auto_renew = False
            
            create_audit_log(
                db=db,
                actor_user_id=db_subscription.user_id,
                action="subscription_cancelled",
                target_type="Subscription",
                target_id=db_subscription.id,
                details=f"Stripe subscription {subscription_id} cancelled"
            )
            
            db.commit()
        
        return True
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error cancelling subscription {subscription_id}: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error cancelling subscription {subscription_id}: {str(e)}")
        db.rollback()
        return False


def handle_subscription_updated(stripe_subscription: Dict[str, Any], db: Session) -> bool:
    if not _check_stripe_configured():
        return False
    
    try:
        subscription_id = stripe_subscription.get('id')
        
        db_subscription = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription_id
        ).first()
        
        if not db_subscription:
            logger.warning(f"Subscription {subscription_id} not found in database")
            return False
        
        status = stripe_subscription.get('status')
        
        if status == 'active':
            db_subscription.status = SubscriptionStatus.ACTIVE
            if stripe_subscription.get('current_period_end'):
                db_subscription.next_billing_date = datetime.fromtimestamp(
                    stripe_subscription['current_period_end']
                )
        elif status == 'canceled':
            db_subscription.status = SubscriptionStatus.CANCELLED
            db_subscription.auto_renew = False
        elif status in ['past_due', 'unpaid']:
            db_subscription.status = SubscriptionStatus.EXPIRED
        
        create_audit_log(
            db=db,
            actor_user_id=db_subscription.user_id,
            action="subscription_updated",
            target_type="Subscription",
            target_id=db_subscription.id,
            details=f"Stripe subscription {subscription_id} updated to status: {status}"
        )
        
        db.commit()
        logger.info(f"Updated subscription {subscription_id} to status {status}")
        return True
        
    except Exception as e:
        logger.error(f"Error handling subscription update: {str(e)}")
        db.rollback()
        return False


def handle_subscription_deleted(stripe_subscription: Dict[str, Any], db: Session) -> bool:
    if not _check_stripe_configured():
        return False
    
    try:
        subscription_id = stripe_subscription.get('id')
        
        db_subscription = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription_id
        ).first()
        
        if not db_subscription:
            logger.warning(f"Subscription {subscription_id} not found in database")
            return False
        
        db_subscription.status = SubscriptionStatus.CANCELLED
        db_subscription.auto_renew = False
        
        create_audit_log(
            db=db,
            actor_user_id=db_subscription.user_id,
            action="subscription_expired",
            target_type="Subscription",
            target_id=db_subscription.id,
            details=f"Stripe subscription {subscription_id} deleted/expired"
        )
        
        db.commit()
        logger.info(f"Deleted subscription {subscription_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error handling subscription deletion: {str(e)}")
        db.rollback()
        return False
