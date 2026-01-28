# TruckingHub API Documentation

Base URL: `http://localhost:5000/api`

All endpoints return JSON responses in the format:
```json
{
  "success": true|false,
  "data": {...},      // For successful requests
  "message": "..."    // For errors
}
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Register User
**POST** `/auth/register`

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "trucker",
  "phone": "555-0101",
  "company": "John's Trucking"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "trucker"
  }
}
```

### Login
**POST** `/auth/login`

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** Same as Register

### Get Current User
**GET** `/auth/me` 🔒

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "trucker",
    "rating": 4.5,
    "totalEarnings": 15000,
    "completedJobs": 25
  }
}
```

## Jobs

### Get All Jobs
**GET** `/jobs` 🔒

**Query Parameters:**
- `status` - Filter by status (available, claimed, in_progress, delivered, completed)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Electronics Shipment - LA to NYC",
      "description": "Time-sensitive electronics shipment",
      "status": "available",
      "pickup": {
        "location": "Los Angeles, CA",
        "date": "2024-01-20T10:00:00Z"
      },
      "delivery": {
        "location": "New York, NY",
        "date": "2024-01-25T10:00:00Z"
      },
      "cargo": {
        "type": "Electronics",
        "weight": 15000
      },
      "payment": {
        "amount": 4500,
        "currency": "USD"
      },
      "distance": 2789
    }
  ]
}
```

### Get Single Job
**GET** `/jobs/:id` 🔒

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Electronics Shipment - LA to NYC",
    "description": "Time-sensitive electronics shipment",
    "postedBy": {
      "_id": "...",
      "name": "Jane Dispatcher",
      "email": "jane@example.com",
      "company": "Global Logistics"
    },
    "assignedTo": null,
    "status": "available",
    "bids": [],
    "statusHistory": []
  }
}
```

### Create Job
**POST** `/jobs` 🔒 (Dispatcher/Shipper only)

**Body:**
```json
{
  "title": "Furniture Delivery",
  "description": "Standard furniture shipment",
  "pickup": {
    "location": "Chicago, IL",
    "address": "789 Furniture Blvd",
    "date": "2024-01-22T09:00:00Z"
  },
  "delivery": {
    "location": "Dallas, TX",
    "address": "321 Retail Plaza",
    "date": "2024-01-25T15:00:00Z"
  },
  "cargo": {
    "type": "Furniture",
    "weight": 12000
  },
  "payment": {
    "amount": 2800
  },
  "distance": 967,
  "requirements": {
    "truckType": "box_truck"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* created job object */ }
}
```

### Claim Job
**POST** `/jobs/:id/claim` 🔒 (Trucker only)

**Response:**
```json
{
  "success": true,
  "data": { /* updated job object */ }
}
```

### Update Job Status
**PUT** `/jobs/:id/status` 🔒

**Body:**
```json
{
  "status": "in_progress",
  "notes": "Picked up cargo, heading to delivery location"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated job object */ }
}
```

### Place Bid
**POST** `/jobs/:id/bid` 🔒 (Trucker only)

**Body:**
```json
{
  "amount": 2500,
  "message": "I can complete this delivery by the deadline"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated job object with bid */ }
}
```

## Ratings

### Create Rating
**POST** `/ratings` 🔒

**Body:**
```json
{
  "job": "507f1f77bcf86cd799439011",
  "ratedUser": "507f191e810c19729de860ea",
  "rating": 5,
  "review": "Excellent service, very professional",
  "categories": {
    "professionalism": 5,
    "communication": 5,
    "timeliness": 4,
    "quality": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* created rating object */ }
}
```

### Get User Ratings
**GET** `/ratings/user/:userId`

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [ /* array of ratings */ ]
}
```

## Transactions

### Get Transactions
**GET** `/transactions` 🔒

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "...",
      "job": { /* job details */ },
      "payer": { /* user details */ },
      "payee": { /* user details */ },
      "amount": 4500,
      "status": "completed",
      "transactionId": "TXN-1234567890-ABC",
      "createdAt": "2024-01-20T10:00:00Z"
    }
  ]
}
```

### Create Transaction
**POST** `/transactions` 🔒

**Body:**
```json
{
  "job": "507f1f77bcf86cd799439011",
  "payee": "507f191e810c19729de860ea",
  "amount": 4500,
  "type": "payment",
  "paymentMethod": "credit_card"
}
```

### Update Transaction Status
**PUT** `/transactions/:id/status` 🔒

**Body:**
```json
{
  "status": "completed"
}
```

## Services

### Get All Services
**GET** `/services`

**Query Parameters:**
- `category` - Filter by category
- `isAvailable` - Filter by availability (true/false)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "...",
      "provider": { /* user details */ },
      "title": "24/7 Roadside Assistance",
      "description": "Quick response roadside assistance",
      "category": "roadside_assistance",
      "pricing": {
        "basePrice": 150,
        "pricingType": "fixed"
      },
      "rating": 4.8,
      "reviewCount": 45
    }
  ]
}
```

### Create Service
**POST** `/services` 🔒 (Service Provider only)

**Body:**
```json
{
  "title": "Emergency Tire Service",
  "description": "Fast tire replacement and repair",
  "category": "tire_service",
  "pricing": {
    "basePrice": 100,
    "pricingType": "fixed"
  },
  "availability": {
    "isAvailable": true,
    "is24_7": true
  },
  "serviceArea": {
    "cities": ["Phoenix", "Tucson"],
    "states": ["AZ"],
    "radius": 100
  }
}
```

## Notifications

### Get Notifications
**GET** `/notifications` 🔒

**Query Parameters:**
- `isRead` - Filter by read status (true/false)

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "recipient": "...",
      "sender": { /* user details */ },
      "type": "job_claimed",
      "title": "Job Claimed",
      "message": "Your job has been claimed",
      "isRead": false,
      "createdAt": "2024-01-20T10:00:00Z"
    }
  ]
}
```

### Mark as Read
**PUT** `/notifications/:id/read` 🔒

### Mark All as Read
**PUT** `/notifications/read-all` 🔒

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Rate Limiting

Currently no rate limiting is implemented. In production, consider implementing rate limiting to prevent abuse.

## Pagination

For endpoints returning lists, pagination will be added in future versions using:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

🔒 = Requires Authentication
