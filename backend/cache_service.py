import json
from typing import Optional, Any
from datetime import timedelta
import redis
from config import get_settings

settings = get_settings()


class CacheService:
    def __init__(self):
        self.redis_client = None
        if settings.REDIS_URL:
            try:
                self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            except Exception as e:
                print(f"Redis connection failed: {e}")
    
    async def get(self, key: str) -> Optional[Any]:
        if not self.redis_client:
            return None
        
        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            print(f"Cache get error: {e}")
        return None
    
    async def set(self, key: str, value: Any, expire_seconds: int = 300):
        if not self.redis_client:
            return False
        
        try:
            self.redis_client.setex(
                key,
                timedelta(seconds=expire_seconds),
                json.dumps(value, default=str)
            )
            return True
        except Exception as e:
            print(f"Cache set error: {e}")
        return False
    
    async def delete(self, key: str):
        if not self.redis_client:
            return False
        
        try:
            self.redis_client.delete(key)
            return True
        except Exception as e:
            print(f"Cache delete error: {e}")
        return False
    
    async def delete_pattern(self, pattern: str):
        if not self.redis_client:
            return False
        
        try:
            for key in self.redis_client.scan_iter(pattern):
                self.redis_client.delete(key)
            return True
        except Exception as e:
            print(f"Cache delete pattern error: {e}")
        return False


cache_service = CacheService()
