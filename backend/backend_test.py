#!/usr/bin/env python3
"""
KalaSarthi Backend API Test Suite
Tests all backend endpoints for proper authentication and functionality
"""

import requests
import json
import sys
from datetime import datetime

# Base URL from environment
BASE_URL = "https://sarthi-craft-dev.preview.emergentagent.com/api"

def print_test_result(test_name, success, details=""):
    """Print formatted test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"   Details: {details}")
    print()

def test_health_check():
    """Test health check endpoint - should work without auth"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'ok':
                print_test_result("Health Check API", True, f"Status: {data.get('status')}, Message: {data.get('message', 'N/A')}")
                return True
            else:
                print_test_result("Health Check API", False, f"Unexpected response: {data}")
                return False
        else:
            print_test_result("Health Check API", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        print_test_result("Health Check API", False, f"Exception: {str(e)}")
        return False

def test_products_get():
    """Test GET /api/products - should work without auth"""
    try:
        response = requests.get(f"{BASE_URL}/products", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if 'products' in data and isinstance(data['products'], list):
                print_test_result("Products GET API (No Auth)", True, f"Returned {len(data['products'])} products")
                return True
            else:
                print_test_result("Products GET API (No Auth)", False, f"Unexpected response structure: {data}")
                return False
        else:
            print_test_result("Products GET API (No Auth)", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        print_test_result("Products GET API (No Auth)", False, f"Exception: {str(e)}")
        return False

def test_unauthorized_endpoints():
    """Test endpoints that should return 401 without auth token"""
    endpoints = [
        ("GET", "/user/profile", "User Profile API"),
        ("POST", "/user/onboard", "User Onboarding API"),
        ("POST", "/products", "Products POST API"),
        ("POST", "/ai/generate-description", "AI Description Generator"),
        ("POST", "/ai/chat", "AI Chat API")
    ]
    
    results = []
    
    for method, endpoint, name in endpoints:
        try:
            # Test without any auth header
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            else:
                # For POST requests, send some basic JSON data
                test_data = {}
                if endpoint == "/user/onboard":
                    test_data = {"role": "artisan", "displayName": "Test User"}
                elif endpoint == "/products":
                    test_data = {"title": "Test Product", "price": 100}
                elif endpoint == "/ai/generate-description":
                    test_data = {"title": "Test Product", "category": "Handicraft"}
                elif endpoint == "/ai/chat":
                    test_data = {"message": "Hello"}
                    
                response = requests.post(f"{BASE_URL}{endpoint}", 
                                       json=test_data, 
                                       headers={"Content-Type": "application/json"},
                                       timeout=10)
            
            if response.status_code == 401:
                data = response.json()
                if data.get('error') == 'Unauthorized':
                    print_test_result(f"{name} (No Auth)", True, "Correctly returned 401 Unauthorized")
                    results.append(True)
                else:
                    print_test_result(f"{name} (No Auth)", False, f"401 but unexpected error message: {data}")
                    results.append(False)
            else:
                print_test_result(f"{name} (No Auth)", False, f"Expected 401, got {response.status_code}: {response.text}")
                results.append(False)
                
        except Exception as e:
            print_test_result(f"{name} (No Auth)", False, f"Exception: {str(e)}")
            results.append(False)
    
    return results

def test_firebase_auth_verification():
    """Test Firebase auth token verification with invalid token"""
    try:
        # Test with invalid Bearer token
        headers = {
            "Authorization": "Bearer invalid_token_12345",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{BASE_URL}/user/profile", headers=headers, timeout=10)
        
        if response.status_code == 401:
            data = response.json()
            if data.get('error') == 'Unauthorized':
                print_test_result("Firebase Auth Token Verification", True, "Invalid token correctly rejected")
                return True
            else:
                print_test_result("Firebase Auth Token Verification", False, f"401 but unexpected error: {data}")
                return False
        else:
            print_test_result("Firebase Auth Token Verification", False, f"Expected 401, got {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_test_result("Firebase Auth Token Verification", False, f"Exception: {str(e)}")
        return False

def test_cors_headers():
    """Test CORS headers are properly set"""
    try:
        response = requests.options(f"{BASE_URL}/health", timeout=10)
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
        
        # Accept both 200 and 204 status codes for OPTIONS requests
        if (response.status_code in [200, 204]) and cors_headers['Access-Control-Allow-Origin']:
            print_test_result("CORS Headers", True, f"CORS properly configured: {cors_headers}")
            return True
        else:
            print_test_result("CORS Headers", False, f"Status: {response.status_code}, Headers: {cors_headers}")
            return False
            
    except Exception as e:
        print_test_result("CORS Headers", False, f"Exception: {str(e)}")
        return False

def main():
    """Run all backend tests"""
    print("=" * 60)
    print("KalaSarthi Backend API Test Suite")
    print(f"Testing against: {BASE_URL}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()
    
    # Track all test results
    all_results = []
    
    # Test 1: Health Check
    print("🔍 Testing Health Check Endpoint...")
    all_results.append(test_health_check())
    
    # Test 2: Products GET (no auth required)
    print("🔍 Testing Products GET Endpoint (No Auth)...")
    all_results.append(test_products_get())
    
    # Test 3: Unauthorized endpoints
    print("🔍 Testing Unauthorized Access Protection...")
    auth_results = test_unauthorized_endpoints()
    all_results.extend(auth_results)
    
    # Test 4: Firebase token verification
    print("🔍 Testing Firebase Auth Token Verification...")
    all_results.append(test_firebase_auth_verification())
    
    # Test 5: CORS headers
    print("🔍 Testing CORS Configuration...")
    all_results.append(test_cors_headers())
    
    # Summary
    print("=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(all_results)
    total = len(all_results)
    
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Backend API is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())