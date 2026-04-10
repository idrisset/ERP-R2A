#!/usr/bin/env python3
"""
R2A Industrie Stock Management - Backend API Testing
Tests authentication, dashboard stats, and core API functionality
"""

import requests
import sys
import json
from datetime import datetime

class R2ABackendTester:
    def __init__(self, base_url="https://inv-pro-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.access_token = None
        self.refresh_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append({"test": name, "error": details})

    def test_login(self):
        """Test admin login"""
        url = f"{self.base_url}/api/auth/login"
        payload = {
            "email": "admin@r2a-industrie.com",
            "password": "Admin123!"
        }
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "email", "name", "role", "access_token", "refresh_token"]
                
                if all(field in data for field in required_fields):
                    self.access_token = data["access_token"]
                    self.refresh_token = data["refresh_token"]
                    
                    # Verify admin role
                    if data["role"] == "admin" and data["email"] == "admin@r2a-industrie.com":
                        self.log_test("Admin Login", True)
                        return True
                    else:
                        self.log_test("Admin Login", False, f"Invalid role/email: {data.get('role')}/{data.get('email')}")
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("Admin Login", False, f"Missing fields: {missing}")
            else:
                self.log_test("Admin Login", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            
        return False

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        url = f"{self.base_url}/api/auth/login"
        payload = {
            "email": "invalid@test.com",
            "password": "wrongpassword"
        }
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 401:
                self.log_test("Invalid Login Rejection", True)
                return True
            else:
                self.log_test("Invalid Login Rejection", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Invalid Login Rejection", False, f"Exception: {str(e)}")
            
        return False

    def test_auth_me(self):
        """Test /auth/me endpoint with valid token"""
        if not self.access_token:
            self.log_test("Auth Me", False, "No access token available")
            return False
            
        url = f"{self.base_url}/api/auth/me"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "email", "name", "role"]
                
                if all(field in data for field in required_fields):
                    if data["email"] == "admin@r2a-industrie.com" and data["role"] == "admin":
                        self.log_test("Auth Me", True)
                        return True
                    else:
                        self.log_test("Auth Me", False, f"Invalid user data: {data}")
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("Auth Me", False, f"Missing fields: {missing}")
            else:
                self.log_test("Auth Me", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Auth Me", False, f"Exception: {str(e)}")
            
        return False

    def test_auth_me_no_token(self):
        """Test /auth/me endpoint without token"""
        url = f"{self.base_url}/api/auth/me"
        
        try:
            response = requests.get(url, timeout=10)
            
            if response.status_code == 401:
                self.log_test("Auth Me No Token", True)
                return True
            else:
                self.log_test("Auth Me No Token", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Auth Me No Token", False, f"Exception: {str(e)}")
            
        return False

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        if not self.access_token:
            self.log_test("Dashboard Stats", False, "No access token available")
            return False
            
        url = f"{self.base_url}/api/dashboard/stats"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = [
                    "total_products", "low_stock", "out_of_stock", 
                    "monthly_sales_amount", "monthly_sales_count", 
                    "total_clients", "categories", "category_counts"
                ]
                
                if all(field in data for field in required_fields):
                    # Verify categories structure
                    categories = data.get("categories", [])
                    if len(categories) == 12:  # Should have 12 product categories
                        category_names = [cat.get("name") for cat in categories]
                        expected_categories = [
                            "Hydraulique", "Pneumatique", "Électrique", "Automatisme",
                            "Roulements", "Moteurs", "Capteurs", "Variateurs",
                            "Outillage", "Quincaillerie", "Sécurité", "Maintenance"
                        ]
                        
                        if all(name in category_names for name in expected_categories):
                            self.log_test("Dashboard Stats", True)
                            return True
                        else:
                            missing = [name for name in expected_categories if name not in category_names]
                            self.log_test("Dashboard Stats", False, f"Missing categories: {missing}")
                    else:
                        self.log_test("Dashboard Stats", False, f"Expected 12 categories, got {len(categories)}")
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("Dashboard Stats", False, f"Missing fields: {missing}")
            else:
                self.log_test("Dashboard Stats", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Dashboard Stats", False, f"Exception: {str(e)}")
            
        return False

    def test_dashboard_stats_no_auth(self):
        """Test dashboard stats without authentication"""
        url = f"{self.base_url}/api/dashboard/stats"
        
        try:
            response = requests.get(url, timeout=10)
            
            if response.status_code == 401:
                self.log_test("Dashboard Stats No Auth", True)
                return True
            else:
                self.log_test("Dashboard Stats No Auth", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Dashboard Stats No Auth", False, f"Exception: {str(e)}")
            
        return False

    def test_refresh_token(self):
        """Test token refresh functionality"""
        if not self.refresh_token:
            self.log_test("Token Refresh", False, "No refresh token available")
            return False
            
        url = f"{self.base_url}/api/auth/refresh"
        payload = {"refresh_token": self.refresh_token}
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.log_test("Token Refresh", True)
                    return True
                else:
                    self.log_test("Token Refresh", False, "No access_token in response")
            else:
                self.log_test("Token Refresh", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Token Refresh", False, f"Exception: {str(e)}")
            
        return False

    def test_logout(self):
        """Test logout endpoint"""
        url = f"{self.base_url}/api/auth/logout"
        
        try:
            response = requests.post(url, timeout=10)
            
            if response.status_code == 200:
                self.log_test("Logout", True)
                return True
            else:
                self.log_test("Logout", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Logout", False, f"Exception: {str(e)}")
            
        return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting R2A Industrie Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Authentication tests
        print("\n🔐 Authentication Tests:")
        self.test_login()
        self.test_invalid_login()
        self.test_auth_me()
        self.test_auth_me_no_token()
        
        # Dashboard tests
        print("\n📊 Dashboard Tests:")
        self.test_dashboard_stats()
        self.test_dashboard_stats_no_auth()
        
        # Token management tests
        print("\n🔄 Token Management Tests:")
        self.test_refresh_token()
        self.test_logout()
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📈 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  • {test['test']}: {test['error']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✨ Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = R2ABackendTester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())