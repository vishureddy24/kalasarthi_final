#!/usr/bin/env python3
"""
Additional KalaSarthi Backend API Tests
Tests edge cases and data validation
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

def test_product_validation():
    """Test product creation validation without auth"""
    try:
        # Test with missing required fields
        test_data = {"description": "Test product without title and price"}
        
        response = requests.post(f"{BASE_URL}/product", 
                               json=test_data, 
                               headers={"Content-Type": "application/json"},
                               timeout=10)
        
        # Should return 401 (unauthorized) before validation
        if response.status_code == 401:
            print_test_result("Product Validation (No Auth)", True, "Correctly blocked unauthorized request before validation")
            return True
        else:
            print_test_result("Product Validation (No Auth)", False, f"Expected 401, got {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_test_result("Product Validation (No Auth)", False, f"Exception: {str(e)}")
        return False

def test_ai_endpoints_without_data():
    """Test AI endpoints with missing data"""
    try:
        # Test AI description generator without data
        response = requests.post(f"{BASE_URL}/ai/generate-description", 
                               json={}, 
                               headers={"Content-Type": "application/json"},
                               timeout=10)
        
        if response.status_code == 401:
            print_test_result("AI Description Generator (Empty Data)", True, "Correctly returned 401 for unauthorized request")
        else:
            print_test_result("AI Description Generator (Empty Data)", False, f"Expected 401, got {response.status_code}")
            return False
        
        # Test AI chat without message
        response = requests.post(f"{BASE_URL}/ai/chat", 
                               json={}, 
                               headers={"Content-Type": "application/json"},
                               timeout=10)
        
        if response.status_code == 401:
            print_test_result("AI Chat (Empty Data)", True, "Correctly returned 401 for unauthorized request")
            return True
        else:
            print_test_result("AI Chat (Empty Data)", False, f"Expected 401, got {response.status_code}")
            return False
            
    except Exception as e:
        print_test_result("AI Endpoints (Empty Data)", False, f"Exception: {str(e)}")
        return False

def test_invalid_routes():
    """Test invalid API routes"""
    try:
        # Test non-existent route
        response = requests.get(f"{BASE_URL}/nonexistent", timeout=10)
        
        if response.status_code == 404:
            data = response.json()
            if 'error' in data and 'not found' in data['error'].lower():
                print_test_result("Invalid Route Handling", True, f"404 with proper error message: {data['error']}")
                return True
            else:
                print_test_result("Invalid Route Handling", False, f"404 but unexpected error format: {data}")
                return False
        else:
            print_test_result("Invalid Route Handling", False, f"Expected 404, got {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_test_result("Invalid Route Handling", False, f"Exception: {str(e)}")
        return False

def test_products_with_filters():
    """Test products endpoint with query parameters"""
    try:
        # Test with category filter
        response = requests.get(f"{BASE_URL}/products?category=handicraft", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if 'products' in data and isinstance(data['products'], list):
                print_test_result("Products with Category Filter", True, f"Returned {len(data['products'])} products for category filter")
            else:
                print_test_result("Products with Category Filter", False, f"Unexpected response structure: {data}")
                return False
        else:
            print_test_result("Products with Category Filter", False, f"Status code: {response.status_code}")
            return False
        
        # Test with artisan ID filter
        response = requests.get(f"{BASE_URL}/products?artisanId=test123", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if 'products' in data and isinstance(data['products'], list):
                print_test_result("Products with Artisan Filter", True, f"Returned {len(data['products'])} products for artisan filter")
                return True
            else:
                print_test_result("Products with Artisan Filter", False, f"Unexpected response structure: {data}")
                return False
        else:
            print_test_result("Products with Artisan Filter", False, f"Status code: {response.status_code}")
            return False
            
    except Exception as e:
        print_test_result("Products with Filters", False, f"Exception: {str(e)}")
        return False

def test_malformed_requests():
    """Test malformed JSON requests"""
    try:
        # Test with malformed JSON
        response = requests.post(f"{BASE_URL}/user/onboard", 
                               data="invalid json", 
                               headers={"Content-Type": "application/json"},
                               timeout=10)
        
        # Should handle malformed JSON gracefully
        if response.status_code in [400, 401, 500]:
            print_test_result("Malformed JSON Handling", True, f"Handled malformed JSON with status {response.status_code}")
            return True
        else:
            print_test_result("Malformed JSON Handling", False, f"Unexpected status: {response.status_code}")
            return False
            
    except Exception as e:
        print_test_result("Malformed JSON Handling", False, f"Exception: {str(e)}")
        return False

def main():
    """Run additional backend tests"""
    print("=" * 60)
    print("KalaSarthi Backend API - Additional Tests")
    print(f"Testing against: {BASE_URL}")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()
    
    # Track all test results
    all_results = []
    
    # Test 1: Product validation
    print("🔍 Testing Product Validation...")
    all_results.append(test_product_validation())
    
    # Test 2: AI endpoints with empty data
    print("🔍 Testing AI Endpoints with Empty Data...")
    all_results.append(test_ai_endpoints_without_data())
    
    # Test 3: Invalid routes
    print("🔍 Testing Invalid Route Handling...")
    all_results.append(test_invalid_routes())
    
    # Test 4: Products with filters
    print("🔍 Testing Products with Query Filters...")
    all_results.append(test_products_with_filters())
    
    # Test 5: Malformed requests
    print("🔍 Testing Malformed Request Handling...")
    all_results.append(test_malformed_requests())
    
    # Summary
    print("=" * 60)
    print("ADDITIONAL TESTS SUMMARY")
    print("=" * 60)
    
    passed = sum(all_results)
    total = len(all_results)
    
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("\n🎉 ALL ADDITIONAL TESTS PASSED!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} additional test(s) failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
