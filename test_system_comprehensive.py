#!/usr/bin/env python3
"""
Comprehensive System Test for Allajnah Enhanced
Tests all API endpoints, workflows, and notification system
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_test(name, status, details=""):
    icon = f"{Colors.GREEN}✓{Colors.ENDC}" if status else f"{Colors.RED}✗{Colors.ENDC}"
    print(f"{icon} {name}")
    if details:
        print(f"  {Colors.YELLOW}→{Colors.ENDC} {details}")

def test_endpoint(method, endpoint, expected_status, data=None, headers=None, desc=""):
    url = f"{API_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=5)
        elif method == "PATCH":
            response = requests.patch(url, json=data, headers=headers, timeout=5)
        
        success = response.status_code == expected_status
        print_test(
            f"{method} {endpoint} - {desc}",
            success,
            f"Expected {expected_status}, Got {response.status_code}"
        )
        return success, response
    except Exception as e:
        print_test(f"{method} {endpoint} - {desc}", False, f"Error: {str(e)}")
        return False, None

def main():
    print(f"\n{Colors.BOLD}{'='*70}")
    print(f"  Allajnah Enhanced - Comprehensive System Test")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*70}{Colors.ENDC}\n")

    results = {
        "total": 0,
        "passed": 0,
        "failed": 0
    }

    # Test 1: Backend Health
    print(f"\n{Colors.BOLD}{Colors.BLUE}1. Backend Health Check{Colors.ENDC}")
    print("-" * 50)
    success, resp = test_endpoint("GET", "/../", 200, desc="Root endpoint")
    results["total"] += 1
    if success: results["passed"] += 1
    else: results["failed"] += 1

    # Test 2: Setup Status
    print(f"\n{Colors.BOLD}{Colors.BLUE}2. Setup & Authentication Endpoints{Colors.ENDC}")
    print("-" * 50)
    
    success, resp = test_endpoint("GET", "/setup/status", 200, desc="Setup status check")
    results["total"] += 1
    if success: 
        results["passed"] += 1
        if resp:
            data = resp.json()
            print_test("Setup Status", True, f"needs_setup: {data.get('needs_setup')}")
    else: 
        results["failed"] += 1

    # Test 3: Categories (Public Endpoint)
    print(f"\n{Colors.BOLD}{Colors.BLUE}3. Public Endpoints{Colors.ENDC}")
    print("-" * 50)
    
    success, resp = test_endpoint("GET", "/categories", 200, desc="Get categories")
    results["total"] += 1
    if success: 
        results["passed"] += 1
        if resp:
            categories = resp.json()
            print_test("Categories Count", True, f"Found {len(categories)} categories")
    else: 
        results["failed"] += 1

    success, resp = test_endpoint("GET", "/government-entities", 200, desc="Get government entities")
    results["total"] += 1
    if success: results["passed"] += 1
    else: results["failed"] += 1

    # Test 4: Protected Endpoints (Should return 401 without auth)
    print(f"\n{Colors.BOLD}{Colors.BLUE}4. Protected Endpoints (Auth Required){Colors.ENDC}")
    print("-" * 50)
    
    protected_endpoints = [
        ("GET", "/auth/me", "Get current user"),
        ("GET", "/complaints", "List complaints"),
        ("GET", "/subscriptions/me", "Get subscription"),
        ("GET", "/admin/users", "List users"),
        ("GET", "/admin/analytics", "Get analytics"),
    ]
    
    for method, endpoint, desc in protected_endpoints:
        success, resp = test_endpoint(method, endpoint, 401, desc=desc)
        results["total"] += 1
        if success: results["passed"] += 1
        else: results["failed"] += 1

    # Test 5: Invalid Endpoints (Should return 404)
    print(f"\n{Colors.BOLD}{Colors.BLUE}5. Invalid Endpoints{Colors.ENDC}")
    print("-" * 50)
    
    success, resp = test_endpoint("GET", "/nonexistent", 404, desc="Non-existent endpoint")
    results["total"] += 1
    if success: results["passed"] += 1
    else: results["failed"] += 1

    # Test 6: Notification System Configuration
    print(f"\n{Colors.BOLD}{Colors.BLUE}6. Notification System Status{Colors.ENDC}")
    print("-" * 50)
    
    try:
        import sys
        sys.path.insert(0, 'backend')
        from config import get_settings
        settings = get_settings()
        
        email_enabled = settings.ENABLE_EMAIL_NOTIFICATIONS
        sms_enabled = settings.ENABLE_SMS_NOTIFICATIONS
        has_sendgrid = bool(settings.SENDGRID_API_KEY)
        has_twilio = bool(settings.TWILIO_ACCOUNT_SID)
        
        print_test("Email Notifications", email_enabled, 
                  f"SendGrid API: {'Configured' if has_sendgrid else 'Not configured'}")
        print_test("SMS Notifications", sms_enabled,
                  f"Twilio API: {'Configured' if has_twilio else 'Not configured'}")
        
        if not email_enabled and not sms_enabled:
            print(f"  {Colors.YELLOW}⚠{Colors.ENDC} Notifications are disabled (expected in development)")
        
    except Exception as e:
        print_test("Notification System", False, f"Error checking: {str(e)}")

    # Summary
    print(f"\n{Colors.BOLD}{'='*70}")
    print(f"  TEST SUMMARY")
    print(f"{'='*70}{Colors.ENDC}")
    print(f"Total Tests: {results['total']}")
    print(f"{Colors.GREEN}Passed: {results['passed']}{Colors.ENDC}")
    print(f"{Colors.RED}Failed: {results['failed']}{Colors.ENDC}")
    
    success_rate = (results['passed'] / results['total'] * 100) if results['total'] > 0 else 0
    print(f"Success Rate: {success_rate:.1f}%")
    
    if results['failed'] == 0:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✓ All tests passed!{Colors.ENDC}\n")
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}✗ Some tests failed{Colors.ENDC}\n")
    
    return results['failed'] == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
