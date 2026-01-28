# TruckingHub Testing Guide

This document outlines manual testing procedures for the TruckingHub logistics marketplace.

## Prerequisites

- Application running (backend on :5000, frontend on :3000)
- Database seeded with test data (`npm run seed`)

## Test Scenarios

### 1. Authentication Tests

#### 1.1 User Registration
- [ ] Navigate to http://localhost:3000/register
- [ ] Fill in registration form with new user
- [ ] Select role (trucker/dispatcher/shipper/service_provider)
- [ ] Submit form
- [ ] **Expected**: Redirected to dashboard, user logged in

#### 1.2 User Login
- [ ] Navigate to http://localhost:3000/login
- [ ] Enter credentials: trucker@test.com / password123
- [ ] Submit form
- [ ] **Expected**: Redirected to dashboard, see welcome message

#### 1.3 Invalid Login
- [ ] Try logging in with wrong password
- [ ] **Expected**: Error message displayed

#### 1.4 Protected Routes
- [ ] Logout
- [ ] Try accessing /dashboard directly
- [ ] **Expected**: Redirected to login page

### 2. Trucker Role Tests

Login as: trucker@test.com / password123

#### 2.1 Dashboard View
- [ ] View dashboard statistics
- [ ] **Expected**: See total jobs, active jobs, completed jobs, earnings

#### 2.2 Browse Jobs
- [ ] Navigate to Jobs page
- [ ] **Expected**: See list of available jobs
- [ ] Filter by status
- [ ] **Expected**: Jobs filtered accordingly

#### 2.3 Claim Job
- [ ] Click "Claim Job" on an available job
- [ ] **Expected**: Job status changes to "claimed"
- [ ] **Expected**: Success message displayed

#### 2.4 View Job Details
- [ ] Click on a job to view details
- [ ] **Expected**: See full job information
- [ ] **Expected**: See pickup/delivery details, cargo info, payment amount

#### 2.5 Place Bid
- [ ] On an available job, place a bid
- [ ] Enter amount and optional message
- [ ] Submit bid
- [ ] **Expected**: Bid submitted successfully
- [ ] **Expected**: Cannot bid on same job twice

#### 2.6 Update Job Status
- [ ] On a claimed job, update status to "in_progress"
- [ ] Add notes
- [ ] **Expected**: Status updated, appears in status history

### 3. Dispatcher Role Tests

Login as: dispatcher@test.com / password123

#### 3.1 Dashboard View
- [ ] View dashboard
- [ ] **Expected**: See posted jobs statistics

#### 3.2 Post New Job
- [ ] Navigate to "Post Job"
- [ ] Fill in all required fields:
  - Job title and description
  - Pickup location and date
  - Delivery location and date
  - Cargo details
  - Payment amount
- [ ] Submit form
- [ ] **Expected**: Job created successfully
- [ ] **Expected**: Redirected to jobs list

#### 3.3 View Posted Jobs
- [ ] Navigate to Jobs page
- [ ] **Expected**: See only jobs posted by dispatcher

#### 3.4 View Bids
- [ ] Click on a job with bids
- [ ] **Expected**: See list of bids from truckers
- [ ] **Expected**: See trucker details and bid amounts

#### 3.5 Monitor Job Progress
- [ ] View job details for in-progress job
- [ ] **Expected**: See current status
- [ ] **Expected**: See status history
- [ ] **Expected**: See assigned trucker details

#### 3.6 Update Job Status
- [ ] Update job status
- [ ] **Expected**: Status changes successfully

### 4. Shipper Role Tests

Login as: shipper@test.com / password123

#### 4.1 Dashboard View
- [ ] View dashboard
- [ ] **Expected**: See shipment statistics

#### 4.2 Submit Shipment Request
- [ ] Navigate to "Post Job"
- [ ] Fill in shipment details
- [ ] Submit request
- [ ] **Expected**: Shipment request created

#### 4.3 Track Deliveries
- [ ] View jobs list
- [ ] **Expected**: See all posted shipments
- [ ] Filter by status
- [ ] **Expected**: See in-progress and delivered shipments

### 5. Service Provider Role Tests

Login as: service@test.com / password123

#### 5.1 Dashboard View
- [ ] View dashboard
- [ ] **Expected**: See service statistics (if available)

#### 5.2 View Services
- [ ] Navigate to services (if implemented in UI)
- [ ] **Expected**: See available services

### 6. Cross-Role Features

#### 6.1 Notifications
- [ ] Login as trucker
- [ ] Check for notifications
- [ ] **Expected**: See unread notification count
- [ ] Login as dispatcher and post a job
- [ ] Login as trucker again
- [ ] **Expected**: See notification about new job

#### 6.2 Job Lifecycle
- [ ] Dispatcher posts a job (status: available)
- [ ] Trucker claims the job (status: claimed)
- [ ] Trucker updates to in_progress
- [ ] Trucker updates to delivered
- [ ] Dispatcher updates to completed
- [ ] **Expected**: Each status transition recorded in history

#### 6.3 Rating System (Manual API Test)
After job completion, use API to create rating:
```bash
curl -X POST http://localhost:5000/api/ratings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "job": "<job_id>",
    "ratedUser": "<user_id>",
    "rating": 5,
    "review": "Great service!"
  }'
```

### 7. Data Validation Tests

#### 7.1 Required Fields
- [ ] Try submitting job form with missing required fields
- [ ] **Expected**: Validation errors displayed

#### 7.2 Invalid Dates
- [ ] Try creating job with delivery date before pickup date
- [ ] **Expected**: Should be prevented or warned

#### 7.3 Invalid Amounts
- [ ] Try entering negative payment amount
- [ ] **Expected**: Validation error

### 8. API Endpoint Tests

Use curl or Postman to test API endpoints:

#### 8.1 Health Check
```bash
curl http://localhost:5000/api/health
```
**Expected**: {"success":true,"message":"Server is running"}

#### 8.2 Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "trucker"
  }'
```
**Expected**: Returns token and user object

#### 8.3 Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trucker@test.com",
    "password": "password123"
  }'
```
**Expected**: Returns token and user object

#### 8.4 Get Jobs (Protected)
```bash
curl http://localhost:5000/api/jobs \
  -H "Authorization: Bearer <your-token>"
```
**Expected**: Returns array of jobs

### 9. Error Handling Tests

#### 9.1 Invalid Token
- [ ] Use invalid/expired token
- [ ] **Expected**: 401 Unauthorized error

#### 9.2 Unauthorized Access
- [ ] Login as trucker
- [ ] Try to access dispatcher-only endpoint
- [ ] **Expected**: 403 Forbidden error

#### 9.3 Not Found
- [ ] Request non-existent job ID
- [ ] **Expected**: 404 Not Found error

#### 9.4 Database Connection Error
- [ ] Stop MongoDB
- [ ] Try to make a request
- [ ] **Expected**: Graceful error handling

### 10. UI/UX Tests

#### 10.1 Responsive Design
- [ ] Resize browser window
- [ ] **Expected**: Layout adapts to different screen sizes

#### 10.2 Navigation
- [ ] Test all navigation links
- [ ] **Expected**: Navigate to correct pages
- [ ] Test back button
- [ ] **Expected**: Returns to previous page

#### 10.3 Loading States
- [ ] Watch for loading indicators
- [ ] **Expected**: Spinner shown while fetching data

#### 10.4 Error Messages
- [ ] Trigger various errors
- [ ] **Expected**: Clear, user-friendly error messages

### 11. Performance Tests

#### 11.1 Multiple Jobs
- [ ] Create 20+ jobs
- [ ] Load jobs list
- [ ] **Expected**: Page loads within reasonable time

#### 11.2 Concurrent Users
- [ ] Open multiple browser sessions with different users
- [ ] Perform actions simultaneously
- [ ] **Expected**: No conflicts or errors

## Test Results Template

```
Date: ___________
Tester: ___________

Authentication Tests:
[ ] PASS [ ] FAIL - Registration
[ ] PASS [ ] FAIL - Login
[ ] PASS [ ] FAIL - Protected Routes

Trucker Tests:
[ ] PASS [ ] FAIL - Dashboard
[ ] PASS [ ] FAIL - Browse Jobs
[ ] PASS [ ] FAIL - Claim Job
[ ] PASS [ ] FAIL - Place Bid
[ ] PASS [ ] FAIL - Update Status

Dispatcher Tests:
[ ] PASS [ ] FAIL - Post Job
[ ] PASS [ ] FAIL - View Bids
[ ] PASS [ ] FAIL - Monitor Progress

Issues Found:
1. ___________
2. ___________
3. ___________
```

## Automated Testing (Future)

To be implemented:
- Unit tests for utilities and services
- Integration tests for API endpoints
- Component tests for React components
- End-to-end tests with Cypress or Playwright

## Bug Reporting

When you find a bug, report it with:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots if applicable
5. Browser and version
6. User role being tested

## Notes

- Always test with fresh seeded data for consistent results
- Clear browser cache if you encounter strange behavior
- Check browser console for JavaScript errors
- Check server console for backend errors
- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
