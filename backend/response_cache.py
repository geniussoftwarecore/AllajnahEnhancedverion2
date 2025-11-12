from functools import wraps
from datetime import datetime, timedelta
import json
import hashlib

cache_store = {}

def cache_response(ttl_seconds=60):
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            cache_key = _generate_cache_key(func.__name__, args, kwargs)
            
            if cache_key in cache_store:
                cached_data, expiry = cache_store[cache_key]
                if datetime.utcnow() < expiry:
                    return cached_data
                else:
                    del cache_store[cache_key]
            
            result = await func(*args, **kwargs)
            cache_store[cache_key] = (result, datetime.utcnow() + timedelta(seconds=ttl_seconds))
            _cleanup_expired_cache()
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            cache_key = _generate_cache_key(func.__name__, args, kwargs)
            
            if cache_key in cache_store:
                cached_data, expiry = cache_store[cache_key]
                if datetime.utcnow() < expiry:
                    return cached_data
                else:
                    del cache_store[cache_key]
            
            result = func(*args, **kwargs)
            cache_store[cache_key] = (result, datetime.utcnow() + timedelta(seconds=ttl_seconds))
            _cleanup_expired_cache()
            return result
        
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

def _generate_cache_key(func_name, args, kwargs):
    key_parts = [func_name]
    
    for arg in args:
        if hasattr(arg, '__dict__'):
            continue
        key_parts.append(str(arg))
    
    for k, v in sorted(kwargs.items()):
        if not k.startswith('_') and not hasattr(v, '__dict__'):
            key_parts.append(f"{k}={v}")
    
    key_string = ":".join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()

def _cleanup_expired_cache():
    if len(cache_store) > 1000:
        now = datetime.utcnow()
        expired_keys = [k for k, (_, expiry) in cache_store.items() if expiry < now]
        for key in expired_keys:
            del cache_store[key]

def clear_cache():
    cache_store.clear()
