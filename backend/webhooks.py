import stripe
import logging
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session
from config import get_settings
from stripe_service import handle_successful_payment, handle_subscription_updated, handle_subscription_deleted

settings = get_settings()
logger = logging.getLogger(__name__)


async def handle_stripe_webhook(request: Request, db: Session) -> dict:
    if not settings.STRIPE_SECRET_KEY:
        logger.error("Stripe webhook received but STRIPE_SECRET_KEY is not configured")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe integration is not configured"
        )
    
    if not settings.STRIPE_WEBHOOK_SECRET:
        logger.error("STRIPE_WEBHOOK_SECRET is not configured, cannot verify webhook signature")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook signature verification is not configured. Webhooks cannot be processed without signature verification for security reasons."
        )
    
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    if not sig_header:
        logger.error("Webhook received without signature header")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing stripe-signature header"
        )
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid webhook payload: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid webhook signature: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    event_type = event['type']
    event_data = event['data']['object']
    
    logger.info(f"Received Stripe webhook event: {event_type}")
    
    try:
        if event_type == 'checkout.session.completed':
            session_id = event_data['id']
            success = handle_successful_payment(session_id, db)
            
            if not success:
                logger.error(f"Failed to handle checkout.session.completed for session {session_id}")
                return {
                    'status': 'error',
                    'message': 'Failed to process payment'
                }
            
            logger.info(f"Successfully processed checkout.session.completed for session {session_id}")
            return {
                'status': 'success',
                'message': 'Payment processed successfully'
            }
        
        elif event_type == 'customer.subscription.updated':
            success = handle_subscription_updated(event_data, db)
            
            if not success:
                logger.error(f"Failed to handle customer.subscription.updated for subscription {event_data.get('id')}")
                return {
                    'status': 'error',
                    'message': 'Failed to update subscription'
                }
            
            logger.info(f"Successfully processed customer.subscription.updated for subscription {event_data.get('id')}")
            return {
                'status': 'success',
                'message': 'Subscription updated successfully'
            }
        
        elif event_type == 'customer.subscription.deleted':
            success = handle_subscription_deleted(event_data, db)
            
            if not success:
                logger.error(f"Failed to handle customer.subscription.deleted for subscription {event_data.get('id')}")
                return {
                    'status': 'error',
                    'message': 'Failed to delete subscription'
                }
            
            logger.info(f"Successfully processed customer.subscription.deleted for subscription {event_data.get('id')}")
            return {
                'status': 'success',
                'message': 'Subscription deleted successfully'
            }
        
        else:
            logger.info(f"Unhandled webhook event type: {event_type}")
            return {
                'status': 'ignored',
                'message': f'Event type {event_type} not handled'
            }
    
    except Exception as e:
        logger.error(f"Error processing webhook event {event_type}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing webhook: {str(e)}"
        )
