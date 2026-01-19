#!/bin/bash

# TruckingHub API Test Script
# This script tests all authentication endpoints

API_BASE="http://localhost:5000/api/auth"

echo "==================================="
echo "TruckingHub API Endpoint Tests"
echo "==================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $2"
    else
        echo -e "${RED}✗ FAILED${NC}: $2"
    fi
}

# 1. Test Health Check
echo -e "${YELLOW}1. Testing Health Check${NC}"
curl -s http://localhost:5000/health | grep -q "TruckingHub API is running"
print_result $? "Health check endpoint"
echo ""

# 2. Test User Registration
echo -e "${YELLOW}2. Testing User Registration${NC}"
SIGNUP_RESPONSE=$(curl -s -X POST "$API_BASE/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!",
    "phone": "+1-555-1234",
    "role": "trucker",
    "company_name": "Test Trucking",
    "city": "Test City",
    "state": "CA",
    "country": "USA"
  }')

echo "$SIGNUP_RESPONSE" | grep -q '"success":true'
print_result $? "User registration"

# Extract token
TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: ${TOKEN:0:50}..."
echo ""

# 3. Test Duplicate Email Prevention
echo -e "${YELLOW}3. Testing Duplicate Email Prevention${NC}"
curl -s -X POST "$API_BASE/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another User",
    "email": "test@example.com",
    "password": "AnotherPass123!",
    "role": "shipper"
  }' | grep -q '"statusCode":409'
print_result $? "Duplicate email prevention"
echo ""

# 4. Test Login
echo -e "${YELLOW}4. Testing User Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }')

echo "$LOGIN_RESPONSE" | grep -q '"success":true'
print_result $? "User login with valid credentials"

# Update token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo ""

# 5. Test Wrong Password
echo -e "${YELLOW}5. Testing Wrong Password${NC}"
curl -s -X POST "$API_BASE/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword!"
  }' | grep -q '"statusCode":401'
print_result $? "Login rejection with wrong password"
echo ""

# 6. Test Token Verification
echo -e "${YELLOW}6. Testing Token Verification${NC}"
curl -s -X GET "$API_BASE/verify" \
  -H "Authorization: Bearer $TOKEN" | grep -q '"success":true'
print_result $? "Token verification"
echo ""

# 7. Test Get Current User
echo -e "${YELLOW}7. Testing Get Current User${NC}"
curl -s -X GET "$API_BASE/me" \
  -H "Authorization: Bearer $TOKEN" | grep -q '"email":"test@example.com"'
print_result $? "Get current user profile"
echo ""

# 8. Test Update Profile
echo -e "${YELLOW}8. Testing Update Profile${NC}"
curl -s -X PUT "$API_BASE/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Test bio for testing",
    "city": "Updated City"
  }' | grep -q '"success":true'
print_result $? "Update user profile"
echo ""

# 9. Test Refresh Token
echo -e "${YELLOW}9. Testing Refresh Token${NC}"
REFRESH_RESPONSE=$(curl -s -X POST "$API_BASE/refresh" \
  -H "Authorization: Bearer $TOKEN")

echo "$REFRESH_RESPONSE" | grep -q '"success":true'
print_result $? "Refresh JWT token"

# Update token
NEW_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo ""

# 10. Test Send Verification Email
echo -e "${YELLOW}10. Testing Send Verification Email${NC}"
VERIFY_EMAIL_RESPONSE=$(curl -s -X POST "$API_BASE/send-verification-email" \
  -H "Authorization: Bearer $NEW_TOKEN")

echo "$VERIFY_EMAIL_RESPONSE" | grep -q '"success":true'
print_result $? "Send verification email"

# Extract verification token
VERIFY_TOKEN=$(echo "$VERIFY_EMAIL_RESPONSE" | grep -o '"verification_token":"[^"]*"' | cut -d'"' -f4)
echo ""

# 11. Test Email Verification
echo -e "${YELLOW}11. Testing Email Verification${NC}"
curl -s -X POST "$API_BASE/verify-email" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$VERIFY_TOKEN\"}" | grep -q '"verified":true'
print_result $? "Email verification"
echo ""

# 12. Test Change Password
echo -e "${YELLOW}12. Testing Change Password${NC}"
curl -s -X POST "$API_BASE/change-password" \
  -H "Authorization: Bearer $NEW_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "TestPass123!",
    "newPassword": "NewTestPass456!",
    "confirmPassword": "NewTestPass456!"
  }' | grep -q '"success":true'
print_result $? "Change password"
echo ""

# 13. Test Token Blacklisting (after password change)
echo -e "${YELLOW}13. Testing Token Blacklisting${NC}"
curl -s -X GET "$API_BASE/me" \
  -H "Authorization: Bearer $NEW_TOKEN" | grep -q '"statusCode":401'
print_result $? "Token blacklisting after password change"
echo ""

# 14. Test Login with New Password
echo -e "${YELLOW}14. Testing Login with New Password${NC}"
NEW_LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "NewTestPass456!"
  }')

echo "$NEW_LOGIN_RESPONSE" | grep -q '"success":true'
print_result $? "Login with new password"

FINAL_TOKEN=$(echo "$NEW_LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo ""

# 15. Test Logout
echo -e "${YELLOW}15. Testing Logout${NC}"
curl -s -X POST "$API_BASE/logout" \
  -H "Authorization: Bearer $FINAL_TOKEN" | grep -q '"success":true'
print_result $? "User logout"
echo ""

# 16. Test Access After Logout
echo -e "${YELLOW}16. Testing Access After Logout${NC}"
curl -s -X GET "$API_BASE/me" \
  -H "Authorization: Bearer $FINAL_TOKEN" | grep -q '"statusCode":401'
print_result $? "Access denied after logout"
echo ""

# 17. Test Validation Errors
echo -e "${YELLOW}17. Testing Input Validation${NC}"
curl -s -X POST "$API_BASE/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "A",
    "email": "invalid-email",
    "password": "short",
    "role": "invalid"
  }' | grep -q '"message":"Validation error"'
print_result $? "Input validation with Joi"
echo ""

# 18. Test No Token Access
echo -e "${YELLOW}18. Testing No Token Access${NC}"
curl -s -X GET "$API_BASE/me" | grep -q '"statusCode":401'
print_result $? "Access denied without token"
echo ""

echo "==================================="
echo "All Tests Completed!"
echo "==================================="
