import os
import httpx
from typing import Dict, Optional


async def get_replit_token() -> str:
    """Get the Replit authentication token."""
    if os.getenv("REPL_IDENTITY"):
        return f"repl {os.getenv('REPL_IDENTITY')}"
    elif os.getenv("WEB_REPL_RENEWAL"):
        return f"depl {os.getenv('WEB_REPL_RENEWAL')}"
    else:
        raise Exception("X_REPLIT_TOKEN not found for repl/depl")


async def get_twilio_credentials() -> Dict[str, str]:
    """Fetch Twilio credentials from Replit connector API or environment variables."""
    # Try Replit connectors first
    try:
        hostname = os.getenv("REPLIT_CONNECTORS_HOSTNAME")
        if hostname:
            x_replit_token = await get_replit_token()
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://{hostname}/api/v2/connection?include_secrets=true&connector_names=twilio",
                    headers={
                        "Accept": "application/json",
                        "X_REPLIT_TOKEN": x_replit_token
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                if data.get("items") and len(data["items"]) > 0:
                    settings = data["items"][0].get("settings", {})
                    
                    if settings.get("account_sid") and settings.get("api_key") and settings.get("api_key_secret"):
                        print("✓ Using Twilio credentials from Replit connector")
                        return {
                            "account_sid": settings["account_sid"],
                            "api_key": settings["api_key"],
                            "api_key_secret": settings["api_key_secret"],
                            "phone_number": settings.get("phone_number", "")
                        }
    except Exception as e:
        print(f"Replit connector unavailable, trying environment variables: {e}")
    
    # Fallback to environment variables
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    phone_number = os.getenv("TWILIO_PHONE_NUMBER")
    
    if account_sid and auth_token:
        print("✓ Using Twilio credentials from environment variables")
        return {
            "account_sid": account_sid,
            "api_key": account_sid,  # For Client() constructor
            "api_key_secret": auth_token,
            "phone_number": phone_number or ""
        }
    
    raise Exception("Twilio credentials not found in connectors or environment variables")


async def get_sendgrid_credentials() -> Dict[str, str]:
    """Fetch SendGrid credentials from Replit connector API or environment variables."""
    # Try Replit connectors first
    try:
        hostname = os.getenv("REPLIT_CONNECTORS_HOSTNAME")
        if hostname:
            x_replit_token = await get_replit_token()
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://{hostname}/api/v2/connection?include_secrets=true&connector_names=sendgrid",
                    headers={
                        "Accept": "application/json",
                        "X_REPLIT_TOKEN": x_replit_token
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                if data.get("items") and len(data["items"]) > 0:
                    settings = data["items"][0].get("settings", {})
                    
                    if settings.get("api_key") and settings.get("from_email"):
                        print("✓ Using SendGrid credentials from Replit connector")
                        return {
                            "api_key": settings["api_key"],
                            "from_email": settings["from_email"]
                        }
    except Exception as e:
        print(f"Replit connector unavailable, trying environment variables: {e}")
    
    # Fallback to environment variables
    api_key = os.getenv("SENDGRID_API_KEY")
    from_email = os.getenv("EMAIL_FROM", "noreply@allajnah.com")
    
    if api_key:
        print("✓ Using SendGrid credentials from environment variables")
        return {
            "api_key": api_key,
            "from_email": from_email
        }
    
    raise Exception("SendGrid credentials not found in connectors or environment variables")
