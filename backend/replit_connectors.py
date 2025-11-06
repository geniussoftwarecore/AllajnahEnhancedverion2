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
    """Fetch Twilio credentials from Replit connector API."""
    hostname = os.getenv("REPLIT_CONNECTORS_HOSTNAME")
    if not hostname:
        raise Exception("REPLIT_CONNECTORS_HOSTNAME not set")
    
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
        
        if not data.get("items") or len(data["items"]) == 0:
            raise Exception("Twilio not connected")
        
        settings = data["items"][0].get("settings", {})
        
        if not settings.get("account_sid") or not settings.get("api_key") or not settings.get("api_key_secret"):
            raise Exception("Twilio credentials incomplete")
        
        return {
            "account_sid": settings["account_sid"],
            "api_key": settings["api_key"],
            "api_key_secret": settings["api_key_secret"],
            "phone_number": settings.get("phone_number", "")
        }


async def get_sendgrid_credentials() -> Dict[str, str]:
    """Fetch SendGrid credentials from Replit connector API."""
    hostname = os.getenv("REPLIT_CONNECTORS_HOSTNAME")
    if not hostname:
        raise Exception("REPLIT_CONNECTORS_HOSTNAME not set")
    
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
        
        if not data.get("items") or len(data["items"]) == 0:
            raise Exception("SendGrid not connected")
        
        settings = data["items"][0].get("settings", {})
        
        if not settings.get("api_key") or not settings.get("from_email"):
            raise Exception("SendGrid credentials incomplete")
        
        return {
            "api_key": settings["api_key"],
            "from_email": settings["from_email"]
        }
