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
        self.created_product_id = None
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

    def test_create_product(self):
        """Test creating a new product"""
        if not self.access_token:
            self.log_test("Create Product", False, "No access token available")
            return False
            
        url = f"{self.base_url}/api/products"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Create unique reference for testing
        timestamp = datetime.now().strftime("%H%M%S")
        test_product = {
            "reference": f"TEST-{timestamp}",
            "name": f"Test Product {timestamp}",
            "category": "hydraulique",
            "quantity": 10,
            "stock_minimum": 5,
            "purchase_price": 100.0,
            "sale_price": 150.0,
            "supplier": "Test Supplier",
            "location": "A-01",
            "brand": "Test Brand",
            "description": "Test product for API testing",
            "state": "neuf",
            "status": "en_stock"
        }
        
        try:
            response = requests.post(url, json=test_product, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "reference", "name", "category"]
                
                if all(field in data for field in required_fields):
                    if data["reference"] == test_product["reference"]:
                        self.created_product_id = data["id"]
                        self.log_test("Create Product", True)
                        return True
                    else:
                        self.log_test("Create Product", False, f"Reference mismatch: {data.get('reference')}")
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("Create Product", False, f"Missing fields: {missing}")
            else:
                self.log_test("Create Product", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Create Product", False, f"Exception: {str(e)}")
            
        return False

    def test_duplicate_reference(self):
        """Test creating product with duplicate reference"""
        if not self.access_token:
            self.log_test("Duplicate Reference Rejection", False, "No access token available")
            return False
            
        url = f"{self.base_url}/api/products"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Try to create product with existing reference
        duplicate_product = {
            "reference": "HYD-001",  # This should already exist
            "name": "Duplicate Test Product",
            "category": "hydraulique",
            "quantity": 5,
            "stock_minimum": 2,
            "purchase_price": 50.0,
            "sale_price": 75.0
        }
        
        try:
            response = requests.post(url, json=duplicate_product, headers=headers, timeout=10)
            
            if response.status_code == 400:
                self.log_test("Duplicate Reference Rejection", True)
                return True
            else:
                self.log_test("Duplicate Reference Rejection", False, f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Duplicate Reference Rejection", False, f"Exception: {str(e)}")
            
        return False

    def test_list_products_by_category(self):
        """Test listing products filtered by category"""
        if not self.access_token:
            self.log_test("List Products by Category", False, "No access token available")
            return False
            
        url = f"{self.base_url}/api/products"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        params = {"category": "hydraulique"}
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["products", "total", "page", "limit", "pages"]
                
                if all(field in data for field in required_fields):
                    products = data.get("products", [])
                    # Check that all products are from hydraulique category
                    if all(p.get("category") == "hydraulique" for p in products):
                        self.log_test("List Products by Category", True)
                        return True
                    else:
                        wrong_category = [p.get("category") for p in products if p.get("category") != "hydraulique"]
                        self.log_test("List Products by Category", False, f"Wrong categories found: {wrong_category}")
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("List Products by Category", False, f"Missing fields: {missing}")
            else:
                self.log_test("List Products by Category", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("List Products by Category", False, f"Exception: {str(e)}")
            
        return False

    def test_search_products_by_name(self):
        """Test searching products by name"""
        if not self.access_token:
            self.log_test("Search Products by Name", False, "No access token available")
            return False
            
        url = f"{self.base_url}/api/products"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        params = {"search": "pompe"}
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "products" in data:
                    self.log_test("Search Products by Name", True)
                    return True
                else:
                    self.log_test("Search Products by Name", False, "No products field in response")
            else:
                self.log_test("Search Products by Name", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Search Products by Name", False, f"Exception: {str(e)}")
            
        return False

    def test_search_products_by_reference(self):
        """Test searching products by reference"""
        if not self.access_token:
            self.log_test("Search Products by Reference", False, "No access token available")
            return False
            
        url = f"{self.base_url}/api/products"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        params = {"search": "HYD"}
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "products" in data:
                    self.log_test("Search Products by Reference", True)
                    return True
                else:
                    self.log_test("Search Products by Reference", False, "No products field in response")
            else:
                self.log_test("Search Products by Reference", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Search Products by Reference", False, f"Exception: {str(e)}")
            
        return False

    def test_update_product(self):
        """Test updating a product"""
        if not self.access_token:
            self.log_test("Update Product", False, "No access token available")
            return False
            
        if not hasattr(self, 'created_product_id'):
            self.log_test("Update Product", False, "No product ID available for update")
            return False
            
        url = f"{self.base_url}/api/products/{self.created_product_id}"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        update_data = {
            "name": "Updated Test Product",
            "quantity": 15,
            "sale_price": 175.0
        }
        
        try:
            response = requests.put(url, json=update_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("name") == "Updated Test Product" and data.get("quantity") == 15:
                    self.log_test("Update Product", True)
                    return True
                else:
                    self.log_test("Update Product", False, f"Update not reflected: {data}")
            else:
                self.log_test("Update Product", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Update Product", False, f"Exception: {str(e)}")
            
        return False

    def test_delete_product(self):
        """Test soft deleting (archiving) a product"""
        if not self.access_token:
            self.log_test("Delete Product", False, "No access token available")
            return False
            
        if not hasattr(self, 'created_product_id'):
            self.log_test("Delete Product", False, "No product ID available for deletion")
            return False
            
        url = f"{self.base_url}/api/products/{self.created_product_id}"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            response = requests.delete(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("Delete Product", True)
                    return True
                else:
                    self.log_test("Delete Product", False, "No message in response")
            else:
                self.log_test("Delete Product", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Delete Product", False, f"Exception: {str(e)}")
            
        return False

    def test_list_archived_products(self):
        """Test listing archived products (trash)"""
        if not self.access_token:
            self.log_test("List Archived Products", False, "No access token available")
            return False
            
        url = f"{self.base_url}/api/products"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        params = {"archived": "true"}
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "products" in data:
                    self.log_test("List Archived Products", True)
                    return True
                else:
                    self.log_test("List Archived Products", False, "No products field in response")
            else:
                self.log_test("List Archived Products", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("List Archived Products", False, f"Exception: {str(e)}")
            
        return False

    def test_restore_product(self):
        """Test restoring a product from trash"""
        if not self.access_token:
            self.log_test("Restore Product", False, "No access token available")
            return False
            
        if not hasattr(self, 'created_product_id'):
            self.log_test("Restore Product", False, "No product ID available for restoration")
            return False
            
        url = f"{self.base_url}/api/products/{self.created_product_id}/restore"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            response = requests.post(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("Restore Product", True)
                    return True
                else:
                    self.log_test("Restore Product", False, "No message in response")
            else:
                self.log_test("Restore Product", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Restore Product", False, f"Exception: {str(e)}")
            
        return False

    def test_pagination(self):
        """Test pagination functionality"""
        if not self.access_token:
            self.log_test("Pagination", False, "No access token available")
            return False
            
        url = f"{self.base_url}/api/products"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        params = {"page": 1, "limit": 2}
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["products", "total", "page", "limit", "pages"]
                
                if all(field in data for field in required_fields):
                    if data["page"] == 1 and data["limit"] == 2:
                        self.log_test("Pagination", True)
                        return True
                    else:
                        self.log_test("Pagination", False, f"Page/limit mismatch: {data.get('page')}/{data.get('limit')}")
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("Pagination", False, f"Missing fields: {missing}")
            else:
                self.log_test("Pagination", False, f"Status {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Pagination", False, f"Exception: {str(e)}")
            
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
        
        # Product management tests
        print("\n📦 Product Management Tests:")
        self.test_create_product()
        self.test_duplicate_reference()
        self.test_list_products_by_category()
        self.test_search_products_by_name()
        self.test_search_products_by_reference()
        self.test_update_product()
        self.test_delete_product()
        self.test_list_archived_products()
        self.test_restore_product()
        self.test_pagination()
        
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