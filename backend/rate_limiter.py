from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from config import get_settings

settings = get_settings()

limiter = Limiter(key_func=get_remote_address)

LOGIN_RATE_LIMIT = f"{settings.RATE_LIMIT_LOGIN_PER_MINUTE}/minute"
COMPLAINT_RATE_LIMIT = f"{settings.RATE_LIMIT_COMPLAINTS_PER_HOUR}/hour"
UPLOAD_RATE_LIMIT = f"{settings.RATE_LIMIT_UPLOADS_PER_HOUR}/hour"
